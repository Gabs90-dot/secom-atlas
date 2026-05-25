import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";

type GlpiSyncArgs = {
  tenantId: string;
  limit?: number;
  offset?: number;
  glpiTicketId?: number | string;
};

const GLPI_STATUS_MAP: Record<number, string> = {
  1: "Nuovo",
  2: "In lavorazione",
  3: "Pianificato",
  4: "In sospeso",
  5: "Risolto",
  6: "Chiuso",
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&#38;/g, "&")
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function cleanHtml(value: any) {
  const decoded = decodeHtmlEntities(String(value || ""));

  return decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapStatus(status: any) {
  const numeric = Number(status);
  return GLPI_STATUS_MAP[numeric] || "Aperto";
}

function isClosedStatus(status: any) {
  const mapped = mapStatus(status);
  return mapped === "Chiuso" || mapped === "Risolto";
}

function parseDate(value: any) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function getGlpiConnection() {
  return mysql.createConnection({
    host: getEnv("GLPI_DB_HOST"),
    port: Number(process.env.GLPI_DB_PORT || 3306),
    user: getEnv("GLPI_DB_USER"),
    password: getEnv("GLPI_DB_PASSWORD"),
    database: getEnv("GLPI_DB_NAME"),
    charset: "utf8mb4",
  });
}

export async function syncGlpiDbToAtlas({
  tenantId,
  limit = 500,
  offset = 0,
  glpiTicketId,
}: GlpiSyncArgs) {
  const supabaseAdmin = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const glpi = await getGlpiConnection();

  try {
    const byId = glpiTicketId !== undefined && glpiTicketId !== null && String(glpiTicketId).trim() !== "";

    const [ticketRows] = await glpi.execute(
      byId
        ? `
          SELECT
            t.id,
            t.name,
            t.status,
            t.date,
            t.solvedate,
            t.closedate,
            t.entities_id,
            t.itilcategories_id,
            t.type,
            t.urgency,
            t.impact,
            t.priority,
            t.content,
            e.name AS entity_name,
            e.completename AS entity_path
          FROM glpi_tickets t
          LEFT JOIN glpi_entities e ON e.id = t.entities_id
          WHERE t.id = ?
          LIMIT 1
          `
        : `
          SELECT
            t.id,
            t.name,
            t.status,
            t.date,
            t.solvedate,
            t.closedate,
            t.entities_id,
            t.itilcategories_id,
            t.type,
            t.urgency,
            t.impact,
            t.priority,
            t.content,
            e.name AS entity_name,
            e.completename AS entity_path
          FROM glpi_tickets t
          LEFT JOIN glpi_entities e ON e.id = t.entities_id
          ORDER BY t.id ASC
          LIMIT ? OFFSET ?
          `,
      byId ? [Number(glpiTicketId)] : [limit, offset],
    );

    const tickets = ticketRows as any[];

    let processed = 0;
    let updated = 0;
    let insertedEvents = 0;
    let errors = 0;
    const skipped: number[] = [];

    for (const glpiTicket of tickets) {
      processed += 1;

      try {
        const status = mapStatus(glpiTicket.status);
        const openedAt = parseDate(glpiTicket.date);
        const solvedAt = parseDate(glpiTicket.solvedate);
        const closedAt =
          parseDate(glpiTicket.closedate) ||
          (isClosedStatus(glpiTicket.status) ? solvedAt || openedAt : null);

        const cleanContent = cleanHtml(glpiTicket.content);
        const title = cleanHtml(glpiTicket.name) || `Ticket GLPI #${glpiTicket.id}`;

        const { data: atlasTicket } = await supabaseAdmin
          .from("tickets")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("glpi_ticket_id", glpiTicket.id)
          .maybeSingle();

        if (!atlasTicket?.id) {
          skipped.push(glpiTicket.id);
          continue;
        }

        const { error: updateError } = await supabaseAdmin
          .from("tickets")
          .update({
            status,
            opened_at: openedAt,
            closed_at: closedAt,
            resolved: isClosedStatus(glpiTicket.status),
            problem: cleanContent || title,
            glpi_entity_path: glpiTicket.entity_path || null,
            glpi_priority: glpiTicket.priority,
            glpi_urgency: glpiTicket.urgency,
            glpi_impact: glpiTicket.impact,
            glpi_raw: {
              ...glpiTicket,
              clean_name: title,
              clean_content: cleanContent,
            },
            imported_at: new Date().toISOString(),
          })
          .eq("id", atlasTicket.id);

        if (updateError) throw updateError;
        updated += 1;

        await supabaseAdmin.from("ticket_events").upsert(
          {
            tenant_id: tenantId,
            ticket_id: atlasTicket.id,
            event_type: "glpi_ticket_content",
            title: "Contenuto ticket GLPI",
            description: cleanContent || title,
            created_by: "GLPI",
            created_at: openedAt || new Date().toISOString(),
            source: "glpi",
            glpi_ticket_id: glpiTicket.id,
            glpi_event_id: glpiTicket.id,
            glpi_raw: glpiTicket,
            metadata: {
              status,
              name: title,
              entity_path: glpiTicket.entity_path,
            },
          },
          { onConflict: "source,glpi_event_id,event_type" },
        );

        const [followupRows] = await glpi.execute(
          `
          SELECT
            f.id,
            f.items_id,
            f.users_id,
            f.date,
            f.content,
            u.name,
            u.realname,
            u.firstname
          FROM glpi_itilfollowups f
          LEFT JOIN glpi_users u ON u.id = f.users_id
          WHERE f.itemtype = 'Ticket'
          AND f.items_id = ?
          ORDER BY f.date ASC
          `,
          [glpiTicket.id],
        );

        for (const followup of followupRows as any[]) {
          const author =
            [followup.firstname, followup.realname].filter(Boolean).join(" ") ||
            followup.name ||
            "GLPI";

          const { error } = await supabaseAdmin.from("ticket_events").upsert(
            {
              tenant_id: tenantId,
              ticket_id: atlasTicket.id,
              event_type: "glpi_followup",
              title: "Follow-up GLPI",
              description: cleanHtml(followup.content),
              created_by: author,
              created_at: parseDate(followup.date) || new Date().toISOString(),
              source: "glpi",
              glpi_ticket_id: glpiTicket.id,
              glpi_event_id: followup.id,
              glpi_raw: followup,
              metadata: {
                users_id: followup.users_id,
              },
            },
            { onConflict: "source,glpi_event_id,event_type" },
          );

          if (!error) insertedEvents += 1;
        }

        const [solutionRows] = await glpi.execute(
          `
          SELECT
            s.id,
            s.items_id,
            s.users_id,
            s.date_creation,
            s.content,
            u.name,
            u.realname,
            u.firstname
          FROM glpi_itilsolutions s
          LEFT JOIN glpi_users u ON u.id = s.users_id
          WHERE s.itemtype = 'Ticket'
          AND s.items_id = ?
          ORDER BY s.date_creation ASC
          `,
          [glpiTicket.id],
        );

        for (const solution of solutionRows as any[]) {
          const author =
            [solution.firstname, solution.realname].filter(Boolean).join(" ") ||
            solution.name ||
            "GLPI";

          const { error } = await supabaseAdmin.from("ticket_events").upsert(
            {
              tenant_id: tenantId,
              ticket_id: atlasTicket.id,
              event_type: "glpi_solution",
              title: "Soluzione GLPI",
              description: cleanHtml(solution.content),
              created_by: author,
              created_at: parseDate(solution.date_creation) || new Date().toISOString(),
              source: "glpi",
              glpi_ticket_id: glpiTicket.id,
              glpi_event_id: solution.id,
              glpi_raw: solution,
              metadata: {
                users_id: solution.users_id,
              },
            },
            { onConflict: "source,glpi_event_id,event_type" },
          );

          if (!error) insertedEvents += 1;
        }
      } catch (error: any) {
        errors += 1;
        await supabaseAdmin.from("glpi_import_errors").insert({
          tenant_id: tenantId,
          glpi_ticket_id: glpiTicket.id || null,
          stage: "glpi_db_sync_engine",
          message: error?.message || error?.details || JSON.stringify(error),
          raw: { error, glpiTicket },
        });
      }
    }

    return {
      ok: true,
      processed,
      updated,
      insertedEvents,
      errors,
      skipped,
      nextOffset: byId ? offset : offset + processed,
      hasMore: byId ? false : processed >= limit,
    };
  } finally {
    await glpi.end();
  }
}
