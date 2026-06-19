import { materials } from "@/lib/atlasConstants";
import { getContractInfo, materialCost } from "@/lib/atlasUtils";

type SyncTicketToGlpiArgs = {
  ticket: any;
  editableContracts: any[];
  supabaseClient: any;
  showMessage: (text: string, type?: "success" | "error") => void;
};

type GlpiSyncResult = {
  ok?: boolean;
  glpiTicketId?: string | number | null;
  glpiEntityId?: number | null;
  error?: string;
  code?: string;
  stage?: string;
  status?: number;
};

const GLPI_SYNC_TIMEOUT_MS = 15000;

function normalizeGlpiValue(value: any) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function resolveGlpiEntityId(
  ticket: any,
  editableContracts: any[],
  supabaseClient: any
) {
  const directGlpiEntityId = Number(ticket?.glpiEntityId || ticket?.glpi_entity_id || 0);

  if (Number.isSafeInteger(directGlpiEntityId) && directGlpiEntityId > 0) {
    return directGlpiEntityId;
  }

  const siteNorm = normalizeGlpiValue(ticket?.site);
  const entityNorm = normalizeGlpiValue(ticket?.entity);
  const regionNorm = normalizeGlpiValue(ticket?.region);
  const contract = getContractInfo(ticket?.site || "", ticket?.entity || "", editableContracts);
  const contractEntityNorm = normalizeGlpiValue(contract?.clientType || "");

  const { data, error } = await supabaseClient
    .from("atlas_glpi_entities")
    .select("glpi_id,name,category,region");

  if (error) {
    console.warn("GLPI entity lookup failed", error);
    return null;
  }

  const rows = (data || []).map((row: any) => ({
    ...row,
    cleanName: normalizeGlpiValue(row.name),
    cleanCategory: normalizeGlpiValue(row.category),
    cleanRegion: normalizeGlpiValue(row.region),
  }));

  const exactSite = rows.find((row: any) => row.cleanName && row.cleanName === siteNorm);
  if (exactSite?.glpi_id !== undefined && exactSite?.glpi_id !== null) {
    console.log("GLPI MATCH EXACT:", exactSite);
    return Number(exactSite.glpi_id);
  }

  const genericWords = new Set([
    "carabinieri",
    "compagnia",
    "comando",
    "provinciale",
    "gruppo",
    "reparto",
    "territoriale",
    "cc",
    "di",
    "del",
    "della",
    "dei",
    "degli",
    "com",
    "prov",
  ]);

  const siteTokens = siteNorm
    .split(" ")
    .filter((token) => token.length >= 3 && !genericWords.has(token));

  const scoredMatches = rows
    .map((row: any) => {
      const cleanName = row.cleanName || "";
      const matchedTokens = siteTokens.filter((token) => cleanName.includes(token));
      const fullContains = cleanName.includes(siteNorm) || siteNorm.includes(cleanName);

      let score = matchedTokens.length * 100;
      if (fullContains) score += 1000;
      score += Math.min(cleanName.length, 200);

      return {
        ...row,
        matchedTokens,
        score,
      };
    })
    .filter((row: any) => {
      if (!row.cleanName || !siteNorm) return false;
      if (row.cleanName.length < 12) return false;
      if (row.cleanName === "carabinieri") return false;
      return row.score > 0;
    })
    .sort((a: any, b: any) => b.score - a.score);

  const bestSite = scoredMatches[0];
  if (bestSite?.glpi_id !== undefined && bestSite?.glpi_id !== null) {
    console.log("GLPI MATCH SCORED:", bestSite);
    return Number(bestSite.glpi_id);
  }

  const categoryRegion = rows
    .filter((row: any) => {
      const categoryMatch =
        row.cleanCategory &&
        (row.cleanCategory === entityNorm ||
          row.cleanCategory === contractEntityNorm ||
          entityNorm.includes(row.cleanCategory) ||
          contractEntityNorm.includes(row.cleanCategory));
      const regionMatch = !regionNorm || !row.cleanRegion || row.cleanRegion === regionNorm;
      return categoryMatch && regionMatch && Number(row.glpi_id) > 1;
    })
    .sort(
      (a: any, b: any) =>
        String(b.cleanName || "").length - String(a.cleanName || "").length
    )?.[0];

  if (categoryRegion?.glpi_id !== undefined && categoryRegion?.glpi_id !== null) {
    console.log("GLPI MATCH CATEGORY REGION:", categoryRegion);
    return Number(categoryRegion.glpi_id);
  }

  console.warn("GLPI entity not resolved for site:", ticket?.site);
  return null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function buildGlpiSyncLogPayload(
  ticket: {
    id?: unknown;
    title?: unknown;
    problem?: unknown;
    site?: unknown;
    entity?: unknown;
    region?: unknown;
    ticketType?: unknown;
    ticketCategory?: unknown;
    ticketStatus?: unknown;
    status?: unknown;
  },
  glpiEntityId: number | null,
  materialCount: number,
) {
  return {
    atlasTicketId: ticket?.id ?? null,
    hasTitle: Boolean(String(ticket?.title || "").trim()),
    hasProblem: Boolean(String(ticket?.problem || "").trim()),
    hasSite: Boolean(String(ticket?.site || "").trim()),
    hasEntity: Boolean(String(ticket?.entity || "").trim()),
    hasRegion: Boolean(String(ticket?.region || "").trim()),
    glpiEntityIdPresent: Boolean(glpiEntityId),
    ticketType: ticket?.ticketType || ticket?.ticketCategory || null,
    ticketStatus: ticket?.ticketStatus || ticket?.status || null,
    materialCount,
  };
}

export async function syncTicketToGlpi({
  ticket,
  editableContracts,
  supabaseClient,
  showMessage,
}: SyncTicketToGlpiArgs): Promise<GlpiSyncResult | null> {
  try {
    const contract = getContractInfo(ticket?.site || "", ticket?.entity || "", editableContracts);
    const glpiEntityId = await resolveGlpiEntityId(ticket, editableContracts, supabaseClient);
    const materialIds = ticket.materialIds || ticket.materials || [];
    const materialNames = materialIds
      .map((id: string) => materials.find((m) => m.id === id)?.name || id)
      .filter(Boolean);
    const cost = materialCost(materialIds);
    const openedAt = ticket.openedAt || ticket.opened_at || new Date().toISOString();

    const logPayload = buildGlpiSyncLogPayload(ticket, glpiEntityId, materialIds.length);
    console.log("GLPI sync payload summary", logPayload);

    if (!glpiEntityId) {
      console.warn("GLPI sync skipped: missing entity", logPayload);
      showMessage("Ticket creato in ATLAS, ma non sincronizzato su GLPI: entitÃ  GLPI mancante.", "error");
      return null;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const tenantId = ticket?.tenantId || ticket?.tenant_id || null;

    if (!accessToken || !tenantId) {
      showMessage("Ticket creato in ATLAS, ma non sincronizzato su GLPI: sessione o tenant non validi.", "error");
      return null;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), GLPI_SYNC_TIMEOUT_MS);

    const response = await fetch("/api/glpi/create-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        atlasTicketId: ticket.id,
        tenantId,
        title: ticket.title,
        name: ticket.title,

        // Campo descrizione GLPI: deve arrivare pulito, senza concetti di pianificazione.
        problem: ticket.problem,
        description: ticket.problem,
        content: ticket.problem,

        ticketCategory: ticket.ticketCategory || ticket.ticketType,
        ticketStatus: ticket.ticketStatus,
        ticketType: ticket.ticketType,
        status: ticket.status,

        site: ticket.site,
        region: ticket.region,
        entity: ticket.entity,
        city: ticket.city,

        materialIds,
        materials: materialNames,
        cost,

        openedAt,
        openingDate: openedAt,
        openedBy: ticket.openedBy || ticket.operator || ticket.technician || "ATLAS",

        contractName: contract?.name,
        contractEntity: contract?.clientType,
        glpiEntityId,
      }),
    });
    window.clearTimeout(timeoutId);

    const result = (await response.json().catch(() => null)) as GlpiSyncResult | null;

    if (!response.ok || !result?.ok) {
      console.error("GLPI sync failed", {
        ...logPayload,
        httpStatus: response.status,
        stage: result?.stage || null,
        code: result?.code || null,
      });

      if (response.status === 400 && result?.code === "missing_glpi_entity") {
        showMessage("Ticket creato in ATLAS, ma non sincronizzato su GLPI: entitÃ  GLPI mancante.", "error");
        return null;
      }

      showMessage(result?.error || "Ticket creato in ATLAS, ma non sincronizzato su GLPI.", "error");
      return null;
    }

    return result;
  } catch (error: unknown) {
    console.error("GLPI sync exception", getErrorMessage(error, "Errore sconosciuto"));
    showMessage(
      isAbortError(error)
        ? "Ticket creato in ATLAS, ma la sincronizzazione GLPI ha superato il tempo massimo."
        : "Ticket creato in ATLAS, ma GLPI non e raggiungibile.",
      "error",
    );
    return null;
  }
}
