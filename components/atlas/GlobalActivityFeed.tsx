"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  Ticket,
  UserCheck,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TimelineSeverity = "critical" | "warning" | "info" | "success";
type TimelineKind = "ticket" | "sla" | "dispatch" | "system";

type AtlasTimelineEvent = {
  id: string;
  kind: TimelineKind;
  severity: TimelineSeverity;
  title: string;
  summary: string;
  customer: string;
  ticketId?: string | number | null;
  glpiTicketId?: string | number | null;
  operator?: string;
  date: string;
  source: string;
  actionRequired: boolean;
  actionLabel?: string;
  status?: string;
};

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "Data n/d";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function isClosed(ticket: any) {
  return Boolean(ticket.closed_at);
}

function isPlanned(ticket: any) {
  return Boolean(ticket.expected_close_date) && !isClosed(ticket);
}

function ticketCustomer(ticket: any) {
  return ticket.site || ticket.entity || ticket.city || ticket.glpi_entity_path || "Cliente / sede n.d.";
}

function shortText(value: any, limit = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "Nessun dettaglio disponibile.";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
}

function eventFromTicket(ticket: any): AtlasTimelineEvent | null {
  const closed = isClosed(ticket);
  const urgent = Boolean(ticket.urgent);
  const age = daysSince(ticket.opened_at || ticket.created_at);
  const planned = isPlanned(ticket);
  const problem = shortText(ticket.problem);

  if (normalize(`${ticket.glpi_entity_path} ${ticket.entity} ${ticket.site}`).includes("webvime")) {
    return null;
  }

  if (!closed && urgent) {
    return {
      id: `urgent-${ticket.id}`,
      kind: "sla",
      severity: "critical",
      title: "Ticket urgente attivo",
      summary: problem,
      customer: ticketCustomer(ticket),
      ticketId: ticket.id,
      glpiTicketId: ticket.glpi_ticket_id,
      operator: ticket.technician || "Tecnico non assegnato",
      date: ticket.opened_at || ticket.created_at,
      source: "GLPI",
      actionRequired: true,
      actionLabel: "Gestire urgenza",
      status: "Aperto",
    };
  }

  if (!closed && age >= 7) {
    return {
      id: `old-${ticket.id}`,
      kind: "sla",
      severity: age >= 30 ? "critical" : "warning",
      title: age >= 30 ? "Ticket aperto da troppo tempo" : "Ticket aperto oltre 7 giorni",
      summary: `${problem} · Aperto da ${age} giorni.`,
      customer: ticketCustomer(ticket),
      ticketId: ticket.id,
      glpiTicketId: ticket.glpi_ticket_id,
      operator: ticket.technician || "Tecnico non assegnato",
      date: ticket.opened_at || ticket.created_at,
      source: "GLPI",
      actionRequired: true,
      actionLabel: "Verificare",
      status: "Aperto",
    };
  }

  if (closed) {
    return {
      id: `closed-${ticket.id}`,
      kind: "ticket",
      severity: "success",
      title: "Ticket chiuso",
      summary: problem,
      customer: ticketCustomer(ticket),
      ticketId: ticket.id,
      glpiTicketId: ticket.glpi_ticket_id,
      operator: ticket.technician || "Operatore n.d.",
      date: ticket.closed_at || ticket.opened_at || ticket.created_at,
      source: "GLPI",
      actionRequired: false,
      status: "Chiuso",
    };
  }

  if (planned) {
    return {
      id: `planned-${ticket.id}`,
      kind: "dispatch",
      severity: "info",
      title: "Intervento pianificato",
      summary: problem,
      customer: ticketCustomer(ticket),
      ticketId: ticket.id,
      glpiTicketId: ticket.glpi_ticket_id,
      operator: ticket.technician || "Tecnico non assegnato",
      date: ticket.expected_close_date || ticket.opened_at || ticket.created_at,
      source: "GLPI",
      actionRequired: false,
      status: "Pianificato",
    };
  }

  return {
    id: `open-${ticket.id}`,
    kind: "ticket",
    severity: "info",
    title: "Ticket aperto / in lavorazione",
    summary: problem,
    customer: ticketCustomer(ticket),
    ticketId: ticket.id,
    glpiTicketId: ticket.glpi_ticket_id,
    operator: ticket.technician || "Tecnico non assegnato",
    date: ticket.opened_at || ticket.created_at,
    source: "GLPI",
    actionRequired: false,
    status: "Aperto",
  };
}

