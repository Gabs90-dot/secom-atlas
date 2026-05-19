import { materials } from "@/lib/atlasConstants";
import { getContractInfo, materialCost } from "@/lib/atlasUtils";

type SyncTicketToGlpiArgs = {
  ticket: any;
  editableContracts: any[];
  supabaseClient: any;
  showMessage: (text: string, type?: "success" | "error") => void;
};

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

export async function syncTicketToGlpi({
  ticket,
  editableContracts,
  supabaseClient,
  showMessage,
}: SyncTicketToGlpiArgs) {
  try {
    const contract = getContractInfo(ticket?.site || "", ticket?.entity || "", editableContracts);
    const glpiEntityId = await resolveGlpiEntityId(ticket, editableContracts, supabaseClient);
    const materialIds = ticket.materialIds || ticket.materials || [];
    const materialNames = materialIds
      .map((id: string) => materials.find((m) => m.id === id)?.name || id)
      .filter(Boolean);
    const cost = materialCost(materialIds);

    console.log("ATLAS SITE:", ticket.site);
    console.log("GLPI ENTITY ID:", glpiEntityId);

    const response = await fetch("/api/glpi/create-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        atlasTicketId: ticket.id,
        title: ticket.title,
        ticketCategory: ticket.ticketCategory || ticket.ticketType,
        ticketStatus: ticket.ticketStatus,
        site: ticket.site,
        region: ticket.region,
        entity: ticket.entity,
        city: ticket.city,
        problem: ticket.problem,
        materialIds,
        materials: materialNames,
        cost,
        technician: ticket.technician,
        status: ticket.status,
        date: ticket.date,
        slot: ticket.slot,
        ticketType: ticket.ticketType,
        contractName: contract?.name,
        contractEntity: contract?.clientType,
        glpiEntityId,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      console.error("GLPI sync error", result);
      showMessage("Ticket salvato in ATLAS, ma non sincronizzato con GLPI", "error");
      return null;
    }

    return result;
  } catch (error) {
    console.error("GLPI sync exception", error);
    showMessage("Ticket salvato in ATLAS, ma GLPI non è raggiungibile", "error");
    return null;
  }
}
