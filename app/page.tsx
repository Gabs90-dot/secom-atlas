"use client";

import { supabase } from "@/lib/supabase";
import { systemsCatalog } from "@/lib/systemsCatalog";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Map,
  Monitor,
  Package,
  Phone,
  Search,
  Users,
} from "lucide-react";

const AtlasMap = dynamic(() => import("@/components/AtlasMap"), {
  ssr: false,
});

const INITIAL_BUDGET = 49043;

const materials = [
  { id: "kit-tlc", name: "Kit TLC", cost: 931, sale: 1210 },
  { id: "uccs", name: "UCCS", cost: 821, sale: 1068 },
  { id: "monitor", name: "Monitor", cost: 199, sale: 259 },
  { id: "kit-lampade", name: "Kit lampade", cost: 72, sale: 94 },
  { id: "ram", name: "RAM", cost: 56, sale: 73 },
  { id: "hub-usb", name: "Hub USB", cost: 52, sale: 68 },
  { id: "motore-sedia", name: "Motore sedia SPIS", cost: 196, sale: 255 },
  { id: "ups", name: "UPS", cost: 94, sale: 122 },
  { id: "tastiera-mouse", name: "Tastiera e mouse", cost: 31, sale: 40 },
  { id: "numeratore", name: "Circuito numeratore SPIS", cost: 199, sale: 259 },
  { id: "ssd-500", name: "SSD 500GB", cost: 92, sale: 120 },
];

const technicians = [
  "Andrea Fabbri",
  "Ivan Canossi",
  "Francesco Romano",
  "Christian Appolloni",
  "Giuseppe Marafioti",
  "Leonardo Aureli",
];

const contracts = [
  {
    name: "POLFER SPIS",
    match: ["POLFER", "POLIZIA FERROVIARIA"],
    clientType: "Polizia Ferroviaria",
    status: "Attivo",
    period: "Fornitura SPIS",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 90,
    pdf: "",
    warranty: "Sì",
    shipping: "Sì, se previsto da garanzia",
    spareParts: "Ricambi gestibili secondo contratto",
    sla: "7 giorni bloccante / 14 giorni non bloccante",
    notes:
      "Assistenza su apparati SPIS Polfer. Verificare sempre se la parte richiesta è coperta da garanzia o ricambio contrattuale.",
  },
  {
    name: "FRONTIERE 26 SPIS",
    match: ["FRONTIERA", "POLIZIA DI FRONTIERA"],
    clientType: "Polizia di Frontiera",
    status: "Attivo",
    period: "2024-2026",
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    renewalAlertDays: 120,
    pdf: "",
    warranty: "24 mesi",
    shipping: "Inclusa",
    spareParts: "Ripristino e sostituzione apparati inclusi",
    sla: "12 ore bloccante / 24 ore non bloccante",
    notes: "Trasporto, ritiro e sostituzione apparati inclusi nel contratto.",
  },
  {
    name: "HOTSPOT ALBANIA 2024-2026",
    match: ["ALBANIA", "HOTSPOT"],
    clientType: "Estero",
    status: "Attivo",
    period: "2024-2026",
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    renewalAlertDays: 120,
    pdf: "",
    warranty: "24 mesi",
    shipping: "Inclusa",
    spareParts: "Riparazione o sostituzione inclusa",
    sla: "5 giorni bloccante / 10 giorni non bloccante",
    notes: "Ritiro apparati, trasporto e supporto tecnico inclusi.",
  },
  {
    name: "CARABINIERI ASSISTENZA 2024-2026",
    match: [
      "CARABINIERI",
      "COMANDO PROVINCIALE",
      "GRUPPO CC",
      "REPARTO TERRITORIALE CC",
      "COMANDO GRUPPO",
    ],
    clientType: "Carabinieri",
    status: "Attivo",
    period: "2024-2026",
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    renewalAlertDays: 120,
    pdf: "",
    warranty: "Sì",
    shipping: "Sì previa autorizzazione",
    spareParts: "Ricambi inclusi entro limiti contrattuali",
    sla: "7 giorni bloccante / 14 giorni non bloccante",
    notes: "Interventi e ricambi soggetti ad autorizzazione AES.",
  },
  {
    name: "CC 75 SPIS",
    match: ["CC 75", "75 SPIS"],
    clientType: "Carabinieri",
    status: "Attivo",
    period: "Fornitura 75 SPIS",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 90,
    pdf: "",
    warranty: "Sì",
    shipping: "Da verificare",
    spareParts: "Gestibili secondo garanzia apparato",
    sla: "Da contratto specifico",
    notes: "Supporto su apparati SPIS della fornitura 75 postazioni.",
  },
  {
    name: "POLIZIE LOCALI",
    match: [
      "POLIZIA LOCALE",
      "POLIZIA MUNICIPALE",
      "POLIZIA PROVINCIALE",
      "COMUNE",
    ],
    clientType: "Polizia Locale / Comuni",
    status: "Attivo se contratto sottoscritto",
    period: "12/24/36 mesi",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 60,
    pdf: "",
    warranty: "Secondo contratto",
    shipping: "Se previsto",
    spareParts: "Secondo formula commerciale",
    sla: "5 giorni / 10 giorni",
    notes: "Verificare sempre formula commerciale sottoscritta dal Comune.",
  },
  {
    name: "RFI AULE SEPA",
    match: ["RFI", "AULA SEPA", "SEPA"],
    clientType: "RFI",
    status: "Attivo",
    period: "48 mesi",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 120,
    pdf: "",
    warranty: "Sì",
    shipping: "Inclusa",
    spareParts: "Incluse salvo esclusioni",
    sla: "2 giorni bloccante / 7 giorni non bloccante",
    notes: "Assistenza su Aule SEPA RFI con SLA prioritari.",
  },
  {
    name: "RFI WEBVIME",
    match: ["WEBVIME"],
    clientType: "RFI / Webvime",
    status: "Attivo",
    period: "12 mesi",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 60,
    pdf: "",
    warranty: "Sì",
    shipping: "Non applicabile",
    spareParts: "Software",
    sla: "Secondo allegato contratto",
    notes: "Assistenza software Webvime.",
  },
  {
    name: "SMARTFAD CARE-PACK",
    match: ["SMARTFAD"],
    clientType: "SmartFAD",
    status: "Attivo se Care-Pack sottoscritto",
    period: "12/24/36 mesi",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 60,
    pdf: "",
    warranty: "Copertura danni accidentali",
    shipping: "Andata cliente / ritorno Secom",
    spareParts: "Riparazione o sostituzione",
    sla: "5 giorni lavorativi",
    notes: "Esclusi furto, manomissioni, danni dolosi e uso improprio.",
  },
  {
    name: "SEEKS / BEESCO PORTI",
    match: ["SEEKS", "BEESCO", "PORTI", "TERMINAL", "VESPUCCI"],
    clientType: "Porti / EES",
    status: "Attivo",
    period: "12/24/36 mesi",
    startDate: "Da verificare",
    endDate: "Da verificare",
    renewalAlertDays: 90,
    pdf: "",
    warranty: "On-center",
    shipping: "Inclusa se in garanzia",
    spareParts: "Riparazione o sostituzione gratuita",
    sla: "2 giorni bloccante / 4 giorni non bloccante",
    notes: "Fuori garanzia serve valutazione tecnica e offerta economica.",
  },
];

const initialInventory = [
  { id: "KIT-TLC", name: "Kit TLC", cost: 931, price: 1210, quantity: 0 },
  { id: "UCCS", name: "UCCS", cost: 821, price: 1068, quantity: 0 },
  { id: "MONITOR", name: "Monitor", cost: 199, price: 259, quantity: 0 },
  { id: "KIT-LAMP", name: "Kit lampade", cost: 72, price: 94, quantity: 0 },
  { id: "RAM", name: "RAM", cost: 56, price: 73, quantity: 0 },
  { id: "HUB-USB", name: "Hub USB", cost: 52, price: 68, quantity: 0 },
  {
    id: "MOTORE-SPIS",
    name: "Motore sedia SPIS",
    cost: 196,
    price: 255,
    quantity: 0,
  },
  { id: "UPS", name: "UPS", cost: 94, price: 122, quantity: 0 },
  {
    id: "TAST-MOUSE",
    name: "Tastiera e mouse",
    cost: 31,
    price: 40,
    quantity: 0,
  },
  {
    id: "NUMERATORE",
    name: "Circuito numeratore SPIS",
    cost: 199,
    price: 259,
    quantity: 0,
  },
  { id: "SSD-500", name: "SSD 500GB", cost: 92, price: 120, quantity: 0 },
];

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function materialCost(ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((m) => m.id === id);
    return sum + (item?.cost || 0);
  }, 0);
}