function severityClasses(severity: TimelineSeverity) {
  if (severity === "critical") return { card: "border-red-500/35 bg-red-500/10", icon: "bg-red-500/15 text-red-200", badge: "border-red-500/30 bg-red-500/15 text-red-200" };
  if (severity === "warning") return { card: "border-amber-500/35 bg-amber-500/10", icon: "bg-amber-500/15 text-amber-200", badge: "border-amber-500/30 bg-amber-500/15 text-amber-200" };
  if (severity === "success") return { card: "border-emerald-500/30 bg-emerald-500/10", icon: "bg-emerald-500/15 text-emerald-200", badge: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" };
  return { card: "border-white/10 bg-white/[0.045]", icon: "bg-blue-500/15 text-blue-200", badge: "border-blue-500/30 bg-blue-500/15 text-blue-200" };
}

function EventIcon({ event }: { event: AtlasTimelineEvent }) {
  if (event.kind === "sla") return <ShieldAlert size={20} />;
  if (event.kind === "dispatch") return <UserCheck size={20} />;
  if (event.severity === "success") return <CheckCircle2 size={20} />;
  if (event.severity === "critical" || event.severity === "warning") return <AlertTriangle size={20} />;
  return <Ticket size={20} />;
}

export default function GlobalActivityFeed() {
  const [events, setEvents] = useState<AtlasTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "critical" | "action" | "ticket" | "dispatch" | "system">("all");

  useEffect(() => {
    let mounted = true;

    async function loadTimeline() {
      setLoading(true);
      setLoadError("");

      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("id, glpi_ticket_id, site, entity, city, glpi_entity_path, problem, urgent, opened_at, closed_at, created_at, expected_close_date, technician, source")
          .eq("source", "glpi")
          .not("glpi_entity_path", "ilike", "%webvime%")
          .order("created_at", { ascending: false })
          .limit(350);

        if (error) throw error;

        const normalizedEvents = (data || []).map(eventFromTicket).filter(Boolean) as AtlasTimelineEvent[];
        normalizedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (!mounted) return;
        setEvents(normalizedEvents.slice(0, 250));
      } catch (error: any) {
        console.error("Timeline load error", error);
        if (!mounted) return;
        setLoadError(error?.message || "Errore caricamento timeline.");
        setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTimeline();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => ({
    total: events.length,
    critical: events.filter((event) => event.severity === "critical").length,
    actions: events.filter((event) => event.actionRequired).length,
    planned: events.filter((event) => event.kind === "dispatch").length,
  }), [events]);

  const filteredEvents = useMemo(() => {
    const q = normalize(query);
    return events.filter((event) => {
      const matchesFilter = filter === "all" || (filter === "critical" && event.severity === "critical") || (filter === "action" && event.actionRequired) || event.kind === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return normalize(`${event.title} ${event.summary} ${event.customer} ${event.operator} ${event.ticketId} ${event.glpiTicketId} ${event.status} ${event.source}`).includes(q);
    });
  }, [events, filter, query]);

  const filters = [
    { key: "all", label: "Tutti" },
    { key: "critical", label: "Critici" },
    { key: "action", label: "Da fare" },
    { key: "ticket", label: "Ticket" },
    { key: "dispatch", label: "Dispatch" },
    { key: "system", label: "Sistema" },
  ] as const;

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">ATLAS EVENT CENTER</p>
        <h2 className="mt-2 text-3xl font-black text-white">Timeline operativa</h2>
        <p className="mt-1 text-sm font-bold text-slate-400">Eventi GLPI tradotti in segnali operativi. Webvime è escluso e vive nel tab dedicato.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={Zap} label="Eventi leggibili" value={metrics.total} tone="blue" />
        <Metric icon={AlertTriangle} label="Criticità" value={metrics.critical} tone="red" />
        <Metric icon={ShieldAlert} label="Azioni richieste" value={metrics.actions} tone="amber" />
        <Metric icon={CalendarDays} label="Pianificazioni" value={metrics.planned} tone="violet" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca cliente, ticket, operatore, criticità..." className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item.key} onClick={() => setFilter(item.key)} className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${filter === item.key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}>
              <Filter size={15} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Caricamento timeline operativa...</div>
      ) : loadError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm font-bold text-red-100">Timeline non caricata: {loadError}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Nessun evento operativo trovato con questi filtri.</div>
      ) : (
        <div className="relative grid gap-3 before:absolute before:left-6 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-white/10">
          {filteredEvents.map((event) => {
            const styles = severityClasses(event.severity);
            return (
              <article key={event.id} className={`relative ml-2 grid gap-3 rounded-3xl border p-4 md:grid-cols-[48px_1fr_auto] ${styles.card}`}>
                <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-2xl ${styles.icon}`}><EventIcon event={event} /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${styles.badge}`}>{event.severity}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{event.kind}</span>
                    {event.ticketId && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">Ticket #{event.glpiTicketId || event.ticketId}</span>}
                    {event.actionRequired && <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white">AZIONE</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-white">{event.title}</h3>
                  <p className="mt-1 text-sm font-bold text-blue-100">{event.customer}</p>
                  <p className="mt-2 max-w-5xl text-sm font-semibold leading-relaxed text-slate-300">{event.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock size={13} />{formatDateTime(event.date)}</span>
                    <span>Fonte: {event.source}</span>
                    <span>Operatore: {event.operator || "Sistema"}</span>
                    {event.status && <span>Stato: {event.status}</span>}
                  </div>
                </div>
                {event.actionRequired && <div className="flex items-start justify-end"><button className="rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-red-950/30">{event.actionLabel || "Gestisci"}</button></div>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone }: any) {
  const toneClass = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : tone === "violet" ? "text-violet-300" : "text-blue-300";
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <Icon className={toneClass} size={22} />
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}
