import { contracts, materials } from "./atlasConstants";
import type { AtlasContract } from "./atlasTypes";

export function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export function materialCost(ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((m) => m.id === id);
    return sum + (item?.cost || 0);
  }, 0);
}

export function getContractInfo(
  site: string,
  entity: string,
  sourceContracts: AtlasContract[] = contracts
) {
  const text = `${site} ${entity}`.toLowerCase();

  return sourceContracts.find((contract) =>
    contract.match.some((word) => text.includes(word.toLowerCase()))
  );
}

export function getContractStatus(contract: any) {
  if (!contract?.endDate || contract.endDate === "Da verificare") {
    return {
      label: "Scadenza da verificare",
      color: "bg-slate-600",
      text: "text-slate-300",
      warning: false,
    };
  }

  const today = new Date();
  const end = new Date(contract.endDate);

  const diffDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: "Contratto scaduto",
      color: "bg-red-600",
      text: "text-red-300",
      warning: true,
    };
  }

  if (diffDays <= contract.renewalAlertDays) {
    return {
      label: `In scadenza tra ${diffDays} giorni`,
      color: "bg-amber-500",
      text: "text-amber-300",
      warning: true,
    };
  }

  return {
    label: "Contratto attivo",
    color: "bg-emerald-600",
    text: "text-emerald-300",
    warning: false,
  };
}

export function getInventoryStatus(quantity: number) {
  if (quantity <= 0) {
    return {
      label: "Esaurito",
      className: "bg-red-500/15 text-red-300 border border-red-500/30",
    };
  }

  if (quantity < 10) {
    return {
      label: "Da riordinare",
      className: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    };
  }

  return {
    label: "Disponibile",
    className: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  };
}

export function normalizeSiteRegion(site: any) {
  if (site.region && !String(site.region).toLowerCase().includes("n/d")) {
    return site;
  }

  const text = `${site.name || ""} ${site.city || ""}`.toLowerCase();

  const rules: [string[], string][] = [
    [["padova", "venezia", "verona", "vicenza", "treviso", "rovigo"], "Veneto"],
    [["parma", "rimini", "reggio emilia", "bologna", "ferrara"], "Emilia-Romagna"],
    [["ragusa", "siracusa", "trapani", "palermo", "catania", "gela"], "Sicilia"],
    [["salerno", "avellino", "caserta", "napoli", "aversa", "nocera"], "Campania"],
    [["viterbo", "rieti", "roma", "ostia", "frascati", "aprilia"], "Lazio"],
    [["trento", "bolzano", "merano"], "Trentino-Alto Adige"],
    [["varese", "milano", "brescia", "pavia", "rho", "sondrio"], "Lombardia"],
    [["trieste", "udine", "pordenone", "gorizia"], "Friuli-Venezia Giulia"],
    [["taranto", "trani", "bari", "brindisi", "lecce"], "Puglia"],
    [["reggio calabria", "vibo valentia", "cosenza", "locri", "lamezia"], "Calabria"],
    [["olbia", "sassari", "cagliari", "sanluri"], "Sardegna"],
    [["verbania", "torino", "vercelli", "cuneo", "asti"], "Piemonte"],
    [["massa", "siena", "pisa", "lucca", "firenze"], "Toscana"],
    [["ancona", "macerata", "fermo", "ascoli"], "Marche"],
    [["perugia", "terni", "orvieto"], "Umbria"],
    [["teramo", "pescara", "chieti", "aquila"], "Abruzzo"],
    [["isernia", "campobasso"], "Molise"],
    [["aosta"], "Valle d'Aosta"],
    [["savona", "genova", "imperia", "la spezia"], "Liguria"],
    [["potenza", "matera"], "Basilicata"],
  ];

  for (const [keywords, region] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return { ...site, region };
    }
  }

  return { ...site, region: "Da verificare" };
}
