"use client";

import { supabase } from "@/lib/supabase";
import { systemsCatalog } from "@/lib/systemsCatalog";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Box,
  FileText,
  ListChecks,
  Map,
  Monitor,
  Package,
Search,
Users,
Phone,
CalendarDays,
ChevronLeft,
ChevronRight,
Home as HomeIcon,
Bell,
Menu,
X,
Download,
MoreHorizontal,
Moon,
Sun,
Clock,
CheckCircle2,
} from "lucide-react";

const AtlasMap = dynamic(() => import("@/components/AtlasMap"), {
  ssr: false,
});

const INITIAL_BUDGET = 49043;

const materials = [
  { id: "kit-tlc", name: "Kit TLC", cost: 931 },
  { id: "uccs", name: "UCCS", cost: 821 },
  { id: "monitor", name: "Monitor", cost: 199 },
  { id: "kit-lampade", name: "Kit lampade", cost: 72 },
  { id: "ram", name: "RAM", cost: 56 },
  { id: "hub-usb", name: "Hub USB", cost: 52 },
  { id: "motore-sedia", name: "Motore sedia SPIS", cost: 196 },
  { id: "ups", name: "UPS", cost: 94 },
  { id: "tastiera-mouse", name: "Tastiera e mouse", cost: 31 },
  { id: "numeratore", name: "Circuito numeratore SPIS", cost: 199 },
  { id: "ssd-500", name: "SSD 500GB", cost: 92 },
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
  { id: "KIT-TLC", name: "Kit TLC", value: 931, quantity: 0 },
  { id: "UCCS", name: "UCCS", value: 821, quantity: 0 },
  { id: "MONITOR", name: "Monitor", value: 199, quantity: 0 },
  { id: "KIT-LAMP", name: "Kit lampade", value: 72, quantity: 0 },
  { id: "RAM", name: "RAM", value: 56, quantity: 0 },
  { id: "HUB-USB", name: "Hub USB", value: 52, quantity: 0 },
  { id: "MOTORE-SPIS", name: "Motore sedia SPIS", value: 196, quantity: 0 },
  { id: "UPS", name: "UPS", value: 94, quantity: 0 },
  { id: "TAST-MOUSE", name: "Tastiera e mouse", value: 31, quantity: 0 },
  { id: "NUMERATORE", name: "Circuito numeratore SPIS", value: 199, quantity: 0 },
  { id: "SSD-500", name: "SSD 500GB", value: 92, quantity: 0 },
];

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function materialCost(ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((m) => m.id === id);
    return sum + (item?.cost || 0);
  }, 0);
}

function getContractInfo(site: string, entity: string, sourceContracts = contracts) {
  const text = `${site} ${entity}`.toLowerCase();

  return sourceContracts.find((contract) =>
    contract.match.some((word) => text.includes(word.toLowerCase()))
  );
}

function getContractStatus(contract: any) {
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

function getInventoryStatus(quantity: number) {
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

function normalizeSiteRegion(site: any) {
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
  const [ticketType, setTicketType] = useState<"ordinaria" | "straordinaria">("ordinaria");
  const [ticketTypesById, setTicketTypesById] = useState<Record<string, "ordinaria" | "straordinaria">>({});

  const [closingNotes, setClosingNotes] = useState("");
  const [futureNeeds, setFutureNeeds] = useState("");
  const [resolved, setResolved] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [activeTab, setActiveTab] = useState<
    | "operativo"
    | "budget"
    | "mappa"
    | "registro"
    | "clienti"
    | "contratti"
    | "sistemi"
    | "magazzino"
| "calendario"
| "contatti"
  >("operativo");

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systemSearch, setSystemSearch] = useState("");

  const [budgetVisible, setBudgetVisible] = useState(true);
  const [theme, setTheme] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("atlas-theme") || "dark";
  }

  return "dark";
});

useEffect(() => {
  localStorage.setItem("atlas-theme", theme);
}, [theme]);
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budget");
      return saved ? Number(saved) : INITIAL_BUDGET;
    }

    return INITIAL_BUDGET;
  });

  const [budgets, setBudgets] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budgets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback sotto
        }
      }
    }

    return [
      {
        id: "BUD-CARABINIERI-2024-2026",
        contractName: "CARABINIERI ASSISTENZA 2024-2026",
        entity: "Carabinieri",
        value: INITIAL_BUDGET,
        notes: "Budget iniziale collegato al contratto Carabinieri Assistenza 2024-2026",
        updatedAt: new Date().toISOString(),
      },
    ];
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
  tag: "Personale",
});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
const [calendarTechnician, setCalendarTechnician] = useState("");
const [calendarSiteSearch, setCalendarSiteSearch] = useState("");
const [calendarSite, setCalendarSite] = useState<any | null>(null);
const [calendarTime, setCalendarTime] = useState("");
const [editingCalendarTicketId, setEditingCalendarTicketId] = useState<string | null>(null);
const [expandedCalendarTicketId, setExpandedCalendarTicketId] = useState<string | null>(null);
const [mobileView, setMobileView] = useState<
  | "home"
  | "operativo"
  | "calendario"
  | "budget"
  | "mappa"
  | "registro"
  | "clienti"
  | "contratti"
  | "sistemi"
  | "contatti"
  | "magazzino"
>("home");
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
const [notificationsOpen, setNotificationsOpen] = useState(false);
const [manualReminders, setManualReminders] = useState<any[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("atlas-reminders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
  }

  return [];
});
const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(false);
const [calendarReminderNote, setCalendarReminderNote] = useState("");
const [mobileInventoryFormOpen, setMobileInventoryFormOpen] = useState(false);
const [editingInventoryIndex, setEditingInventoryIndex] = useState<number | null>(null);
const [inventoryForm, setInventoryForm] = useState({
  id: "",
  name: "",
  value: "0",
  quantity: "0",
});
const [mobileBudgetFormOpen, setMobileBudgetFormOpen] = useState(false);
const [budgetClientSearch, setBudgetClientSearch] = useState("");
const [budgetClient, setBudgetClient] = useState<any | null>(null);
const [budgetForm, setBudgetForm] = useState({
  contractName: "CARABINIERI ASSISTENZA 2024-2026",
  value: String(budget),
  notes: "",
});
const [mobileCalendarFormOpen, setMobileCalendarFormOpen] = useState(false);
const [mobileContactFormOpen, setMobileContactFormOpen] = useState(false);
const [mobileContactFilter, setMobileContactFilter] = useState<"Tutti" | "Personale" | "Fornitore" | "Istituzione" | "Preferiti">("Tutti");

  useEffect(() => {
    const savedContracts = localStorage.getItem("atlas-contract-overrides");
    if (savedContracts) setContractOverrides(JSON.parse(savedContracts));

    const savedInventory = localStorage.getItem("atlas-inventory");
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    const savedContacts = localStorage.getItem("atlas-contacts");
if (savedContacts) setContacts(JSON.parse(savedContacts));
    const savedTicketTypes = localStorage.getItem("atlas-ticket-types");
if (savedTicketTypes) setTicketTypesById(JSON.parse(savedTicketTypes));
  }, []);

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase.from("sites").select("*").order("name");

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
          ticketType:
            (typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("atlas-ticket-types") || "{}")?.[String(t.id)]
              : undefined) || t.ticket_type || "ordinaria",
        })) || [];

      setTickets(formatted);
    }

    loadTickets();
    loadSites();
  }, []);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function syncTicketToGlpi(ticket: any) {
    try {
      const contract = getTicketContract(ticket);

      const response = await fetch("/api/glpi/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          atlasTicketId: ticket.id,
          site: ticket.site,
          region: ticket.region,
          entity: ticket.entity,
          city: ticket.city,
          problem: ticket.problem,
          materialIds: ticket.materialIds || [],
          materials: (ticket.materialIds || [])
            .map((id: string) => materials.find((m) => m.id === id)?.name)
            .filter(Boolean),
          cost: materialCost(ticket.materialIds || []),
          technician: ticket.technician,
          status: ticket.status,
          date: ticket.date,
          slot: ticket.slot,
          ticketType: getTicketType(ticket),
          contractName: contract?.name || "Contratto non rilevato",
          contractEntity: contract?.clientType || ticket.entity || "Entità non definita",
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

  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.value || item.total || 0),
    0
  ) || budget;

  function getTicketType(ticket: any): "ordinaria" | "straordinaria" {
    return (
      ticket?.ticketType ||
      ticketTypesById[String(ticket?.id)] ||
      ticket?.ticket_type ||
      "ordinaria"
    );
  }

  function getTicketContract(ticket: any) {
    return getContractInfo(ticket?.site || "", ticket?.entity || "", editableContracts);
  }

  function getBudgetSpent(contractName?: string) {
    return tickets
      .filter((ticket) => getTicketType(ticket) === "straordinaria")
      .filter((ticket) => {
        if (!contractName) return true;
        return getTicketContract(ticket)?.name === contractName;
      })
      .reduce((sum, ticket) => sum + materialCost(ticket.materialIds || []), 0);
  }

  function getBudgetTotal(contractName?: string) {
    if (!contractName) return totalBudget;
    const found = budgets.find((item) => item.contractName === contractName);
    return Number(found?.value || 0);
  }

  function getBudgetRemaining(contractName?: string) {
    return getBudgetTotal(contractName) - getBudgetSpent(contractName);
  }

  function updateContractField(contractName: string, field: string, value: string) {
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
        [field]:
          field === "value" || field === "quantity"
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
        value: 0,
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
      tickets
        .filter((t) => getTicketType(t) === "straordinaria")
        .reduce((sum, t) => sum + materialCost(t.materialIds || []), 0),
    [tickets, ticketTypesById]
  );

  const remainingBudget = totalBudget - totalForecast;

  const filteredTickets = tickets.filter((t) => {
    const matchTechnician = !filterTechnician || t.technician === filterTechnician;
    const matchRegion = !filterRegion || t.region === filterRegion;
    const matchStatus = !filterStatus || t.status === filterStatus;

    return matchTechnician && matchRegion && matchStatus;
  });

  const availableRegions = Array.from(
    new Set(tickets.map((t) => t.region).filter(Boolean))
  );

  const expiringContracts = editableContracts.filter(
    (contract) => getContractStatus(contract).warning
  );

  const inventoryValue = inventory.reduce(
    (sum, item) => sum + Number(item.value || 0) * Number(item.quantity || 0),
    0
  );

  const inventoryCritical = inventory.filter((item) => Number(item.quantity) < 10);

  const clientCategories = {
    "Ministero Interni": sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("minister")
    ),
    Carabinieri: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("carabin")
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
      `${s.name} ${s.entity}`.toLowerCase().includes("questura")
    ),
    Prefetture: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("prefettura")
    ),
    Tribunali: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("tribunale")
    ),
    Comuni: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("comune")
    ),
    RFI: sites.filter((s) => `${s.name} ${s.entity}`.toLowerCase().includes("rfi")),
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
      ticketType,
    };

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(data.id)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem("atlas-ticket-types", JSON.stringify(updatedTicketTypes));

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
    const glpiResult = await syncTicketToGlpi(newTicket);

    setSelectedMaterials([]);
    setTicketType("ordinaria");

    showMessage(glpiResult?.glpiTicketId ? `Ticket salvato e inviato a GLPI #${glpiResult.glpiTicketId}` : "Ticket salvato su ATLAS");
  }

  async function planTicket(id: string) {
    if (!selectedDate || !selectedSlot || !technician) {
      showMessage("Seleziona tecnico, data e slot prima di pianificare", "error");
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
          : t
      )
    );

    showMessage("Ticket pianificato");
  }

  async function closeTicket(id: string) {
    const today = new Date().toISOString().slice(0, 10);

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
          : t
      )
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
      "Costo",
      "Tecnico",
      "Tipo chiamata",
      "Stato",
      "Risolto",
      "Data intervento",
      "Slot",
      "Note chiusura",
      "Necessità future",
    ];

    const rows = tickets.map((t) => [
      t.id,
      t.site,
      t.entity || "",
      t.city || "",
      t.region || "",
      t.problem,
      (t.materialIds || [])
        .map((id: string) => materials.find((m) => m.id === id)?.name)
        .join(" + "),
      materialCost(t.materialIds || []),
      t.technician || "",
      getTicketType(t),
      t.status,
      t.resolved === false ? "No" : "Sì",
      t.date || "",
      t.slot || "",
      t.closingNotes || "",
      t.futureNeeds || "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")
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
  1
);

