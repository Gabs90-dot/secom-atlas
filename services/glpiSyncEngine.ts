import { createClient } from "@supabase/supabase-js";

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

function normalizeGlpiArray(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extractGlpiId(row: any) {
  return row?.id ?? row?.["2"] ?? row?.glpi_id ?? null;
}

function extractGlpiName(row: any) {
  return row?.name ?? row?.["1"] ?? "";
}

function extractGlpiContent(row: any) {
  return row?.content ?? row?.["21"] ?? row?.description ?? "";
}

function extractGlpiStatus(row: any) {
  return row?.status ?? row?.["12"] ?? row?.state ?? "";
}

function extractGlpiDate(row: any) {
  return row?.date ?? row?.["15"] ?? row?.date_creation ?? row?.created_at ?? "";
}

function extractGlpiSolvedDate(row: any) {
  return row?.solvedate ?? row?.solvedate_mod ?? row?.["18"] ?? "";
}

function extractGlpiClosedDate(row: any) {
  return row?.closedate ?? row?.closed_at ?? row?.["19"] ?? "";
}

function extractGlpiEntityPath(row: any) {
  return (
    row?.entity_path ||
    row?.completename ||
    row?.complete_name ||
    row?.entities_completename ||
    row?.["80"] ||
    ""
  );
}

function extractGlpiPriority(row: any) {
  return row?.priority ?? row?.["3"] ?? null;
}

function extractGlpiUrgency(row: any) {
  return row?.urgency ?? row?.["10"] ?? null;
}

function extractGlpiImpact(row: any) {
  return row?.impact ?? row?.["11"] ?? null;
}

function parseGlpiEntityPath(value: any) {
  const entityPath = cleanHtml(value || "");
  const parts = entityPath
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.toLowerCase() !== "root");

  const entity = parts[0] || "Storico GLPI";
  const region = parts[1] || "Da definire";
  const site = parts[parts.length - 1] || entity || "Storico GLPI";

  let city = "";
  const cityMatch = site.match(/\bDI\s+(.+)$/i);
  if (cityMatch?.[1]) {
    city = cityMatch[1].replace(/\s+/g, " ").trim().toUpperCase();
  }

  return { entityPath, entity, region, site, city };
}

function isUrgent(value: any) {
  const raw = String(value || "").toLowerCase();
  return raw === "alta" || raw === "high" || raw === "5" || raw === "4" || raw.includes("urgent");
}