function materialSale(ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((m) => m.id === id);
    return sum + (item?.sale || item?.cost || 0);
  }, 0);
}

function normalizeInventory(items: any[]) {
  return items.map((item) => {
    const cost = Number(item.cost ?? item.value ?? 0);
    const price = Number(item.price ?? item.sale ?? Math.round(cost * 1.3));

    return {
      id: item.id || `ART-${Date.now()}`,
      name: item.name || "Articolo",
      cost,
      price,
      quantity: Number(item.quantity || 0),
    };
  });
}

function getContractInfo(
  site: string,
  entity: string,
  sourceContracts = contracts,
) {
  const text = `${site} ${entity}`.toLowerCase();

  return sourceContracts.find((contract) =>
    contract.match.some((word) => text.includes(word.toLowerCase())),
  );
}

function getContractStatus(contract: any) {
  if (!contract?.endDate || contract.endDate === "Da verificare") {
    return {
      label: "Scadenza da verificare",
      color: "bg-slate-600",
      warning: false,
    };
  }

  const today = new Date();
  const end = new Date(contract.endDate);

  const diffDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return {
      label: "Contratto scaduto",
      color: "bg-red-600",
      warning: true,
    };
  }

  if (diffDays <= contract.renewalAlertDays) {
    return {
      label: `In scadenza tra ${diffDays} giorni`,
      color: "bg-amber-500",
      warning: true,
    };
  }

  return {
    label: "Contratto attivo",
    color: "bg-emerald-600",
    warning: false,
  };
}

function getInventoryStatus(quantity: number) {
  if (quantity <= 0) return { label: "Esaurito", type: "empty" };
  if (quantity < 10) return { label: "Da riordinare", type: "low" };
  return { label: "Disponibile", type: "ok" };
}