const monthEnd = new Date(
  calendarMonth.getFullYear(),
  calendarMonth.getMonth() + 1,
  0
);

const calendarDays = Array.from(
  { length: monthEnd.getDate() },
  (_, i) =>
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1)
);

const mobileCalendarStart = new Date(
  calendarMonth.getFullYear(),
  calendarMonth.getMonth(),
  1 - ((monthStart.getDay() + 6) % 7)
);

const mobileCalendarCells = Array.from({ length: 42 }, (_, i) => {
  const date = new Date(mobileCalendarStart);
  date.setDate(mobileCalendarStart.getDate() + i);
  return date;
});

const mobileSelectedDate =
  selectedCalendarDay || formatLocalDate(new Date());

const mobileSelectedTickets = tickets.filter((t) => t.date === mobileSelectedDate);


const monthLabel = calendarMonth.toLocaleDateString("it-IT", {
  month: "long",
  year: "numeric",
});

function changeMonth(amount: number) {
  setCalendarMonth(
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1)
  );
}

const calendarSiteResults = sites
  .filter((s) => {
    const q = calendarSiteSearch.toLowerCase();
    return `${s.name} ${s.city} ${s.entity} ${s.region}`
      .toLowerCase()
      .includes(q);
  })
  .slice(0, 8);
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
            region: calendarSite.region || "",
            entity: calendarSite.entity || "",
            city: calendarSite.city || "",
            technician: calendarTechnician,
            slot: calendarTime,
            date: selectedCalendarDay,
            status: "Pianificato",
            ticketType,
          }
        : t
    )
  );

  const updatedTicketTypes = {
    ...ticketTypesById,
    [String(editingCalendarTicketId)]: ticketType,
  };
  setTicketTypesById(updatedTicketTypes);
  localStorage.setItem("atlas-ticket-types", JSON.stringify(updatedTicketTypes));

  setEditingCalendarTicketId(null);
  setExpandedCalendarTicketId(null);
  setCalendarTechnician("");
  setCalendarSiteSearch("");
  setCalendarSite(null);
  setCalendarTime("");

  showMessage("Intervento aggiornato");
}
async function addCalendarTicket() {
  if (!selectedCalendarDay || !calendarTechnician || !calendarSite || !calendarTime) {
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
    ticketType,
  };

  const updatedTicketTypes = {
    ...ticketTypesById,
    [String(data.id)]: ticketType,
  };
  setTicketTypesById(updatedTicketTypes);
  localStorage.setItem("atlas-ticket-types", JSON.stringify(updatedTicketTypes));

  setTickets([newTicket, ...tickets]);

  const glpiResult = await syncTicketToGlpi(newTicket);

  setSelectedCalendarDay(null);
  setCalendarTechnician("");
  setCalendarSiteSearch("");
  setCalendarSite(null);
  setCalendarTime("");

  showMessage(glpiResult?.glpiTicketId ? `Intervento aggiunto e inviato a GLPI #${glpiResult.glpiTicketId}` : "Intervento aggiunto al calendario");
}
const contactClientResults = sites
  .filter((s) => {
    const q = contactClientSearch.toLowerCase();

    return `${s.name} ${s.city} ${s.entity} ${s.region}`
      .toLowerCase()
      .includes(q);
  })
  .slice(0, 8);

const budgetClientResults = sites
  .filter((s) => {
    const q = budgetClientSearch.toLowerCase();

    return `${s.name} ${s.city} ${s.entity} ${s.region}`
      .toLowerCase()
      .includes(q);
  })
  .slice(0, 8);

const filteredContacts = contacts.filter((contact) => {
  const q = contactSearch.toLowerCase();
  const tag = contact.tag || "Personale";

  const matchesSearch = `${contact.name} ${contact.phone} ${contact.address} ${contact.notes} ${contact.clientName} ${contact.clientCity} ${contact.clientRegion} ${tag}`
    .toLowerCase()
    .includes(q);

  const matchesTag =
    mobileContactFilter === "Tutti" ||
    (mobileContactFilter === "Preferiti" && contact.favorite) ||
    tag === mobileContactFilter;

  return matchesSearch && matchesTag;
});

function resetContactForm() {
  setEditingContactId(null);
  setContactClientSearch("");
  setContactClient(null);
  setContactForm({
    name: "",
    phone: "",
    address: "",
    notes: "",
    tag: "Personale",
  });
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
    tag: contactForm.tag || "Personale",
    clientId: contactClient?.id || null,
    clientName: contactClient?.name || contactClientSearch || "",
    clientCity: contactClient?.city || "",
    clientRegion: contactClient?.region || "",
    updatedAt: new Date().toISOString(),
  };

  const updated = editingContactId
    ? contacts.map((contact) =>
        contact.id === editingContactId ? payload : contact
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
    tag: contact.tag || "Personale",
  });
}

function deleteContact(id: string) {
  const updated = contacts.filter((contact) => contact.id !== id);
  setContacts(updated);
  localStorage.setItem("atlas-contacts", JSON.stringify(updated));
  resetContactForm();
  showMessage("Contatto eliminato");
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openBudgetForm(contractName?: string) {
  const selectedContractName = contractName || budgetForm.contractName || budgets[0]?.contractName || editableContracts[0]?.name || "";
  const existing = budgets.find((item) => item.contractName === selectedContractName);

  setBudgetForm({
    contractName: selectedContractName,
    value: String(existing?.value || budget || INITIAL_BUDGET),
    notes: existing?.notes || "",
  });
  setMobileBudgetFormOpen(true);
}

function saveMobileBudget() {
  const parsed = Number(String(budgetForm.value || "0").replace(",", "."));
  const contract = editableContracts.find((item) => item.name === budgetForm.contractName);

  if (!contract) {
    showMessage("Seleziona un contratto / entità", "error");
    return;
  }

  if (Number.isNaN(parsed)) {
    showMessage("Valore budget non valido", "error");
    return;
  }

  const payload = {
    id: `BUD-${contract.name.replace(/[^A-Z0-9]+/gi, "-").toUpperCase()}`,
    contractName: contract.name,
    entity: contract.clientType || contract.name,
    value: parsed,
    notes: budgetForm.notes || "",
    updatedAt: new Date().toISOString(),
  };

  const updated = budgets.some((item) => item.contractName === contract.name)
    ? budgets.map((item) => (item.contractName === contract.name ? payload : item))
    : [payload, ...budgets];

  setBudgets(updated);
  localStorage.setItem("atlas-budgets", JSON.stringify(updated));
  setBudget(updated.reduce((sum, item) => sum + Number(item.value || 0), 0));
  localStorage.setItem("atlas-budget", String(updated.reduce((sum, item) => sum + Number(item.value || 0), 0)));

  setMobileBudgetFormOpen(false);
  showMessage("Budget contratto aggiornato");
}

async function promptPlanTicket(id: string) {
  const current = tickets.find((t) => String(t.id) === String(id));
  const date = prompt("Data intervento (AAAA-MM-GG):", current?.date || selectedDate || formatLocalDate(new Date()));
  if (!date) return;

  const slot = prompt("Slot (Mattina/Pomeriggio):", current?.slot || selectedSlot || "Mattina");
  if (!slot) return;

  const tech = prompt("Tecnico:", current?.technician || technician || technicians[0]);
  if (!tech) return;

  const { error } = await supabase
    .from("tickets")
    .update({
      technician: tech,
      intervention_date: date,
      slot,
      status: "Pianificato",
    })
    .eq("id", Number(id));

  if (error) {
    console.log(error);
    showMessage("Errore pianificazione ticket", "error");
    return;
  }

  setTickets((prev) =>
    prev.map((t) =>
      String(t.id) === String(id)
        ? { ...t, technician: tech, date, slot, status: "Pianificato" }
        : t
    )
  );

  showMessage("Ticket pianificato");
}

async function promptCloseTicket(id: string) {
  const notes = prompt("Note chiusura:", closingNotes || "");
  if (notes === null) return;

  const future = prompt("Necessità future:", futureNeeds || "");
  if (future === null) return;

  const today = formatLocalDate(new Date());

  const { error } = await supabase
    .from("tickets")
    .update({
      status: "Chiuso",
      intervention_date: today,
      closing_notes: notes,
      future_needs: future,
      resolved: true,
    })
    .eq("id", Number(id));

  if (error) {
    console.log(error);
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
            closingNotes: notes,
            futureNeeds: future,
            resolved: true,
          }
        : t
    )
  );

  showMessage("Ticket chiuso");
}

function startCalendarCreate(day?: string) {
  setEditingCalendarTicketId(null);
  setExpandedCalendarTicketId(null);
  setSelectedCalendarDay(day || mobileSelectedDate || formatLocalDate(new Date()));
  setCalendarTechnician("");
  setCalendarSiteSearch("");
  setCalendarSite(null);
  setCalendarTime("");
  setTicketType("ordinaria");
  setMobileCalendarFormOpen(true);
}

function startCalendarEdit(ticket: any) {
  setEditingCalendarTicketId(String(ticket.id));
  setExpandedCalendarTicketId(String(ticket.id));
  setSelectedCalendarDay(ticket.date || mobileSelectedDate || formatLocalDate(new Date()));
  setCalendarTechnician(ticket.technician || "");
  setCalendarSiteSearch(ticket.site || "");
  setCalendarSite({
    id: ticket.site_id || null,
    name: ticket.site || "",
    region: ticket.region || "",
    entity: ticket.entity || "",
    city: ticket.city || "",
  });
  setCalendarTime(ticket.slot || "");
  setTicketType(getTicketType(ticket));
  setMobileCalendarFormOpen(true);
}

async function saveMobileCalendarTicket() {
  const reminderDate = selectedCalendarDay || mobileSelectedDate || formatLocalDate(new Date());
  const reminderTitle = calendarSite?.name
    ? `Intervento ${calendarSite.name}`
    : calendarSiteSearch
    ? `Intervento ${calendarSiteSearch}`
    : "Intervento calendario";

  if (editingCalendarTicketId) {
    await updateCalendarTicket();
  } else {
    await addCalendarTicket();
  }

  if (calendarReminderEnabled) {
    addManualReminder(reminderTitle, reminderDate, calendarReminderNote || calendarTime || "Reminder calendario");
    setCalendarReminderEnabled(false);
    setCalendarReminderNote("");
  }

  setMobileCalendarFormOpen(false);
}

