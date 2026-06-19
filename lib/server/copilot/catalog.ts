import type { SupabaseClient } from "@supabase/supabase-js";

import type { AtlasRole } from "@/lib/auth";
import { technicians as fallbackTechnicians } from "@/lib/atlasConstants";
import type { AtlasRequester } from "@/lib/server/requireAtlasUser";

export const COPILOT_ALLOWED_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
  "commerciale",
];

export const COPILOT_MAX_QUESTION_LENGTH = 500;
export const COPILOT_TOOL_LIMIT = 20;

export type CopilotRecordTarget = "registro" | "clienti" | "calendario" | "analytics";

export type CopilotRecord = {
  id: string;
  type: "ticket" | "customer" | "site" | "technician" | "metric";
  label: string;
  detail: string;
  target: CopilotRecordTarget;
  ticketId?: string;
  customerId?: string;
  siteId?: string;
  technician?: string;
  date?: string;
};

export type CopilotSource = {
  tool: string;
  label: string;
  tables: string[];
  rows: number;
  capped?: boolean;
};

export type CopilotQueryResult = {
  answer: string;
  sources: CopilotSource[];
  results: CopilotRecord[];
  warnings: string[];
  toolNames: string[];
};

type CopilotContext = {
  client: SupabaseClient;
  requester: AtlasRequester;
  question: string;
  now: Date;
};

type TicketRow = {
  id: string | number;
  tenant_id: string | null;
  glpi_ticket_id: string | number | null;
  site: string | null;
  region: string | null;
  entity: string | null;
  city: string | null;
  problem: string | null;
  technician: string | null;
  status: string | null;
  intervention_date: string | null;
  opened_at: string | null;
  created_at: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  urgent: boolean | null;
  site_id: string | number | null;
  customer_id: string | null;
  glpi_entity_id: string | number | null;
  glpi_entity_path: string | null;
};

type CustomerRow = {
  id: string;
  tenant_id: string | null;
  name: string | null;
  city: string | null;
  region: string | null;
  category?: string | null;
  type?: string | null;
};

type SiteRow = {
  id: string | number;
  tenant_id: string | null;
  name: string | null;
  city: string | null;
  region: string | null;
  entity: string | null;
  province: string | null;
  customer_id: string | null;
  glpi_entity_path: string | null;
};

type CustomerEntityRow = {
  id: string;
  tenant_id: string | null;
  customer_id: string | null;
  glpi_entity_id: string | number | null;
  display_name: string | null;
  canonical_name: string | null;
  name: string | null;
  complete_name: string | null;
  normalized_complete_name: string | null;
  root_name: string | null;
  entity_type: string | null;
  city: string | null;
  region: string | null;
  province: string | null;
  is_active: boolean | null;
};

type TenantUserRow = {
  id: string;
  tenant_id: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  display_name: string | null;
};

type WorkOrderRow = {
  id: string;
  tenant_id: string | null;
  ticket_id: string | number | null;
  title: string | null;
  technician_name: string | null;
  customer_name_snapshot: string | null;
  site_name_snapshot: string | null;
  site_address_snapshot: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  status: string | null;
  created_at: string | null;
};

type LocationMatch = {
  kind: "customer" | "site" | "entity" | "text";
  id: string;
  label: string;
  detail: string;
  score: number;
  customerId?: string;
  siteId?: string;
  entityId?: string;
  text?: string;
};

type LocationResolution =
  | { status: "none"; candidate: string }
  | { status: "ambiguous"; candidate: string; matches: LocationMatch[] }
  | { status: "resolved"; candidate: string; match: LocationMatch };

type TechnicianResolution =
  | { status: "none"; candidate: string }
  | { status: "ambiguous"; candidate: string; matches: string[] }
  | { status: "resolved"; name: string };

type Period = {
  label: string;
  start?: string;
  end?: string;
};

const TICKET_SELECT =
  "id,tenant_id,glpi_ticket_id,site,region,entity,city,problem,technician,status,intervention_date,opened_at,created_at,expected_close_date,closed_at,urgent,site_id,customer_id,glpi_entity_id,glpi_entity_path";

const CUSTOMER_SELECT = "id,tenant_id,name,city,region,category,type";
const SITE_SELECT = "id,tenant_id,name,city,region,entity,province,customer_id,glpi_entity_path";
const ENTITY_SELECT =
  "id,tenant_id,customer_id,glpi_entity_id,display_name,canonical_name,name,complete_name,normalized_complete_name,root_name,entity_type,city,region,province,is_active";
const TENANT_USER_SELECT = "id,tenant_id,email,role,status,display_name";
const WORK_ORDER_SELECT =
  "id,tenant_id,ticket_id,title,technician_name,customer_name_snapshot,site_name_snapshot,site_address_snapshot,scheduled_at,started_at,completed_at,closed_at,status,created_at";

const ITALIAN_NUMBER_WORDS: Record<string, number> = {
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
};

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(parts: Array<unknown>) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" - ");
}

function safeLikeTerm(value: string) {
  return normalize(value).replace(/\s+/g, " ").trim();
}

function safeOrPattern(value: string) {
  return safeLikeTerm(value).replace(/\s+/g, "%");
}

function formatDate(value?: string | null) {
  if (!value) return "data n/d";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data n/d";
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "data n/d";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data n/d";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  return copy;
}

function daysSince(value?: string | null, now = new Date()) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((now.getTime() - time) / 86400000));
}