function normalizeSiteRegion(site: any) {
  if (site.region && !String(site.region).toLowerCase().includes("n/d")) {
    return site;
  }

  const text = `${site.name || ""} ${site.city || ""}`.toLowerCase();

  const rules: [string[], string][] = [
    [["padova", "venezia", "verona", "vicenza", "treviso", "rovigo"], "Veneto"],
    [
      ["parma", "rimini", "reggio emilia", "bologna", "ferrara"],
      "Emilia-Romagna",
    ],
    [
      ["ragusa", "siracusa", "trapani", "palermo", "catania", "gela"],
      "Sicilia",
    ],
    [
      ["salerno", "avellino", "caserta", "napoli", "aversa", "nocera"],
      "Campania",
    ],
    [["viterbo", "rieti", "roma", "ostia", "frascati", "aprilia"], "Lazio"],
    [["trento", "bolzano", "merano"], "Trentino-Alto Adige"],
    [["varese", "milano", "brescia", "pavia", "rho", "sondrio"], "Lombardia"],
    [["trieste", "udine", "pordenone", "gorizia"], "Friuli-Venezia Giulia"],
    [["taranto", "trani", "bari", "brindisi", "lecce"], "Puglia"],
    [
      ["reggio calabria", "vibo valentia", "cosenza", "locri", "lamezia"],
      "Calabria",
    ],
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

export default function Home() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const [site, setSite] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [region, setRegion] = useState("");
  const [entity, setEntity] = useState("");
  const [city, setCity] = useState("");
  const [siteId, setSiteId] = useState<number | null>(null);

  const [problem, setProblem] = useState("");
  const [technician, setTechnician] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const [closingNotes, setClosingNotes] = useState("");
  const [futureNeeds, setFutureNeeds] = useState("");
  const [resolved, setResolved] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const [activeTab, setActiveTab] = useState<
    | "operativo"
    | "calendario"
    | "registro"
    | "clienti"
    | "contatti"
    | "mappa"
    | "contratti"
    | "sistemi"
    | "magazzino"
    | "budget"
  >("operativo");

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systemSearch, setSystemSearch] = useState("");

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas-theme") || "dark";
    }
    return "dark";
  });

  const [budgetVisible, setBudgetVisible] = useState(true);
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budget");
      return saved ? Number(saved) : INITIAL_BUDGET;
    }
    return INITIAL_BUDGET;
  });

  const [clientSearch, setClientSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [contractOverrides, setContractOverrides] = useState<any>({});
  const [inventory, setInventory] = useState<any[]>(initialInventory);
  const [inventorySearch, setInventorySearch] = useState("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactClientSearch, setContactClientSearch] = useState("");
  const [contactClient, setContactClient] = useState<any | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(
    null,
  );
  const [calendarTechnician, setCalendarTechnician] = useState("");
  const [calendarSiteSearch, setCalendarSiteSearch] = useState("");
  const [calendarSite, setCalendarSite] = useState<any | null>(null);
  const [calendarTime, setCalendarTime] = useState("");
  const [editingCalendarTicketId, setEditingCalendarTicketId] = useState<
    string | null
  >(null);
  const [expandedCalendarTicketId, setExpandedCalendarTicketId] = useState<
    string | null
  >(null);
  const [expandedNewCalendarDay, setExpandedNewCalendarDay] = useState<
    string | null
  >(null);

  useEffect(() => {
    localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedContracts = localStorage.getItem("atlas-contract-overrides");
    if (savedContracts) setContractOverrides(JSON.parse(savedContracts));

    const savedInventory = localStorage.getItem("atlas-inventory");
    if (savedInventory)
      setInventory(normalizeInventory(JSON.parse(savedInventory)));

    const savedContacts = localStorage.getItem("atlas-contacts");
    if (savedContacts) setContacts(JSON.parse(savedContacts));
  }, []);

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("name");
      if (error) {
        console.log(error);
        return;
      }
      setSites((data || []).map(normalizeSiteRegion));
    }

    async function loadTickets() {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log(error);
        return;
      }

      const formatted =
        data?.map((t) => ({
          id: t.id,
          site: t.site,
          siteId: t.site_id || null,
          region: t.region,
          entity: t.entity || "",
          city: t.city || "",
          problem: t.problem,
          materialIds: t.materials || [],
          technician: t.technician,
          status: t.status,
          date: t.intervention_date || "",
          resolved: t.resolved,
          futureNeeds: t.future_needs || "",
          closingNotes: t.closing_notes || "",
          slot: t.slot || "",
        })) || [];

      setTickets(formatted);
    }

    loadTickets();
    loadSites();
  }, []);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  }

  const editableContracts = contracts.map((contract) => ({
    ...contract,
    ...(contractOverrides[contract.name] || {}),
  }));

  const selectedContractBase = getContractInfo(site, entity, editableContracts);
  const selectedContract = selectedContractBase
    ? {
        ...selectedContractBase,
        ...(contractOverrides[selectedContractBase.name] || {}),
      }
    : undefined;

  function updateContractField(
    contractName: string,
    field: string,
    value: string,
  ) {
    const updated = {
      ...contractOverrides,
      [contractName]: {
        ...(contractOverrides[contractName] || {}),
        [field]: value,
      },
    };

    setContractOverrides(updated);
    localStorage.setItem("atlas-contract-overrides", JSON.stringify(updated));
    showMessage("Contratto aggiornato");
  }

  function updateInventoryItem(index: number, field: string, value: string) {
    const updated = inventory.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        [field]: ["cost", "price", "quantity"].includes(field)
          ? Number(value || 0)
          : value,
      };
    });

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  function addInventoryItem() {
    const updated = [
      ...inventory,
      {
        id: `ART-${Date.now()}`,
        name: "Nuovo articolo",
        cost: 0,
        price: 0,
        quantity: 0,
      },
    ];
    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  const filteredSites = sites
    .filter((s) => {
      const text = `${s.name} ${s.city} ${s.entity}`.toLowerCase();
      return text.includes(siteSearch.toLowerCase());
    })
    .slice(0, 10);

  const totalForecast = useMemo(
    () =>
      tickets.reduce((sum, t) => sum + materialCost(t.materialIds || []), 0),
    [tickets],
  );

  const totalSalesForecast = useMemo(
    () =>
      tickets.reduce((sum, t) => sum + materialSale(t.materialIds || []), 0),
    [tickets],
  );

  const remainingBudget = budget - totalForecast;

  const filteredTickets = tickets.filter((t) => {
    const matchTechnician =
      !filterTechnician || t.technician === filterTechnician;
    const matchRegion = !filterRegion || t.region === filterRegion;
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchTechnician && matchRegion && matchStatus;
  });

  const availableRegions = Array.from(
    new Set(tickets.map((t) => t.region).filter(Boolean)),
  );

  const inventoryValueCost = inventory.reduce(
    (sum, item) => sum + Number(item.cost || 0) * Number(item.quantity || 0),
    0,
  );
  const inventoryValueSale = inventory.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const inventoryEnded = inventory.filter((item) => Number(item.quantity) <= 0);
  const inventoryLow = inventory.filter(
    (item) => Number(item.quantity) > 0 && Number(item.quantity) < 10,
  );

  const clientCategories = {
    "Ministero Interni": sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("minister"),
    ),
    Carabinieri: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("carabin"),
    ),
    "Polizia Locale": sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();
      return (
        text.includes("polizia locale") ||
        text.includes("polizia municipale") ||
        text.includes("polizia provinciale")
      );
    }),
    Questure: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("questura"),
    ),
    Prefetture: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("prefettura"),
    ),
    Tribunali: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("tribunale"),
    ),
    Comuni: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("comune"),
    ),
    RFI: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("rfi"),
    ),
    Altro: sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();
      return ![
        "minister",
        "carabin",
        "polizia locale",
        "polizia municipale",
        "polizia provinciale",
        "questura",
        "prefettura",
        "tribunale",
        "comune",
        "rfi",
      ].some((k) => text.includes(k));
    }),
  };

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function addTicket() {
    if (!site || !problem) {
      showMessage("Sede e descrizione intervento sono obbligatorie", "error");
      return;
    }

    const cost = materialCost(selectedMaterials);

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          site,
          region: region || "Da definire",
          entity,
          city,
          site_id: siteId,
          problem,
          materials: selectedMaterials,
          technician,
          status: "Aperto",
          cost,
          slot: selectedSlot,
          intervention_date: selectedDate || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore salvataggio ticket", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      site,
      siteId,
      region,
      entity,
      city,
      problem,
      materialIds: selectedMaterials,
      technician,
      status: "Aperto",
      date: selectedDate || "",
      slot: selectedSlot || "",
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
    };

    setTickets([newTicket, ...tickets]);
    setSite("");
    setSiteSearch("");
    setRegion("");
    setEntity("");
    setCity("");
    setSiteId(null);
    setProblem("");
    setTechnician("");
    setSelectedDate("");
    setSelectedSlot("");
    setSelectedMaterials([]);
    showMessage("Ticket salvato su database");
  }

  async function planTicket(id: string) {
    if (!selectedDate || !selectedSlot || !technician) {
      showMessage(
        "Seleziona tecnico, data e slot prima di pianificare",
        "error",
      );
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        technician,
        intervention_date: selectedDate,
        slot: selectedSlot,
        status: "Pianificato",
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              technician,
              date: selectedDate,
              slot: selectedSlot,
              status: "Pianificato",
            }
          : t,
      ),
    );

    showMessage("Ticket pianificato");
  }

  async function closeTicket(id: string) {
    const today = localDate(new Date());

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closing_notes: closingNotes || "",
        future_needs: futureNeeds || "",
        resolved,
      })
      .eq("id", Number(id));

    if (error) {
      console.log("ERRORE CHIUSURA:", error);
      showMessage("Errore chiusura ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              status: "Chiuso",
              date: today,
              closingNotes: closingNotes || "",
              futureNeeds: futureNeeds || "",
              resolved,
            }
          : t,
      ),
    );

    setClosingNotes("");
    setFutureNeeds("");
    setResolved(true);
    setClosingTicketId(null);
    showMessage("Ticket chiuso e salvato");
  }

  function exportCsv() {
    const header = [
      "ID",
      "Sede",
      "Ente",
      "Città",
      "Regione",
      "Problema",
      "Materiali",
      "Costo azienda",
      "Valore vendita",
      "Margine",
      "Tecnico",
      "Stato",
      "Risolto",
      "Data intervento",
      "Slot",
      "Note chiusura",
      "Necessità future",
    ];

    const rows = tickets.map((t) => {
      const cost = materialCost(t.materialIds || []);
      const sale = materialSale(t.materialIds || []);
      return [
        t.id,
        t.site,
        t.entity || "",
        t.city || "",
        t.region || "",
        t.problem,
        (t.materialIds || [])
          .map((id: string) => materials.find((m) => m.id === id)?.name)
          .join(" + "),
        cost,
        sale,
        sale - cost,
        t.technician || "",
        t.status,
        t.resolved === false ? "No" : "Sì",
        t.date || "",
        t.slot || "",
        t.closingNotes || "",
        t.futureNeeds || "",
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secom-atlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const monthStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  );
  const calendarDays = Array.from(
    { length: monthEnd.getDate() },
    (_, i) =>
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1),
  );
  const leadingEmptyDays = Array.from({
    length: (monthStart.getDay() + 6) % 7,
  });
  const monthLabel = calendarMonth.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(amount: number) {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + amount,
        1,
      ),
    );
    resetCalendarForm();
  }

  const calendarSiteResults = sites
    .filter((s) => {
      const q = calendarSiteSearch.toLowerCase();
      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  function resetCalendarForm() {
    setSelectedCalendarDay(null);
    setExpandedNewCalendarDay(null);
    setExpandedCalendarTicketId(null);
    setEditingCalendarTicketId(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");
  }

  function startNewCalendarTicket(iso: string) {
    setSelectedCalendarDay(iso);
    setExpandedNewCalendarDay(expandedNewCalendarDay === iso ? null : iso);
    setExpandedCalendarTicketId(null);
    setEditingCalendarTicketId(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");
  }

  function startEditCalendarTicket(ticket: any, iso: string) {
    const id = String(ticket.id);
    setSelectedCalendarDay(iso);
    setExpandedNewCalendarDay(null);
    setExpandedCalendarTicketId(expandedCalendarTicketId === id ? null : id);
    setEditingCalendarTicketId(id);
    setCalendarTechnician(ticket.technician || "");
    setCalendarSiteSearch(ticket.site || "");
    setCalendarSite({
      id: ticket.siteId || null,
      name: ticket.site,
      region: ticket.region,
      entity: ticket.entity,
      city: ticket.city,
    });
    setCalendarTime(ticket.slot || "");
  }

  async function addCalendarTicket() {
    if (
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa giorno, tecnico, cliente e orario", "error");
      return;
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          site: calendarSite.name,
          region: calendarSite.region || "Da definire",
          entity: calendarSite.entity || "",
          city: calendarSite.city || "",
          site_id: calendarSite.id || null,
          problem: "Intervento pianificato da calendario",
          materials: [],
          technician: calendarTechnician,
          status: "Pianificato",
          cost: 0,
          slot: calendarTime,
          intervention_date: selectedCalendarDay,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore creazione intervento calendario", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      site: calendarSite.name,
      siteId: calendarSite.id || null,
      region: calendarSite.region || "",
      entity: calendarSite.entity || "",
      city: calendarSite.city || "",
      problem: "Intervento pianificato da calendario",
      materialIds: [],
      technician: calendarTechnician,
      status: "Pianificato",
      date: selectedCalendarDay,
      slot: calendarTime,
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
    };

    setTickets([newTicket, ...tickets]);
    resetCalendarForm();
    showMessage("Intervento aggiunto al calendario");
  }

  async function updateCalendarTicket() {
    if (
      !editingCalendarTicketId ||
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa tecnico, cliente e orario", "error");
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        site: calendarSite.name,
        region: calendarSite.region || "Da definire",
        entity: calendarSite.entity || "",
        city: calendarSite.city || "",
        site_id: calendarSite.id || null,
        technician: calendarTechnician,
        slot: calendarTime,
        intervention_date: selectedCalendarDay,
        status: "Pianificato",
      })
      .eq("id", Number(editingCalendarTicketId));

    if (error) {
      console.log(error);
      showMessage("Errore modifica intervento", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(editingCalendarTicketId)
          ? {
              ...t,
              site: calendarSite.name,
              siteId: calendarSite.id || null,
              region: calendarSite.region || "",
              entity: calendarSite.entity || "",
              city: calendarSite.city || "",
              technician: calendarTechnician,
              slot: calendarTime,
              date: selectedCalendarDay,
              status: "Pianificato",
            }
          : t,
      ),
    );

    resetCalendarForm();
    showMessage("Intervento aggiornato");
  }

  const contactClientResults = sites
    .filter((s) => {
      const q = contactClientSearch.toLowerCase();
      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  const filteredContacts = contacts.filter((contact) => {
    const q = contactSearch.toLowerCase();
    return `${contact.name} ${contact.phone} ${contact.address} ${contact.notes} ${contact.clientName} ${contact.clientCity} ${contact.clientRegion}`
      .toLowerCase()
      .includes(q);
  });

  function resetContactForm() {
    setEditingContactId(null);
    setContactClientSearch("");
    setContactClient(null);
    setContactForm({ name: "", phone: "", address: "", notes: "" });
  }

  function saveContact() {
    if (!contactForm.name || !contactForm.phone) {
      showMessage("Nome e telefono sono obbligatori", "error");
      return;
    }

    const payload = {
      id: editingContactId || `CNT-${Date.now()}`,
      name: contactForm.name,
      phone: contactForm.phone,
      address: contactForm.address,
      notes: contactForm.notes,
      clientId: contactClient?.id || null,
      clientName: contactClient?.name || contactClientSearch || "",
      clientCity: contactClient?.city || "",
      clientRegion: contactClient?.region || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = editingContactId
      ? contacts.map((contact) =>
          contact.id === editingContactId ? payload : contact,
        )
      : [payload, ...contacts];

    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();
    showMessage(editingContactId ? "Contatto aggiornato" : "Contatto aggiunto");
  }

  function editContact(contact: any) {
    setEditingContactId(contact.id);
    setContactClientSearch(contact.clientName || "");
    setContactClient({
      id: contact.clientId || null,
      name: contact.clientName || "",
      city: contact.clientCity || "",
      region: contact.clientRegion || "",
    });
    setContactForm({
      name: contact.name || "",
      phone: contact.phone || "",
      address: contact.address || "",
      notes: contact.notes || "",
    });
  }

  function deleteContact(id: string) {
    const updated = contacts.filter((contact) => contact.id !== id);
    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();
    showMessage("Contatto eliminato");
  }

  const tabs = [
    { key: "operativo", label: "Operativo", icon: AlertTriangle },
    { key: "calendario", label: "Calendario", icon: CalendarDays },
    { key: "registro", label: "Registro", icon: ListChecks },
    { key: "clienti", label: "Clienti", icon: Users },
    { key: "contatti", label: "Contatti", icon: Phone },
    { key: "mappa", label: "Mappa", icon: Map },
    { key: "contratti", label: "Contratti", icon: FileText },
    { key: "sistemi", label: "Sistemi", icon: Monitor },
    { key: "magazzino", label: "Magazzino", icon: Package },
    { key: "budget", label: "Budget", icon: BarChart3 },
  ];

  const isDark = theme === "dark";

  const appBg = isDark
    ? "bg-[#07111f] text-slate-100"
    : "bg-[#eef3f8] text-slate-950";
  const sidebarClass = isDark
    ? "border-white/10 bg-[#081523]"
    : "border-slate-300 bg-white shadow-xl shadow-slate-300/30";
  const headerClass = isDark
    ? "border-white/10 bg-[#07111f]/90"
    : "border-slate-300 bg-white/90 shadow-sm";
  const card = isDark
    ? "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur"
    : "rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.10)]";
  const panel = isDark
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-300 bg-slate-50 shadow-sm";
  const innerPanel = isDark
    ? "bg-slate-950/40"
    : "bg-white border border-slate-300 shadow-sm";
  const input = isDark
    ? "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
    : "rounded-xl border-2 border-slate-300 bg-white p-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-600";
  const lightInput = isDark
    ? "rounded-xl border border-white/10 bg-slate-950/50 p-2 text-white outline-none focus:border-blue-400"
    : "rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-950 outline-none focus:border-blue-600";
  const mutedText = isDark ? "text-slate-400" : "text-slate-600";
  const strongText = isDark ? "text-white" : "text-slate-950";

  return (
    <main className={`min-h-screen transition-all duration-300 ${appBg}`}>
      <div className="flex min-h-screen">
        <div className="fixed right-4 top-4 z-[9999]">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`rounded-2xl px-4 py-3 font-bold shadow-xl transition-all ${
              isDark ? "bg-white text-slate-900" : "bg-slate-950 text-white"
            }`}
          >
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <aside
          className={`hidden w-72 shrink-0 border-r p-6 lg:block ${sidebarClass}`}
        >
          <div className="mb-8 flex flex-col items-center gap-3 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
            <img
              src="/secom-logo.png.png"
              alt="Secom"
              className="h-24 w-auto object-contain"
            />
            <div className="text-center">
              <div className="text-3xl font-black tracking-[0.35em]">ATLAS</div>
              <div className="text-sm font-bold text-blue-500">
                Centrale operativa
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all hover:translate-x-1 ${
                  activeTab === key
                    ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : isDark
                      ? "border-white/10 text-slate-300 hover:bg-white/10"
                      : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className={`mt-8 rounded-3xl border p-4 ${panel}`}>
            <p className="text-sm font-black">Filtri rapidi</p>
            <select
              className={`mt-3 w-full ${input}`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tutti gli stati</option>
              <option value="Aperto">Aperto</option>
              <option value="Pianificato">Pianificato</option>
              <option value="Chiuso">Chiuso</option>
            </select>
          </div>
        </aside>

        <div className="flex-1">
          <header
            className={`sticky top-0 z-30 border-b px-4 py-4 backdrop-blur md:px-8 ${headerClass}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-black">
                  Centrale Operativa ATLAS
                </h1>
                <p className={`text-sm ${mutedText}`}>
                  Ticket, calendario, clienti, magazzino e sistemi.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className={`rounded-2xl border px-4 py-3 ${panel}`}>
                  <p className={`text-xs font-bold ${mutedText}`}>
                    Interventi aperti
                  </p>
                  <p className="text-2xl font-black">
                    {tickets.filter((t) => t.status !== "Chiuso").length}
                  </p>
                </div>

                <div className="relative w-full md:w-96">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none ${
                      isDark
                        ? "border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-blue-400"
                        : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-blue-600"
                    }`}
                    placeholder="Cerca sito, cliente, contratto..."
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-bold ${
                    activeTab === key
                      ? "border-blue-500 bg-blue-600 text-white"
                      : isDark
                        ? "border-white/10 bg-white/10 text-slate-300"
                        : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </header>

          <main className="space-y-6 p-4 md:p-8">
            {message && (
              <div
                className={`rounded-2xl p-4 text-sm font-bold text-white shadow ${
                  messageType === "success" ? "bg-emerald-700" : "bg-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {activeTab === "operativo" && (
              <section className={card}>
                <h2 className="mb-5 text-2xl font-black">
                  Apri nuova chiamata
                </h2>

                {site && (
                  <div
                    className={`mb-5 rounded-3xl border p-5 ${isDark ? "border-blue-400/30 bg-blue-500/10" : "border-blue-300 bg-blue-50"}`}
                  >
                    {selectedContract ? (
                      <>
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-xl font-black text-blue-500">
                            {selectedContract.name}
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white ${getContractStatus(selectedContract).color}`}
                          >
                            {getContractStatus(selectedContract).label}
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <p>
                            <b>Cliente:</b> {selectedContract.clientType}
                          </p>
                          <p>
                            <b>Periodo:</b> {selectedContract.period}
                          </p>
                          <p>
                            <b>Garanzia:</b> {selectedContract.warranty}
                          </p>
                          <p>
                            <b>Spedizione:</b> {selectedContract.shipping}
                          </p>
                          <p>
                            <b>Ricambi:</b> {selectedContract.spareParts}
                          </p>
                          <p>
                            <b>SLA:</b> {selectedContract.sla}
                          </p>
                        </div>
                        <p
                          className={`mt-3 rounded-2xl p-3 text-sm ${innerPanel}`}
                        >
                          {selectedContract.notes}
                        </p>
                      </>
                    ) : (
                      <p className={`text-sm ${mutedText}`}>
                        Nessun contratto specifico riconosciuto per questa sede.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <input
                      className={`w-full ${input}`}
                      placeholder="Cerca sede: es. Alatri, Bari, Ferrara..."
                      value={siteSearch}
                      onChange={(e) => {
                        setSiteSearch(e.target.value);
                        setSite("");
                        setRegion("");
                        setEntity("");
                        setCity("");
                        setSiteId(null);
                      }}
                    />
                    {siteSearch && !site && (
                      <div
                        className={`absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-xl ${isDark ? "border-white/10 bg-slate-950" : "border-slate-300 bg-white"}`}
                      >
                        {filteredSites.length === 0 && (
                          <div className={`p-3 text-sm ${mutedText}`}>
                            Nessuna sede trovata
                          </div>
                        )}
                        {filteredSites.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`block w-full border-b p-3 text-left ${isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-blue-50"}`}
                            onClick={() => {
                              setSite(s.name);
                              setSiteSearch(s.name);
                              setRegion(s.region || "");
                              setEntity(s.entity || "");
                              setCity(s.city || "");
                              setSiteId(s.id || null);
                            }}
                          >
                            <div className="font-bold">{s.name}</div>
                            <div className={`text-xs ${mutedText}`}>
                              {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    className={input}
                    placeholder="Regione automatica"
                    value={region}
                    readOnly
                  />
                  <textarea
                    className={`md:col-span-2 ${input}`}
                    placeholder="Descrizione intervento"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                  />

                  <select
                    className={input}
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                  >
                    <option value="">Tecnico non assegnato</option>
                    {technicians.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    className={input}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <select
                    className={input}
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                  >
                    <option value="">Seleziona slot</option>
                    <option value="Mattina">Mattina</option>
                    <option value="Pomeriggio">Pomeriggio</option>
                  </select>
                </div>

                <h3 className="mt-6 mb-3 font-black">Materiali necessari</h3>
                <div className="grid gap-3 md:grid-cols-4">
                  {materials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMaterial(m.id)}
                      className={`cursor-pointer rounded-2xl border p-3 text-left transition hover:scale-[1.02] ${
                        selectedMaterials.includes(m.id)
                          ? "border-blue-400 bg-blue-600 text-white"
                          : isDark
                            ? "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                            : "border-slate-300 bg-white text-slate-950 shadow-sm hover:bg-blue-50"
                      }`}
                    >
                      <p className="font-bold">{m.name}</p>
                      <p className="text-sm opacity-70">Costo {euro(m.cost)}</p>
                      <p className="text-sm opacity-70">
                        Vendita {euro(m.sale)}
                      </p>
                    </button>
                  ))}
                </div>

                <div
                  className={`mt-6 grid gap-4 rounded-3xl border p-5 md:grid-cols-3 ${panel}`}
                >
                  <div>
                    <p className={`text-sm ${mutedText}`}>Costo azienda</p>
                    <p className="text-2xl font-black">
                      {euro(materialCost(selectedMaterials))}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${mutedText}`}>Valore vendita</p>
                    <p className="text-2xl font-black">
                      {euro(materialSale(selectedMaterials))}
                    </p>
                  </div>
                  <button
                    onClick={addTicket}
                    className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                  >
                    Apri chiamata
                  </button>
                </div>
              </section>
            )}

            {activeTab === "calendario" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className={`text-2xl font-black ${strongText}`}>
                      Calendario interventi
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Clicca un giorno per inserire. Clicca un intervento per
                      modificarlo nel riquadro.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="rounded-xl bg-blue-600 p-3 text-white"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-48 text-center text-lg font-black capitalize">
                      {monthLabel}
                    </div>
                    <button
                      onClick={() => changeMonth(1)}
                      className="rounded-xl bg-blue-600 p-3 text-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div
                  className={`mb-3 grid grid-cols-7 rounded-2xl border text-center text-xs font-black uppercase tracking-wide ${panel}`}
                >
                  {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
                    (d) => (
                      <div key={d} className="p-3">
                        {d}
                      </div>
                    ),
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-7">
                  {leadingEmptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="hidden md:block" />
                  ))}
                  {calendarDays.map((day) => {
                    const iso = localDate(day);
                    const dayTickets = tickets.filter((t) => t.date === iso);
                    const isNewOpen = expandedNewCalendarDay === iso;

                    return (
                      <div
                        key={iso}
                        onClick={() => startNewCalendarTicket(iso)}
                        className={`min-h-44 cursor-pointer rounded-2xl border p-3 text-left transition hover:scale-[1.01] ${
                          selectedCalendarDay === iso
                            ? "border-blue-500 bg-blue-600 text-white"
                            : isDark
                              ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                              : "border-slate-400 bg-white shadow-sm hover:bg-blue-50"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-lg font-black">
                            {day.getDate()}
                          </span>
                          <span className="text-xs font-bold">
                            {day.toLocaleDateString("it-IT", {
                              weekday: "short",
                            })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dayTickets.length === 0 && !isNewOpen && (
                            <p className="text-xs opacity-60">
                              Clicca per inserire
                            </p>
                          )}

                          {dayTickets.slice(0, 3).map((t) => {
                            const isExpanded =
                              expandedCalendarTicketId === String(t.id);
                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditCalendarTicket(t, iso);
                                }}
                                className={`cursor-pointer overflow-visible rounded-xl p-2 text-xs transition-all duration-300 ${
                                  isExpanded
                                    ? isDark
                                      ? "bg-blue-600/30 ring-2 ring-blue-400"
                                      : "bg-blue-100 ring-2 ring-blue-500"
                                    : isDark
                                      ? "bg-slate-950/50 hover:bg-slate-900"
                                      : "border border-slate-300 bg-slate-100 hover:bg-blue-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-black">
                                      {t.slot || "Orario n/d"}
                                    </p>
                                    <p>{t.site}</p>
                                    <p className="opacity-70">
                                      {t.technician || "Tecnico n/d"}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-black opacity-70">
                                    {isExpanded ? "CHIUDI" : "MODIFICA"}
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div
                                    className={`mt-3 grid gap-2 rounded-xl p-3 ${innerPanel}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <select
                                      className={lightInput}
                                      value={calendarTechnician}
                                      onChange={(e) =>
                                        setCalendarTechnician(e.target.value)
                                      }
                                    >
                                      <option value="">
                                        Seleziona tecnico
                                      </option>
                                      {technicians.map((tech) => (
                                        <option key={tech}>{tech}</option>
                                      ))}
                                    </select>
                                    <div className="relative">
                                      <input
                                        className={`w-full ${lightInput}`}
                                        placeholder="Cerca cliente / sede..."
                                        value={calendarSiteSearch}
                                        onChange={(e) => {
                                          setCalendarSiteSearch(e.target.value);
                                          setCalendarSite(null);
                                        }}
                                      />
                                      {calendarSiteSearch && !calendarSite && (
                                        <div
                                          className={`absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border shadow-xl ${isDark ? "border-white/10 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                                        >
                                          {calendarSiteResults.map((s) => (
                                            <button
                                              key={s.id}
                                              type="button"
                                              className={`block w-full border-b p-3 text-left text-xs ${isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-blue-50"}`}
                                              onClick={() => {
                                                setCalendarSite(s);
                                                setCalendarSiteSearch(s.name);
                                              }}
                                            >
                                              <div className="font-black">
                                                {s.name}
                                              </div>
                                              <div className="opacity-70">
                                                {s.city || "Città n/d"} ·{" "}
                                                {s.region || "Regione n/d"}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <input
                                      type="time"
                                      className={lightInput}
                                      value={calendarTime}
                                      onChange={(e) =>
                                        setCalendarTime(e.target.value)
                                      }
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={updateCalendarTicket}
                                        className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500"
                                      >
                                        Salva
                                      </button>
                                      <button
                                        onClick={resetCalendarForm}
                                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900"}`}
                                      >
                                        Annulla
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {dayTickets.length > 3 && (
                            <p className="text-xs font-bold">
                              +{dayTickets.length - 3} altri
                            </p>
                          )}

                          {isNewOpen && (
                            <div
                              className={`rounded-xl p-3 text-xs ${innerPanel}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="mb-2 font-black">
                                Nuovo intervento
                              </p>
                              <div className="grid gap-2">
                                <select
                                  className={lightInput}
                                  value={calendarTechnician}
                                  onChange={(e) =>
                                    setCalendarTechnician(e.target.value)
                                  }
                                >
                                  <option value="">Seleziona tecnico</option>
                                  {technicians.map((tech) => (
                                    <option key={tech}>{tech}</option>
                                  ))}
                                </select>
                                <div className="relative">
                                  <input
                                    className={`w-full ${lightInput}`}
                                    placeholder="Cerca cliente / sede..."
                                    value={calendarSiteSearch}
                                    onChange={(e) => {
                                      setCalendarSiteSearch(e.target.value);
                                      setCalendarSite(null);
                                    }}
                                  />
                                  {calendarSiteSearch && !calendarSite && (
                                    <div
                                      className={`absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border shadow-xl ${isDark ? "border-white/10 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                                    >
                                      {calendarSiteResults.map((s) => (
                                        <button
                                          key={s.id}
                                          type="button"
                                          className={`block w-full border-b p-3 text-left text-xs ${isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-blue-50"}`}
                                          onClick={() => {
                                            setCalendarSite(s);
                                            setCalendarSiteSearch(s.name);
                                          }}
                                        >
                                          <div className="font-black">
                                            {s.name}
                                          </div>
                                          <div className="opacity-70">
                                            {s.city || "Città n/d"} ·{" "}
                                            {s.region || "Regione n/d"}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="time"
                                  className={lightInput}
                                  value={calendarTime}
                                  onChange={(e) =>
                                    setCalendarTime(e.target.value)
                                  }
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={addCalendarTicket}
                                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500"
                                  >
                                    Inserisci
                                  </button>
                                  <button
                                    onClick={resetCalendarForm}
                                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900"}`}
                                  >
                                    Annulla
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "budget" && (
              <section className="grid gap-4 md:grid-cols-4">
                <div className={card}>
                  <p className={`text-sm ${mutedText}`}>Budget iniziale</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-2xl font-black">
                      {budgetVisible ? euro(budget) : "••••••"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const value = prompt("Nuovo budget:");
                          if (!value) return;
                          const parsed = Number(value);
                          if (isNaN(parsed)) return;
                          setBudget(parsed);
                          localStorage.setItem("atlas-budget", String(parsed));
                          showMessage("Budget aggiornato");
                        }}
                        className={`rounded-lg px-3 py-1 text-xs font-bold ${isDark ? "bg-white/10" : "bg-slate-200"}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setBudgetVisible(!budgetVisible)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold ${isDark ? "bg-white/10" : "bg-slate-200"}`}
                      >
                        {budgetVisible ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={card}>
                  <p className={`text-sm ${mutedText}`}>Costo previsto</p>
                  <p className="mt-2 text-2xl font-black">
                    {euro(totalForecast)}
                  </p>
                </div>
                <div className={card}>
                  <p className={`text-sm ${mutedText}`}>
                    Valore vendita previsto
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {euro(totalSalesForecast)}
                  </p>
                </div>
                <div className={card}>
                  <p className={`text-sm ${mutedText}`}>Budget residuo</p>
                  <p className="mt-2 text-2xl font-black">
                    {euro(remainingBudget)}
                  </p>
                </div>
              </section>
            )}

            {activeTab === "mappa" && (
              <section className={card}>
                <h2 className="mb-5 text-2xl font-black">Mappa operativa</h2>
                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  <select
                    className={input}
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                  >
                    <option value="">Tutti i tecnici</option>
                    {technicians.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input}
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                  >
                    <option value="">Tutte le regioni</option>
                    {availableRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tutti gli stati</option>
                    <option value="Aperto">Aperto</option>
                    <option value="Pianificato">Pianificato</option>
                    <option value="Chiuso">Chiuso</option>
                  </select>
                </div>
                <div className="h-[500px] overflow-hidden rounded-3xl border border-slate-300">
                  <AtlasMap sites={sites} tickets={filteredTickets} />
                </div>
              </section>
            )}

            {activeTab === "magazzino" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Magazzino</h2>
                    <p className={`text-sm ${mutedText}`}>
                      Costo azienda, prezzo vendita, scorte e margine.
                    </p>
                  </div>
                  <button
                    onClick={addInventoryItem}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white hover:bg-blue-500"
                  >
                    + Nuovo articolo
                  </button>
                </div>

                <div className="mb-5 grid gap-4 md:grid-cols-4">
                  <div className={`rounded-2xl border p-4 ${panel}`}>
                    <p className={`text-sm ${mutedText}`}>Valore a costo</p>
                    <p className="text-2xl font-black">
                      {euro(inventoryValueCost)}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${panel}`}>
                    <p className={`text-sm ${mutedText}`}>Valore vendita</p>
                    <p className="text-2xl font-black">
                      {euro(inventoryValueSale)}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${panel}`}>
                    <p className={`text-sm ${mutedText}`}>Articoli terminati</p>
                    <p className="text-2xl font-black text-red-500">
                      {inventoryEnded.length}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${panel}`}>
                    <p className={`text-sm ${mutedText}`}>Da riordinare</p>
                    <p className="text-2xl font-black text-amber-500">
                      {inventoryLow.length}
                    </p>
                  </div>
                </div>

                <input
                  className={`mb-5 w-full ${input}`}
                  placeholder="Cerca articolo o ID..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />

                <div
                  className={`mb-3 hidden rounded-2xl border px-4 py-3 text-sm font-black md:grid md:grid-cols-6 ${isDark ? "border-white/10 bg-slate-950/40 text-slate-300" : "border-slate-400 bg-slate-200 text-slate-800"}`}
                >
                  <div>ID</div>
                  <div>Articolo</div>
                  <div>Costo azienda</div>
                  <div>Prezzo vendita</div>
                  <div>Quantità</div>
                  <div className="text-center">Stato</div>
                </div>

                <div className="grid gap-3">
                  {inventory
                    .filter((item) => {
                      const q = inventorySearch.toLowerCase();
                      return (
                        item.id.toLowerCase().includes(q) ||
                        item.name.toLowerCase().includes(q)
                      );
                    })
                    .map((item, index) => {
                      const status = getInventoryStatus(Number(item.quantity));
                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className={`grid gap-3 rounded-2xl border p-4 transition-all md:grid-cols-6 md:items-center ${isDark ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]" : "border-slate-400 bg-white shadow-sm hover:bg-blue-50"}`}
                        >
                          <input
                            className={lightInput}
                            value={item.id}
                            onChange={(e) =>
                              updateInventoryItem(index, "id", e.target.value)
                            }
                            placeholder="ID articolo"
                          />
                          <input
                            className={lightInput}
                            value={item.name}
                            onChange={(e) =>
                              updateInventoryItem(index, "name", e.target.value)
                            }
                            placeholder="Nome articolo"
                          />
                          <input
                            className={lightInput}
                            type="number"
                            value={item.cost}
                            onChange={(e) =>
                              updateInventoryItem(index, "cost", e.target.value)
                            }
                            placeholder="Costo azienda"
                          />
                          <input
                            className={lightInput}
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateInventoryItem(
                                index,
                                "price",
                                e.target.value,
                              )
                            }
                            placeholder="Prezzo vendita"
                          />
                          <input
                            className={lightInput}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateInventoryItem(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            placeholder="Quantità"
                          />
                          <div
                            className={`rounded-full px-4 py-2 text-center text-sm font-black ${status.type === "empty" ? (isDark ? "border border-red-500/30 bg-red-500/15 text-red-300" : "border border-red-500 bg-red-100 text-red-700") : status.type === "low" ? (isDark ? "border border-amber-500/30 bg-amber-500/15 text-amber-300" : "border border-amber-500 bg-amber-100 text-amber-800") : isDark ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border border-emerald-500 bg-emerald-100 text-emerald-800"}`}
                          >
                            {status.label}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {activeTab === "contratti" && (
              <section className={card}>
                <h2 className="mb-6 text-2xl font-black">
                  Contratti / Accordi commerciali
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {editableContracts.map((contract) => {
                    const status = getContractStatus(contract);
                    return (
                      <div
                        key={contract.name}
                        className={`rounded-3xl border p-5 ${panel}`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black">
                              {contract.name}
                            </p>
                            <p className={`text-sm ${mutedText}`}>
                              {contract.clientType}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold text-white ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="grid gap-3 text-sm">
                          <p>
                            <b>Stato:</b> {contract.status}
                          </p>
                          <p>
                            <b>Periodo:</b> {contract.period}
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label>
                              <b>Inizio contratto</b>
                              <input
                                type="date"
                                className={`mt-1 w-full ${lightInput}`}
                                value={
                                  contract.startDate !== "Da verificare"
                                    ? contract.startDate
                                    : ""
                                }
                                onChange={(e) =>
                                  updateContractField(
                                    contract.name,
                                    "startDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </label>
                            <label>
                              <b>Scadenza contratto</b>
                              <input
                                type="date"
                                className={`mt-1 w-full ${lightInput}`}
                                value={
                                  contract.endDate !== "Da verificare"
                                    ? contract.endDate
                                    : ""
                                }
                                onChange={(e) =>
                                  updateContractField(
                                    contract.name,
                                    "endDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </label>
                          </div>
                          <p>
                            <b>Garanzia:</b> {contract.warranty}
                          </p>
                          <p>
                            <b>Spedizione:</b> {contract.shipping}
                          </p>
                          <p>
                            <b>Ricambi:</b> {contract.spareParts}
                          </p>
                          <p>
                            <b>SLA:</b> {contract.sla}
                          </p>
                        </div>
                        <div
                          className={`mt-4 rounded-2xl p-3 text-sm ${innerPanel}`}
                        >
                          {contract.notes}
                        </div>
                        <div className={`mt-4 rounded-2xl p-4 ${innerPanel}`}>
                          <label className="text-sm font-bold">
                            Link PDF contratto
                            <input
                              className={`mt-2 w-full ${lightInput}`}
                              placeholder="/contracts/nome-file.pdf"
                              value={contract.pdf || ""}
                              onChange={(e) =>
                                updateContractField(
                                  contract.name,
                                  "pdf",
                                  e.target.value,
                                )
                              }
                            />
                          </label>
                          <div className="mt-3">
                            {contract.pdf ? (
                              <a
                                href={contract.pdf}
                                target="_blank"
                                className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                              >
                                Apri / scarica PDF
                              </a>
                            ) : (
                              <div className="rounded-xl bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-500">
                                PDF contratto non ancora collegato
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "clienti" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Clienti / Enti</h2>
                    <p className={`text-sm ${mutedText}`}>
                      {sites.length} sedi totali
                    </p>
                  </div>
                  <input
                    className={input}
                    placeholder="Cerca cliente, città, sede..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {Object.entries(clientCategories).map(
                    ([category, categorySites]) => {
                      const filtered = categorySites.filter((s) => {
                        const q = clientSearch.toLowerCase();
                        return (
                          s.name?.toLowerCase().includes(q) ||
                          s.city?.toLowerCase().includes(q) ||
                          s.entity?.toLowerCase().includes(q) ||
                          s.region?.toLowerCase().includes(q)
                        );
                      });
                      if (filtered.length === 0) return null;
                      return (
                        <div
                          key={category}
                          className={`rounded-3xl border ${panel}`}
                        >
                          <button
                            onClick={() =>
                              setOpenCategory(
                                openCategory === category ? null : category,
                              )
                            }
                            className="flex w-full items-center justify-between p-5 text-left"
                          >
                            <div>
                              <p className="text-lg font-black">{category}</p>
                              <p className={`text-sm ${mutedText}`}>
                                {filtered.length} sedi
                              </p>
                            </div>
                            <div className="text-2xl">
                              {openCategory === category ? "−" : "+"}
                            </div>
                          </button>
                          {openCategory === category && (
                            <div
                              className={`grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3 ${isDark ? "border-white/10" : "border-slate-300"}`}
                            >
                              {filtered.map((s) => (
                                <div
                                  key={s.id}
                                  className={`rounded-2xl p-4 ${innerPanel}`}
                                >
                                  <p className="font-bold">{s.name}</p>
                                  <p className={`mt-1 text-sm ${mutedText}`}>
                                    {s.entity || "Ente n/d"}
                                  </p>
                                  <p className="mt-2 text-sm">
                                    {s.city || "Città n/d"} ·{" "}
                                    {s.region || "Regione n/d"}
                                  </p>
                                  <p className={`mt-2 text-xs ${mutedText}`}>
                                    {s.address || "Indirizzo n/d"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {activeTab === "contatti" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Contatti</h2>
                    <p className={`text-sm ${mutedText}`}>
                      Rubrica tecnica associata ai clienti.
                    </p>
                  </div>
                  <input
                    className={`md:w-96 ${input}`}
                    placeholder="Cerca nome, telefono, cliente, note..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
                <div className={`mb-6 rounded-3xl border p-5 ${panel}`}>
                  <h3 className="mb-4 text-xl font-black">
                    {editingContactId ? "Modifica contatto" : "Nuovo contatto"}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className={input}
                      placeholder="Nome e cognome / referente"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                    />
                    <input
                      className={input}
                      placeholder="Numero di telefono"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          phone: e.target.value,
                        })
                      }
                    />
                    <div className="relative md:col-span-2">
                      <input
                        className={`w-full ${input}`}
                        placeholder="Associa cliente / sede..."
                        value={contactClientSearch}
                        onChange={(e) => {
                          setContactClientSearch(e.target.value);
                          setContactClient(null);
                        }}
                      />
                      {contactClientSearch && !contactClient && (
                        <div
                          className={`absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-xl ${isDark ? "border-white/10 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-900"}`}
                        >
                          {contactClientResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`block w-full border-b p-3 text-left text-sm ${isDark ? "border-white/10 hover:bg-white/10" : "border-slate-200 hover:bg-blue-50"}`}
                              onClick={() => {
                                setContactClient(s);
                                setContactClientSearch(s.name);
                              }}
                            >
                              <div className="font-black">{s.name}</div>
                              <div className="text-xs opacity-70">
                                {s.city || "Città n/d"} ·{" "}
                                {s.region || "Regione n/d"}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      className={`md:col-span-2 ${input}`}
                      placeholder="Indirizzo"
                      value={contactForm.address}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          address: e.target.value,
                        })
                      }
                    />
                    <textarea
                      className={`md:col-span-2 min-h-28 ${input}`}
                      placeholder="Note operative"
                      value={contactForm.notes}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={saveContact}
                      className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                    >
                      {editingContactId
                        ? "Salva modifica"
                        : "Aggiungi contatto"}
                    </button>
                    {editingContactId && (
                      <button
                        onClick={resetContactForm}
                        className={`rounded-2xl px-5 py-3 font-black ${isDark ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900"}`}
                      >
                        Annulla modifica
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`rounded-3xl border p-5 ${panel}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">{contact.name}</p>
                          <p className={`text-sm ${mutedText}`}>
                            {contact.clientName || "Cliente non associato"}
                          </p>
                        </div>
                        <button
                          onClick={() => editContact(contact)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                        >
                          Modifica
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <a
                          href={`tel:${contact.phone}`}
                          className="block rounded-xl bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-500"
                        >
                          📞 {contact.phone}
                        </a>
                        {contact.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                            target="_blank"
                            className={`block rounded-xl px-3 py-2 font-bold ${isDark ? "bg-white/10 text-blue-300" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                          >
                            📍 {contact.address}
                          </a>
                        )}
                        {(contact.clientCity || contact.clientRegion) && (
                          <p className={mutedText}>
                            {contact.clientCity || "Città n/d"} ·{" "}
                            {contact.clientRegion || "Regione n/d"}
                          </p>
                        )}
                        {contact.notes && (
                          <div className={`rounded-2xl p-3 ${innerPanel}`}>
                            {contact.notes}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="mt-4 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-500"
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
                  {filteredContacts.length === 0 && (
                    <div
                      className={`rounded-3xl border p-8 text-center md:col-span-2 xl:col-span-3 ${panel}`}
                    >
                      Nessun contatto trovato.
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "sistemi" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      Sistemi / Componenti
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Catalogo tecnico consultabile dai tecnici
                    </p>
                  </div>
                  {selectedSystem && (
                    <button
                      onClick={() => {
                        setSelectedSystem(null);
                        setSystemSearch("");
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                    >
                      ← Torna ai sistemi
                    </button>
                  )}
                </div>
                {!selectedSystem && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {systemsCatalog.map((system) => (
                      <button
                        key={system.name}
                        onClick={() => setSelectedSystem(system.name)}
                        className={`rounded-3xl border p-5 text-left hover:bg-blue-50 ${panel}`}
                      >
                        <h3 className="text-xl font-black">{system.name}</h3>
                        <p className={`mt-2 text-sm ${mutedText}`}>
                          {system.components.length} componenti
                        </p>
                        <p className="mt-3 text-lg font-black">
                          {euro(system.totalCost)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedSystem &&
                  (() => {
                    const system = systemsCatalog.find(
                      (s) => s.name === selectedSystem,
                    );
                    if (!system) return null;
                    const filteredComponents = system.components.filter(
                      (component: any) => {
                        const q = systemSearch.toLowerCase();
                        return (
                          component.name?.toLowerCase().includes(q) ||
                          component.code?.toLowerCase().includes(q) ||
                          component.category?.toLowerCase().includes(q)
                        );
                      },
                    );
                    return (
                      <div>
                        <div className={`mb-5 rounded-3xl p-5 ${innerPanel}`}>
                          <h3 className="text-2xl font-black">{system.name}</h3>
                          <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                            <p>
                              <b>Componenti:</b> {system.components.length}
                            </p>
                            <p>
                              <b>Valore totale:</b> {euro(system.totalCost)}
                            </p>
                            <p>
                              <b>Prodotto:</b> {system.productName}
                            </p>
                          </div>
                          <input
                            className={`mt-4 w-full ${input}`}
                            placeholder="Cerca componente, codice, categoria..."
                            value={systemSearch}
                            onChange={(e) => setSystemSearch(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {filteredComponents.map((component: any) => (
                            <div
                              key={component.id}
                              className={`rounded-3xl border p-4 ${panel}`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="font-bold">{component.name}</p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? "bg-white/10" : "bg-slate-200"}`}
                                >
                                  {component.category || "Altro"}
                                </span>
                              </div>
                              <div className={`space-y-1 text-sm ${mutedText}`}>
                                <p>
                                  <b>Codice:</b> {component.code || "N/D"}
                                </p>
                                <p>
                                  <b>Quantità:</b> {component.quantity || "N/D"}
                                </p>
                                <p>
                                  <b>Prezzo:</b>{" "}
                                  {euro(Number(component.cost || 0))}
                                </p>
                                {component.parent && (
                                  <p>
                                    <b>Gruppo:</b> {component.parent}
                                  </p>
                                )}
                              </div>
                              {component.imageSearchUrl && (
                                <a
                                  href={component.imageSearchUrl}
                                  target="_blank"
                                  className="mt-3 inline-block text-sm font-bold text-blue-500"
                                >
                                  Cerca immagine componente
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </section>
            )}

            {activeTab === "registro" && (
              <section className={card}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-black">Registro chiamate</h2>
                  <button
                    onClick={exportCsv}
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"
                  >
                    Esporta CSV
                  </button>
                </div>
                {tickets.length === 0 ? (
                  <div className={`rounded-2xl p-10 text-center ${panel}`}>
                    Nessuna chiamata presente
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr
                          className={`border-b ${isDark ? "border-white/10 text-slate-400" : "border-slate-300 text-slate-600"}`}
                        >
                          <th className="p-3">ID</th>
                          <th>Sede</th>
                          <th>Regione</th>
                          <th>Problema</th>
                          <th>Materiali</th>
                          <th>Costo azienda</th>
                          <th>Valore vendita</th>
                          <th>Tecnico</th>
                          <th>Stato</th>
                          <th>Azione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t) => {
                          const cost = materialCost(t.materialIds || []);
                          const sale = materialSale(t.materialIds || []);
                          return (
                            <tr
                              key={t.id}
                              className={`border-b ${isDark ? "border-white/10" : "border-slate-200"}`}
                            >
                              <td className="p-3 font-bold">{t.id}</td>
                              <td>{t.site}</td>
                              <td>{t.region}</td>
                              <td>{t.problem}</td>
                              <td>
                                {(t.materialIds || [])
                                  .map(
                                    (id: string) =>
                                      materials.find((m) => m.id === id)?.name,
                                  )
                                  .join(" + ") || "Nessuno"}
                              </td>
                              <td className="font-bold">{euro(cost)}</td>
                              <td className="font-bold">{euro(sale)}</td>
                              <td>{t.technician || "Non assegnato"}</td>
                              <td>{t.status}</td>
                              <td>
                                {t.status !== "Chiuso" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => planTicket(String(t.id))}
                                      className="rounded-lg bg-blue-600 px-3 py-1 text-white"
                                    >
                                      Pianifica
                                    </button>
                                    <button
                                      onClick={() =>
                                        setClosingTicketId(String(t.id))
                                      }
                                      className="rounded-lg bg-slate-700 px-3 py-1 text-white"
                                    >
                                      Chiudi
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {closingTicketId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div
                  className={`w-full max-w-xl rounded-3xl border p-6 shadow-xl ${isDark ? "border-white/10 bg-[#0b1728]" : "border-slate-300 bg-white"}`}
                >
                  <h2 className="mb-4 text-xl font-black">Chiudi intervento</h2>
                  <textarea
                    className={`mb-3 w-full ${input}`}
                    placeholder="Note chiusura intervento"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                  <textarea
                    className={`mb-3 w-full ${input}`}
                    placeholder="Necessità future / materiale da ordinare"
                    value={futureNeeds}
                    onChange={(e) => setFutureNeeds(e.target.value)}
                  />
                  <label className="mb-5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={resolved}
                      onChange={(e) => setResolved(e.target.checked)}
                    />
                    Intervento risolto
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setClosingTicketId(null);
                        setClosingNotes("");
                        setFutureNeeds("");
                        setResolved(true);
                      }}
                      className={`flex-1 rounded-xl px-4 py-3 font-bold ${isDark ? "bg-white/10" : "bg-slate-200"}`}
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => closeTicket(closingTicketId)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                    >
                      Conferma chiusura
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </main>
  );
}