async function promptAddClient() {
  const name = prompt("Nome sede/cliente:");
  if (!name) return;

  const cityValue = prompt("Città:", "") || "";
  const entityValue = prompt("Ente:", "") || "";
  const regionValue = prompt("Regione:", "Da definire") || "Da definire";

  const { data, error } = await supabase
    .from("sites")
    .insert([
      {
        name,
        city: cityValue,
        entity: entityValue,
        region: regionValue,
      },
    ])
    .select()
    .single();

  if (error) {
    console.log(error);
    showMessage("Errore creazione cliente", "error");
    return;
  }

  setSites((prev) => [normalizeSiteRegion(data), ...prev]);
  showMessage("Cliente/sede aggiunto");
}

function editMobileContract(contract: any) {
  const startDate = prompt("Data inizio contratto (AAAA-MM-GG):", contract.startDate !== "Da verificare" ? contract.startDate : "");
  if (startDate !== null) updateContractField(contract.name, "startDate", startDate || "Da verificare");

  const endDate = prompt("Scadenza contratto (AAAA-MM-GG):", contract.endDate !== "Da verificare" ? contract.endDate : "");
  if (endDate !== null) updateContractField(contract.name, "endDate", endDate || "Da verificare");

  const pdf = prompt("Link PDF contratto:", contract.pdf || "");
  if (pdf !== null) updateContractField(contract.name, "pdf", pdf);

  const notes = prompt("Note contratto:", contract.notes || "");
  if (notes !== null) updateContractField(contract.name, "notes", notes);
}

function startContactCreate() {
  setEditingContactId(null);
  setContactClientSearch("");
  setContactClient(null);
  setContactForm({
    name: "",
    phone: "",
    address: "",
    notes: "",
    tag: "Personale",
  });
  setMobileContactFormOpen(true);
}

function startContactEdit(contact: any) {
  editContact(contact);
  setMobileContactFormOpen(true);
}

function saveMobileContact() {
  saveContact();
  setMobileContactFormOpen(false);
}

function startInventoryCreate() {
  setEditingInventoryIndex(null);
  setInventoryForm({
    id: "",
    name: "",
    value: "0",
    quantity: "0",
  });
  setMobileInventoryFormOpen(true);
}

function startInventoryEdit(index: number) {
  const item = inventory[index];
  if (!item) return;

  setEditingInventoryIndex(index);
  setInventoryForm({
    id: item.id || "",
    name: item.name || "",
    value: String(item.value || 0),
    quantity: String(item.quantity || 0),
  });
  setMobileInventoryFormOpen(true);
}

function saveInventoryItemMobile() {
  const name = inventoryForm.name.trim();
  const id = inventoryForm.id.trim() || name.toUpperCase().replace(/\s+/g, "-");

  if (!name || !id) {
    showMessage("Nome e ID articolo sono obbligatori", "error");
    return;
  }

  const payload = {
    id,
    name,
    value: Number(String(inventoryForm.value || "0").replace(",", ".")),
    quantity: Number(String(inventoryForm.quantity || "0").replace(",", ".")),
  };

  const updated =
    editingInventoryIndex === null
      ? [payload, ...inventory]
      : inventory.map((item, index) =>
          index === editingInventoryIndex ? { ...item, ...payload } : item
        );

  setInventory(updated);
  localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  setMobileInventoryFormOpen(false);
  setEditingInventoryIndex(null);
  showMessage(editingInventoryIndex === null ? "Articolo aggiunto" : "Articolo aggiornato");
}

function deleteInventoryItemMobile() {
  if (editingInventoryIndex === null) return;

  const updated = inventory.filter((_, index) => index !== editingInventoryIndex);
  setInventory(updated);
  localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  setMobileInventoryFormOpen(false);
  setEditingInventoryIndex(null);
  showMessage("Articolo eliminato");
}

function openSystemMobile(systemName: string) {
  setSelectedSystem(selectedSystem === systemName ? null : systemName);
}