function ticketPrimaryDate(ticket: TicketRow) {
  return ticket.closed_at || ticket.intervention_date || ticket.opened_at || ticket.created_at || null;
}

function ticketTitle(ticket: TicketRow) {
  return ticket.problem || ticket.site || ticket.entity || `Ticket #${ticket.glpi_ticket_id || ticket.id}`;
}

function ticketLabel(ticket: TicketRow) {
  const number = ticket.glpi_ticket_id ? `GLPI #${ticket.glpi_ticket_id}` : `ATLAS #${ticket.id}`;
  return `${number} - ${ticket.site || ticket.entity || "Sede n/d"}`;
}

function ticketDetail(ticket: TicketRow) {
  return compactText([
    ticket.status || "stato n/d",
    ticket.technician || "tecnico non assegnato",
    ticket.city || ticket.region,
    formatDate(ticketPrimaryDate(ticket)),
  ]);
}

function toTicketRecord(ticket: TicketRow): CopilotRecord {
  return {
    id: `ticket-${ticket.id}`,
    type: "ticket",
    label: ticketLabel(ticket),
    detail: ticketDetail(ticket),
    target: "registro",
    ticketId: String(ticket.id),
    customerId: ticket.customer_id || undefined,
    siteId: ticket.site_id ? String(ticket.site_id) : undefined,
    technician: ticket.technician || undefined,
    date: ticketPrimaryDate(ticket) || undefined,
  };
}

function toSiteRecord(site: SiteRow): CopilotRecord {
  return {
    id: `site-${site.id}`,
    type: "site",
    label: site.name || site.entity || "Sede",
    detail: compactText([site.city, site.region, site.glpi_entity_path]) || "Sede ATLAS",
    target: "clienti",
    siteId: String(site.id),
    customerId: site.customer_id || undefined,
  };
}

function toCustomerRecord(customer: CustomerRow): CopilotRecord {
  return {
    id: `customer-${customer.id}`,
    type: "customer",
    label: customer.name || "Cliente",
    detail: compactText([customer.city, customer.region, customer.category || customer.type]) || "Cliente ATLAS",
    target: "clienti",
    customerId: customer.id,
  };
}

function hasSqlIntent(question: string) {
  const q = normalize(question);
  return /\b(select|insert|update|delete|drop|alter|truncate|grant|revoke|from|where|join|union|sql|service role|service_role|tenant_id)\b/.test(q);
}

function isClosedStatus(value: unknown) {
  const status = normalize(value);
  return (
    status.includes("chiuso") ||
    status.includes("closed") ||
    status.includes("risolto") ||
    status.includes("solved") ||
    status.includes("validato") ||
    status === "5" ||
    status === "6"
  );
}

function isOpenTicket(ticket: TicketRow) {
  return !ticket.closed_at && !isClosedStatus(ticket.status);
}

function isUnassigned(ticket: TicketRow) {
  const technician = normalize(ticket.technician);
  return !technician || technician.includes("non assegnato") || technician === "n d" || technician === "nd";
}

function isTechnicianScoped(requester: AtlasRequester) {
  return requester.role === "tecnico";
}

function requesterTechnicianPattern(requester: AtlasRequester) {
  const display = normalize(requester.displayName);
  const displayParts = display.split(" ").filter(Boolean);
  const surname = displayParts.length > 1 ? displayParts[displayParts.length - 1] : display;
  const emailLocal = normalize(String(requester.email || "").split("@")[0]);
  return surname || emailLocal || "__no_technician_scope__";
}

function extractLimit(question: string, fallback = 10) {
  const q = normalize(question);
  const numeric = q.match(/\b(\d{1,2})\b/);
  if (numeric) return Math.min(COPILOT_TOOL_LIMIT, Math.max(1, Number(numeric[1])));

  const word = Object.entries(ITALIAN_NUMBER_WORDS).find(([key]) => q.includes(key));
  if (word) return Math.min(COPILOT_TOOL_LIMIT, word[1]);

  return Math.min(COPILOT_TOOL_LIMIT, fallback);
}

function extractPeriod(question: string, now: Date): Period {
  const q = normalize(question);

  if (q.includes("oggi")) {
    return {
      label: "oggi",
      start: startOfDay(now).toISOString(),
      end: endOfDay(now).toISOString(),
    };
  }

  if (q.includes("questa settimana") || q.includes("settimana")) {
    return {
      label: "questa settimana",
      start: startOfWeek(now).toISOString(),
      end: endOfDay(addDays(startOfWeek(now), 6)).toISOString(),
    };
  }

  if (q.includes("ultimi 30") || q.includes("ultimo mese")) {
    return {
      label: "ultimi 30 giorni",
      start: addDays(now, -30).toISOString(),
      end: now.toISOString(),
    };
  }

  const days = q.match(/(?:da|negli|ultimi)\s+(\d{1,4})\s+giorn/);
  if (days) {
    const amount = Math.min(730, Math.max(1, Number(days[1])));
    return {
      label: `ultimi ${amount} giorni`,
      start: addDays(now, -amount).toISOString(),
      end: now.toISOString(),
    };
  }

  const months = q.match(/(?:da|negli|ultimi)\s+(\d{1,3})\s+mes/);
  if (months) {
    const amount = Math.min(60, Math.max(1, Number(months[1])));
    return {
      label: `ultimi ${amount} mesi`,
      start: addDays(now, -amount * 30).toISOString(),
      end: now.toISOString(),
    };
  }

  return { label: "storico disponibile" };
}

