import { createClient } from "@supabase/supabase-js";

type ImportBatchArgs = {
  tenantId: string;
  runId?: string | null;
  offset?: number;
  limit?: number;
};

const GLPI_STATUS_MAP: Record<string, string> = {
  "1": "Nuovo",
  "2": "Aperto",
  "3": "Pianificato",
  "4": "In lavorazione",
  "5": "Risolto",
  "6": "Chiuso",
};

type ParsedGlpiEntityPath = {
  entityPath: string;
  entity: string;
  region: string;
  site: string;
  city: string;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function normalizeText(value: any) {
  return String(value ?? "").trim();
}

function normalizeForMatch(value: any) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseDate(value: any) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function mapGlpiStatus(value: any) {
  const raw = normalizeText(value);
  return GLPI_STATUS_MAP[raw] || raw || "Aperto";
}


function isClosedStatus(status: any) {
  const value = normalizeText(status).toLowerCase();
  return (
    value === "5" ||
    value === "6" ||
    value.includes("chiuso") ||
    value.includes("risolto") ||
    value.includes("validato") ||
    value.includes("closed") ||
    value.includes("solved")
  );
}


function isBefore2026(value: any) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return new Date(parsed).getTime() < new Date("2026-01-01T00:00:00.000Z").getTime();
}

function getEffectiveStatus(ticket: any) {
  if (isClosedStatus(ticket.status)) return "Chiuso";

  // Business rule ATLAS:
  // lo storico GLPI fino al 31/12/2025 viene considerato chiuso.
  if (ticket.openedAt && isBefore2026(ticket.openedAt)) return "Chiuso";

  return ticket.status || "Aperto";
}

function getEffectiveClosedAt(ticket: any) {
  const effectiveStatus = getEffectiveStatus(ticket);
  if (!isClosedStatus(effectiveStatus)) return null;

  return ticket.activityDate || ticket.openedAt || new Date().toISOString();
}

function isUrgent(value: any) {
  const raw = normalizeText(value).toLowerCase();
  return raw === "alta" || raw === "high" || raw === "5" || raw === "4" || raw.includes("urgent");
}

function pick(row: any, keys: string[]) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return null;
}

function parseGlpiEntityPath(value: any): ParsedGlpiEntityPath {
  const entityPath = normalizeText(value);
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
  if (cityMatch?.[1]) city = cityMatch[1].replace(/\s+/g, " ").trim().toUpperCase();

  return { entityPath, entity, region, site, city };
}

async function glpiFetch(path: string, params: Record<string, string | number> = {}) {
  const apiUrl = getEnv("GLPI_API_URL").replace(/\/$/, "");
  const appToken = getEnv("GLPI_APP_TOKEN");
  const userToken = getEnv("GLPI_USER_TOKEN");

  const initSession = await fetch(`${apiUrl}/initSession`, {
    method: "GET",
    headers: {
      "App-Token": appToken,
      Authorization: `user_token ${userToken}`,
    },
    cache: "no-store",
  });

  if (!initSession.ok) {
    const text = await initSession.text();
    throw new Error(`GLPI initSession failed: ${initSession.status} ${text}`);
  }

  const sessionJson = await initSession.json();
  const sessionToken = sessionJson.session_token;
  const url = new URL(`${apiUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "App-Token": appToken,
        "Session-Token": sessionToken,
      },
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`GLPI request failed: ${response.status} ${JSON.stringify(json)}`);
    return json;
  } finally {
    await fetch(`${apiUrl}/killSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        "Session-Token": sessionToken,
      },
      cache: "no-store",
    }).catch(() => null);
  }
}

function normalizeGlpiTicket(row: any) {
  const entityPathData = parseGlpiEntityPath(pick(row, ["Entità", "Entity", "entities_id", "80"]));
  const id = Number(pick(row, ["ID", "id", "2"]));
  const title = normalizeText(pick(row, ["Titolo", "name", "1"])) || `Ticket GLPI #${id}`;
  const requester = normalizeText(pick(row, ["Richiedente - Richiedente", "requester", "users_id_recipient"]));
  const commentsDescription = normalizeText(pick(row, ["Commenti - Descrizione", "content", "21"]));
  const urgency = normalizeText(pick(row, ["Urgenza", "urgency", "10"]));
  const status = mapGlpiStatus(pick(row, ["Stato", "status", "12"]));
  const activityDescription = normalizeText(pick(row, ["Attività - Descrizione", "activity_description"]));
  const activityDate = parseDate(pick(row, ["Attività - Data", "activity_date"]));
  const description = normalizeText(pick(row, ["Descrizione", "description"]));
  const technicianGroup = normalizeText(pick(row, ["Assegnatario - Gruppo tecnico", "technician_group"]));
  const resolutionTime = normalizeText(pick(row, ["Tempo di risoluzione", "solve_delay_stat"]));
  const impact = normalizeText(pick(row, ["Impatto", "impact", "11"]));
  const priority = normalizeText(pick(row, ["Priorità", "priority", "3"]));
  const openedAt = parseDate(pick(row, ["Data di apertura", "date", "15"]));

  return {
    id,
    title,
    requester,
    commentsDescription,
    urgency,
    status,
    activityDescription,
    activityDate,
    description,
    technicianGroup,
    resolutionTime,
    impact,
    priority,
    openedAt,
    entityPath: entityPathData.entityPath,
    entity: entityPathData.entity,
    region: entityPathData.region,
    site: entityPathData.site,
    city: entityPathData.city,
    raw: row,
  };
}