async function openGlpiSession() {
  const baseUrl = getEnv("GLPI_API_URL").replace(/\/$/, "");
  const appToken = getEnv("GLPI_APP_TOKEN");
  const userToken = getEnv("GLPI_USER_TOKEN");

  const response = await fetch(`${baseUrl}/initSession`, {
    method: "GET",
    headers: {
      "App-Token": appToken,
      Authorization: `user_token ${userToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.session_token) {
    throw new Error(
      `GLPI initSession failed: ${response.status} ${JSON.stringify(data)}`,
    );
  }

  return {
    baseUrl,
    appToken,
    sessionToken: data.session_token as string,
  };
}

async function closeGlpiSession(session: {
  baseUrl: string;
  appToken: string;
  sessionToken: string;
}) {
  await fetch(`${session.baseUrl}/killSession`, {
    method: "GET",
    headers: {
      "App-Token": session.appToken,
      "Session-Token": session.sessionToken,
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);
}

async function glpiRequest(
  session: {
    baseUrl: string;
    appToken: string;
    sessionToken: string;
  },
  endpoint: string,
) {
  const response = await fetch(`${session.baseUrl}${endpoint}`, {
    method: "GET",
    headers: {
      "App-Token": session.appToken,
      "Session-Token": session.sessionToken,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `GLPI request failed ${endpoint}: ${response.status} ${JSON.stringify(data)}`,
    );
  }

  return data;
}

async function loadGlpiTickets(
  session: {
    baseUrl: string;
    appToken: string;
    sessionToken: string;
  },
  {
    limit,
    offset,
    glpiTicketId,
  }: {
    limit: number;
    offset: number;
    glpiTicketId?: number | string;
  },
) {
  const byId =
    glpiTicketId !== undefined &&
    glpiTicketId !== null &&
    String(glpiTicketId).trim() !== "";

  if (byId) {
    const ticket = await glpiRequest(session, `/Ticket/${Number(glpiTicketId)}`);
    return normalizeGlpiArray([ticket]);
  }

  const end = offset + limit - 1;
  const query =
    `/search/Ticket?range=${offset}-${end}` +
    `&sort=2` +
    `&order=DESC` +
    `&forcedisplay[0]=1` +
    `&forcedisplay[1]=2` +
    `&forcedisplay[2]=3` +
    `&forcedisplay[3]=10` +
    `&forcedisplay[4]=11` +
    `&forcedisplay[5]=12` +
    `&forcedisplay[6]=15` +
    `&forcedisplay[7]=21` +
    `&forcedisplay[8]=80`;

  const result = await glpiRequest(session, query);
  return normalizeGlpiArray(result?.data || result);
}

async function loadGlpiFollowups(
  session: {
    baseUrl: string;
    appToken: string;
    sessionToken: string;
  },
  ticketId: number | string,
) {
  try {
    const result = await glpiRequest(session, `/Ticket/${ticketId}/ITILFollowup`);
    return normalizeGlpiArray(result);
  } catch {
    return [];
  }
}

async function loadGlpiSolutions(
  session: {
    baseUrl: string;
    appToken: string;
    sessionToken: string;
  },
  ticketId: number | string,
) {
  try {
    const result = await glpiRequest(session, `/Ticket/${ticketId}/ITILSolution`);
    return normalizeGlpiArray(result);
  } catch {
    return [];
  }
}

// Manteniamo lo stesso nome esportato per non rompere la route già collegata.
// Ora però NON usa più MySQL: usa GLPI REST API.
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

  const session = await openGlpiSession();

  try {
    const tickets = await loadGlpiTickets(session, {
      limit,
      offset,
      glpiTicketId,
    });

    const byId =
      glpiTicketId !== undefined &&
      glpiTicketId !== null &&
      String(glpiTicketId).trim() !== "";

    let processed = 0;
    let updated = 0;
    let inserted = 0;
    let insertedEvents = 0;
    let errors = 0;
    const skipped: number[] = [];

    for (const glpiTicket of tickets) {
      processed += 1;

      const glpiId = extractGlpiId(glpiTicket);

      if (!glpiId) {
        errors += 1;
        await supabaseAdmin.from("glpi_import_errors").insert({
          tenant_id: tenantId,
          glpi_ticket_id: null,
          stage: "glpi_api_sync_engine",
          message: "GLPI ticket id mancante nella risposta API",
          raw: { glpiTicket },
        });
        continue;
      }

      try {
        const status = mapStatus(extractGlpiStatus(glpiTicket));
        const openedAt = parseDate(extractGlpiDate(glpiTicket));
        const solvedAt = parseDate(extractGlpiSolvedDate(glpiTicket));
        const closedAt =
          parseDate(extractGlpiClosedDate(glpiTicket)) ||
          (isClosedStatus(extractGlpiStatus(glpiTicket))
            ? solvedAt || openedAt
            : null);

        const cleanContent = cleanHtml(extractGlpiContent(glpiTicket));
        const title =
          cleanHtml(extractGlpiName(glpiTicket)) || `Ticket GLPI #${glpiId}`;

        const { data: atlasTicket } = await supabaseAdmin
          .from("tickets")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("glpi_ticket_id", glpiId)
          .maybeSingle();

        const entityPath = extractGlpiEntityPath(glpiTicket);
        const entityData = parseGlpiEntityPath(entityPath);

        const ticketPayload = {
          tenant_id: tenantId,
          site: entityData.site || "Storico GLPI",
          entity: entityData.entity || "Storico GLPI",
          city: entityData.city || "",
          region: entityData.region || "Da definire",
          status,
          opened_at: openedAt,
          closed_at: closedAt,
          resolved: isClosedStatus(extractGlpiStatus(glpiTicket)),
          problem: cleanContent || title,
          urgent: isUrgent(extractGlpiUrgency(glpiTicket)),
          source: "glpi",
          glpi_ticket_id: Number(glpiId),
          glpi_entity_path: entityPath || null,
          glpi_priority: extractGlpiPriority(glpiTicket),
          glpi_urgency: extractGlpiUrgency(glpiTicket),
          glpi_impact: extractGlpiImpact(glpiTicket),
          glpi_raw: {
            ...glpiTicket,
            clean_name: title,
            clean_content: cleanContent,
          },
          imported_at: new Date().toISOString(),
        };

        let atlasTicketId = atlasTicket?.id || null;

        if (atlasTicketId) {
          const { error: updateError } = await supabaseAdmin
            .from("tickets")
            .update(ticketPayload)
            .eq("id", atlasTicketId);

          if (updateError) throw updateError;
          updated += 1;
        } else {
          const { data: insertedTicket, error: insertError } = await supabaseAdmin
            .from("tickets")
            .insert(ticketPayload)
            .select("id")
            .single();

          if (insertError) throw insertError;
          atlasTicketId = insertedTicket.id;
          inserted += 1;
        }

        await supabaseAdmin.from("glpi_ticket_mappings").upsert({
          tenant_id: tenantId,
          glpi_ticket_id: Number(glpiId),
          atlas_ticket_id: atlasTicketId,
          glpi_status: status,
          glpi_priority: extractGlpiPriority(glpiTicket),
          glpi_urgency: extractGlpiUrgency(glpiTicket),
          glpi_impact: extractGlpiImpact(glpiTicket),
          glpi_entity_path: entityPath || null,
          raw: glpiTicket,
          updated_at: new Date().toISOString(),
        });

        await supabaseAdmin.from("ticket_events").upsert(
          {
            tenant_id: tenantId,
            ticket_id: atlasTicketId,
            event_type: "glpi_ticket_content",
            title: "Contenuto ticket GLPI",
            description: cleanContent || title,
            created_by: "GLPI",
            created_at: openedAt || new Date().toISOString(),
            source: "glpi",
            glpi_ticket_id: glpiId,
            glpi_event_id: glpiId,
            glpi_raw: glpiTicket,
            metadata: {
              status,
              name: title,
              entity_path: entityPath,
            },
          },
          { onConflict: "source,glpi_event_id,event_type" },
        );

        const followupRows = await loadGlpiFollowups(session, glpiId);

        for (const followup of followupRows) {
          const followupId = followup?.id ?? followup?.["2"];
          if (!followupId) continue;

          const author =
            [followup?.firstname, followup?.realname]
              .filter(Boolean)
              .join(" ") ||
            followup?.name ||
            followup?.users_id ||
            "GLPI";

          const { error } = await supabaseAdmin.from("ticket_events").upsert(
            {
              tenant_id: tenantId,
              ticket_id: atlasTicketId,
              event_type: "glpi_followup",
              title: "Follow-up GLPI",
              description: cleanHtml(followup?.content ?? followup?.["21"]),
              created_by: author,
              created_at:
                parseDate(followup?.date ?? followup?.date_creation) ||
                new Date().toISOString(),
              source: "glpi",
              glpi_ticket_id: glpiId,
              glpi_event_id: followupId,
              glpi_raw: followup,
              metadata: {
                users_id: followup?.users_id,
              },
            },
            { onConflict: "source,glpi_event_id,event_type" },
          );

          if (!error) insertedEvents += 1;
        }

        const solutionRows = await loadGlpiSolutions(session, glpiId);

        for (const solution of solutionRows) {
          const solutionId = solution?.id ?? solution?.["2"];
          if (!solutionId) continue;

          const author =
            [solution?.firstname, solution?.realname]
              .filter(Boolean)
              .join(" ") ||
            solution?.name ||
            solution?.users_id ||
            "GLPI";

          const { error } = await supabaseAdmin.from("ticket_events").upsert(
            {
              tenant_id: tenantId,
              ticket_id: atlasTicketId,
              event_type: "glpi_solution",
              title: "Soluzione GLPI",
              description: cleanHtml(solution?.content ?? solution?.["21"]),
              created_by: author,
              created_at:
                parseDate(solution?.date_creation ?? solution?.date) ||
                new Date().toISOString(),
              source: "glpi",
              glpi_ticket_id: glpiId,
              glpi_event_id: solutionId,
              glpi_raw: solution,
              metadata: {
                users_id: solution?.users_id,
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
          glpi_ticket_id: glpiId || null,
          stage: "glpi_api_sync_engine",
          message: error?.message || error?.details || JSON.stringify(error),
          raw: { error, glpiTicket },
        });
      }
    }

    return {
      ok: true,
      mode: "glpi_api",
      processed,
      updated,
      inserted,
      insertedEvents,
      errors,
      skipped,
      nextOffset: byId ? offset : offset + processed,
      hasMore: byId ? false : processed >= limit,
    };
  } finally {
    await closeGlpiSession(session);
  }
}