function extractInactiveDays(question: string) {
  const q = normalize(question);
  const days = q.match(/(\d{1,4})\s+giorn/);
  if (days) return Math.min(1825, Math.max(1, Number(days[1])));

  const months = q.match(/(\d{1,3})\s+mes/);
  if (months) return Math.min(1825, Math.max(1, Number(months[1]) * 30));

  const years = q.match(/(\d{1,2})\s+ann/);
  if (years) return Math.min(3650, Math.max(1, Number(years[1]) * 365));

  return 90;
}

function extractLocationCandidate(question: string) {
  const raw = question.trim();
  const patterns = [
    /\b(?:per|presso|alla|allo|alle|agli|al|a|nel|nella|nello|nei|nelle)\s+(.+?)(?:\?|$)/i,
    /\b(?:di|del|della)\s+(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/\b(oggi|questa settimana|settimana|aperti|aperte|ticket|chiamate|interveniamo)\b/gi, " ")
        .trim();
    }
  }

  return "";
}

function scoreTextMatch(candidate: string, text: string) {
  const c = normalize(candidate);
  const t = normalize(text);
  if (!c || !t) return 0;
  if (t === c) return 100;
  if (t.includes(c)) return 82;
  const tokens = c.split(" ").filter((token) => token.length > 2);
  if (!tokens.length) return 0;
  const hits = tokens.filter((token) => t.includes(token)).length;
  return Math.round((hits / tokens.length) * 70);
}