function renderDateInput(value: string, onChange: (value: string) => void, className = input) {
  return (
    <div className="relative w-full">
      <input
        type="date"
        className={`${className} w-full appearance-none pr-12`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <CalendarDays
        size={20}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function addManualReminder(title: string, date: string, note = "") {
  if (!title || !date) return;

  const reminder = {
    id: `REM-${Date.now()}`,
    title,
    date,
    note,
    done: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [reminder, ...manualReminders];
  setManualReminders(updated);
  localStorage.setItem("atlas-reminders", JSON.stringify(updated));
}

function toggleReminderDone(id: string) {
  const updated = manualReminders.map((reminder) =>
    reminder.id === id ? { ...reminder, done: !reminder.done } : reminder
  );
  setManualReminders(updated);
  localStorage.setItem("atlas-reminders", JSON.stringify(updated));
}

const todayIso = formatLocalDate(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrowIso = formatLocalDate(tomorrowDate);

const budgetAlerts = budgets
  .map((item) => {
    const remaining = getBudgetRemaining(item.contractName);
    const total = Number(item.value || 0);
    const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
    return { ...item, remaining, percentage };
  })
  .filter((item) => item.value > 0 && item.percentage <= 20);

const todayTickets = tickets.filter((ticket) => ticket.date === todayIso);
const tomorrowTickets = tickets.filter((ticket) => ticket.date === tomorrowIso);

const notificationItems = [
  ...manualReminders
    .filter((reminder) => !reminder.done)
    .map((reminder) => ({
      id: reminder.id,
      type: "Reminder",
      title: reminder.title,
      detail: `${reminder.date}${reminder.note ? ` · ${reminder.note}` : ""}`,
      tone: "blue",
      action: () => toggleReminderDone(reminder.id),
    })),
  ...todayTickets.map((ticket) => ({
    id: `today-${ticket.id}`,
    type: "Oggi",
    title: ticket.site || "Intervento",
    detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
    tone: "emerald",
  })),
  ...tomorrowTickets.map((ticket) => ({
    id: `tomorrow-${ticket.id}`,
    type: "Domani",
    title: ticket.site || "Intervento",
    detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
    tone: "blue",
  })),
  ...expiringContracts.map((contract) => ({
    id: `contract-${contract.name}`,
    type: "Contratto",
    title: contract.name,
    detail: getContractStatus(contract).label,
    tone: "amber",
  })),
  ...budgetAlerts.map((budgetItem) => ({
    id: `budget-${budgetItem.id}`,
    type: "Budget",
    title: budgetItem.contractName,
    detail: `Residuo ${euro(budgetItem.remaining)} (${budgetItem.percentage}%)`,
    tone: "red",
  })),
  ...inventoryCritical.slice(0, 6).map((item) => ({
    id: `inventory-${item.id}`,
    type: "Magazzino",
    title: item.name,
    detail: `Quantità ${item.quantity}`,
    tone: Number(item.quantity) <= 0 ? "red" : "amber",
  })),
];

function renderNotificationsDrawer() {
  if (!notificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm">
      <div
        className={`ml-auto flex h-full w-full max-w-md flex-col border-l p-5 shadow-2xl ${
          theme === "dark"
            ? "border-white/10 bg-[#07111f] text-white"
            : "border-slate-200 bg-[#f4f7fb] text-slate-950"
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
              ATLAS
            </p>
            <h2 className="text-2xl font-black">Notifiche</h2>
          </div>

          <button
            onClick={() => setNotificationsOpen(false)}
            className={`rounded-2xl p-3 ${
              theme === "dark" ? "bg-white/10 text-white" : "bg-white text-slate-900 shadow-sm"
            }`}
          >
            <X size={22} />
          </button>
        </div>

        <div className={`mb-4 rounded-3xl border p-4 ${
          theme === "dark" ? "border-white/10 bg-white/[0.05]" : "border-slate-200 bg-white"
        }`}>
          <p className="mb-3 text-sm font-black">Nuovo reminder manuale</p>
          <div className="grid gap-3">
            <input
              className={input}
              placeholder="Titolo reminder"
              id="atlas-reminder-title"
            />
            {renderDateInput("", (value) => {
              const field = document.getElementById("atlas-reminder-date") as HTMLInputElement | null;
              if (field) field.value = value;
            })}
            <input id="atlas-reminder-date" type="hidden" />
            <button
              onClick={() => {
                const title = (document.getElementById("atlas-reminder-title") as HTMLInputElement | null)?.value || "";
                const date = (document.getElementById("atlas-reminder-date") as HTMLInputElement | null)?.value || todayIso;
                addManualReminder(title, date);
                showMessage("Reminder aggiunto");
              }}
              className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
            >
              + Aggiungi reminder
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {notificationItems.length === 0 ? (
            <div className={`rounded-3xl border p-5 text-sm ${
              theme === "dark" ? "border-white/10 bg-white/[0.05] text-slate-300" : "border-slate-200 bg-white text-slate-600"
            }`}>
              Nessuna notifica attiva.
            </div>
          ) : (
            notificationItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl border p-4 ${
                  theme === "dark" ? "border-white/10 bg-white/[0.06]" : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      item.tone === "red"
                        ? "bg-red-500/15 text-red-300"
                        : item.tone === "amber"
                        ? "bg-amber-500/15 text-amber-300"
                        : item.tone === "emerald"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-blue-500/15 text-blue-300"
                    }`}>
                      {item.type}
                    </span>
                    <p className="mt-3 font-black">{item.title}</p>
                    <p className={theme === "dark" ? "text-sm text-slate-400" : "text-sm text-slate-600"}>
                      {item.detail}
                    </p>
                  </div>

                  {"action" in item && (
                    <button
                      onClick={() => (item as any).action?.()}
                      className="rounded-2xl bg-emerald-600 p-3 text-white"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
  const tabs = [
    { key: "operativo", label: "Operativo", icon: AlertTriangle },
    { key: "calendario", label: "Calendario", icon: CalendarDays },
    { key: "budget", label: "Budget", icon: BarChart3 },
    { key: "mappa", label: "Mappa", icon: Map },
    { key: "registro", label: "Registro", icon: ListChecks },
    { key: "clienti", label: "Clienti", icon: Users },
    { key: "contratti", label: "Contratti", icon: FileText },
    { key: "sistemi", label: "Sistemi", icon: Monitor },
    { key: "magazzino", label: "Magazzino", icon: Package },
    { key: "contatti", label: "Contatti", icon: Phone },
  ];

  const card =
  theme === "dark"
    ? "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur"
    : "rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.12)]";

const input =
  theme === "dark"
    ? "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
    : "rounded-xl border-2 border-slate-300 bg-white p-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-600";

const lightInput =
  theme === "dark"
    ? "rounded-xl border border-white/10 bg-slate-950/50 p-2 text-white outline-none focus:border-blue-400"
    : "rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-950 outline-none focus:border-blue-600";

const panel =
  theme === "dark"
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-300 bg-slate-50 shadow-sm";

const innerPanel =
  theme === "dark"
    ? "bg-slate-950/40"
    : "bg-white border border-slate-300 shadow-sm";

const mutedText =
  theme === "dark" ? "text-slate-400" : "text-slate-600";

const strongText =
  theme === "dark" ? "text-white" : "text-slate-950";

return (
  <main
    className={`min-h-screen overflow-x-hidden transition-all duration-300 ${
      theme === "dark"
        ? "bg-[#07111f] text-slate-100"
        : "bg-[#eef3f8] text-slate-900"
    }`}
  >
    {renderNotificationsDrawer()}
    <div className="flex min-h-screen">
      <aside
        className={`hidden w-72 shrink-0 border-r p-6 lg:block ${
          theme === "dark"
            ? "border-white/10 bg-[#081523]"
            : "border-slate-300 bg-white shadow-xl shadow-slate-300/30"
        }`}
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
                  : theme === "dark"
                    ? "border-white/10 text-slate-300 hover:bg-white/10"
                    : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div
          className={`mt-8 rounded-3xl border p-4 ${
            theme === "dark"
              ? "border-white/10 bg-white/[0.04]"
              : "border-slate-300 bg-slate-50 shadow-sm"
          }`}
        >
          <p className="text-sm font-black">Filtri rapidi</p>

          <select
            className={`mt-3 w-full rounded-xl border p-3 text-sm outline-none ${
              theme === "dark"
                ? "border-white/10 bg-slate-950/50 text-slate-200"
                : "border-slate-300 bg-white text-slate-900"
            }`}
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

      <div className="min-w-0 flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06111f]/95 px-5 pb-4 pt-5 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <button onClick={() => setMobileMenuOpen(true)} className="rounded-2xl p-2 text-white" aria-label="Apri menu mobile">
              <Menu size={26} />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <img src="/secom-logo.png.png" alt="Secom" className="h-9 w-auto object-contain" />
              <h1 className="truncate text-base font-black text-white">Centrale Operativa ATLAS</h1>
            </div>

            <button onClick={() => setNotificationsOpen(true)} className="relative rounded-2xl p-2 text-white" aria-label="Notifiche">
              <Bell size={24} />
              {notificationItems.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                  {notificationItems.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <header
          className={`hidden md:block sticky top-0 z-30 border-b backdrop-blur ${
            theme === "dark"
              ? "border-white/10 bg-[#07111f]/90"
              : "border-slate-300 bg-white/95 shadow-sm"
          }`}
        >
          <div className="px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/secom-logo.png.png"
                  alt="Secom"
                  className="h-10 w-auto object-contain lg:hidden"
                />

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black md:text-2xl">
                    Centrale Operativa ATLAS
                  </h1>
                  <p
                    className={`hidden text-sm md:block ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Ticket, contratti, calendario, magazzino e sistemi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className={`relative shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.06] text-white"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                  aria-label="Notifiche"
                >
                  <Bell size={18} />
                  {notificationItems.length > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                      {notificationItems.length}
                    </span>
                  )}
                </button>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                  theme === "dark"
                    ? "border-white/10 bg-white text-slate-900"
                    : "border-slate-300 bg-slate-950 text-white"
                }`}
              >
                {theme === "dark" ? "☀️" : "🌙"}
                <span className="ml-2 hidden md:inline">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div
                className={`w-fit rounded-2xl border px-4 py-2 ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <p
                  className={`text-[11px] font-bold ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Interventi aperti
                </p>
                <p className="text-xl font-black">
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
                    theme === "dark"
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

          <div
            className={`border-t px-3 py-2 lg:hidden ${
              theme === "dark" ? "border-white/10" : "border-slate-200"
            }`}
          >
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${
                    activeTab === key
                      ? "border-blue-500 bg-blue-600 text-white"
                      : theme === "dark"
                        ? "border-white/10 bg-white/10 text-slate-300"
                        : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
            <div className="h-full w-[82%] max-w-sm border-r border-white/10 bg-[#07111f] p-6 shadow-2xl">
              <button onClick={() => setMobileMenuOpen(false)} className="mb-8 rounded-2xl p-2 text-slate-300" aria-label="Chiudi menu">
                <X size={26} />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <img src="/secom-logo.png.png" alt="Secom" className="h-10 w-auto object-contain" />
                <p className="text-base font-black text-white">Centrale Operativa ATLAS</p>
              </div>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mb-6 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200"
              >
                <span className="flex items-center gap-3">
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  Tema {theme === "dark" ? "chiaro" : "scuro"}
                </span>
                <span className="rounded-xl bg-blue-600/20 px-3 py-1 text-xs text-blue-300">
                  {theme === "dark" ? "Dark" : "Light"}
                </span>
              </button>

              <div className="grid gap-2">
                {[
                  { key: "home", label: "Home", icon: HomeIcon },
                  { key: "operativo", label: "Apri chiamata", icon: AlertTriangle },
                  { key: "calendario", label: "Calendario", icon: CalendarDays },
                  { key: "budget", label: "Budget", icon: BarChart3 },
                  { key: "mappa", label: "Mappa", icon: Map },
                  { key: "registro", label: "Registro interventi", icon: ListChecks },
                  { key: "clienti", label: "Clienti", icon: Users },
                  { key: "contratti", label: "Contratti", icon: FileText },
                  { key: "sistemi", label: "Sistemi", icon: Monitor },
                  { key: "contatti", label: "Contatti", icon: Phone },
                  { key: "magazzino", label: "Magazzino", icon: Package },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMobileView(key as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left font-bold ${
                      mobileView === key ? "bg-blue-600/25 text-blue-300" : "text-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <Icon size={22} />
                      {label}
                    </span>
                    {key !== "home" && <ChevronRight size={18} className="text-slate-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="w-full max-w-full overflow-x-hidden space-y-6 p-5 pb-24 md:p-8">
            {message && (
              <div
                className={`rounded-2xl p-4 text-sm font-bold text-white shadow ${
                  messageType === "success" ? "bg-emerald-700" : "bg-red-700"
                }`}
              >
                {message}
              </div>
            )}
            <section className="w-full max-w-full overflow-x-hidden md:hidden">
              {mobileView !== "home" && (
                <>
                  <button onClick={() => setMobileView("home")} className="mb-5 flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-blue-400">
                    <ChevronLeft size={18} />
                    Torna alla home mobile
                  </button>
                  <div className="mb-5 flex w-full max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-white/10 pb-4 [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[
                      { key: "operativo", label: "Operativo", icon: AlertTriangle },
                      { key: "calendario", label: "Calendario", icon: CalendarDays },
                      { key: "budget", label: "Budget", icon: BarChart3 },
                      { key: "mappa", label: "Mappa", icon: Map },
                      { key: "registro", label: "Registro", icon: ListChecks },
                      { key: "clienti", label: "Clienti", icon: Users },
                      { key: "contratti", label: "Contratti", icon: FileText },
                      { key: "sistemi", label: "Sistemi", icon: Monitor },
                      { key: "magazzino", label: "Magazzino", icon: Package },
                      { key: "contatti", label: "Contatti", icon: Phone },
                    ].map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setMobileView(key as any)} className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${mobileView === key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-slate-300"}`}>
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mobileView === "home" && (
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
                    <p className="text-sm font-bold text-slate-400">Interventi aperti</p>
                    <p className="mt-1 text-4xl font-black text-white">{tickets.filter((t) => t.status !== "Chiuso").length}</p>
                  </div>

                  <div className="relative">
                    <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="w-full rounded-3xl border border-white/10 bg-white/[0.06] py-4 pl-12 pr-4 text-base text-white placeholder:text-slate-500 outline-none" placeholder="Cerca sito, cliente, contratto..." value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)} />
                  </div>

                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS Mobile</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Cosa devi fare?</h2>
                    <p className="mt-1 text-sm text-slate-400">Accesso rapido alle funzioni operative.</p>
                  </div>

                  <button onClick={() => setMobileView("operativo")} className="rounded-3xl bg-blue-600 p-5 text-left shadow-lg shadow-blue-900/40">
                    <p className="text-2xl font-black text-white">+ Apri chiamata</p>
                    <p className="mt-1 text-sm font-bold text-blue-100">Crea subito un nuovo intervento</p>
                  </button>

                  {[
                    { key: "calendario", title: "Calendario", desc: "Pianifica o modifica interventi", icon: CalendarDays },
                    { key: "budget", title: "Budget", desc: "Costi, residuo e avanzamento", icon: BarChart3 },
                    { key: "mappa", title: "Mappa", desc: "Sedi e interventi sul territorio", icon: Map },
                    { key: "registro", title: "Registro interventi", desc: "Vedi, pianifica o chiudi ticket", icon: ListChecks },
                    { key: "clienti", title: "Clienti", desc: "Cerca sedi e riferimenti", icon: Users },
                    { key: "contratti", title: "Contratti", desc: "Accordi, SLA e scadenze", icon: FileText },
                    { key: "sistemi", title: "Sistemi", desc: "Catalogo tecnico componenti", icon: Monitor },
                    { key: "contatti", title: "Contatti", desc: "Rubrica rapida operativa", icon: Phone },
                    { key: "magazzino", title: "Magazzino", desc: "Materiali e disponibilità", icon: Package },
                  ].map(({ key, title, desc, icon: Icon }) => (
                    <button key={key} onClick={() => setMobileView(key as any)} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left shadow-lg shadow-black/10">
                      <Icon size={24} className="shrink-0 text-slate-200" />
                      <span>
                        <span className="block text-xl font-black text-white">{title}</span>
                        <span className="mt-1 block text-sm text-slate-400">{desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {mobileView === "operativo" && (
                <div className="grid gap-4">
                  <h2 className="text-3xl font-black text-white">Apri nuova chiamata</h2>
                  <div className="relative">
                    <input className={`w-full ${input}`} placeholder="Cerca sede: es. Alatri, Bari, Ferrara..." value={siteSearch} onChange={(e) => { setSiteSearch(e.target.value); setSite(""); setRegion(""); setEntity(""); setCity(""); setSiteId(null); }} />
                    {siteSearch && !site && (
                      <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                        {filteredSites.map((s) => (
                          <button key={s.id} type="button" className="block w-full border-b border-white/10 p-4 text-left" onClick={() => { setSite(s.name); setSiteSearch(s.name); setRegion(s.region || ""); setEntity(s.entity || ""); setCity(s.city || ""); setSiteId(s.id || null); }}>
                            <div className="font-black text-white">{s.name}</div>
                            <div className="text-xs text-slate-400">{s.city || "Città n/d"} · {s.entity || "Ente n/d"}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea className={`min-h-28 ${input}`} placeholder="Descrizione intervento" value={problem} onChange={(e) => setProblem(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketType("ordinaria")}
                      className={`rounded-2xl border p-4 text-left font-black ${ticketType === "ordinaria" ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
                    >
                      Ordinaria
                      <span className="mt-1 block text-xs font-bold opacity-70">Non scala budget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketType("straordinaria")}
                      className={`rounded-2xl border p-4 text-left font-black ${ticketType === "straordinaria" ? "border-amber-500 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
                    >
                      Straordinaria
                      <span className="mt-1 block text-xs font-bold opacity-70">Scala budget</span>
                    </button>
                  </div>
                  {site && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
                      <b className="text-white">Contratto rilevato:</b>{" "}
                      {selectedContract?.name || "Nessun contratto riconosciuto"}
                    </div>
                  )}
                  <select className={input} value={technician} onChange={(e) => setTechnician(e.target.value)}>
                    <option value="">Tecnico non assegnato</option>
                    {technicians.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    {renderDateInput(selectedDate, setSelectedDate)}
                    <select className={input} value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                      <option value="">Slot</option>
                      <option value="Mattina">Mattina</option>
                      <option value="Pomeriggio">Pomeriggio</option>
                    </select>
                  </div>
                  <button onClick={addTicket} className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white">Salva chiamata</button>
                </div>
              )}

              {mobileView === "calendario" && (
                <div className="grid gap-5">
                  <div>
                    <h2 className="text-3xl font-black text-white">Calendario interventi</h2>
                    <p className="mt-2 break-words text-base text-slate-400">
                      Vista mensile con interventi pianificati e inserimento rapido.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button onClick={() => changeMonth(-1)} className="rounded-2xl bg-blue-600 p-4 text-white">
                      <ChevronLeft size={28} />
                    </button>
                    <div className="text-2xl font-black capitalize text-white">{monthLabel}</div>
                    <button onClick={() => changeMonth(1)} className="rounded-2xl bg-blue-600 p-4 text-white">
                      <ChevronRight size={28} />
                    </button>
                  </div>

                  <div className="grid w-full grid-cols-7 gap-1 text-center text-xs font-bold text-slate-300">
                    {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid w-full grid-cols-7 gap-1">
                    {mobileCalendarCells.map((day) => {
                      const iso = formatLocalDate(day);
                      const inMonth = day.getMonth() === calendarMonth.getMonth();
                      const hasTickets = tickets.some((t) => t.date === iso);
                      const selected = mobileSelectedDate === iso;

                      return (
                        <button
                          key={iso}
                          onClick={() => setSelectedCalendarDay(iso)}
                          className={`aspect-square min-h-0 rounded-xl border p-1 text-center ${
                            selected ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-white"
                          } ${!inMonth ? "opacity-30" : ""}`}
                        >
                          <div className="text-base font-black">{day.getDate()}</div>
                          {hasTickets && <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-blue-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="text-slate-300" />
                      <h3 className="text-xl font-black text-white">
                        Interventi del{" "}
                        {new Date(`${mobileSelectedDate}T12:00:00`).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {mobileSelectedTickets.length === 0 ? (
                        <p className="text-slate-400">Nessun intervento pianificato.</p>
                      ) : (
                        mobileSelectedTickets.map((t) => (
                          <div key={t.id} className="rounded-2xl bg-slate-950/40 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-white">
                                  {t.slot || "Orario n/d"} · {t.site}
                                </p>
                                <p className="text-sm text-slate-400">{t.technician || "Tecnico n/d"}</p>
                              </div>
                              <button
                                onClick={() => startCalendarEdit(t)}
                                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                              >
                                Modifica
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {mobileCalendarFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white">
                          {editingCalendarTicketId ? "Modifica intervento" : "Nuovo intervento"}
                        </h3>
                        <button
                          onClick={() => setMobileCalendarFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        {renderDateInput(selectedCalendarDay || "", (value) => setSelectedCalendarDay(value))}

                        <select
                          className={input}
                          value={calendarTechnician}
                          onChange={(e) => setCalendarTechnician(e.target.value)}
                        >
                          <option value="">Seleziona tecnico</option>
                          {technicians.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>

                        <div className="relative">
                          <input
                            className={`w-full ${input}`}
                            placeholder="Cerca cliente/sede..."
                            value={calendarSiteSearch}
                            onChange={(e) => {
                              setCalendarSiteSearch(e.target.value);
                              setCalendarSite(null);
                            }}
                          />

                          {calendarSiteSearch && !calendarSite && (
                            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                              {calendarSiteResults.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="block w-full border-b border-white/10 p-4 text-left"
                                  onClick={() => {
                                    setCalendarSite(s);
                                    setCalendarSiteSearch(s.name);
                                  }}
                                >
                                  <div className="font-black text-white">{s.name}</div>
                                  <div className="text-xs text-slate-400">
                                    {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <select
                          className={input}
                          value={calendarTime}
                          onChange={(e) => setCalendarTime(e.target.value)}
                        >
                          <option value="">Seleziona orario/slot</option>
                          <option value="Mattina">Mattina</option>
                          <option value="Pomeriggio">Pomeriggio</option>
                        </select>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setTicketType("ordinaria")}
                            className={`rounded-2xl border p-4 text-left font-black ${ticketType === "ordinaria" ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
                          >
                            Ordinaria
                            <span className="mt-1 block text-xs font-bold opacity-70">Non scala budget</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketType("straordinaria")}
                            className={`rounded-2xl border p-4 text-left font-black ${ticketType === "straordinaria" ? "border-amber-500 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
                          >
                            Straordinaria
                            <span className="mt-1 block text-xs font-bold opacity-70">Scala budget</span>
                          </button>
                        </div>

                        <button
                          onClick={saveMobileCalendarTicket}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          {editingCalendarTicketId ? "Salva modifica" : "Aggiungi intervento"}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => startCalendarCreate(mobileSelectedDate)}
                    className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Nuovo intervento
                  </button>
                </div>
              )}

              {mobileView === "registro" && (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-3xl font-black leading-tight text-white">Registro chiamate</h2>
                    <button
                      onClick={exportCsv}
                      className="shrink-0 flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-black text-white"
                    >
                      <Download size={18} /> Esporta
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        className="grid grid-cols-[40px_1fr] gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4"
                      >
                        <div className="text-xl font-black text-blue-500">{t.id}</div>

                        <div>
                          <p className="text-sm font-black uppercase text-white">{t.site}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {t.region || "Regione n/d"} · {t.problem}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-white">
                                {euro(materialCost(t.materialIds || []))}
                              </p>
                              <p className="text-sm text-slate-300">{t.technician || "Non assegnato"}</p>
                              {(t.date || t.slot) && (
                                <p className="text-xs text-slate-500">
                                  {t.date || "Data n/d"} · {t.slot || "Slot n/d"}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="mb-2 text-sm text-slate-300">
                                <span className="mr-1 text-emerald-400">●</span>
                                {t.status}
                              </p>

                              {t.status !== "Chiuso" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => promptPlanTicket(String(t.id))}
                                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                                  >
                                    Pianifica
                                  </button>
                                  <button
                                    onClick={() => promptCloseTicket(String(t.id))}
                                    className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-bold text-white"
                                  >
                                    Chiudi
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setMobileView("operativo")}
                    className="sticky bottom-4 rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Nuova chiamata/intervento
                  </button>
                </div>
              )}



              {mobileView === "budget" && (
                <div className="grid gap-4">
                  <h2 className="text-3xl font-black text-white">Budget per contratto</h2>

                  <div className="grid gap-3">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-300">Budget totale contratti</p>
                          <p className="mt-3 text-3xl font-black text-white">
                            {budgetVisible ? euro(totalBudget) : "••••••"}
                          </p>
                        </div>
                        <button
                          onClick={() => openBudgetForm()}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-lg font-black text-white"
                          aria-label="Modifica budget"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-amber-500">
                      <p className="text-base font-black text-slate-300">Consumo straordinari</p>
                      <p className="mt-3 text-3xl font-black text-white">{euro(totalForecast)}</p>
                      <p className="mt-2 text-xs font-bold text-slate-400">Solo le chiamate straordinarie scalano il budget.</p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-emerald-500">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-300">Residuo totale</p>
                          <p className="mt-3 text-3xl font-black text-white">
                            {budgetVisible ? euro(remainingBudget) : "••••••"}
                          </p>
                        </div>
                        <button
                          onClick={() => setBudgetVisible(!budgetVisible)}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-lg font-black text-white"
                          aria-label="Mostra o nascondi budget"
                        >
                          {budgetVisible ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {budgets.map((item) => {
                      const spent = getBudgetSpent(item.contractName);
                      const total = Number(item.value || 0);
                      const percent = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
                      return (
                        <div key={item.id || item.contractName} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-white">{item.contractName}</p>
                              <p className="text-sm text-slate-400">{item.entity || "Entità non definita"}</p>
                            </div>
                            <button onClick={() => openBudgetForm(item.contractName)} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white">✏️</button>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div><p className="text-slate-400">Budget</p><p className="font-black text-white">{budgetVisible ? euro(total) : "••••••"}</p></div>
                            <div><p className="text-slate-400">Scalato</p><p className="font-black text-amber-300">{euro(spent)}</p></div>
                            <div><p className="text-slate-400">Residuo</p><p className="font-black text-emerald-300">{budgetVisible ? euro(total - spent) : "••••••"}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <h3 className="mb-4 text-xl font-black text-white">Straordinari per contratto</h3>
                    {budgets.length === 0 ? (
                      <p className="text-sm text-slate-400">Nessun budget configurato.</p>
                    ) : (
                      budgets.map((item) => (
                        <button
                          key={`detail-${item.contractName}`}
                          onClick={() => setMobileView("registro")}
                          className="flex w-full items-center justify-between border-t border-white/10 py-4 text-left text-slate-300"
                        >
                          <span className="font-bold">{item.entity || item.contractName}</span>
                          <span className="flex items-center gap-2">
                            <b className="text-white">{euro(getBudgetSpent(item.contractName))}</b>
                            <ChevronRight size={18} />
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {mobileBudgetFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-white">Budget contratto / entità</h3>
                        <button
                          onClick={() => setMobileBudgetFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <select
                          className={input}
                          value={budgetForm.contractName}
                          onChange={(e) => {
                            const existing = budgets.find((item) => item.contractName === e.target.value);
                            setBudgetForm({
                              ...budgetForm,
                              contractName: e.target.value,
                              value: String(existing?.value || budgetForm.value || INITIAL_BUDGET),
                              notes: existing?.notes || "",
                            });
                          }}
                        >
                          {editableContracts.map((contract) => (
                            <option key={contract.name} value={contract.name}>{contract.name}</option>
                          ))}
                        </select>

                        <input
                          className={input}
                          type="number"
                          placeholder="Budget contratto"
                          value={budgetForm.value}
                          onChange={(e) => setBudgetForm({ ...budgetForm, value: e.target.value })}
                        />

                        <textarea
                          className={input}
                          placeholder="Note budget / riferimento contratto"
                          value={budgetForm.notes}
                          onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                        />

                        <button
                          onClick={saveMobileBudget}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva budget
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => openBudgetForm()}
                    className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Aggiorna budget contratto
                  </button>
                </div>
              )}

              {mobileView === "mappa" && (
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <h2 className="text-3xl font-black text-white">Mappa operativa</h2>
                  <select className={input} value={filterTechnician} onChange={(e) => setFilterTechnician(e.target.value)}><option value="">Tutti i tecnici</option>{technicians.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                  <select className={input} value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}><option value="">Tutte le regioni</option>{availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                  <select className={input} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="">Tutti gli stati</option><option value="Aperto">Aperto</option><option value="Pianificato">Pianificato</option><option value="Chiuso">Chiuso</option></select>
                  <div className="h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                    <AtlasMap sites={sites} tickets={filteredTickets} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-300"><span><b className="text-blue-400">●</b> Tecnico</span><span><b className="text-emerald-400">●</b> Sede operativa</span><span><b className="text-yellow-400">●</b> Cliente</span><span><b className="text-red-400">●</b> Intervento</span></div>
                </div>
              )}

              {mobileView === "clienti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">Clienti / Enti</h2>
                      <p className="text-base text-slate-400">{sites.length} sedi totali</p>
                    </div>
                    <button
                      onClick={promptAddClient}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo cliente
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca cliente, città, sede..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />

                  <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 text-center text-sm font-black">
                    <button className="border-b-2 border-blue-500 py-3 text-blue-400">Categorie</button>
                    <button className="py-3 text-slate-400">Elenco clienti</button>
                  </div>

                  <div className="grid gap-3">
                    {Object.entries(clientCategories).map(([category, categorySites]) => {
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
                        <div key={category} className="rounded-3xl border border-white/10 bg-white/[0.06]">
                          <button
                            onClick={() => setOpenCategory(openCategory === category ? null : category)}
                            className="flex w-full items-center justify-between p-4 text-left"
                          >
                            <span className="flex items-center gap-4">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/30 text-lg font-black text-white">
                                {category.slice(0, 2).toUpperCase()}
                              </span>
                              <span>
                                <span className="block text-lg font-black text-white">{category}</span>
                                <span className="text-sm text-slate-400">{filtered.length} sedi</span>
                              </span>
                            </span>
                            <ChevronRight className={`text-slate-400 transition ${openCategory === category ? "rotate-90" : ""}`} />
                          </button>

                          {openCategory === category && (
                            <div className="grid gap-2 border-t border-white/10 p-4">
                              {filtered.slice(0, 30).map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setSite(s.name);
                                    setSiteSearch(s.name);
                                    setRegion(s.region || "");
                                    setEntity(s.entity || "");
                                    setCity(s.city || "");
                                    setSiteId(s.id || null);
                                    setMobileView("operativo");
                                  }}
                                  className="rounded-2xl bg-slate-950/40 p-3 text-left"
                                >
                                  <p className="font-black text-white">{s.name}</p>
                                  <p className="text-sm text-slate-400">
                                    {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                                  </p>
                                  <p className="text-xs text-slate-500">{s.region || "Regione n/d"}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-white">{sites.length}</p>
                      <p className="text-xs text-slate-400">Sedi totali</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{Object.keys(clientCategories).length}</p>
                      <p className="text-xs text-slate-400">Categorie</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{sites.length}</p>
                      <p className="text-xs text-slate-400">Clienti</p>
                    </div>
                  </div>
                </div>
              )}

              {mobileView === "contratti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">Contratti / Accordi commerciali</h2>
                      <p className="text-base text-slate-400">{editableContracts.length} contratti totali</p>
                    </div>
                    <button
                      onClick={() => showMessage("Aggiunta nuovo contratto non ancora collegata a database", "error")}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 text-center text-xs font-black">
                    <button className="border-b-2 border-blue-500 py-3 text-blue-400">Tutti</button>
                    <button className="py-3 text-slate-400">Attivi</button>
                    <button className="py-3 text-slate-400">In scadenza</button>
                    <button className="py-3 text-slate-400">Scaduti</button>
                  </div>

                  {editableContracts.map((contract) => {
                    const st = getContractStatus(contract);
                    return (
                      <div key={contract.name} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-white">{contract.name}</p>
                            <p className="text-sm text-slate-400">{contract.clientType}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black text-white ${st.color}`}>
                            {st.label}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-300">
                          <b>Periodo:</b> {contract.period}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                          <div>
                            <p>Garanzia</p>
                            <b className="text-white">{contract.warranty}</b>
                          </div>
                          <div>
                            <p>Spedizione</p>
                            <b className="text-white">{contract.shipping}</b>
                          </div>
                          <div>
                            <p>SLA</p>
                            <b className="text-white">{contract.sla}</b>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => editMobileContract(contract)}
                            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                          >
                            Modifica
                          </button>

                          {contract.pdf && (
                            <a
                              href={contract.pdf}
                              target="_blank"
                              className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {mobileView === "sistemi" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">Sistemi / Componenti</h2>
                      <p className="text-base text-slate-400">Catalogo tecnico consultabile dai tecnici</p>
                    </div>
                    <button
                      onClick={() => showMessage("Catalogo sistemi collegato da systemsCatalog", "error")}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca sistema, componente, produttore..."
                    value={systemSearch}
                    onChange={(e) => setSystemSearch(e.target.value)}
                  />

                  <div className="grid grid-cols-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center text-xs text-slate-400">
                    <div>
                      <p className="text-xl font-black text-white">{systemsCatalog.length}</p>
                      <p>Sistemi</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">
                        {systemsCatalog.reduce((sum, s: any) => sum + (s.components?.length || 0), 0)}
                      </p>
                      <p>Componenti</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xl font-black text-white">
                        {euro(systemsCatalog.reduce((sum, s: any) => sum + Number(s.totalCost || 0), 0))}
                      </p>
                      <p>Valore totale</p>
                    </div>
                  </div>

                  {systemsCatalog
                    .filter((system: any) => {
                      const q = systemSearch.toLowerCase();
                      return `${system.name} ${system.productName} ${system.components?.map((c: any) => c.name).join(" ")}`.toLowerCase().includes(q);
                    })
                    .map((system: any) => (
                      <div key={system.name} className="rounded-3xl border border-white/10 bg-white/[0.06]">
                        <button
                          onClick={() => openSystemMobile(system.name)}
                          className="flex w-full items-center justify-between p-4 text-left"
                        >
                          <span className="flex items-center gap-4">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/30 text-sm font-black text-white">
                              {system.name.slice(0, 5)}
                            </span>
                            <span>
                              <span className="block text-xl font-black text-white">{system.name}</span>
                              <span className="text-sm text-slate-400">{system.productName || "Sistema"}</span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {system.components.length} componenti
                              </span>
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-black text-white">{euro(system.totalCost)}</span>
                            <ChevronRight className={`ml-auto mt-2 text-slate-400 transition ${selectedSystem === system.name ? "rotate-90" : ""}`} />
                          </span>
                        </button>

                        {selectedSystem === system.name && (
                          <div className="grid gap-2 border-t border-white/10 p-4">
                            {(system.components || []).slice(0, 20).map((component: any, index: number) => (
                              <div key={`${component.name}-${index}`} className="rounded-2xl bg-slate-950/40 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-black text-white">{component.name || "Componente"}</p>
                                    <p className="text-xs text-slate-400">{component.category || component.type || "Categoria n/d"}</p>
                                  </div>
                                  <p className="shrink-0 text-sm font-black text-white">
                                    {euro(Number(component.cost || component.price || 0))}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {mobileView === "contatti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">Contatti</h2>
                      <p className="text-base text-slate-400">Rubrica tecnica, personale e fornitori.</p>
                    </div>
                    <button
                      onClick={startContactCreate}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca contatto, telefono, email, azienda..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />

                  <div className="flex max-w-full gap-5 overflow-x-auto border-b border-white/10 text-sm font-black">
                    {[
                      { key: "Tutti", label: "Tutti" },
                      { key: "Personale", label: "Personale" },
                      { key: "Fornitore", label: "Fornitori" },
                      { key: "Istituzione", label: "Istituzioni" },
                      { key: "Preferiti", label: "Preferiti" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setMobileContactFilter(tab.key as any);
                          setMobileContactFormOpen(false);
                          setEditingContactId(null);
                        }}
                        className={`shrink-0 px-2 py-3 ${
                          mobileContactFilter === tab.key
                            ? "border-b-2 border-blue-500 text-blue-400"
                            : "text-slate-400"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {mobileContactFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white">
                          {editingContactId ? "Modifica contatto" : "Nuovo contatto"}
                        </h3>
                        <button
                          onClick={() => setMobileContactFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input
                          className={input}
                          placeholder="Nome"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        />

                        <input
                          className={input}
                          placeholder="Telefono"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        />

                        <input
                          className={input}
                          placeholder="Indirizzo"
                          value={contactForm.address}
                          onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                        />

                        <textarea
                          className={input}
                          placeholder="Note"
                          value={contactForm.notes}
                          onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                        />

                        <div className="relative">
                          <input
                            className={`w-full ${input}`}
                            placeholder="Collega cliente/sede"
                            value={contactClientSearch}
                            onChange={(e) => {
                              setContactClientSearch(e.target.value);
                              setContactClient(null);
                            }}
                          />

                          {contactClientSearch && !contactClient && (
                            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                              {contactClientResults.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="block w-full border-b border-white/10 p-4 text-left"
                                  onClick={() => {
                                    setContactClient(s);
                                    setContactClientSearch(s.name);
                                  }}
                                >
                                  <div className="font-black text-white">{s.name}</div>
                                  <div className="text-xs text-slate-400">
                                    {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <select
                          className={input}
                          value={contactForm.tag}
                          onChange={(e) => setContactForm({ ...contactForm, tag: e.target.value })}
                        >
                          <option value="Personale">Personale</option>
                          <option value="Fornitore">Fornitore</option>
                          <option value="Istituzione">Istituzione</option>
                        </select>

                        <button
                          onClick={saveMobileContact}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva contatto
                        </button>

                        {editingContactId && (
                          <button
                            onClick={() => {
                              deleteContact(editingContactId);
                              setMobileContactFormOpen(false);
                            }}
                            className="rounded-3xl bg-red-600 p-4 text-lg font-black text-white"
                          >
                            Elimina contatto
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!mobileContactFormOpen && (
                    <>
                      <p className="text-sm text-slate-400">{filteredContacts.length} contatti trovati</p>

                      {filteredContacts.map((contact: any) => (
                        <button
                          key={contact.id}
                          onClick={() => startContactEdit(contact)}
                          className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/40 text-lg font-black text-white">
                              {String(contact.name || "?").split(" ").map((x: string) => x[0]).slice(0, 2).join("")}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-lg font-black text-white">{contact.name}</span>
                              <span className="block truncate text-sm text-slate-400">
                                {contact.notes || contact.clientName || "Contatto"}
                              </span>
                              <span className="mt-2 block text-xs text-slate-400">☎ {contact.phone || "Telefono n/d"}</span>
                              <span className="mt-2 inline-block rounded-full bg-blue-600/20 px-2 py-1 text-[11px] font-black text-blue-300">
                                {contact.tag || "Personale"}
                              </span>
                            </span>
                          </div>
                          <ChevronRight className="shrink-0 text-slate-400" />
                        </button>
                      ))}

                      {filteredContacts.length === 0 && (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-slate-400">
                          La lista è vuota.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {mobileView === "magazzino" && (
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <h2 className="text-3xl font-black text-white">Magazzino</h2>
                    <p className="text-base text-slate-400">Articoli, valori, quantità e stato scorte.</p>
                  </div>

                  <button
                    onClick={startInventoryCreate}
                    className="w-full rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Nuovo articolo
                  </button>

                  {mobileInventoryFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-white">
                          {editingInventoryIndex === null ? "Nuovo articolo" : "Modifica articolo"}
                        </h3>
                        <button
                          onClick={() => setMobileInventoryFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input
                          className={input}
                          placeholder="Nome articolo"
                          value={inventoryForm.name}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                        />

                        <input
                          className={input}
                          placeholder="ID articolo"
                          value={inventoryForm.id}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, id: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className={input}
                            type="number"
                            placeholder="Valore"
                            value={inventoryForm.value}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, value: e.target.value })}
                          />

                          <input
                            className={input}
                            type="number"
                            placeholder="Quantità"
                            value={inventoryForm.quantity}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                          />
                        </div>

                        <button
                          onClick={saveInventoryItemMobile}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva articolo
                        </button>

                        {editingInventoryIndex !== null && (
                          <button
                            onClick={deleteInventoryItemMobile}
                            className="rounded-3xl bg-red-600 p-4 text-lg font-black text-white"
                          >
                            Elimina articolo
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    className={`w-full ${input}`}
                    placeholder="Cerca articolo o ID..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />

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
                          <button
                            key={`${item.id}-${index}`}
                            onClick={() => startInventoryEdit(index)}
                            className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-lg font-black uppercase leading-tight text-white">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">ID: {item.id}</p>
                              </div>

                              <ChevronRight
                                className="mt-1 shrink-0 text-slate-500"
                                size={20}
                              />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-slate-400">Quantità</p>
                                <p className="text-xl font-black text-white">{item.quantity}</p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">Valore</p>
                                <p className="text-xl font-black text-white">{euro(Number(item.value || 0))}</p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">Stato</p>
                                <span
                                  className={
                                    status.className +
                                    " mt-1 inline-block rounded-xl px-2 py-1 text-[11px] font-black"
                                  }
                                >
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-400">
                    <span>
                      ⓘ Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")} {" "}
                      {new Date().toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>↻</span>
                  </div>
                </div>
              )}
            </section>

            <section className="hidden gap-4 md:grid md:grid-cols-4">
              <div className={card}>
                <p className="text-sm text-slate-400">Interventi aperti</p>
                <p className="mt-2 text-4xl font-black">
                  {tickets.filter((t) => t.status !== "Chiuso").length}
                </p>
              </div>
              <div className={card}>
                <p className="text-sm text-slate-400">Contratti critici</p>
                <p className="mt-2 text-4xl font-black text-amber-300">
                  {expiringContracts.length}
                </p>
              </div>
              <div className={card}>
                <p className="text-sm text-slate-400">Valore magazzino</p>
                <p className="mt-2 text-3xl font-black">{euro(inventoryValue)}</p>
              </div>
              <div className={card}>
                <p className="text-sm text-slate-400">Articoli terminati</p>
                <p className="mt-2 text-4xl font-black text-red-300">
                  {inventoryCritical.length}
                </p>
              </div>
            </section>

            {activeTab === "budget" && (
              <section className="hidden space-y-4 md:block">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className={card}>
                    <p className="text-sm text-slate-400">Budget contratti</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-2xl font-black">
                        {budgetVisible ? euro(totalBudget) : "••••••"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openBudgetForm()}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setBudgetVisible(!budgetVisible)}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold"
                        >
                          {budgetVisible ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Somma dei budget associati a contratti/entità.
                    </p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">Consumo straordinario</p>
                    <p className="mt-2 text-2xl font-black">{euro(totalForecast)}</p>
                    <p className="mt-2 text-xs text-slate-400">Solo ticket straordinari.</p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">Budget residuo</p>
                    <p className="mt-2 text-2xl font-black">{euro(remainingBudget)}</p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">Ticket straordinari</p>
                    <p className="mt-2 text-2xl font-black">
                      {tickets.filter((t) => getTicketType(t) === "straordinaria").length}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">su {tickets.length} ticket totali</p>
                  </div>
                </div>

                {mobileBudgetFormOpen && (
                  <div className={card}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">Aggiorna budget contratto</h3>
                        <p className="text-sm text-slate-400">
                          Il budget viene collegato al contratto/entità, non al singolo cliente.
                        </p>
                      </div>
                      <button
                        onClick={() => setMobileBudgetFormOpen(false)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black"
                      >
                        Chiudi
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <select
                        className={input}
                        value={budgetForm.contractName}
                        onChange={(e) => {
                          const existing = budgets.find((item) => item.contractName === e.target.value);
                          const contract = editableContracts.find((item) => item.name === e.target.value);
                          setBudgetForm({
                            contractName: e.target.value,
                            value: String(existing?.value || ""),
                            notes: existing?.notes || "",
                          });
                          setBudgetClientSearch(contract?.clientType || "");
                        }}
                      >
                        {editableContracts.map((contract) => (
                          <option key={contract.name} value={contract.name}>
                            {contract.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className={input}
                        type="number"
                        value={budgetForm.value}
                        onChange={(e) => setBudgetForm({ ...budgetForm, value: e.target.value })}
                        placeholder="Importo budget"
                      />
                      <input
                        className={input}
                        value={budgetForm.notes}
                        onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                        placeholder="Note budget"
                      />
                    </div>
                    <button
                      onClick={saveMobileBudget}
                      className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                    >
                      Salva budget contratto
                    </button>
                  </div>
                )}

                <div className={card}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">Budget per contratto/entità</h3>
                      <p className="text-sm text-slate-400">
                        Il consumo viene scalato solo dalle chiamate straordinarie collegate automaticamente al contratto.
                      </p>
                    </div>
                    <button
                      onClick={() => openBudgetForm()}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo / modifica budget
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {budgets.map((item) => {
                      const spent = getBudgetSpent(item.contractName);
                      const total = Number(item.value || 0);
                      const remaining = total - spent;
                      const percent = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;

                      return (
                        <div key={item.id || item.contractName} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black">{item.contractName}</p>
                              <p className="text-sm text-slate-400">{item.entity || "Entità da verificare"}</p>
                            </div>
                            <span className="rounded-xl bg-blue-600/20 px-3 py-1 text-sm font-black text-blue-300">
                              {percent}%
                            </span>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                            <div>
                              <p className="text-slate-400">Totale</p>
                              <p className="font-black">{budgetVisible ? euro(total) : "••••••"}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Scalato</p>
                              <p className="font-black text-amber-300">{euro(spent)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Residuo</p>
                              <p className="font-black text-emerald-300">{euro(remaining)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "operativo" && (
  <section className={`${card} hidden md:block`}>
                <h2 className="mb-5 text-2xl font-black">Apri nuova chiamata</h2>

                {site && (
                  <div className="mb-5 rounded-3xl border border-blue-400/30 bg-blue-500/10 p-5">
                    {selectedContract ? (
                      <>
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-xl font-black text-blue-200">
                            {selectedContract.name}
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white ${
                              getContractStatus(selectedContract).color
                            }`}
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
                        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-slate-200">
                          {selectedContract.notes}
                        </p>
                        <div className="mt-3 grid gap-3 rounded-2xl bg-slate-950/40 p-3 text-sm md:grid-cols-3">
                          <div>
                            <p className="text-slate-400">Budget contratto</p>
                            <p className="font-black">{euro(getBudgetTotal(selectedContract.name))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Straordinario scalato</p>
                            <p className="font-black text-amber-300">{euro(getBudgetSpent(selectedContract.name))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Residuo contratto</p>
                            <p className="font-black text-emerald-300">{euro(getBudgetRemaining(selectedContract.name))}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-300">
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
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                        {filteredSites.length === 0 && (
                          <div className="p-3 text-sm text-slate-400">
                            Nessuna sede trovata
                          </div>
                        )}

                        {filteredSites.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="block w-full border-b border-white/10 p-3 text-left hover:bg-white/10"
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
                            <div className="text-xs text-slate-400">
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

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketType("ordinaria")}
                      className={`rounded-xl border p-3 text-left font-black ${ticketType === "ordinaria" ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-slate-950/50 text-slate-300"}`}
                    >
                      Ordinaria
                      <span className="mt-1 block text-xs font-bold opacity-70">Non scala budget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketType("straordinaria")}
                      className={`rounded-xl border p-3 text-left font-black ${ticketType === "straordinaria" ? "border-amber-500 bg-amber-500/20 text-amber-200" : "border-white/10 bg-slate-950/50 text-slate-300"}`}
                    >
                      Straordinaria
                      <span className="mt-1 block text-xs font-bold opacity-70">Scala budget</span>
                    </button>
                  </div>

                  {renderDateInput(selectedDate, setSelectedDate)}

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
                          : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <p className="font-bold">{m.name}</p>
                      <p className="text-sm opacity-70">{euro(m.cost)}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-3xl bg-white/[0.06] p-5">
                  <div>
                    <p className="text-sm text-slate-400">Costo nuova chiamata</p>
                    <p className="text-2xl font-black">
                      {euro(materialCost(selectedMaterials))}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {ticketType === "straordinaria" ? "Scala il budget del contratto rilevato." : "Ordinaria: non scala il budget."}
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

                <div className="h-[500px] overflow-hidden rounded-3xl border border-white/10">
                  <AtlasMap sites={sites} tickets={filteredTickets} />
                </div>
              </section>
            )}

            {activeTab === "magazzino" && (
  <section className={`${card} hidden md:block`}>
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className={`text-2xl font-black ${strongText}`}>Magazzino</h2>
        <p className={`text-sm ${mutedText}`}>
          Articoli, valore, quantità e stato automatico.
        </p>
      </div>

      <button
        onClick={addInventoryItem}
        className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
      >
        + Nuovo articolo
      </button>
    </div>

    <input
      className={`mb-5 w-full ${input}`}
      placeholder="Cerca articolo o ID..."
      value={inventorySearch}
      onChange={(e) => setInventorySearch(e.target.value)}
    />

    <div
      className={`mb-3 hidden rounded-2xl border px-4 py-3 text-sm font-black md:grid md:grid-cols-5 ${
        theme === "dark"
          ? "border-white/10 bg-slate-950/40 text-slate-300"
          : "border-slate-400 bg-slate-200 text-slate-800"
      }`}
    >
      <div>ID articolo</div>
      <div>Nome articolo</div>
      <div>Valore</div>
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
              className={`grid gap-3 rounded-2xl border p-4 transition-all md:grid-cols-5 md:items-center ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                  : "border-slate-400 bg-white shadow-sm hover:bg-blue-50"
              }`}
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
                value={item.value}
                onChange={(e) =>
                  updateInventoryItem(index, "value", e.target.value)
                }
                placeholder="Valore"
              />

              <input
                className={lightInput}
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateInventoryItem(index, "quantity", e.target.value)
                }
                placeholder="Quantità"
              />

              <div
                className={`rounded-full px-4 py-2 text-center text-sm font-black ${
                  Number(item.quantity) <= 0
                    ? theme === "dark"
                      ? "border border-red-500/30 bg-red-500/15 text-red-300"
                      : "border border-red-500 bg-red-100 text-red-700"
                    : Number(item.quantity) < 10
                    ? theme === "dark"
                      ? "border border-amber-500/30 bg-amber-500/15 text-amber-300"
                      : "border border-amber-500 bg-amber-100 text-amber-800"
                    : theme === "dark"
                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border border-emerald-500 bg-emerald-100 text-emerald-800"
                }`}
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
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black">{contract.name}</p>
                            <p className="text-sm text-slate-400">
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
                              {renderDateInput(
                                contract.startDate !== "Da verificare" ? contract.startDate : "",
                                (value) => updateContractField(contract.name, "startDate", value),
                                `mt-1 w-full ${lightInput}`
                              )}
                            </label>

                            <label>
                              <b>Scadenza contratto</b>
                              {renderDateInput(
                                contract.endDate !== "Da verificare" ? contract.endDate : "",
                                (value) => updateContractField(contract.name, "endDate", value),
                                `mt-1 w-full ${lightInput}`
                              )}
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

                        <div className="mt-4 rounded-2xl bg-slate-950/50 p-3 text-sm">
                          {contract.notes}
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-950/40 p-4">
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
                                  e.target.value
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
                              <div className="rounded-xl bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-300">
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
                    <p className="text-sm text-slate-400">{sites.length} sedi totali</p>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca cliente, città, sede..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  {Object.entries(clientCategories).map(([category, categorySites]) => {
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
                        className={`rounded-3xl border ${
  theme === "dark"
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-400 bg-white"
}`}
                      >
                        <button
                          onClick={() =>
                            setOpenCategory(openCategory === category ? null : category)
                          }
                          className="flex w-full items-center justify-between p-5 text-left"
                        >
                          <div>
                            <p className="text-lg font-black">{category}</p>
                            <p className="text-sm text-slate-400">
                              {filtered.length} sedi
                            </p>
                          </div>
                          <div className="text-2xl">
                            {openCategory === category ? "−" : "+"}
                          </div>
                        </button>

                        {openCategory === category && (
                          <div
  className={`grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3 ${
    theme === "dark"
      ? "border-white/10"
      : "border-slate-300"
  }`}
>
                            {filtered.map((s) => (
                              <div
                                key={s.id}
                                className={`rounded-2xl p-4 ${
  theme === "dark"
    ? "bg-slate-950/40"
    : "bg-slate-100 border border-slate-300"
}`}
                              >
                                <p className="font-bold">{s.name}</p>
                                <p className="mt-1 text-sm text-slate-400">
                                  {s.entity || "Ente n/d"}
                                </p>
                                <p className="mt-2 text-sm">
                                  {s.city || "Città n/d"} ·{" "}
                                  {s.region || "Regione n/d"}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {s.address || "Indirizzo n/d"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "sistemi" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Sistemi / Componenti</h2>
                    <p className="text-sm text-slate-400">
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
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left hover:bg-white/10"
                      >
                        <h3 className="text-xl font-black">{system.name}</h3>
                        <p className="mt-2 text-sm text-slate-400">
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
                      (s) => s.name === selectedSystem
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
                      }
                    );

                    return (
                      <div>
                        <div className="mb-5 rounded-3xl bg-slate-950/40 p-5">
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
                              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="font-bold">{component.name}</p>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                                  {component.category || "Altro"}
                                </span>
                              </div>

                              <div className="space-y-1 text-sm text-slate-300">
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
                                  className="mt-3 inline-block text-sm font-bold text-blue-300"
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
{activeTab === "calendario" && (
  <section className={`${card} hidden md:block`}>
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className={`text-2xl font-black ${strongText}`}>Calendario interventi</h2>
        <p className={`text-sm ${mutedText}`}>
          Vista mensile con interventi pianificati e inserimento rapido.
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

    <div className="grid gap-3 md:grid-cols-7">
      {calendarDays.map((day) => {
        const iso = formatLocalDate(day);

        const dayTickets = tickets.filter((t) => t.date === iso);

        return (
          <button
            key={iso}
            onClick={() => setSelectedCalendarDay(iso)}
            className={`min-h-36 rounded-2xl border p-3 text-left transition hover:scale-[1.02] ${
              selectedCalendarDay === iso
                ? "border-blue-500 bg-blue-600 text-white"
                : theme === "dark"
                ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                : "border-slate-400 bg-white hover:bg-blue-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-black">{day.getDate()}</span>
              <span className="text-xs font-bold">
                {day.toLocaleDateString("it-IT", { weekday: "short" })}
              </span>
            </div>

            <div className="space-y-2">
              {dayTickets.length === 0 && (
                <p className="text-xs opacity-60">Nessun intervento</p>
              )}

              {dayTickets.slice(0, 3).map((t) => {
  const isExpanded = expandedCalendarTicketId === String(t.id);

  return (
    <div
      key={t.id}
      onClick={(e) => {
        e.stopPropagation();

        const nextExpanded =
          expandedCalendarTicketId === String(t.id) ? null : String(t.id);

        setExpandedCalendarTicketId(nextExpanded);
        setEditingCalendarTicketId(String(t.id));
        setSelectedCalendarDay(iso);

        setCalendarTechnician(t.technician || "");
        setCalendarSiteSearch(t.site || "");
        setCalendarSite({
          id: t.siteId || null,
          name: t.site,
          region: t.region,
          entity: t.entity,
          city: t.city,
        });
        setCalendarTime(t.slot || "");
      }}
      className={`cursor-pointer overflow-hidden rounded-xl p-2 text-xs transition-all duration-300 ${
        isExpanded
          ? theme === "dark"
            ? "bg-blue-600/30 ring-2 ring-blue-400"
            : "bg-blue-100 ring-2 ring-blue-500"
          : selectedCalendarDay === iso
          ? "bg-white/20"
          : theme === "dark"
          ? "bg-slate-950/50 hover:bg-slate-900"
          : "border border-slate-300 bg-slate-100 hover:bg-blue-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black">{t.slot || "Orario n/d"}</p>
          <p>{t.site}</p>
          <p className="opacity-70">{t.technician || "Tecnico n/d"}</p>
        </div>

        <span className="text-[10px] font-black opacity-70">
          {isExpanded ? "CHIUDI" : "MODIFICA"}
        </span>
      </div>

      {isExpanded && (
        <div
          className={`mt-3 grid gap-2 rounded-xl p-3 transition-all duration-300 ${
            theme === "dark"
              ? "bg-slate-950/60"
              : "border border-slate-300 bg-white"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <select
            className={lightInput}
            value={calendarTechnician}
            onChange={(e) => setCalendarTechnician(e.target.value)}
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
                className={`absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border shadow-xl ${
                  theme === "dark"
                    ? "border-white/10 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {calendarSiteResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`block w-full border-b p-3 text-left text-xs ${
                      theme === "dark"
                        ? "border-white/10 hover:bg-white/10"
                        : "border-slate-200 hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setCalendarSite(s);
                      setCalendarSiteSearch(s.name);
                    }}
                  >
                    <div className="font-black">{s.name}</div>
                    <div className="opacity-70">
                      {s.city || "Città n/d"} · {s.region || "Regione n/d"}
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
            onChange={(e) => setCalendarTime(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={updateCalendarTicket}
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500"
            >
              Salva
            </button>

            <button
              onClick={() => {
                setExpandedCalendarTicketId(null);
                setEditingCalendarTicketId(null);
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${
                theme === "dark"
                  ? "bg-white/10 text-white"
                  : "bg-slate-200 text-slate-900"
              }`}
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
            </div>
          </button>
        );
      })}
    </div>
  </section>
)}
{activeTab === "contatti" && (
  <section className={card}>
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className={`text-2xl font-black ${strongText}`}>Contatti</h2>
        <p className={`text-sm ${mutedText}`}>
          Rubrica tecnica associata ai clienti, modificabile dai tecnici.
        </p>
      </div>

      <input
        className={`md:w-96 ${input}`}
        placeholder="Cerca nome, telefono, cliente, note..."
        value={contactSearch}
        onChange={(e) => setContactSearch(e.target.value)}
      />
    </div>

    <div
      className={`mb-6 rounded-3xl border p-5 ${
        theme === "dark"
          ? "border-white/10 bg-slate-950/40"
          : "border-slate-400 bg-slate-50"
      }`}
    >
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
            setContactForm({ ...contactForm, phone: e.target.value })
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
              className={`absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-xl ${
                theme === "dark"
                  ? "border-white/10 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
            >
              {contactClientResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`block w-full border-b p-3 text-left text-sm ${
                    theme === "dark"
                      ? "border-white/10 hover:bg-white/10"
                      : "border-slate-200 hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    setContactClient(s);
                    setContactClientSearch(s.name);
                  }}
                >
                  <div className="font-black">{s.name}</div>
                  <div className="text-xs opacity-70">
                    {s.city || "Città n/d"} · {s.region || "Regione n/d"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          className="md:col-span-2 rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500"
          placeholder="Indirizzo"
          value={contactForm.address}
          onChange={(e) =>
            setContactForm({ ...contactForm, address: e.target.value })
          }
        />

        <textarea
          className={`md:col-span-2 min-h-28 ${input}`}
          placeholder="Note operative"
          value={contactForm.notes}
          onChange={(e) =>
            setContactForm({ ...contactForm, notes: e.target.value })
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={saveContact}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
        >
          {editingContactId ? "Salva modifica" : "Aggiungi contatto"}
        </button>

        {editingContactId && (
          <button
            onClick={resetContactForm}
            className={`rounded-2xl px-5 py-3 font-black ${
              theme === "dark"
                ? "bg-white/10 text-white"
                : "bg-slate-200 text-slate-900"
            }`}
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
          className={`rounded-3xl border p-5 ${
            theme === "dark"
              ? "border-white/10 bg-white/[0.04]"
              : "border-slate-400 bg-white shadow-sm"
          }`}
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
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  contact.address
                )}`}
                target="_blank"
                className={`block rounded-xl px-3 py-2 font-bold ${
                  theme === "dark"
                    ? "bg-white/10 text-blue-300"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
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
              <div
                className={`rounded-2xl p-3 ${
                  theme === "dark"
                    ? "bg-slate-950/40"
                    : "bg-slate-100 border border-slate-300"
                }`}
              >
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
          className={`rounded-3xl border p-8 text-center md:col-span-2 xl:col-span-3 ${
            theme === "dark"
              ? "border-white/10 bg-white/[0.04] text-slate-400"
              : "border-slate-300 bg-slate-50 text-slate-600"
          }`}
        >
          Nessun contatto trovato.
        </div>
      )}
    </div>
  </section>
)}
            {activeTab === "registro" && (
              <section className={`${card} hidden md:block`}>
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
                  <div className="rounded-2xl bg-white/[0.04] p-10 text-center text-slate-400">
                    Nessuna chiamata presente
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="p-3">ID</th>
                          <th>Sede</th>
                          <th>Regione</th>
                          <th>Problema</th>
                          <th>Materiali</th>
                          <th>Costo</th>
                          <th>Tecnico</th>
                          <th>Stato</th>
                          <th>Azione</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tickets.map((t) => (
                          <tr key={t.id} className="border-b border-white/10">
                            <td className="p-3 font-bold">{t.id}</td>
                            <td>{t.site}</td>
                            <td>{t.region}</td>
                            <td>{t.problem}</td>
                            <td>
                              {(t.materialIds || [])
                                .map(
                                  (id: string) =>
                                    materials.find((m) => m.id === id)?.name
                                )
                                .join(" + ") || "Nessuno"}
                            </td>
                            <td className="font-bold">
                              {euro(materialCost(t.materialIds || []))}
                            </td>
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
                                    onClick={() => setClosingTicketId(String(t.id))}
                                    className="rounded-lg bg-slate-700 px-3 py-1 text-white"
                                  >
                                    Chiudi
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {closingTicketId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1728] p-6 shadow-xl">
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
                      className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-bold"
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
  
          {mobileMoreOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden">
              <button
                className="absolute inset-0 h-full w-full"
                aria-label="Chiudi menu altro"
                onClick={() => setMobileMoreOpen(false)}
              />

              <div className="absolute bottom-20 left-4 right-4 rounded-3xl border border-white/10 bg-[#07111f] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-lg font-black text-white">Altre sezioni</p>
                  <button
                    onClick={() => setMobileMoreOpen(false)}
                    className="rounded-2xl bg-white/10 p-2 text-slate-300"
                    aria-label="Chiudi"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "registro", label: "Registro", icon: ListChecks },
                    { key: "contratti", label: "Contratti", icon: FileText },
                    { key: "sistemi", label: "Sistemi", icon: Monitor },
                    { key: "contatti", label: "Contatti", icon: Phone },
                    { key: "magazzino", label: "Magazzino", icon: Package },
                    { key: "operativo", label: "Operativo", icon: AlertTriangle },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setMobileView(key as any);
                        setMobileMoreOpen(false);
                      }}
                      className={`flex items-center gap-3 rounded-2xl border border-white/10 p-4 text-left font-black ${
                        mobileView === key
                          ? "bg-blue-600 text-white"
                          : "bg-white/[0.06] text-slate-200"
                      }`}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-white/10 bg-[#06111f]/95 px-2 py-2 backdrop-blur md:hidden">
            {[
              { key: "home", label: "Home", icon: HomeIcon },
              { key: "calendario", label: "Calendario", icon: CalendarDays },
              { key: "budget", label: "Budget", icon: BarChart3 },
              { key: "mappa", label: "Mappa", icon: Map },
              { key: "clienti", label: "Clienti", icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMobileView(key as any)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-bold ${
                  mobileView === key ? "text-blue-500" : "text-slate-400"
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}

            <button
              onClick={() => setMobileMoreOpen(true)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-bold ${
                ["registro", "contratti", "sistemi", "contatti", "magazzino", "operativo"].includes(mobileView)
                  ? "text-blue-500"
                  : "text-slate-400"
              }`}
            >
              <MoreHorizontal size={22} />
              Altro
            </button>
          </nav>
        </main>
        </div>
      </div>
    </main>
  );
}