"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  Users,
  X,
  Zap,
} from "lucide-react";
import ExecutiveCopilotPanel from "./ExecutiveCopilotPanel";
import ExecutiveGlassCard from "./ExecutiveGlassCard";
import ExecutiveMetricCard from "./ExecutiveMetricCard";
import ExecutiveNetworkMap from "./ExecutiveNetworkMap";
import ExecutiveRiskRadar from "./ExecutiveRiskRadar";
import ExecutiveSignalFeed from "./ExecutiveSignalFeed";

type ExecutiveDashboardProps = {
  customers?: any[];
  sites?: any[];
  tickets?: any[];
  customerEntities?: any[];
  onOpenTicket?: (customer: any, site?: any) => void;
  onNavigate?: (view: string) => void;
};

type SearchResult = {
  type: string;
  label: string;
  detail: string;
  customer?: any;
  site?: any;
  entity?: any;
  ticket?: any;
};

type DashboardWidgetId =
  | "metric-open"
  | "metric-unassigned"
  | "metric-critical"
  | "metric-sla"
  | "metric-clients"
  | "command-bar"
  | "mission-health"
  | "network-overview"
  | "operational-risk"
  | "recent-operations"
  | "copilot"
  | "quick-actions";

type DashboardWidgetConfig = {
  id: DashboardWidgetId;
  visible: boolean;
};

type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  label: string;
  sizeClass: string;
};

const DASHBOARD_STORAGE_KEY = "atlas-executive-dashboard-layout-v1";

const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "metric-open", label: "Ticket aperti", sizeClass: "col-span-12 sm:col-span-6 2xl:col-span-2" },
  { id: "metric-unassigned", label: "Da assegnare", sizeClass: "col-span-12 sm:col-span-6 2xl:col-span-2" },
  { id: "metric-critical", label: "Critici", sizeClass: "col-span-12 sm:col-span-6 2xl:col-span-2" },
  { id: "metric-sla", label: "SLA Compliance", sizeClass: "col-span-12 sm:col-span-6 2xl:col-span-2" },
  { id: "metric-clients", label: "Clienti", sizeClass: "col-span-12 sm:col-span-6 2xl:col-span-2" },
  { id: "command-bar", label: "Command Bar", sizeClass: "col-span-12" },
  { id: "mission-health", label: "Mission Health", sizeClass: "col-span-12 xl:col-span-5 2xl:col-span-4" },
  { id: "network-overview", label: "Network Overview", sizeClass: "col-span-12 xl:col-span-7 2xl:col-span-5" },
  { id: "copilot", label: "ATLAS Copilot", sizeClass: "col-span-12 2xl:col-span-3 2xl:row-span-2" },
  { id: "operational-risk", label: "Operational Risk", sizeClass: "col-span-12 xl:col-span-5 2xl:col-span-4" },
  { id: "recent-operations", label: "Operazioni recenti", sizeClass: "col-span-12 xl:col-span-7 2xl:col-span-5" },
  { id: "quick-actions", label: "Quick Actions", sizeClass: "col-span-12 2xl:col-span-3" },
];

function defaultDashboardLayout(): DashboardWidgetConfig[] {
  return DASHBOARD_WIDGETS.map((widget) => ({ id: widget.id, visible: true }));
}

function normalizeDashboardLayout(value: unknown): DashboardWidgetConfig[] {
  const fallback = defaultDashboardLayout();
  if (!Array.isArray(value)) return fallback;

  const validIds = new Set(DASHBOARD_WIDGETS.map((widget) => widget.id));
  const seen = new Set<string>();
  const parsed = value
    .filter((item: any) => item && validIds.has(item.id) && !seen.has(item.id))
    .map((item: any) => {
      seen.add(item.id);
      return { id: item.id as DashboardWidgetId, visible: item.visible !== false };
    });

  const missing = fallback.filter((item) => !seen.has(item.id));
  return [...parsed, ...missing];
}

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isClosed(ticket: any) {
  const status = normalize(ticket?.status || ticket?.ticket_status || ticket?.glpi_status);
  return Boolean(
    ticket?.closedAt ||
      ticket?.closed_at ||
      status.includes("chiuso") ||
      status.includes("closed") ||
      status.includes("risolto") ||
      status.includes("solved") ||
      status === "5" ||
      status === "6",
  );
}