async function resolveAtlasCustomerId(
  supabaseAdmin: any,
  tenantId: string,
  entity: string,
  entityPath?: string,
  site?: string,
  city?: string
) {
  const candidatesToMatch = [
    site,
    city,
    entity,
    entityPath,
    entityPath ? entityPath.replace(/^Root\s*>\s*/i, "") : "",
  ]
    .map(normalizeForMatch)
    .filter(Boolean);

  if (candidatesToMatch.length === 0) return null;

  const isMatch = (value: any) => {
    const normalized = normalizeForMatch(value);
    if (!normalized) return false;

    return candidatesToMatch.some((candidate) => {
      if (!candidate) return false;
      return (
        candidate === normalized ||
        candidate.includes(normalized) ||
        normalized.includes(candidate)
      );
    });
  };

  const { data: aliases, error: aliasError } = await supabaseAdmin
    .from("customer_aliases")
    .select("customer_id,alias,normalized_alias")
    .eq("tenant_id", tenantId)
    .limit(5000);

  if (!aliasError && aliases?.length) {
    const aliasMatch = aliases.find((item: any) => isMatch(item.normalized_alias || item.alias));

    if (aliasMatch?.customer_id) return aliasMatch.customer_id;
  }

  const { data: customers } = await supabaseAdmin
    .from("customers")
    .select("id,name")
    .eq("tenant_id", tenantId)
    .limit(1000);

  const customerMatch = (customers || []).find((customer: any) => isMatch(customer.name));

  if (customerMatch?.id) return customerMatch.id;

  const { data: sites, error: sitesError } = await supabaseAdmin
    .from("sites")
    .select("id,name,customer_id")
    .eq("tenant_id", tenantId)
    .not("customer_id", "is", null)
    .limit(10000);

  if (!sitesError && sites?.length) {
    const siteMatch = sites.find((item: any) => isMatch(item.name));

    if (siteMatch?.customer_id) return siteMatch.customer_id;
  }

  return null;
}