function bestLocationMatches(candidate: string, rows: LocationMatch[]) {
  return rows
    .filter((row) => row.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

async function searchCustomersAndSites(client: SupabaseClient, tenantId: string, candidate: string): Promise<LocationResolution> {
  const term = safeLikeTerm(candidate);
  if (!term || term.length < 2) return { status: "none", candidate };

  const pattern = `%${term}%`;
  const [customersResult, sitesResult, entitiesResult] = await Promise.all([
    client.from("customers").select(CUSTOMER_SELECT).eq("tenant_id", tenantId).ilike("name", pattern).limit(8),
    client.from("sites").select(SITE_SELECT).eq("tenant_id", tenantId).ilike("name", pattern).limit(8),
    client.from("v_customer_entities_active").select(ENTITY_SELECT).eq("tenant_id", tenantId).ilike("complete_name", pattern).limit(8),
  ]);

  const extraSitesByCity = await client
    .from("sites")
    .select(SITE_SELECT)
    .eq("tenant_id", tenantId)
    .ilike("city", pattern)
    .limit(8);

  const extraSitesByRegion = await client
    .from("sites")
    .select(SITE_SELECT)
    .eq("tenant_id", tenantId)
    .ilike("region", pattern)
    .limit(8);

  const customers = (customersResult.data ?? []) as CustomerRow[];
  const sites = [
    ...((sitesResult.data ?? []) as SiteRow[]),
    ...((extraSitesByCity.data ?? []) as SiteRow[]),
    ...((extraSitesByRegion.data ?? []) as SiteRow[]),
  ];
  const entities = (entitiesResult.data ?? []) as CustomerEntityRow[];

  const matches = bestLocationMatches(candidate, [
    ...customers.map((customer) => ({
      kind: "customer" as const,
      id: customer.id,
      label: customer.name || "Cliente",
      detail: compactText([customer.city, customer.region]),
      customerId: customer.id,
      score: scoreTextMatch(candidate, compactText([customer.name, customer.city, customer.region])),
    })),
    ...sites.map((site) => ({
      kind: "site" as const,
      id: String(site.id),
      label: site.name || site.entity || "Sede",
      detail: compactText([site.city, site.region, site.glpi_entity_path]),
      siteId: String(site.id),
      customerId: site.customer_id || undefined,
      score: scoreTextMatch(candidate, compactText([site.name, site.city, site.region, site.entity, site.glpi_entity_path])),
    })),
    ...entities.map((entity) => ({
      kind: "entity" as const,
      id: entity.id,
      label: entity.display_name || entity.complete_name || entity.name || "Entita cliente",
      detail: compactText([entity.city, entity.region, entity.complete_name]),
      entityId: entity.id,
      customerId: entity.customer_id || undefined,
      score: scoreTextMatch(
        candidate,
        compactText([entity.display_name, entity.complete_name, entity.name, entity.city, entity.region, entity.root_name]),
      ),
    })),
  ]);

  if (!matches.length) {
    return {
      status: "resolved",
      candidate,
      match: {
        kind: "text",
        id: `text-${term}`,
        label: candidate,
        detail: "Filtro testuale su sede, citta, regione o ente",
        score: 30,
        text: term,
      },
    };
  }

  const top = matches[0];
  const closeMatches = matches.filter((match) => top.score - match.score <= 8);

  if (closeMatches.length > 1 && term.split(" ").length > 1) {
    return { status: "ambiguous", candidate, matches: closeMatches.slice(0, 5) };
  }

  return { status: "resolved", candidate, match: top };
}

async function listTenantTechnicians(client: SupabaseClient, tenantId: string) {
  const { data } = await client
    .from("tenant_users")
    .select(TENANT_USER_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("role", ["tecnico", "dispatcher", "manager"])
    .limit(200);

  const rows = (data ?? []) as TenantUserRow[];
  const names = rows
    .map((row) => row.display_name || String(row.email || "").split("@")[0])
    .filter(Boolean);

  return Array.from(new Set([...names, ...fallbackTechnicians]));
}

async function resolveTechnician(client: SupabaseClient, tenantId: string, question: string): Promise<TechnicianResolution> {
  const q = normalize(question);
  const technicians = await listTenantTechnicians(client, tenantId);
  const genericWords = new Set([
    "dove",
    "oggi",
    "tecnico",
    "tecnici",
    "ticket",
    "settimana",
    "questa",
    "quali",
    "hanno",
    "piu",
    "carico",
    "attivita",
  ]);
  const queryTokens = q.split(" ").filter((token) => token.length > 2 && !genericWords.has(token));

  const scored = technicians
    .map((name) => {
      const normalizedName = normalize(name);
      const nameTokens = normalizedName.split(" ").filter(Boolean);
      const direct = q.includes(normalizedName) ? 100 : 0;
      const tokenHits = queryTokens.filter((token) => nameTokens.some((nameToken) => nameToken.includes(token) || token.includes(nameToken))).length;
      const score = Math.max(direct, tokenHits * 45);
      return { name, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return { status: "none", candidate: queryTokens.join(" ") };

  const top = scored[0];
  const close = scored.filter((item) => top.score - item.score <= 10).map((item) => item.name);
  if (close.length > 1) return { status: "ambiguous", candidate: queryTokens.join(" "), matches: close.slice(0, 5) };

  return { status: "resolved", name: top.name };
}

function applyLocationFilterParts(match: LocationMatch) {
  if (match.kind === "customer" && match.customerId) return { field: "customer_id", value: match.customerId };
  if (match.kind === "site" && match.siteId) return { field: "site_id", value: match.siteId };
  if (match.kind === "entity" && match.customerId) return { field: "customer_id", value: match.customerId };
  return null;
}

function locationTextFilter(match: LocationMatch) {
  const text = match.text || match.label;
  const pattern = safeOrPattern(text);
  if (!pattern) return "";
  return [
    `site.ilike.%${pattern}%`,
    `city.ilike.%${pattern}%`,
    `region.ilike.%${pattern}%`,
    `entity.ilike.%${pattern}%`,
    `glpi_entity_path.ilike.%${pattern}%`,
  ].join(",");
}

function source(tool: string, label: string, tables: string[], rows: number, capped = false): CopilotSource {
  return { tool, label, tables, rows, capped: capped || undefined };
}

function buildAmbiguousLocationAnswer(resolution: Extract<LocationResolution, { status: "ambiguous" }>): CopilotQueryResult {
  return {
    answer: `Ho trovato piu corrispondenze per "${resolution.candidate}". Specifica quale intendi: ${resolution.matches
      .map((match) => match.label)
      .join(", ")}.`,
    sources: [source("search_customer_or_site", "Ricerca cliente/sede", ["customers", "sites", "v_customer_entities_active"], resolution.matches.length)],
    results: resolution.matches.map((match) => ({
      id: `${match.kind}-${match.id}`,
      type: match.kind === "customer" ? "customer" : "site",
      label: match.label,
      detail: match.detail,
      target: "clienti",
      customerId: match.customerId,
      siteId: match.siteId,
    })),
    warnings: ["Nome ambiguo: nessuna aggregazione eseguita finche non viene specificata la sede o il cliente."],
    toolNames: ["search_customer_or_site"],
  };
}

function buildAmbiguousTechnicianAnswer(resolution: Extract<TechnicianResolution, { status: "ambiguous" }>): CopilotQueryResult {
  return {
    answer: `Ho trovato piu tecnici compatibili con "${resolution.candidate}": ${resolution.matches.join(", ")}. Specifica nome e cognome.`,
    sources: [source("resolve_technician", "Ricerca tecnico", ["tenant_users"], resolution.matches.length)],
    results: resolution.matches.map((name) => ({
      id: `technician-${normalize(name)}`,
      type: "technician",
      label: name,
      detail: "Tecnico compatibile",
      target: "calendario",
      technician: name,
    })),
    warnings: ["Nome tecnico ambiguo."],
    toolNames: ["resolve_technician"],
  };
}

async function countTickets(ctx: CopilotContext, location?: LocationMatch, period?: Period) {
  let query = ctx.client
    .from("v_operational_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.requester.tenantId)
    .is("closed_at", null);

  if (period?.start) query = query.gte("opened_at", period.start);
  if (period?.end) query = query.lte("opened_at", period.end);

  if (location) {
    const part = applyLocationFilterParts(location);
    if (part) query = query.eq(part.field, part.value);
    else {
      const filter = locationTextFilter(location);
      if (filter) query = query.or(filter);
    }
  }

  if (isTechnicianScoped(ctx.requester)) {
    query = query.ilike("technician", `%${requesterTechnicianPattern(ctx.requester)}%`);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function answerTicketCount(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const candidate = extractLocationCandidate(ctx.question);
  const period = extractPeriod(ctx.question, ctx.now);
  const location = candidate ? await searchCustomersAndSites(ctx.client, ctx.requester.tenantId, candidate) : null;

  if (location?.status === "ambiguous") return buildAmbiguousLocationAnswer(location);

  const count = await countTickets(ctx, location?.status === "resolved" ? location.match : undefined, period);
  const scope = location?.status === "resolved" ? ` per ${location.match.label}` : "";
  const periodText = period.start ? ` in ${period.label}` : "";
  const scoped = isTechnicianScoped(ctx.requester) ? " nel tuo perimetro tecnico" : "";

  return {
    answer: `Ci sono ${count} ticket aperti${scope}${periodText}${scoped}.`,
    sources: [source("count_tickets", "Conteggio ticket aperti", ["v_operational_tickets"], count)],
    results: [
      {
        id: "metric-open-tickets",
        type: "metric",
        label: `${count} ticket aperti`,
        detail: `${location?.status === "resolved" ? location.match.label : "Tenant corrente"}${periodText}`,
        target: "registro",
      },
    ],
    warnings: location?.status === "none" ? [`Nessuna sede/cliente trovato per "${candidate}"; conteggio tenant-wide.`] : [],
    toolNames: ["count_tickets"],
  };
}

async function listOpenTickets(ctx: CopilotContext, options: { unassigned?: boolean; urgent?: boolean; slaRisk?: boolean } = {}) {
  const limit = extractLimit(ctx.question, options.slaRisk ? 10 : 5);
  let query = ctx.client
    .from("v_operational_tickets")
    .select(TICKET_SELECT, { count: "exact" })
    .eq("tenant_id", ctx.requester.tenantId)
    .is("closed_at", null)
    .order("opened_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (options.unassigned) query = query.or("technician.is.null,technician.eq.,technician.ilike.%non assegnato%");
  if (options.urgent) query = query.eq("urgent", true);
  if (options.slaRisk) query = query.lte("expected_close_date", addDays(ctx.now, 3).toISOString());

  const locationCandidate = extractLocationCandidate(ctx.question);
  let locationWarning: string | null = null;
  if (locationCandidate) {
    const location = await searchCustomersAndSites(ctx.client, ctx.requester.tenantId, locationCandidate);
    if (location.status === "ambiguous") return { rows: [], count: 0, capped: false, locationResult: buildAmbiguousLocationAnswer(location) };
    if (location.status === "resolved") {
      const part = applyLocationFilterParts(location.match);
      if (part) query = query.eq(part.field, part.value);
      else {
        const filter = locationTextFilter(location.match);
        if (filter) query = query.or(filter);
      }
    }
    if (location.status === "none") locationWarning = `Nessuna sede/cliente trovato per "${locationCandidate}".`;
  }

  if (isTechnicianScoped(ctx.requester)) {
    query = query.ilike("technician", `%${requesterTechnicianPattern(ctx.requester)}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const rows = ((data ?? []) as TicketRow[]).filter(isOpenTicket);
  return {
    rows,
    count: count || rows.length,
    capped: Boolean(count && count > rows.length),
    locationWarning,
    locationResult: null,
  };
}

async function answerTicketList(ctx: CopilotContext, options: { unassigned?: boolean; urgent?: boolean; slaRisk?: boolean }): Promise<CopilotQueryResult> {
  const list = await listOpenTickets(ctx, options);
  if (list.locationResult) return list.locationResult;

  const label = options.slaRisk
    ? "SLA a rischio o in scadenza"
    : options.urgent
      ? "ticket urgenti"
      : options.unassigned
        ? "ticket senza tecnico"
        : "ticket aperti";

  if (!list.rows.length) {
    return {
      answer: `Non risultano ${label} nel perimetro consultabile.`,
      sources: [source(options.slaRisk ? "sla_risk" : "list_open_tickets", label, ["v_operational_tickets"], 0)],
      results: [],
      warnings: [list.locationWarning].filter((item): item is string => Boolean(item)),
      toolNames: [options.slaRisk ? "sla_risk" : options.unassigned ? "list_unassigned_tickets" : "list_open_tickets"],
    };
  }

  const firstRows = list.rows.slice(0, 5);
  const facts = firstRows
    .map((ticket) => {
      const extra = options.slaRisk && ticket.expected_close_date ? `, scadenza ${formatDate(ticket.expected_close_date)}` : "";
      return `${ticketLabel(ticket)} (${ticket.status || "stato n/d"}, ${ticket.technician || "senza tecnico"}${extra})`;
    })
    .join("; ");

  return {
    answer: `Ho trovato ${list.count} ${label}. Primi risultati: ${facts}.${list.capped ? " Nota: lista limitata per sicurezza." : ""}`,
    sources: [
      source(
        options.slaRisk ? "sla_risk" : options.unassigned ? "list_unassigned_tickets" : "list_open_tickets",
        label,
        ["v_operational_tickets"],
        list.rows.length,
        list.capped,
      ),
    ],
    results: list.rows.map(toTicketRecord),
    warnings: [list.locationWarning, list.capped ? "Risultati limitati: restringi la domanda per vedere meno record." : null].filter(
      (item): item is string => Boolean(item),
    ),
    toolNames: [options.slaRisk ? "sla_risk" : options.unassigned ? "list_unassigned_tickets" : "list_open_tickets"],
  };
}

async function answerTechnicianSchedule(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const resolved = await resolveTechnician(ctx.client, ctx.requester.tenantId, ctx.question);
  if (resolved.status === "ambiguous") return buildAmbiguousTechnicianAnswer(resolved);
  if (resolved.status === "none") {
    return {
      answer: "Non ho trovato un tecnico compatibile nella rubrica ATLAS. Specifica nome e cognome.",
      sources: [source("resolve_technician", "Ricerca tecnico", ["tenant_users"], 0)],
      results: [],
      warnings: ["Tecnico non trovato."],
      toolNames: ["resolve_technician"],
    };
  }

  if (isTechnicianScoped(ctx.requester) && !normalize(resolved.name).includes(requesterTechnicianPattern(ctx.requester))) {
    return {
      answer: "Il tuo ruolo consente solo il perimetro dei tuoi interventi. Non posso consultare la pianificazione di un altro tecnico.",
      sources: [source("permission_scope", "Perimetro ruolo tecnico", ["tenant_users"], 0)],
      results: [],
      warnings: ["Richiesta fuori perimetro per ruolo tecnico."],
      toolNames: ["permission_scope"],
    };
  }

  const week = normalize(ctx.question).includes("settimana");
  const start = startOfDay(ctx.now).toISOString();
  const end = (week ? endOfDay(addDays(startOfWeek(ctx.now), 6)) : endOfDay(ctx.now)).toISOString();
  const startDate = dateOnly(startOfDay(ctx.now));
  const endDate = dateOnly(week ? endOfDay(addDays(startOfWeek(ctx.now), 6)) : endOfDay(ctx.now));
  const pattern = `%${safeLikeTerm(resolved.name.split(" ").slice(-1)[0] || resolved.name)}%`;

  const [ticketsResult, workOrdersResult] = await Promise.all([
    ctx.client
      .from("v_operational_tickets")
      .select(TICKET_SELECT)
      .eq("tenant_id", ctx.requester.tenantId)
      .is("closed_at", null)
      .ilike("technician", pattern)
      .gte("intervention_date", startDate)
      .lte("intervention_date", endDate)
      .order("intervention_date", { ascending: true })
      .limit(10),
    ctx.client
      .from("work_orders")
      .select(WORK_ORDER_SELECT)
      .eq("tenant_id", ctx.requester.tenantId)
      .ilike("technician_name", pattern)
      .gte("scheduled_at", start)
      .lte("scheduled_at", end)
      .order("scheduled_at", { ascending: true })
      .limit(10),
  ]);

  if (ticketsResult.error) throw ticketsResult.error;
  if (workOrdersResult.error) throw workOrdersResult.error;

  const tickets = (ticketsResult.data ?? []) as TicketRow[];
  const workOrders = (workOrdersResult.data ?? []) as WorkOrderRow[];
  const records = [
    ...tickets.map(toTicketRecord),
    ...workOrders.map((workOrder) => ({
      id: `work-order-${workOrder.id}`,
      type: "ticket" as const,
      label: workOrder.title || `Bolla ${workOrder.id}`,
      detail: compactText([workOrder.site_name_snapshot, workOrder.customer_name_snapshot, formatDateTime(workOrder.scheduled_at)]),
      target: "calendario" as const,
      ticketId: workOrder.ticket_id ? String(workOrder.ticket_id) : undefined,
      technician: workOrder.technician_name || undefined,
      date: workOrder.scheduled_at || undefined,
    })),
  ].slice(0, COPILOT_TOOL_LIMIT);

  if (!records.length) {
    const recent = await ctx.client
      .from("v_operational_tickets")
      .select(TICKET_SELECT)
      .eq("tenant_id", ctx.requester.tenantId)
      .is("closed_at", null)
      .ilike("technician", pattern)
      .order("opened_at", { ascending: false, nullsFirst: false })
      .limit(5);

    if (recent.error) throw recent.error;
    const recentTickets = (recent.data ?? []) as TicketRow[];

    return {
      answer: recentTickets.length
        ? `${resolved.name} non ha una pianificazione con data ${week ? "questa settimana" : "oggi"} nei dati consultati. Risultano pero ${recentTickets.length} ticket attivi assegnati: ${recentTickets
            .map((ticket) => ticketLabel(ticket))
            .join("; ")}. Non posso dedurre una posizione reale senza calendario o intervento pianificato.`
        : `${resolved.name} non ha pianificazioni o ticket attivi visibili ${week ? "questa settimana" : "oggi"}. Non posso determinare dove si trovi dai dati ATLAS.`,
      sources: [
        source("technician_schedule", "Pianificazione tecnico", ["v_operational_tickets", "work_orders"], 0),
        source("technician_activity", "Ticket attivi tecnico", ["v_operational_tickets"], recentTickets.length),
      ],
      results: recentTickets.map(toTicketRecord),
      warnings: ["Posizione non determinabile: nessun dato di localizzazione live disponibile."],
      toolNames: ["technician_schedule", "technician_activity"],
    };
  }

  const first = records[0];
  return {
    answer: `${resolved.name} risulta pianificato ${week ? "questa settimana" : "oggi"} su ${records.length} attivita. Prima evidenza: ${first.label}, ${first.detail}. Questo e un fatto di pianificazione, non una posizione GPS.`,
    sources: [source("technician_schedule", "Pianificazione tecnico", ["v_operational_tickets", "work_orders"], records.length)],
    results: records,
    warnings: ["ATLAS non dispone di tracking posizione live: la risposta usa ticket e bolle pianificate."],
    toolNames: ["technician_schedule"],
  };
}

async function answerTechnicianWorkload(ctx: CopilotContext): Promise<CopilotQueryResult> {
  if (isTechnicianScoped(ctx.requester)) {
    const own = await answerTechnicianSchedule({
      ...ctx,
      question: `Dove sono ${ctx.requester.displayName || ctx.requester.email} questa settimana?`,
    });
    return {
      ...own,
      answer: `Per il tuo ruolo mostro solo il tuo perimetro. ${own.answer}`,
      warnings: [...own.warnings, "Aggregazione globale tecnici non disponibile per ruolo tecnico."],
    };
  }

  const period = extractPeriod(ctx.question, ctx.now);
  const start = period.start || startOfWeek(ctx.now).toISOString();
  const { data, error, count } = await ctx.client
    .from("v_operational_tickets")
    .select("id,tenant_id,technician,urgent,status,closed_at,opened_at,intervention_date", { count: "exact" })
    .eq("tenant_id", ctx.requester.tenantId)
    .gte("opened_at", start)
    .order("opened_at", { ascending: false })
    .limit(1000);

  if (error) throw error;

  const rows = ((data ?? []) as TicketRow[]).filter((ticket) => ticket.technician);
  const byTechnician = new Map<string, { total: number; open: number; urgent: number }>();

  rows.forEach((ticket) => {
    const name = ticket.technician || "Tecnico n/d";
    const current = byTechnician.get(name) || { total: 0, open: 0, urgent: 0 };
    current.total += 1;
    if (isOpenTicket(ticket)) current.open += 1;
    if (ticket.urgent) current.urgent += 1;
    byTechnician.set(name, current);
  });

  const ranking = Array.from(byTechnician.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const answer = ranking.length
    ? `Tecnici con piu ticket in ${period.label}: ${ranking
        .map((item) => `${item.name}: ${item.total} totali (${item.open} aperti, ${item.urgent} urgenti)`)
        .join("; ")}.${count && count > rows.length ? " Dato parziale: campione limitato a 1000 record." : ""}`
    : `Non risultano ticket assegnati a tecnici in ${period.label}.`;

  return {
    answer,
    sources: [source("technician_workload", "Carico tecnici", ["v_operational_tickets"], rows.length, Boolean(count && count > rows.length))],
    results: ranking.map((item) => ({
      id: `technician-load-${normalize(item.name)}`,
      type: "technician",
      label: item.name,
      detail: `${item.total} ticket, ${item.open} aperti, ${item.urgent} urgenti`,
      target: "analytics",
      technician: item.name,
    })),
    warnings: count && count > rows.length ? ["Aggregazione limitata a 1000 record per contenere costo e latenza."] : [],
    toolNames: ["technician_workload"],
  };
}

async function answerLastIntervention(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const candidate = extractLocationCandidate(ctx.question) || ctx.question.replace(/da quanto tempo non interveniamo/gi, "").trim();
  const location = await searchCustomersAndSites(ctx.client, ctx.requester.tenantId, candidate);
  if (location.status === "ambiguous") return buildAmbiguousLocationAnswer(location);

  if (location.status === "none") {
    return {
      answer: `Non ho trovato cliente o sede compatibile con "${candidate}".`,
      sources: [source("search_customer_or_site", "Ricerca cliente/sede", ["customers", "sites", "v_customer_entities_active"], 0)],
      results: [],
      warnings: ["Cliente o sede non trovato."],
      toolNames: ["search_customer_or_site"],
    };
  }

  let query = ctx.client
    .from("v_operational_tickets")
    .select(TICKET_SELECT)
    .eq("tenant_id", ctx.requester.tenantId)
    .order("intervention_date", { ascending: false, nullsFirst: false })
    .order("closed_at", { ascending: false, nullsFirst: false })
    .limit(10);

  const part = applyLocationFilterParts(location.match);
  if (part) query = query.eq(part.field, part.value);
  else {
    const filter = locationTextFilter(location.match);
    if (filter) query = query.or(filter);
  }

  if (isTechnicianScoped(ctx.requester)) {
    query = query.ilike("technician", `%${requesterTechnicianPattern(ctx.requester)}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = ((data ?? []) as TicketRow[])
    .filter((ticket) => Boolean(ticketPrimaryDate(ticket)))
    .sort((a, b) => new Date(ticketPrimaryDate(b) || 0).getTime() - new Date(ticketPrimaryDate(a) || 0).getTime());

  if (!rows.length) {
    return {
      answer: `Non trovo interventi registrati per ${location.match.label} nel perimetro consultabile.`,
      sources: [source("last_intervention", "Ultimo intervento", ["v_operational_tickets"], 0)],
      results: [
        {
          id: `location-${location.match.id}`,
          type: location.match.kind === "customer" ? "customer" : "site",
          label: location.match.label,
          detail: location.match.detail,
          target: "clienti",
          customerId: location.match.customerId,
          siteId: location.match.siteId,
        },
      ],
      warnings: ["Dato incompleto: nessun ticket/intervento con data utile."],
      toolNames: ["last_intervention"],
    };
  }

  const last = rows[0];
  const lastDate = ticketPrimaryDate(last);
  const days = daysSince(lastDate, ctx.now);

  return {
    answer: `Ultimo intervento trovato per ${location.match.label}: ${formatDate(lastDate)} (${days ?? "n/d"} giorni fa), ${ticketLabel(last)}. Fatto basato sui ticket/interventi registrati.`,
    sources: [source("last_intervention", "Ultimo intervento", ["v_operational_tickets"], rows.length)],
    results: rows.map(toTicketRecord),
    warnings: rows.length >= 10 ? ["Sono stati analizzati gli ultimi 10 record corrispondenti."] : [],
    toolNames: ["last_intervention"],
  };
}

async function answerInactiveLocations(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const days = extractInactiveDays(ctx.question);
  const since = addDays(ctx.now, -days).toISOString();
  const [sitesResult, ticketsResult] = await Promise.all([
    ctx.client.from("sites").select(SITE_SELECT).eq("tenant_id", ctx.requester.tenantId).order("name", { ascending: true }).limit(200),
    ctx.client
      .from("v_operational_tickets")
      .select("id,tenant_id,site_id,customer_id,intervention_date,closed_at,opened_at,created_at")
      .eq("tenant_id", ctx.requester.tenantId)
      .gte("opened_at", since)
      .limit(5000),
  ]);

  if (sitesResult.error) throw sitesResult.error;
  if (ticketsResult.error) throw ticketsResult.error;

  const sites = (sitesResult.data ?? []) as SiteRow[];
  const tickets = (ticketsResult.data ?? []) as TicketRow[];
  const activeSiteIds = new Set(tickets.map((ticket) => String(ticket.site_id || "")).filter(Boolean));
  const inactive = sites.filter((site) => !activeSiteIds.has(String(site.id))).slice(0, COPILOT_TOOL_LIMIT);

  return {
    answer: inactive.length
      ? `Ho trovato ${inactive.length} sedi senza interventi negli ultimi ${days} giorni tra le prime ${sites.length} sedi analizzate: ${inactive
          .slice(0, 6)
          .map((site) => site.name || site.entity || site.city || site.id)
          .join("; ")}.`
      : `Non risultano sedi inattive negli ultimi ${days} giorni nel campione analizzato.`,
    sources: [
      source("inactive_locations", "Sedi senza interventi", ["sites", "v_operational_tickets"], inactive.length, sites.length >= 200 || tickets.length >= 5000),
    ],
    results: inactive.map(toSiteRecord),
    warnings: sites.length >= 200 || tickets.length >= 5000 ? ["Analisi campionata per limiti di sicurezza: restringi la domanda per maggiore precisione."] : [],
    toolNames: ["inactive_locations"],
  };
}

async function answerOperationalStats(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const [open, urgent, unassigned, sla] = await Promise.all([
    countTickets(ctx),
    listOpenTickets(ctx, { urgent: true }),
    listOpenTickets(ctx, { unassigned: true }),
    listOpenTickets(ctx, { slaRisk: true }),
  ]);

  const answer = [
    `Sintesi operativa: ${open} ticket aperti`,
    `${urgent.count} urgenti`,
    `${unassigned.count} senza tecnico`,
    `${sla.count} SLA a rischio o in scadenza`,
  ].join(", ") + ".";

  return {
    answer,
    sources: [
      source("operational_stats", "Statistiche operative sintetiche", ["v_operational_tickets"], open),
      source("ticket_urgenti", "Ticket urgenti", ["v_operational_tickets"], urgent.rows.length, urgent.capped),
      source("ticket_senza_tecnico", "Ticket senza tecnico", ["v_operational_tickets"], unassigned.rows.length, unassigned.capped),
      source("sla_risk", "SLA a rischio", ["v_operational_tickets"], sla.rows.length, sla.capped),
    ],
    results: [...urgent.rows, ...unassigned.rows, ...sla.rows]
      .filter((ticket, index, array) => array.findIndex((item) => String(item.id) === String(ticket.id)) === index)
      .slice(0, COPILOT_TOOL_LIMIT)
      .map(toTicketRecord),
    warnings: isTechnicianScoped(ctx.requester) ? ["Statistiche limitate al perimetro del tecnico autenticato."] : [],
    toolNames: ["operational_stats", "ticket_urgenti", "ticket_senza_tecnico", "sla_risk"],
  };
}

export async function answerCopilotQuestion(ctx: CopilotContext): Promise<CopilotQueryResult> {
  const q = normalize(ctx.question);

  if (hasSqlIntent(ctx.question)) {
    return {
      answer:
        "Non posso eseguire o generare SQL, leggere tabelle arbitrarie o aggirare i permessi. Posso pero rispondere usando gli strumenti ATLAS autorizzati: ticket aperti, SLA, tecnico, sede, cliente e statistiche operative.",
      sources: [source("security_guardrail", "Blocco SQL libero", [], 0)],
      results: [],
      warnings: ["Richiesta SQL o istruzione amministrativa bloccata."],
      toolNames: ["security_guardrail"],
    };
  }

  if (q.includes("dove") || (q.includes("pianific") && q.includes("tecnic"))) {
    return answerTechnicianSchedule(ctx);
  }

  if ((q.includes("tecnici") || q.includes("tecnico")) && (q.includes("piu ticket") || q.includes("carico") || q.includes("attivita"))) {
    return answerTechnicianWorkload(ctx);
  }

  if (q.includes("senza interventi") || q.includes("non interveniamo da")) {
    return answerInactiveLocations(ctx);
  }

  if (q.includes("da quanto") || q.includes("ultimo intervento") || q.includes("non interveniamo")) {
    return answerLastIntervention(ctx);
  }

  if (q.includes("sla")) {
    return answerTicketList(ctx, { slaRisk: true });
  }

  if (q.includes("senza tecnico") || q.includes("non assegnat")) {
    return answerTicketList(ctx, { unassigned: true });
  }

  if (q.includes("urgent") || q.includes("critici") || q.includes("critico")) {
    return answerTicketList(ctx, { urgent: true });
  }

  if (q.includes("quanti") || q.includes("quante") || q.includes("conteggio") || q.includes("numero")) {
    return answerTicketCount(ctx);
  }

  if (q.includes("mostrami") || q.includes("mostra") || q.includes("elenca") || q.includes("lista")) {
    return answerTicketList(ctx, {});
  }

  return answerOperationalStats(ctx);
}