function ticketDate(ticket: any) {
  const raw = ticket?.openedAt || ticket?.opened_at || ticket?.created_at || ticket?.intervention_date || ticket?.date;
  const parsed = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function shortTime(value: number) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function ticketTitle(ticket: any) {
  return ticket?.title || ticket?.name || ticket?.problem || ticket?.description || ticket?.glpi_title || `Ticket #${ticket?.id || "n/d"}`;
}

function ticketCustomer(ticket: any) {
  return ticket?.customerName || ticket?.customer_name || ticket?.customer?.name || ticket?.site || ticket?.entity || "Cliente n/d";
}

function ticketStatus(ticket: any) {
  if (isClosed(ticket)) return "Chiuso";
  const status = String(ticket?.status || "").trim();
  return status || "Aperto";
}

function metricSeries(seed: number, length = 8) {
  return Array.from({ length }, (_, index) => Math.max(1, Math.round(seed * (0.62 + index * 0.035 + ((index % 3) * 0.06)))));
}

function buildSearchText(item: any) {
  return normalize(
    [
      item?.name,
      item?.customerName,
      item?.customer_name,
      item?.complete_name,
      item?.normalized_complete_name,
      item?.site,
      item?.city,
      item?.region,
      item?.entity,
      item?.address,
      item?.glpi_entity_path,
      item?.glpi_ticket_id,
      item?.id,
      item?.title,
      item?.problem,
    ].filter(Boolean).join(" "),
  );
}

export default function ExecutiveDashboard({ customers = [], sites = [], tickets = [], customerEntities = [], onOpenTicket, onNavigate }: ExecutiveDashboardProps) {
  const [query, setQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<DashboardWidgetId | null>(null);
  const [showWidgetDrawer, setShowWidgetDrawer] = useState(false);
  const [layout, setLayout] = useState<DashboardWidgetConfig[]>(defaultDashboardLayout);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
      if (!stored) return;
      setLayout(normalizeDashboardLayout(JSON.parse(stored)));
    } catch (error) {
      console.warn("[ATLAS] Impossibile leggere layout dashboard executive", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.warn("[ATLAS] Impossibile salvare layout dashboard executive", error);
    }
  }, [layout]);

  const definitionsById = useMemo(() => {
    return new Map(DASHBOARD_WIDGETS.map((widget) => [widget.id, widget]));
  }, []);

  const visibleLayout = useMemo(() => layout.filter((widget) => widget.visible), [layout]);
  const hiddenLayout = useMemo(() => layout.filter((widget) => !widget.visible), [layout]);

  const openTickets = useMemo(() => tickets.filter((ticket) => !isClosed(ticket)), [tickets]);
  const unassignedTickets = useMemo(
    () => openTickets.filter((ticket) => !ticket?.technician || normalize(ticket?.technician).includes("non assegnato") || normalize(ticket?.technician) === "n d"),
    [openTickets],
  );
  const criticalTickets = useMemo(() => openTickets.filter((ticket) => Boolean(ticket?.urgent) || normalize(ticket?.priority).includes("crit")), [openTickets]);
  const closedTickets = useMemo(() => tickets.filter(isClosed), [tickets]);
  const recentTickets = useMemo(() => [...tickets].sort((a, b) => ticketDate(b) - ticketDate(a)).slice(0, 6), [tickets]);

  const realSearchResults = useMemo<SearchResult[]>(() => {
    const q = normalize(query);
    if (!q) return [];

    const customerResults = customers
      .filter((item) => buildSearchText(item).includes(q))
      .slice(0, 5)
      .map((item) => ({
        type: "Cliente",
        label: item?.name || item?.customerName || item?.customer_name || "Cliente",
        detail: [item?.city, item?.region].filter(Boolean).join(" · ") || "Anagrafica cliente",
        customer: item,
      }));

    const siteResults = sites
      .filter((item) => buildSearchText(item).includes(q))
      .slice(0, 6)
      .map((item) => ({
        type: "Sede",
        label: item?.name || item?.site || "Sede",
        detail: [item?.city, item?.entity, item?.region].filter(Boolean).join(" · ") || "Sede operativa",
        site: item,
      }));

    return [...customerResults, ...siteResults].slice(0, 8);
  }, [query, customers, sites]);

  const networkNodes = useMemo(() => {
    const source = sites.length > 0 ? sites : customerEntities;
    const byCity = new Map<string, any>();
    source.forEach((item) => {
      const label = item?.city || item?.region || item?.name || item?.site;
      if (!label) return;
      const key = normalize(label);
      if (["dubai", "acme", "milano hq"].some((blocked) => key.includes(blocked))) return;
      if (!byCity.has(key)) byCity.set(key, item);
    });

    const coords = [
      [48, 54], [38, 35], [31, 42], [53, 68], [60, 74], [43, 84], [66, 46], [28, 60],
    ];

    return Array.from(byCity.values()).slice(0, 8).map((item, index) => ({
      label: item?.city || item?.region || item?.name || item?.site || `Nodo ${index + 1}`,
      x: coords[index][0],
      y: coords[index][1],
      status: index % 7 === 4 ? "critical" as const : index % 5 === 3 ? "warning" as const : "ok" as const,
    }));
  }, [sites, customerEntities]);

  const signalItems = recentTickets.map((ticket) => ({
    id: ticket?.id,
    time: shortTime(ticketDate(ticket)),
    level: (ticket?.urgent ? "CRITICO" : isClosed(ticket) ? "CHIUSO" : unassignedTickets.includes(ticket) ? "ALTA" : "INFO") as "CRITICO" | "ALTA" | "INFO" | "CHIUSO",
    title: ticketTitle(ticket),
    meta: `${ticketCustomer(ticket)} · ${ticket?.glpi_ticket_id ? `GLPI #${ticket.glpi_ticket_id}` : `ATLAS #${ticket?.id || "n/d"}`} · ${ticket?.technician || "Tecnico N/D"}`,
    status: ticketStatus(ticket),
    onClick: () => onNavigate?.("registro"),
  }));

  const metricById = {
    "metric-open": { label: "Ticket aperti", value: openTickets.length, detail: "Backlog reale", tone: "cyan" as const, sparkline: metricSeries(openTickets.length || 9), onClick: () => onNavigate?.("registro") },
    "metric-unassigned": { label: "Da assegnare", value: unassignedTickets.length, detail: "Senza tecnico", tone: "gold" as const, sparkline: metricSeries(unassignedTickets.length || 4), onClick: () => onNavigate?.("registro") },
    "metric-critical": { label: "Critici", value: criticalTickets.length, detail: "Urgenti attivi", tone: "red" as const, sparkline: metricSeries(criticalTickets.length || 2), onClick: () => onNavigate?.("registro") },
    "metric-sla": { label: "SLA Compliance", value: closedTickets.length && tickets.length ? `${Math.round((closedTickets.length / tickets.length) * 100)}%` : "—", detail: "Calcolo su ticket", tone: "green" as const, sparkline: metricSeries(closedTickets.length || 8), onClick: () => onNavigate?.("analytics") },
    "metric-clients": { label: "Clienti", value: customers.length, detail: "Anagrafiche", tone: "blue" as const, sparkline: metricSeries(customers.length || 5), onClick: () => onNavigate?.("clienti") },
  } as const;

  const healthRows = [
    [Activity, "Operational Load", `${Math.min(99, Math.max(12, openTickets.length))}%`, "text-cyan-100"],
    [ShieldAlert, "Risk Exposure", criticalTickets.length > 5 ? "Alto" : criticalTickets.length > 0 ? "Medio" : "Basso", "text-amber-100"],
    [Clock, "Ticket recenti", String(recentTickets.length), "text-blue-100"],
    [CheckCircle2, "Ticket chiusi", String(closedTickets.length), "text-emerald-100"],
  ];

  function setWidgetVisible(id: DashboardWidgetId, visible: boolean) {
    setLayout((current) => current.map((item) => item.id === id ? { ...item, visible } : item));
  }

  function moveWidget(id: DashboardWidgetId, direction: -1 | 1) {
    setLayout((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function dropWidget(targetId: DashboardWidgetId) {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    setLayout((current) => {
      const from = current.findIndex((item) => item.id === draggedWidgetId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
    setDraggedWidgetId(null);
  }

  function renderWidgetContent(id: DashboardWidgetId) {
    if (id in metricById) {
      return <ExecutiveMetricCard {...metricById[id as keyof typeof metricById]} />;
    }

    if (id === "command-bar") {
      return (
        <div className="relative overflow-visible rounded-[30px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(255,255,255,0.045),rgba(251,191,36,0.08))] p-5 shadow-[0_0_70px_rgba(34,211,238,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.14)]">
              <Search size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/55">Command Bar</p>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca cliente o sede operativa..."
                className="mt-1 w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-500 md:text-3xl"
              />
              <p className="mt-1 text-xs font-semibold text-slate-400">Esempi: Casoria · Carabinieri Roma · UST Roma · Provinciale Roma</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              {realSearchResults.length > 0 ? `${realSearchResults.length} risultati` : "Ricerca cliente"}
            </div>
          </div>

          {query && (
            <div className="absolute left-5 right-5 top-[calc(100%-8px)] z-30 grid max-h-96 gap-2 overflow-y-auto rounded-[24px] border border-cyan-300/15 bg-[#040a15]/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              {realSearchResults.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-slate-400">Nessun cliente o sede trovato.</div>
              ) : (
                realSearchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.label}-${index}`}
                    onClick={() => {
                      if (result.customer) onOpenTicket?.(result.customer);
                      else if (result.site) onOpenTicket?.(null, result.site);
                    }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left hover:border-cyan-300/25 hover:bg-cyan-300/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{result.label}</p>
                      <p className="truncate text-xs font-semibold text-slate-400">{result.type} · {result.detail}</p>
                    </div>
                    <span className="rounded-full border border-cyan-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Apri</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    if (id === "mission-health") {
      return (
        <ExecutiveGlassCard title="Mission Health" eyebrow="Executive Overview">
          <div className="grid gap-4">
            <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_95px_rgba(94,234,212,0.22)]">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_220deg,rgba(16,185,129,0.05),rgba(110,231,183,0.85),rgba(34,211,238,0.12),rgba(16,185,129,0.05))] blur-[1px]" />
              <div className="absolute inset-4 rounded-full border border-cyan-300/15 bg-[#071321]" />
              <div className="absolute inset-8 rounded-full border border-emerald-300/20" />
              <div className="relative z-10 text-center">
                <p className="text-5xl font-black text-white">82</p>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100/60">score</p>
              </div>
            </div>
            <div className="space-y-3">
              {healthRows.map(([Icon, label, value, color]) => {
                const RowIcon = Icon as typeof Activity;
                return (
                  <button key={label as string} onClick={() => onNavigate?.("analytics")} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/10">
                    <div className="flex items-center gap-3">
                      <RowIcon size={16} className={color as string} />
                      <span className="text-sm font-bold text-slate-300">{label as string}</span>
                    </div>
                    <span className="text-sm font-black text-white">{value as string}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ExecutiveGlassCard>
      );
    }

    if (id === "network-overview") {
      return (
        <ExecutiveGlassCard title="Network Overview" eyebrow="Operational Map" action={<button onClick={() => onNavigate?.("mappa")} className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Vista completa</button>}>
          <ExecutiveNetworkMap nodes={networkNodes} stats={{ sites: sites.length || customerEntities.length, critical: criticalTickets.length, offline: 0, uptime: "98.7%" }} />
        </ExecutiveGlassCard>
      );
    }

    if (id === "operational-risk") {
      return (
        <ExecutiveGlassCard title="Operational Risk" eyebrow="Risk Radar">
          <ExecutiveRiskRadar score={criticalTickets.length * 40 + unassignedTickets.length * 8} label={criticalTickets.length > 5 ? "ALTO" : criticalTickets.length > 0 ? "MEDIO" : "BASSO"} />
        </ExecutiveGlassCard>
      );
    }

    if (id === "recent-operations") {
      return (
        <ExecutiveGlassCard
          title="Operazioni recenti"
          eyebrow="Dati reali ATLAS"
          action={<button onClick={() => onNavigate?.("registro")} className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Mostra tutto</button>}
        >
          <ExecutiveSignalFeed items={signalItems} emptyLabel="Nessun ticket reale recente da mostrare." />
        </ExecutiveGlassCard>
      );
    }

    if (id === "copilot") return <ExecutiveCopilotPanel />;

    if (id === "quick-actions") {
      return (
        <ExecutiveGlassCard title="Quick Actions" eyebrow="Operator Shortcuts">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            {[
              [Zap, "Apri Webvime", "Signal Center", "webvime"],
              [Users, "Cerca clienti", "Anagrafiche", "clienti"],
              [ShieldAlert, "Registro ticket", "Backlog", "registro"],
              [Activity, "Nuovo ticket", "Apri chiamata", "operativo"],
            ].map(([Icon, title, detail, target]) => {
              const ActionIcon = Icon as typeof Zap;
              return (
                <button key={title as string} onClick={() => onNavigate?.(target as string)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left hover:border-cyan-300/25 hover:bg-cyan-300/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                    <ActionIcon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{title as string}</p>
                    <p className="text-xs font-semibold text-slate-500">{detail as string}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ExecutiveGlassCard>
      );
    }

    return null;
  }

  return (
    <div className="space-y-5">
      <div className="relative z-40 mb-[-2px] flex items-center justify-end gap-2">
        {editMode && (
          <span className="mr-1 hidden rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/80 md:inline-flex">
            Modifica layout attiva
          </span>
        )}
        <button
          type="button"
          title={editMode ? "Chiudi modifica dashboard" : "Personalizza dashboard"}
          onClick={() => {
            setEditMode((value) => {
              if (value) setShowWidgetDrawer(false);
              return !value;
            });
          }}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
            editMode
              ? "border-amber-200/40 bg-amber-300/16 text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.18)]"
              : "border-cyan-300/15 bg-white/[0.045] text-cyan-100 hover:border-cyan-300/35 hover:bg-cyan-300/10"
          }`}
        >
          <Settings2 size={17} />
        </button>
        <button
          type="button"
          title="Aggiungi o riattiva widget"
          onClick={() => {
            setEditMode(true);
            setShowWidgetDrawer((value) => !value);
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-emerald-300/35 hover:bg-emerald-300/10 hover:text-emerald-100"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          title="Ripristina layout dashboard"
          onClick={() => {
            setLayout(defaultDashboardLayout());
            setShowWidgetDrawer(false);
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <RotateCcw size={17} />
        </button>

        {editMode && showWidgetDrawer && (
          <div className="absolute right-0 top-14 z-50 w-[min(420px,calc(100vw-2rem))] rounded-[24px] border border-cyan-300/15 bg-[#040a15]/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between gap-3 px-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/60">Widget nascosti</p>
                <p className="text-xs font-semibold text-slate-500">Riattiva solo quello che ti serve.</p>
              </div>
              <button type="button" onClick={() => setShowWidgetDrawer(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-2">
              {hiddenLayout.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-400">Nessun widget nascosto</div>
              ) : (
                hiddenLayout.map((item) => {
                  const definition = definitionsById.get(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWidgetVisible(item.id, true)}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left text-sm font-black text-slate-200 hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-emerald-100"
                    >
                      {definition?.label || item.id}
                      <Plus size={15} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {visibleLayout.map((item) => {
          const definition = definitionsById.get(item.id);
          if (!definition) return null;
          return (
            <section
              key={item.id}
              draggable={editMode}
              onDragStart={() => setDraggedWidgetId(item.id)}
              onDragOver={(event) => editMode && event.preventDefault()}
              onDrop={() => dropWidget(item.id)}
              onDragEnd={() => setDraggedWidgetId(null)}
              className={`${definition.sizeClass} group relative min-w-0 overflow-hidden rounded-[30px] transition ${
                editMode ? "ring-2 ring-amber-200/20 ring-offset-4 ring-offset-[#020713]" : ""
              } ${draggedWidgetId === item.id ? "opacity-50" : ""}`}
            >
              {editMode && (
                <div className="absolute -top-3 left-4 z-40 flex items-center gap-1 rounded-2xl border border-amber-200/20 bg-[#071321]/95 px-2 py-1 shadow-2xl backdrop-blur-xl">
                  <span className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
                    <GripVertical size={14} />
                    {definition.label}
                  </span>
                  <button type="button" onClick={() => moveWidget(item.id, -1)} className="rounded-xl px-2 py-1 text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white">↑</button>
                  <button type="button" onClick={() => moveWidget(item.id, 1)} className="rounded-xl px-2 py-1 text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white">↓</button>
                  <button type="button" onClick={() => setWidgetVisible(item.id, false)} className="rounded-xl px-2 py-1 text-xs font-black text-red-200 hover:bg-red-500/15">
                    <X size={14} />
                  </button>
                </div>
              )}
              {item.id !== "command-bar" && (
                <div
                  className="pointer-events-none absolute inset-0 z-30 rounded-[30px] border border-transparent transition-[border-color,box-shadow] duration-300 group-hover:border-violet-400/70 group-hover:shadow-[inset_0_0_0_1px_rgba(139,92,246,0.42),inset_0_0_22px_rgba(6,182,212,0.10)]"
                  aria-hidden="true"
                />
              )}
              <div className="h-full">
                {renderWidgetContent(item.id)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
