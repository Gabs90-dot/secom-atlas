"use client";

import { supabase } from "@/lib/supabase";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useIsDesktopShell } from "@/components/atlas/layout/useAtlasShellMode";

type PlanType = "counter" | "site_list" | "mixed";
type ServiceType = "ordinaria" | "straordinaria" | "sepa" | "custom";
type TimeRule =
  | "annual"
  | "semester_50_50"
  | "semester_custom"
  | "single_deadline"
  | "multiple_deadlines"
  | "none";
type ScaleMode =
  | "ticket_created"
  | "scheduled"
  | "completed_date"
  | "ticket_closed"
  | "work_order_closed"
  | "manual";
type PlanStatus = "active" | "paused" | "archived";
type ItemStatus =
  | "todo"
  | "planned"
  | "open"
  | "completed"
  | "skipped"
  | "out_of_scope";
type ConsumptionStatus =
  | "planned"
  | "open"
  | "completed"
  | "cancelled"
  | "manual";

type CustomerLike = {
  id?: string | null;
  name?: string | null;
  customer_name?: string | null;
  label?: string | null;
};
type SiteLike = {
  id?: number | string | null;
  name?: string | null;
  site_name?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  region?: string | null;
  province?: string | null;
  city?: string | null;
  glpi_entity_path?: string | null;
};
type TicketLike = {
  id?: number | string | null;
  title?: string | null;
  glpi_ticket_id?: number | string | null;
};

type Props = {
  tenant?: { id?: string | null } | null;
  currentUser?: {
    id?: string | null;
    user_id?: string | null;
    email?: string | null;
  } | null;
  customers?: CustomerLike[];
  sites?: SiteLike[];
  tickets?: TicketLike[];
  executiveMode?: boolean;
};

type OperationalPlan = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  year: number;
  customer_id: string | null;
  entity_label: string | null;
  plan_type: PlanType;
  service_type: ServiceType;
  time_rule: TimeRule;
  scale_mode: ScaleMode;
  total_target: number | null;
  first_period_target: number | null;
  second_period_target: number | null;
  start_date: string | null;
  end_date: string | null;
  first_period_deadline: string | null;
  second_period_deadline: string | null;
  status: PlanStatus;
  notes: string | null;
  active?: boolean | null;
};

type OperationalPlanItem = {
  id: string;
  tenant_id: string;
  plan_id: string;
  customer_id: string | null;
  site_id: number | null;
  customer_name: string | null;
  site_name: string;
  entity_path: string | null;
  region: string | null;
  province: string | null;
  city: string | null;
  period_target: number | null;
  target_date: string | null;
  planned_date: string | null;
  opened_date: string | null;
  completed_date: string | null;
  ticket_id: number | null;
  glpi_ticket_id: number | null;
  work_order_id: string | null;
  target_value: number | null;
  status: ItemStatus;
  notes: string | null;
};

type OperationalPlanConsumption = {
  id: string;
  tenant_id: string;
  plan_id: string;
  plan_item_id: string | null;
  ticket_id: number | null;
  glpi_ticket_id: number | null;
  service_type: ServiceType;
  consumption_status: ConsumptionStatus;
  count_value: number | null;
  planned_date: string | null;
  opened_date: string | null;
  completed_date: string | null;
  manual_date: string | null;
  notes: string | null;
};

type PlanFormState = {
  title: string;
  year: string;
  customer_id: string;
  entity_label: string;
  plan_type: PlanType;
  service_type: ServiceType;
  time_rule: TimeRule;
  scale_mode: ScaleMode;
  total_target: string;
  first_period_target: string;
  second_period_target: string;
  start_date: string;
  end_date: string;
  first_period_deadline: string;
  second_period_deadline: string;
  description: string;
  notes: string;
};

type ApiState = {
  plans: OperationalPlan[];
  items: OperationalPlanItem[];
  consumptions: OperationalPlanConsumption[];
};

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  counter: "Contatore",
  site_list: "Elenco sedi",
  mixed: "Misto",
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ordinaria: "Ordinaria",
  straordinaria: "Straordinaria",
  sepa: "SEPA",
  custom: "Custom",
};

const TIME_RULE_LABELS: Record<TimeRule, string> = {
  annual: "Annuale",
  semester_50_50: "Semestrale 50/50",
  semester_custom: "Semestrale personalizzato",
  single_deadline: "Scadenza unica",
  multiple_deadlines: "Scadenze multiple",
  none: "Nessuna scadenza",
};

const SCALE_MODE_LABELS: Record<ScaleMode, string> = {
  ticket_created: "Alla creazione ticket",
  scheduled: "Alla pianificazione",
  completed_date: "Alla data effettuazione",
  ticket_closed: "Alla chiusura ticket",
  work_order_closed: "Alla chiusura bolla",
  manual: "Manuale",
};

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  todo: "Da fare",
  planned: "Pianificata",
  open: "Aperta",
  completed: "Effettuata",
  skipped: "Saltata",
  out_of_scope: "Fuori piano",
};

const defaultPlanForm = (): PlanFormState => ({
  title: "",
  year: String(new Date().getFullYear()),
  customer_id: "",
  entity_label: "",
  plan_type: "site_list",
  service_type: "ordinaria",
  time_rule: "semester_50_50",
  scale_mode: "work_order_closed",
  total_target: "120",
  first_period_target: "60",
  second_period_target: "60",
  start_date: `${new Date().getFullYear()}-01-01`,
  end_date: `${new Date().getFullYear()}-12-31`,
  first_period_deadline: `${new Date().getFullYear()}-06-30`,
  second_period_deadline: `${new Date().getFullYear()}-12-31`,
  description: "",
  notes: "",
});

function emptyToNull(value: string | null | undefined): string | null {
  const clean = (value || "").trim();
  return clean ? clean : null;
}