export async function importGlpiHistoricalBatch({ tenantId, runId, offset = 0, limit = 500 }: ImportBatchArgs) {
  const supabaseAdmin = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  let activeRunId = runId || null;

  if (!activeRunId) {
    const { data, error } = await supabaseAdmin
      .from("glpi_import_runs")
      .insert({
        tenant_id: tenantId,
        status: "running",
        batch_size: limit,
        cursor_offset: offset,
        metadata: { importer: "ticket_activity_v8_status_cutoff_2025" },
      })
      .select()
      .single();

    if (error) throw error;
    activeRunId = data.id;
  }

  const glpiResult = await glpiFetch("/search/Ticket", {
    range: `${offset}-${offset + limit - 1}`,
    sort: 2,
    order: "ASC",
    forcedisplay: "1,2,3,10,11,12,15,21,80",
  });

  const rows = Array.isArray(glpiResult?.data) ? glpiResult.data : Array.isArray(glpiResult) ? glpiResult : [];

  console.log("GLPI IMPORT DEBUG RESPONSE SHAPE", {
    offset,
    limit,
    rowCount: rows.length,
    resultKeys: glpiResult && typeof glpiResult === "object" ? Object.keys(glpiResult) : [],
    totalcount: glpiResult?.totalcount,
    count: glpiResult?.count,
    range: glpiResult?.range,
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const ticket = normalizeGlpiTicket(row);

    if (!ticket.id) {
      skipped += 1;
      continue;
    }

    try {
      const customerId = await resolveAtlasCustomerId(supabaseAdmin, tenantId, ticket.entity, ticket.entityPath, ticket.site, ticket.city);

      const { data: existingMapping } = await supabaseAdmin
        .from("glpi_ticket_mappings")
        .select("atlas_ticket_id")
        .eq("tenant_id", tenantId)
        .eq("glpi_ticket_id", ticket.id)
        .maybeSingle();


      let resolvedSiteId = null;

      const { data: matchedSite } = await supabaseAdmin
        .from("sites")
        .select("id,name")
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .ilike("name", `%${ticket.site}%`)
        .maybeSingle();

      if (matchedSite?.id) {
        resolvedSiteId = matchedSite.id;
      }

      const payload = {
        tenant_id: tenantId,
        site: ticket.site || "Storico GLPI",
        entity: ticket.entity || "Storico GLPI",
        city: ticket.city || "",
        region: ticket.region || "Da definire",
        problem: ticket.commentsDescription || ticket.description || ticket.title,
        status: getEffectiveStatus(ticket),
        technician: ticket.technicianGroup || "",
        opened_at: ticket.openedAt,
        closed_at: getEffectiveClosedAt(ticket),
        resolved: getEffectiveStatus(ticket) === "Chiuso",
        urgent: isUrgent(ticket.urgency),
        customer_id: customerId,
        site_id: resolvedSiteId,
        source: "glpi",
        glpi_ticket_id: ticket.id,
        glpi_requester: ticket.requester,
        glpi_entity_path: ticket.entityPath,
        glpi_technician_group: ticket.technicianGroup,
        glpi_urgency: ticket.urgency,
        glpi_impact: ticket.impact,
        glpi_priority: ticket.priority,
        glpi_resolution_time: ticket.resolutionTime,
        glpi_raw: ticket.raw,
        imported_at: new Date().toISOString(),
      };

      let atlasTicketId = existingMapping?.atlas_ticket_id || null;

      if (atlasTicketId) {
        const { error } = await supabaseAdmin.from("tickets").update(payload).eq("id", atlasTicketId);
        if (error) throw error;
        updated += 1;
      } else {
        const { data, error } = await supabaseAdmin.from("tickets").insert(payload).select("id").single();
        if (error) throw error;
        atlasTicketId = data.id;
        inserted += 1;
      }

      await supabaseAdmin.from("glpi_ticket_mappings").upsert({
        tenant_id: tenantId,
        glpi_ticket_id: ticket.id,
        atlas_ticket_id: atlasTicketId,
        glpi_status: ticket.status,
        glpi_priority: ticket.priority,
        glpi_urgency: ticket.urgency,
        glpi_impact: ticket.impact,
        glpi_requester: ticket.requester,
        glpi_entity_path: ticket.entityPath,
        glpi_technician_group: ticket.technicianGroup,
        glpi_opened_at: ticket.openedAt,
        glpi_resolution_time: ticket.resolutionTime,
        last_import_run_id: activeRunId,
        raw: ticket.raw,
        updated_at: new Date().toISOString(),
      });

      if (ticket.activityDescription || ticket.activityDate) {
        await supabaseAdmin.from("ticket_events").insert({
          tenant_id: tenantId,
          ticket_id: atlasTicketId,
          event_type: "glpi_activity",
          title: "Attività GLPI",
          description: ticket.activityDescription || "Attività storica GLPI",
          created_by: ticket.technicianGroup || "GLPI",
          created_at: ticket.activityDate || ticket.openedAt || new Date().toISOString(),
          source: "glpi",
          glpi_ticket_id: ticket.id,
          glpi_activity_date: ticket.activityDate,
          glpi_raw: ticket.raw,
          metadata: {
            requester: ticket.requester,
            status: getEffectiveStatus(ticket),
            priority: ticket.priority,
            urgency: ticket.urgency,
            impact: ticket.impact,
            entity_path: ticket.entityPath,
          },
        });
      }
    } catch (error: any) {
      errors += 1;
      await supabaseAdmin.from("glpi_import_errors").insert({
        tenant_id: tenantId,
        run_id: activeRunId,
        glpi_ticket_id: ticket.id || null,
        stage: "ticket_activity_import_v8_status_cutoff_2025",
        message: error?.message || error?.details || error?.hint || error?.code || JSON.stringify(error),
        raw: { error, ticket, row },
      });
    }
  }

  const processed = rows.length;
  const nextOffset = offset + processed;
  const hasMore = processed >= limit;

  await supabaseAdmin
    .from("glpi_import_runs")
    .update({
      status: hasMore ? "running" : "completed",
      cursor_offset: nextOffset,
      total_processed: nextOffset,
      total_inserted: inserted,
      total_updated: updated,
      total_skipped: skipped,
      total_errors: errors,
      finished_at: hasMore ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", activeRunId);

  return { ok: true, runId: activeRunId, processed, inserted, updated, skipped, errors, nextOffset, hasMore };
}