function toNumberOrNull(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIntegerOrNull(
  value: string | number | null | undefined,
): number | null {
  const parsed = toNumberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isPastDate(value: string | null | undefined): boolean {
  const clean = (value || "").trim();
  return Boolean(clean && clean < today());
}

function normalizeDateCell(value: string | null | undefined): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function splitImportRow(row: string): string[] {
  if (row.includes(";")) return row.split(";").map((cell) => cell.trim());
  if (row.includes("\t")) return row.split("\t").map((cell) => cell.trim());
  return [row.trim()];
}

function customerLabel(customer: CustomerLike): string {
  return (
    customer.name ||
    customer.customer_name ||
    customer.label ||
    customer.id ||
    "Cliente"
  );
}

const CITY_TO_REGION: Record<
  string,
  { region: string; province?: string; city: string }
> = {
  ROMA: { region: "Lazio", province: "RM", city: "Roma" },
  FRASCATI: { region: "Lazio", province: "RM", city: "Frascati" },
  OSTIA: { region: "Lazio", province: "RM", city: "Ostia" },
  APRILIA: { region: "Lazio", province: "LT", city: "Aprilia" },
  VITERBO: { region: "Lazio", province: "VT", city: "Viterbo" },
  RIETI: { region: "Lazio", province: "RI", city: "Rieti" },
  LATINA: { region: "Lazio", province: "LT", city: "Latina" },
  FROSINONE: { region: "Lazio", province: "FR", city: "Frosinone" },
  CASORIA: { region: "Campania", province: "NA", city: "Casoria" },
  NAPOLI: { region: "Campania", province: "NA", city: "Napoli" },
  AVERSA: { region: "Campania", province: "CE", city: "Aversa" },
  CASERTA: { region: "Campania", province: "CE", city: "Caserta" },
  BENEVENTO: { region: "Campania", province: "BN", city: "Benevento" },
  AVELLINO: { region: "Campania", province: "AV", city: "Avellino" },
  SALERNO: { region: "Campania", province: "SA", city: "Salerno" },
  MONDRAGONE: { region: "Campania", province: "CE", city: "Mondragone" },
  "TORRE ANNUNZIATA": {
    region: "Campania",
    province: "NA",
    city: "Torre Annunziata",
  },
  "NOCERA INF": {
    region: "Campania",
    province: "SA",
    city: "Nocera Inferiore",
  },
  "VALLO DELLA LUCANIA": {
    region: "Campania",
    province: "SA",
    city: "Vallo della Lucania",
  },
  MILANO: { region: "Lombardia", province: "MI", city: "Milano" },
  RHO: { region: "Lombardia", province: "MI", city: "Rho" },
  BERGAMO: { region: "Lombardia", province: "BG", city: "Bergamo" },
  BRESCIA: { region: "Lombardia", province: "BS", city: "Brescia" },
  COMO: { region: "Lombardia", province: "CO", city: "Como" },
  CREMONA: { region: "Lombardia", province: "CR", city: "Cremona" },
  LECCO: { region: "Lombardia", province: "LC", city: "Lecco" },
  LODI: { region: "Lombardia", province: "LO", city: "Lodi" },
  MANTOVA: { region: "Lombardia", province: "MN", city: "Mantova" },
  MONZA: { region: "Lombardia", province: "MB", city: "Monza" },
  PAVIA: { region: "Lombardia", province: "PV", city: "Pavia" },
  SONDRIO: { region: "Lombardia", province: "SO", city: "Sondrio" },
  VARESE: { region: "Lombardia", province: "VA", city: "Varese" },
  TORINO: { region: "Piemonte", province: "TO", city: "Torino" },
  ALESSANDRIA: { region: "Piemonte", province: "AL", city: "Alessandria" },
  ASTI: { region: "Piemonte", province: "AT", city: "Asti" },
  BIELLA: { region: "Piemonte", province: "BI", city: "Biella" },
  CUNEO: { region: "Piemonte", province: "CN", city: "Cuneo" },
  NOVARA: { region: "Piemonte", province: "NO", city: "Novara" },
  VERBANIA: { region: "Piemonte", province: "VB", city: "Verbania" },
  VERCELLI: { region: "Piemonte", province: "VC", city: "Vercelli" },
  GENOVA: { region: "Liguria", province: "GE", city: "Genova" },
  IMPERIA: { region: "Liguria", province: "IM", city: "Imperia" },
  "LA SPEZIA": { region: "Liguria", province: "SP", city: "La Spezia" },
  SAVONA: { region: "Liguria", province: "SV", city: "Savona" },
  BOLOGNA: { region: "Emilia-Romagna", province: "BO", city: "Bologna" },
  FERRARA: { region: "Emilia-Romagna", province: "FE", city: "Ferrara" },
  FORLI: { region: "Emilia-Romagna", province: "FC", city: "Forlì" },
  MODENA: { region: "Emilia-Romagna", province: "MO", city: "Modena" },
  PARMA: { region: "Emilia-Romagna", province: "PR", city: "Parma" },
  PIACENZA: { region: "Emilia-Romagna", province: "PC", city: "Piacenza" },
  RAVENNA: { region: "Emilia-Romagna", province: "RA", city: "Ravenna" },
  "REGGIO EMILIA": {
    region: "Emilia-Romagna",
    province: "RE",
    city: "Reggio Emilia",
  },
  RIMINI: { region: "Emilia-Romagna", province: "RN", city: "Rimini" },
  FIRENZE: { region: "Toscana", province: "FI", city: "Firenze" },
  AREZZO: { region: "Toscana", province: "AR", city: "Arezzo" },
  GROSSETO: { region: "Toscana", province: "GR", city: "Grosseto" },
  LIVORNO: { region: "Toscana", province: "LI", city: "Livorno" },
  LUCCA: { region: "Toscana", province: "LU", city: "Lucca" },
  "MASSA CARRARA": { region: "Toscana", province: "MS", city: "Massa Carrara" },
  PISA: { region: "Toscana", province: "PI", city: "Pisa" },
  PISTOIA: { region: "Toscana", province: "PT", city: "Pistoia" },
  PRATO: { region: "Toscana", province: "PO", city: "Prato" },
  SIENA: { region: "Toscana", province: "SI", city: "Siena" },
  ANCONA: { region: "Marche", province: "AN", city: "Ancona" },
  "ASCOLI PICENO": { region: "Marche", province: "AP", city: "Ascoli Piceno" },
  FERMO: { region: "Marche", province: "FM", city: "Fermo" },
  MACERATA: { region: "Marche", province: "MC", city: "Macerata" },
  "PESARO URBINO": { region: "Marche", province: "PU", city: "Pesaro Urbino" },
  PERUGIA: { region: "Umbria", province: "PG", city: "Perugia" },
  TERNI: { region: "Umbria", province: "TR", city: "Terni" },
  "L AQUILA": { region: "Abruzzo", province: "AQ", city: "L'Aquila" },
  PESCARA: { region: "Abruzzo", province: "PE", city: "Pescara" },
  TERAMO: { region: "Abruzzo", province: "TE", city: "Teramo" },
  CHIETI: { region: "Abruzzo", province: "CH", city: "Chieti" },
  CAMPOBASSO: { region: "Molise", province: "CB", city: "Campobasso" },
  ISERNIA: { region: "Molise", province: "IS", city: "Isernia" },
  BARI: { region: "Puglia", province: "BA", city: "Bari" },
  BRINDISI: { region: "Puglia", province: "BR", city: "Brindisi" },
  FOGGIA: { region: "Puglia", province: "FG", city: "Foggia" },
  LECCE: { region: "Puglia", province: "LE", city: "Lecce" },
  TARANTO: { region: "Puglia", province: "TA", city: "Taranto" },
  TRANI: { region: "Puglia", province: "BT", city: "Trani" },
  POTENZA: { region: "Basilicata", province: "PZ", city: "Potenza" },
  MATERA: { region: "Basilicata", province: "MT", city: "Matera" },
  CATANZARO: { region: "Calabria", province: "CZ", city: "Catanzaro" },
  COSENZA: { region: "Calabria", province: "CS", city: "Cosenza" },
  CROTONE: { region: "Calabria", province: "KR", city: "Crotone" },
  "REGGIO CALABRIA": {
    region: "Calabria",
    province: "RC",
    city: "Reggio Calabria",
  },
  "VIBO VALENTIA": {
    region: "Calabria",
    province: "VV",
    city: "Vibo Valentia",
  },
  LOCRI: { region: "Calabria", province: "RC", city: "Locri" },
  "GIOIA TAURO": { region: "Calabria", province: "RC", city: "Gioia Tauro" },
  "LAMEZIA TERME": {
    region: "Calabria",
    province: "CZ",
    city: "Lamezia Terme",
  },
  "CORIGLIANO ROSSANO": {
    region: "Calabria",
    province: "CS",
    city: "Corigliano Rossano",
  },
  PALERMO: { region: "Sicilia", province: "PA", city: "Palermo" },
  AGRIGENTO: { region: "Sicilia", province: "AG", city: "Agrigento" },
  CALTANISSETTA: { region: "Sicilia", province: "CL", city: "Caltanissetta" },
  CATANIA: { region: "Sicilia", province: "CT", city: "Catania" },
  ENNA: { region: "Sicilia", province: "EN", city: "Enna" },
  MESSINA: { region: "Sicilia", province: "ME", city: "Messina" },
  RAGUSA: { region: "Sicilia", province: "RG", city: "Ragusa" },
  SIRACUSA: { region: "Sicilia", province: "SR", city: "Siracusa" },
  TRAPANI: { region: "Sicilia", province: "TP", city: "Trapani" },
  MONREALE: { region: "Sicilia", province: "PA", city: "Monreale" },
  GELA: { region: "Sicilia", province: "CL", city: "Gela" },
  CAGLIARI: { region: "Sardegna", province: "CA", city: "Cagliari" },
  NUORO: { region: "Sardegna", province: "NU", city: "Nuoro" },
  ORISTANO: { region: "Sardegna", province: "OR", city: "Oristano" },
  SASSARI: { region: "Sardegna", province: "SS", city: "Sassari" },
  OLBIA: { region: "Sardegna", province: "SS", city: "Olbia" },
  VENEZIA: { region: "Veneto", province: "VE", city: "Venezia" },
  BELLUNO: { region: "Veneto", province: "BL", city: "Belluno" },
  PADOVA: { region: "Veneto", province: "PD", city: "Padova" },
  ROVIGO: { region: "Veneto", province: "RO", city: "Rovigo" },
  TREVISO: { region: "Veneto", province: "TV", city: "Treviso" },
  VERONA: { region: "Veneto", province: "VR", city: "Verona" },
  VICENZA: { region: "Veneto", province: "VI", city: "Vicenza" },
  TRIESTE: { region: "Friuli Venezia Giulia", province: "TS", city: "Trieste" },
  GORIZIA: { region: "Friuli Venezia Giulia", province: "GO", city: "Gorizia" },
  PORDENONE: {
    region: "Friuli Venezia Giulia",
    province: "PN",
    city: "Pordenone",
  },
  UDINE: { region: "Friuli Venezia Giulia", province: "UD", city: "Udine" },
  AOSTA: { region: "Valle d'Aosta", province: "AO", city: "Aosta" },
  TRENTO: { region: "Trentino-Alto Adige", province: "TN", city: "Trento" },
  BOLZANO: { region: "Trentino-Alto Adige", province: "BZ", city: "Bolzano" },
};

function normalizeName(value: string): string {
  return value
    .toUpperCase()
    .replace(/[’']/g, " ")
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPlaceFromSiteName(siteName: string): {
  region: string | null;
  province: string | null;
  city: string | null;
} {
  const normalized = normalizeName(siteName);
  const entries = Object.entries(CITY_TO_REGION).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [key, value] of entries) {
    if (normalized.includes(key))
      return {
        region: value.region,
        province: value.province || null,
        city: value.city,
      };
  }
  return { region: null, province: null, city: null };
}

function badgeClass(status: string): string {
  if (status === "completed" || status === "active")
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "planned")
    return "border-blue-400/30 bg-blue-500/15 text-blue-100";
  if (status === "open")
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  if (status === "skipped" || status === "cancelled" || status === "paused")
    return "border-red-400/30 bg-red-500/15 text-red-100";
  return "border-white/10 bg-white/10 text-slate-200";
}

function actionButtonClass(
  tone: "planned" | "open" | "completed" | "skipped",
  active: boolean,
): string {
  const base =
    "relative rounded-xl border px-2.5 py-2 text-xs font-black transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

  if (tone === "planned") {
    return `${base} ${
      active
        ? "border-cyan-200/70 bg-cyan-400/25 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.28)]"
        : "border-cyan-300/20 bg-cyan-500/12 text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-400/22 hover:shadow-[0_0_20px_rgba(34,211,238,0.18)]"
    }`;
  }

  if (tone === "open") {
    return `${base} ${
      active
        ? "border-amber-200/70 bg-amber-400/25 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.28)]"
        : "border-amber-300/20 bg-amber-500/12 text-amber-100 hover:border-amber-200/60 hover:bg-amber-400/22 hover:shadow-[0_0_20px_rgba(251,191,36,0.18)]"
    }`;
  }

  if (tone === "completed") {
    return `${base} ${
      active
        ? "border-emerald-200/70 bg-emerald-400/25 text-emerald-50 shadow-[0_0_22px_rgba(16,185,129,0.28)]"
        : "border-emerald-300/20 bg-emerald-500/12 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/22 hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]"
    }`;
  }

  return `${base} ${
    active
      ? "border-red-200/70 bg-red-500/25 text-red-50 shadow-[0_0_22px_rgba(248,113,113,0.24)]"
      : "border-red-300/20 bg-red-500/12 text-red-100 hover:border-red-200/60 hover:bg-red-500/22 hover:shadow-[0_0_20px_rgba(248,113,113,0.16)]"
  }`;
}

type PlanActionButtonProps = {
  label: string;
  status: "planned" | "open" | "completed" | "skipped";
  active: boolean;
  disabled: boolean;
  onClick: () => void;
};

function PlanActionButton({
  label,
  status,
  active,
  disabled,
  onClick,
}: PlanActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={actionButtonClass(status, active)}
    >
      {label}
    </button>
  );
}

export default function OperationalPlansCenter({
  tenant,
  customers = [],
  executiveMode = false,
}: Props) {
  const isDesktopShell = useIsDesktopShell();
  const tenantId = tenant?.id || null;
  const [plans, setPlans] = useState<OperationalPlan[]>([]);
  const [items, setItems] = useState<OperationalPlanItem[]>([]);
  const [consumptions, setConsumptions] = useState<
    OperationalPlanConsumption[]
  >([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [planForm, setPlanForm] = useState<PlanFormState>(defaultPlanForm);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortMode, setSortMode] = useState<
    "alpha" | "region" | "status" | "date"
  >("alpha");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );
  const selectedItems = useMemo(
    () => items.filter((item) => item.plan_id === selectedPlanId),
    [items, selectedPlanId],
  );
  const selectedConsumptions = useMemo(
    () =>
      consumptions.filter(
        (consumption) => consumption.plan_id === selectedPlanId,
      ),
    [consumptions, selectedPlanId],
  );

  const regions = useMemo(() => {
    const set = new Set<string>();
    selectedItems.forEach((item) => {
      if (item.region) set.add(item.region);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
  }, [selectedItems]);

  const visibleItems = useMemo(() => {
    const search = filterSearch.trim().toLowerCase();
    return selectedItems
      .filter((item) => !filterRegion || item.region === filterRegion)
      .filter((item) => !filterStatus || item.status === filterStatus)
      .filter(
        (item) =>
          !filterPeriod || String(item.period_target || "") === filterPeriod,
      )
      .filter((item) => {
        if (!search) return true;
        return [
          item.site_name,
          item.customer_name,
          item.region,
          item.city,
          item.province,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .sort((a, b) => {
        if (sortMode === "region")
          return `${a.region || ""}${a.site_name}`.localeCompare(
            `${b.region || ""}${b.site_name}`,
            "it",
          );
        if (sortMode === "status")
          return `${a.status}${a.site_name}`.localeCompare(
            `${b.status}${b.site_name}`,
            "it",
          );
        if (sortMode === "date")
          return `${a.completed_date || a.planned_date || a.target_date || "9999-12-31"}${a.site_name}`.localeCompare(
            `${b.completed_date || b.planned_date || b.target_date || "9999-12-31"}${b.site_name}`,
            "it",
          );
        return a.site_name.localeCompare(b.site_name, "it");
      });
  }, [
    selectedItems,
    filterRegion,
    filterStatus,
    filterPeriod,
    filterSearch,
    sortMode,
  ]);

  const kpis = useMemo(() => {
    const total = selectedPlan?.total_target || selectedItems.length || 0;
    const completedItems = selectedItems.filter(
      (item) => item.status === "completed",
    ).length;
    const committedItems = selectedItems.filter(
      (item) => item.status === "planned" || item.status === "open",
    ).length;
    const completedCounter = selectedConsumptions
      .filter((consumption) => consumption.consumption_status === "completed")
      .reduce(
        (sum, consumption) => sum + Number(consumption.count_value || 0),
        0,
      );
    const committedCounter = selectedConsumptions
      .filter(
        (consumption) =>
          consumption.consumption_status === "planned" ||
          consumption.consumption_status === "open",
      )
      .reduce(
        (sum, consumption) => sum + Number(consumption.count_value || 0),
        0,
      );
    const isCounter =
      selectedPlan?.plan_type === "counter" && selectedItems.length === 0;
    const completed = isCounter ? completedCounter : completedItems;
    const committed = isCounter ? committedCounter : committedItems;
    return {
      total,
      completed,
      committed,
      remaining: Math.max(Number(total) - Number(completed), 0),
    };
  }, [selectedPlan, selectedItems, selectedConsumptions]);

  const progressPercent =
    kpis.total > 0
      ? Math.min(100, Math.round((kpis.completed / kpis.total) * 100))
      : 0;

  const shellClass = executiveMode
    ? "space-y-6 text-slate-100"
    : "space-y-6 text-slate-100";

  const panelClass = executiveMode
    ? "relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#0b1524]/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.11),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.10),transparent_32%)] before:opacity-90"
    : "rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl";

  const innerPanelClass = executiveMode
    ? "relative overflow-hidden rounded-[28px] border border-cyan-300/12 bg-[#0b1524]/90 p-5 shadow-[0_20px_65px_rgba(0,0,0,0.28)]"
    : "rounded-[28px] border border-white/10 bg-slate-900/80 p-5";

  const inputClass = executiveMode
    ? "rounded-2xl border border-cyan-300/12 bg-[#030816] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-200/55 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
    : "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white";

  useEffect(() => {
    if (!tenantId) return;
    void loadData();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
  }

  async function authHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token)
      throw new Error("Sessione Supabase assente: fai logout/login e riprova.");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function apiGet(): Promise<ApiState> {
    if (!tenantId) throw new Error("tenantId mancante.");
    const headers = await authHeaders();
    const response = await fetch(
      `/api/operational-plans?tenantId=${encodeURIComponent(tenantId)}`,
      { headers, cache: "no-store" },
    );
    const json = (await response.json()) as Partial<ApiState> & {
      error?: string;
    };
    if (!response.ok) throw new Error(json.error || "Errore API Piani.");
    return {
      plans: json.plans || [],
      items: json.items || [],
      consumptions: json.consumptions || [],
    };
  }

  async function apiPost(payload: Record<string, unknown>): Promise<void> {
    if (!tenantId) throw new Error("tenantId mancante.");
    const headers = await authHeaders();
    const response = await fetch("/api/operational-plans", {
      method: "POST",
      headers,
      body: JSON.stringify({ tenantId, ...payload }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(json.error || "Errore API Piani.");
  }

  async function loadData() {
    if (!tenantId) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await apiGet();
      setPlans(data.plans);
      setItems(data.items);
      setConsumptions(data.consumptions);
      if (!selectedPlanId && data.plans.length > 0)
        setSelectedPlanId(data.plans[0].id);
    } catch (error) {
      console.error("[OperationalPlans] loadData", error);
      showMessage(
        error instanceof Error
          ? `Caricamento piani: ${error.message}`
          : "Errore caricamento piani.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!planForm.title.trim()) {
      showMessage("Titolo piano obbligatorio.", "error");
      return;
    }
    setSaving(true);
    showMessage("Creazione piano in corso...");
    try {
      const totalTarget = toNumberOrNull(planForm.total_target);
      const firstTarget = toNumberOrNull(planForm.first_period_target);
      const secondTarget = toNumberOrNull(planForm.second_period_target);
      await apiPost({
        action: "createPlan",
        plan: {
          title: planForm.title.trim(),
          description: emptyToNull(planForm.description),
          year: toIntegerOrNull(planForm.year) || new Date().getFullYear(),
          customer_id: emptyToNull(planForm.customer_id),
          entity_label: emptyToNull(planForm.entity_label),
          plan_type: planForm.plan_type,
          service_type: planForm.service_type,
          time_rule: planForm.time_rule,
          scale_mode: planForm.scale_mode,
          total_target: totalTarget,
          first_period_target: firstTarget,
          second_period_target: secondTarget,
          start_date: emptyToNull(planForm.start_date),
          end_date: emptyToNull(planForm.end_date),
          first_period_deadline: emptyToNull(planForm.first_period_deadline),
          second_period_deadline: emptyToNull(planForm.second_period_deadline),
          status: "active",
          active: true,
          notes: emptyToNull(planForm.notes),
        },
      });
      setPlanForm(defaultPlanForm());
      setShowPlanForm(false);
      await loadData();
      showMessage("Piano creato.");
    } catch (error) {
      console.error("[OperationalPlans] createPlan", error);
      showMessage(
        error instanceof Error
          ? `Errore creazione piano: ${error.message}`
          : "Errore creazione piano.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function buildImportPayload(): {
    rows: Record<string, unknown>[];
    missingRegionCount: number;
  } {
    if (!selectedPlan) throw new Error("Seleziona prima un piano.");
    const rawRows = importText
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);
    if (rawRows.length === 0)
      throw new Error("Incolla almeno una riga da importare.");
    const firstRow = rawRows[0].toLowerCase();
    const hasHeader =
      firstRow.includes("site_name") ||
      firstRow.includes("sede") ||
      firstRow.includes("semestre") ||
      firstRow.includes("regione");
    const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
    const firstLimit =
      selectedPlan.first_period_target || Math.ceil(dataRows.length / 2);
    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedPlan.customer_id,
    );
    const defaultCustomer = selectedCustomer
      ? customerLabel(selectedCustomer)
      : selectedPlan.entity_label || selectedPlan.title;

    const rows = dataRows
      .map((row, index) => {
        const cells = splitImportRow(row);
        const isExcelTrackerRow = row.includes("\t") && !row.includes(";");
        const autoPeriod =
          selectedPlan.time_rule === "semester_50_50" ||
          selectedPlan.time_rule === "semester_custom"
            ? index < firstLimit
              ? 1
              : 2
            : null;

        if (isExcelTrackerRow) {
          const siteName = (cells[0] || "").trim();
          const firstSemesterDate = normalizeDateCell(cells[1]);
          const secondSemesterDate = normalizeDateCell(cells[2]);
          const completedDate = firstSemesterDate || secondSemesterDate;
          const periodTarget = firstSemesterDate
            ? 1
            : secondSemesterDate
              ? 2
              : autoPeriod;
          const targetDate =
            completedDate ||
            (periodTarget === 1
              ? selectedPlan.first_period_deadline
              : periodTarget === 2
                ? selectedPlan.second_period_deadline
                : selectedPlan.end_date);
          const inferred = inferPlaceFromSiteName(siteName);
          return {
            site_name: siteName,
            customer_name: defaultCustomer,
            region: inferred.region,
            province: inferred.province,
            city: inferred.city,
            period_target: periodTarget,
            target_date: targetDate,
            completed_date: completedDate,
            target_value: 1,
            status: completedDate ? "completed" : "todo",
          };
        }

        const [
          siteNameRaw,
          regionRaw,
          provinceRaw,
          cityRaw,
          periodRaw,
          targetDateRaw,
          customerRaw,
          notesRaw,
        ] = cells;
        const siteName = (siteNameRaw || "").trim();
        const periodTarget = toIntegerOrNull(periodRaw) || autoPeriod;
        const targetDate =
          normalizeDateCell(targetDateRaw) ||
          emptyToNull(targetDateRaw) ||
          (periodTarget === 1
            ? selectedPlan.first_period_deadline
            : periodTarget === 2
              ? selectedPlan.second_period_deadline
              : selectedPlan.end_date);
        const inferred = inferPlaceFromSiteName(siteName);
        return {
          site_name: siteName,
          customer_name: emptyToNull(customerRaw) || defaultCustomer,
          region: emptyToNull(regionRaw) || inferred.region,
          province: emptyToNull(provinceRaw) || inferred.province,
          city: emptyToNull(cityRaw) || inferred.city,
          period_target: periodTarget,
          target_date: targetDate,
          target_value: 1,
          status: "todo",
          notes: emptyToNull(notesRaw),
        };
      })
      .filter(
        (row) => typeof row.site_name === "string" && row.site_name.trim(),
      );

    return {
      rows,
      missingRegionCount: rows.filter((row) => !row.region).length,
    };
  }

  async function importItems() {
    if (saving) return;
    if (!selectedPlanId) {
      showMessage("Seleziona prima un piano nella lista a sinistra.", "error");
      return;
    }
    setSaving(true);
    try {
      const { rows, missingRegionCount } = buildImportPayload();
      showMessage(`Importazione di ${rows.length} righe in corso...`);
      await apiPost({
        action: "importItems",
        planId: selectedPlanId,
        items: rows,
      });
      setImportText("");
      await loadData();
      showMessage(
        missingRegionCount > 0
          ? `Importate ${rows.length} righe. ${missingRegionCount} senza regione riconosciuta.`
          : `Importate ${rows.length} righe.`,
      );
    } catch (error) {
      console.error("[OperationalPlans] importItems", error);
      showMessage(
        error instanceof Error
          ? `Errore import righe: ${error.message}`
          : "Errore import righe.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateItemStatus(
    item: OperationalPlanItem,
    status: ItemStatus,
  ) {
    if (saving) return;

    const previousItems = items;
    const patch: Partial<OperationalPlanItem> = { status };

    if (status === "planned") patch.planned_date = item.planned_date || today();
    if (status === "open") patch.opened_date = item.opened_date || today();
    if (status === "completed")
      patch.completed_date = item.completed_date || today();
    if (status === "skipped") {
      patch.planned_date = item.planned_date;
      patch.opened_date = item.opened_date;
      patch.completed_date = item.completed_date;
    }

    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, ...patch } : row)),
    );
    setSaving(true);

    try {
      await apiPost({
        action: "updateItemStatus",
        itemId: item.id,
        itemPatch: patch,
      });
      await loadData();
      showMessage(`Stato aggiornato: ${ITEM_STATUS_LABELS[status]}.`);
    } catch (error) {
      setItems(previousItems);
      showMessage(
        error instanceof Error
          ? `Errore aggiornamento stato: ${error.message}`
          : "Errore aggiornamento stato.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function registerManualConsumption(status: ConsumptionStatus) {
    if (!selectedPlanId || !selectedPlan) return;
    setSaving(true);
    try {
      await apiPost({
        action: "createConsumption",
        planId: selectedPlanId,
        consumption: {
          service_type: selectedPlan.service_type,
          consumption_status: status,
          count_value: 1,
          manual_date: today(),
          completed_date: status === "completed" ? today() : null,
          planned_date: status === "planned" ? today() : null,
          opened_date: status === "open" ? today() : null,
          source: "manual",
          notes: "Consumo manuale registrato da Piani.",
        },
      });
      await loadData();
      showMessage("Consumo manuale registrato.");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? `Errore consumo manuale: ${error.message}`
          : "Errore consumo manuale.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan() {
    if (!selectedPlanId || !selectedPlan) return;
    if (!window.confirm(`Archiviare il piano ${selectedPlan.title}?`)) return;
    setSaving(true);
    try {
      await apiPost({ action: "archivePlan", planId: selectedPlanId });
      setSelectedPlanId(null);
      await loadData();
      showMessage("Piano archiviato.");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? `Errore archiviazione: ${error.message}`
          : "Errore archiviazione.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetFilters() {
    setFilterSearch("");
    setFilterRegion("");
    setFilterStatus("");
    setFilterPeriod("");
    setSortMode("alpha");
  }

  const hasActiveFilters = Boolean(
    filterSearch || filterRegion || filterStatus || filterPeriod || sortMode !== "alpha",
  );

  return (
    <div className={shellClass}>
      <section className={panelClass}>
        <div className="relative z-10">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-sky-300">
                Centrale Operativa
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">Piani</h2>
              <p className="mt-2 max-w-3xl text-sm font-bold text-slate-300">
                Piani annuali, semestrali, a contatore o a sedi obbligatorie.
                Qui dentro ci vanno ordinarie, straordinarie, SEPA e assistenze
                a contratto.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-black hover:bg-slate-700"
                disabled={loading || saving}
              >
                {loading ? "Aggiorno..." : "Aggiorna"}
              </button>
              <button
                type="button"
                onClick={() => setShowPlanForm(true)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
              >
                + Nuovo piano
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-black ${messageType === "error" ? "border-red-400/40 bg-red-500/20 text-red-100" : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"}`}
            >
              {message}
            </div>
          )}

          {showPlanForm && (
            <form
              onSubmit={createPlan}
              className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={planForm.title}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Titolo piano"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  value={planForm.year}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      year: event.target.value,
                    }))
                  }
                  placeholder="Anno"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <select
                  value={planForm.customer_id}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      customer_id: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                >
                  <option value="">Cliente non agganciato</option>
                  {customers.map((customer) =>
                    customer.id ? (
                      <option key={customer.id} value={customer.id}>
                        {customerLabel(customer)}
                      </option>
                    ) : null,
                  )}
                </select>
                <input
                  value={planForm.entity_label}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      entity_label: event.target.value,
                    }))
                  }
                  placeholder="Entità/contratto es. CARABINIERI"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <select
                  value={planForm.plan_type}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      plan_type: event.target.value as PlanType,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                >
                  {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={planForm.service_type}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      service_type: event.target.value as ServiceType,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                >
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={planForm.time_rule}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      time_rule: event.target.value as TimeRule,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                >
                  {Object.entries(TIME_RULE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={planForm.scale_mode}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      scale_mode: event.target.value as ScaleMode,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                >
                  {Object.entries(SCALE_MODE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={planForm.total_target}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      total_target: event.target.value,
                    }))
                  }
                  placeholder="Totale previsto"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  value={planForm.first_period_target}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      first_period_target: event.target.value,
                    }))
                  }
                  placeholder="Target 1° periodo"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  type="date"
                  value={planForm.start_date}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      start_date: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  type="date"
                  value={planForm.end_date}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      end_date: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  type="date"
                  value={planForm.first_period_deadline}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      first_period_deadline: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <input
                  type="date"
                  value={planForm.second_period_deadline}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      second_period_deadline: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-black text-white"
                />
              </div>
              <textarea
                value={planForm.description}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Descrizione / regole operative"
                className="min-h-24 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-bold text-white"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanForm(false)}
                  className="rounded-2xl bg-slate-800 px-5 py-3 font-black hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 font-black hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "Salvataggio..." : "Crea piano"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section
          className={
            executiveMode
              ? "min-w-0 rounded-[28px] border border-cyan-300/12 bg-[#0b1524]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.26)]"
              : "min-w-0 rounded-[28px] border border-white/10 bg-slate-900/80 p-4"
          }
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-black text-white">Lista piani</h3>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
              {plans.length}
            </span>
          </div>
          <div className="space-y-3">
            {loading && (
              <p className="text-sm font-bold text-sky-200">Caricamento...</p>
            )}
            {!loading && plans.length === 0 && (
              <p className="rounded-2xl bg-slate-950/60 p-4 text-sm font-bold text-slate-300">
                Nessun piano. Crea il primo.
              </p>
            )}
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full rounded-2xl border p-4 text-left ${selectedPlanId === plan.id ? "border-blue-400 bg-blue-500/20" : "border-white/10 bg-slate-950/50 hover:bg-slate-800"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{plan.title}</p>
                    <p className="mt-1 text-xs font-bold text-sky-200">
                      {plan.year} · {PLAN_TYPE_LABELS[plan.plan_type]} ·{" "}
                      {SERVICE_TYPE_LABELS[plan.service_type]}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-black ${badgeClass(plan.status)}`}
                  >
                    {plan.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 space-y-5">
          {!selectedPlan ? (
            <div
              className={
                executiveMode
                  ? "rounded-[28px] border border-cyan-300/12 bg-[#0b1524]/90 p-6 text-sm font-bold text-cyan-100"
                  : "rounded-[28px] border border-white/10 bg-slate-900/80 p-6 text-sm font-bold text-sky-200"
              }
            >
              Seleziona o crea un piano.
            </div>
          ) : (
            <>
              <div className={panelClass}>
                <div className="relative z-10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-3xl font-black text-white">
                        {selectedPlan.title}
                      </h3>
                      <p className="mt-2 text-sm font-bold text-slate-300">
                        {selectedPlan.description || "Nessuna descrizione."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void registerManualConsumption("completed")
                        }
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black hover:bg-emerald-500"
                      >
                        + Consumo
                      </button>
                      <button
                        type="button"
                        onClick={() => void archivePlan()}
                        className="rounded-2xl bg-red-900/70 px-4 py-3 text-sm font-black hover:bg-red-800"
                      >
                        Archivia
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                        Totale previsto
                      </p>
                      <p className="mt-2 text-4xl font-black">{kpis.total}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
                        Effettuate
                      </p>
                      <p className="mt-2 text-4xl font-black">
                        {kpis.completed}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-blue-400/30 bg-blue-500/15 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">
                        Pianificate/aperte
                      </p>
                      <p className="mt-2 text-4xl font-black">
                        {kpis.committed}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/15 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-200">
                        Residue
                      </p>
                      <p className="mt-2 text-4xl font-black">
                        {kpis.remaining}
                      </p>
                    </div>
                  </div>
                  {selectedPlan.time_rule.includes("semester") && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-blue-400/30 bg-blue-500/15 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">
                          Target 1° semestre
                        </p>
                        <p className="mt-2 text-3xl font-black">
                          {selectedPlan.first_period_target || "—"}
                        </p>
                        <p className="text-xs font-bold text-slate-300">
                          Scadenza: {selectedPlan.first_period_deadline || "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
                          Target 2° semestre
                        </p>
                        <p className="mt-2 text-3xl font-black">
                          {selectedPlan.second_period_target || "—"}
                        </p>
                        <p className="text-xs font-bold text-slate-300">
                          Scadenza: {selectedPlan.second_period_deadline || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/35">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Avanzamento piano {progressPercent}%
                  </p>
                </div>
              </div>

              <div className={innerPanelClass}>
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="text-xl font-black text-white">Righe piano</h3>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-100 lg:hidden"
                    >
                      Azzera filtri
                    </button>
                  )}
                  <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <input
                      value={filterSearch}
                      onChange={(event) => setFilterSearch(event.target.value)}
                      placeholder="Cerca sede"
                      className={`w-full ${inputClass}`}
                    />
                    <select
                      value={filterRegion}
                      onChange={(event) => setFilterRegion(event.target.value)}
                      className={`w-full ${inputClass}`}
                    >
                      <option value="">Tutte regioni</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(event) => setFilterStatus(event.target.value)}
                      className={`w-full ${inputClass}`}
                    >
                      <option value="">Tutti stati</option>
                      {Object.entries(ITEM_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={filterPeriod}
                      onChange={(event) => setFilterPeriod(event.target.value)}
                      className={`w-full ${inputClass}`}
                    >
                      <option value="">Tutti periodi</option>
                      <option value="1">1° semestre</option>
                      <option value="2">2° semestre</option>
                    </select>
                    <select
                      value={sortMode}
                      onChange={(event) =>
                        setSortMode(
                          event.target.value as
                            | "alpha"
                            | "region"
                            | "status"
                            | "date",
                        )
                      }
                      className={`w-full ${inputClass}`}
                    >
                      <option value="alpha">Alfabetico</option>
                      <option value="region">Regione</option>
                      <option value="status">Stato</option>
                      <option value="date">Data</option>
                    </select>
                  </div>
                </div>
                {isDesktopShell ? (
                <div
                  className={
                    executiveMode
                      ? "max-w-full overflow-x-auto rounded-2xl border border-cyan-300/12 bg-black/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "max-w-full overflow-x-auto rounded-2xl border border-white/10"
                  }
                >
                  <table className="w-full min-w-[960px] table-fixed text-left text-sm">
                    <thead
                      className={
                        executiveMode
                          ? "bg-[#030816] text-xs uppercase tracking-[0.28em] text-cyan-200"
                          : "bg-slate-950 text-xs uppercase tracking-[0.28em] text-sky-200"
                      }
                    >
                      <tr>
                        <th className="w-[31%] p-4">Sede</th>
                        <th className="w-[17%] p-4">Regione</th>
                        <th className="w-[8%] p-4 text-center">Periodo</th>
                        <th className="w-[13%] p-4">Stato</th>
                        <th className="w-[16%] p-4">Date</th>
                        <th className="w-[15%] p-4 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 font-bold text-slate-300"
                          >
                            Nessuna riga trovata.
                          </td>
                        </tr>
                      )}
                      {visibleItems.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            executiveMode
                              ? "border-t border-cyan-300/10 align-top transition hover:bg-cyan-300/[0.035]"
                              : "border-t border-white/10 align-top"
                          }
                        >
                          <td className="p-4">
                            <p className="break-words text-sm font-black leading-snug text-white">
                              {item.site_name}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-400">
                              {item.city || ""}
                            </p>
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            {item.region || "n/d"}
                          </td>
                          <td className="p-4 text-center font-black text-slate-200">
                            {item.period_target
                              ? `${item.period_target}°`
                              : "—"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex min-w-[88px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-2 text-xs font-black ${badgeClass(item.status)}`}
                            >
                              {ITEM_STATUS_LABELS[item.status]}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold leading-6 text-slate-300">
                            <div className="whitespace-nowrap">
                              Target: {item.target_date || "—"}
                            </div>
                            <div className="whitespace-nowrap">
                              Fatta: {item.completed_date || "—"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="grid grid-cols-2 gap-2">
                              <PlanActionButton
                                label="Pian."
                                status="planned"
                                active={item.status === "planned"}
                                disabled={saving}
                                onClick={() =>
                                  void updateItemStatus(item, "planned")
                                }
                              />
                              <PlanActionButton
                                label="Aperta"
                                status="open"
                                active={item.status === "open"}
                                disabled={saving}
                                onClick={() =>
                                  void updateItemStatus(item, "open")
                                }
                              />
                              <PlanActionButton
                                label="Fatta"
                                status="completed"
                                active={item.status === "completed"}
                                disabled={saving}
                                onClick={() =>
                                  void updateItemStatus(item, "completed")
                                }
                              />
                              <PlanActionButton
                                label="Salta"
                                status="skipped"
                                active={item.status === "skipped"}
                                disabled={saving}
                                onClick={() =>
                                  void updateItemStatus(item, "skipped")
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="grid gap-3">
                    {visibleItems.length === 0 && (
                      <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 text-sm font-bold text-slate-300">
                        {selectedItems.length === 0
                          ? "Nessuna riga presente nel piano."
                          : "Nessuna riga trovata con questi filtri."}
                      </div>
                    )}
                    {visibleItems.map((item) => {
                      const expanded = expandedItemId === item.id;
                      const isLate =
                        isPastDate(item.target_date) &&
                        item.status !== "completed" &&
                        item.status !== "skipped" &&
                        item.status !== "out_of_scope";
                      const customerName =
                        item.customer_name ||
                        selectedPlan.entity_label ||
                        selectedPlan.title;
                      const itemDescription =
                        item.notes || selectedPlan.description || "Nessuna descrizione.";

                      return (
                        <article
                          key={item.id}
                          className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-lg shadow-black/10"
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
                                {selectedPlan.title}
                              </p>
                              <h4 className="mt-2 break-words text-lg font-black leading-tight text-white">
                                {item.site_name || "Sede n/d"}
                              </h4>
                              <p className="mt-1 break-words text-sm font-bold text-slate-300">
                                {customerName}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${badgeClass(item.status)}`}
                            >
                              {ITEM_STATUS_LABELS[item.status]}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                Data pianificata
                              </p>
                              <p className="mt-1 font-black text-white">
                                {item.planned_date || item.target_date || "n/d"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                Periodo
                              </p>
                              <p className="mt-1 font-black text-white">
                                {item.period_target ? `${item.period_target}Â° semestre` : "n/d"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                Area
                              </p>
                              <p className="mt-1 break-words font-black text-white">
                                {[item.city, item.province, item.region].filter(Boolean).join(" Â· ") || "n/d"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                Assegnazione
                              </p>
                              <p className="mt-1 font-black text-white">
                                {item.ticket_id || item.glpi_ticket_id
                                  ? `Ticket ${item.glpi_ticket_id || item.ticket_id}`
                                  : "Tecnico n/d"}
                              </p>
                            </div>
                          </div>

                          {isLate && (
                            <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-xs font-black text-red-100">
                              Scadenza superata: {item.target_date}
                            </div>
                          )}

                          <p className="mt-4 line-clamp-2 break-words text-sm font-bold leading-6 text-slate-300">
                            {itemDescription}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItemId((current) =>
                                current === item.id ? null : item.id,
                              )
                            }
                            className="mt-4 min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white"
                          >
                            {expanded ? "Chiudi azioni" : "Azioni e dettagli"}
                          </button>

                          {expanded && (
                            <div className="mt-4 grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void updateItemStatus(item, "planned")}
                                  className="min-h-11 rounded-2xl border border-cyan-300/20 bg-cyan-500/12 px-3 py-3 text-xs font-black text-cyan-100 disabled:opacity-45"
                                >
                                  Pianifica
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void updateItemStatus(item, "open")}
                                  className="min-h-11 rounded-2xl border border-amber-300/20 bg-amber-500/12 px-3 py-3 text-xs font-black text-amber-100 disabled:opacity-45"
                                >
                                  Aperta
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void updateItemStatus(item, "completed")}
                                  className="min-h-11 rounded-2xl border border-emerald-300/20 bg-emerald-500/12 px-3 py-3 text-xs font-black text-emerald-100 disabled:opacity-45"
                                >
                                  Fatta
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void updateItemStatus(item, "skipped")}
                                  className="min-h-11 rounded-2xl border border-red-300/20 bg-red-500/12 px-3 py-3 text-xs font-black text-red-100 disabled:opacity-45"
                                >
                                  Salta
                                </button>
                              </div>

                              <dl className="grid gap-3 text-xs font-bold text-slate-300">
                                <div className="grid gap-1">
                                  <dt className="font-black uppercase tracking-[0.18em] text-slate-500">
                                    Target
                                  </dt>
                                  <dd>{item.target_date || "n/d"}</dd>
                                </div>
                                <div className="grid gap-1">
                                  <dt className="font-black uppercase tracking-[0.18em] text-slate-500">
                                    Fatta
                                  </dt>
                                  <dd>{item.completed_date || "n/d"}</dd>
                                </div>
                                <div className="grid gap-1">
                                  <dt className="font-black uppercase tracking-[0.18em] text-slate-500">
                                    Fascia oraria
                                  </dt>
                                  <dd>n/d</dd>
                                </div>
                                <div className="grid gap-1">
                                  <dt className="font-black uppercase tracking-[0.18em] text-slate-500">
                                    Note
                                  </dt>
                                  <dd className="break-words">{itemDescription}</dd>
                                </div>
                              </dl>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={innerPanelClass}>
                <h3 className="text-xl font-black text-white">
                  Import veloce righe
                </h3>
                <p className="mt-2 text-sm font-bold text-slate-300">
                  Copia da Excel la sola colonna delle sedi, oppure incolla Sede
                  | 1° semestre | 2° semestre. ATLAS prova a riconoscere
                  regione/provincia/città e divide i semestri in base ai target.
                </p>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="COMANDO PROVINCIALE DI ROMA\nCOMANDO PROVINCIALE DI MILANO"
                  className="mt-4 min-h-44 w-full rounded-2xl border border-blue-400 bg-slate-950 px-4 py-3 font-black text-white"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={saving || !importText.trim()}
                    onClick={() => void importItems()}
                    className="rounded-2xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500 disabled:opacity-50"
                  >
                    {saving ? "Importazione..." : "Importa righe"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
