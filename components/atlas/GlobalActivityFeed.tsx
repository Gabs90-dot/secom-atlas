"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  UserRound,
  Zap,
} from "lucide-react";

type ActivityEvent = {
  id: string;
  ticket_id?: number | null;
  customer_id?: string | null;
  site_id?: number | null;
  event_type: string;
  title: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
};

type EventFilter = "all" | "critical" | "ticket" | "dispatch" | "system";

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
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function eventSeverity(event: ActivityEvent) {
  const type = normalize(event.event_type);
  const text = normalize(`${event.title} ${event.description}`);

  if (type.includes("urgent") || type.includes("sla") || text.includes("urgente") || text.includes("bloccato")) {
    return "critical";
  }

  if (type.includes("closed") || text.includes("chiuso") || text.includes("risolto")) {
    return "success";
  }

  if (type.includes("scheduled") || text.includes("pianificato")) {
    return "scheduled";
  }

  if (type.includes("assigned") || text.includes("assegnato")) {
    return "dispatch";
  }

  return "info";
}

function eventTone(event: ActivityEvent) {
  const severity = eventSeverity(event);

  if (severity === "critical") return "border-red-500/30 bg-red-500/15 text-red-200";
  if (severity === "success") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (severity === "scheduled") return "border-violet-500/30 bg-violet-500/15 text-violet-200";
  if (severity === "dispatch") return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  return "border-slate-500/30 bg-slate-500/15 text-slate-200";
}

function EventIcon({ event }: { event: ActivityEvent }) {
  const severity = eventSeverity(event);
  const className =
    severity === "critical"
      ? "text-red-300"
      : severity === "success"
      ? "text-emerald-300"
      : severity === "scheduled"
      ? "text-violet-300"
      : severity === "dispatch"
      ? "text-blue-300"
      : "text-slate-300";

  if (severity === "critical") return <ShieldAlert className={className} size={20} />;
  if (severity === "success") return <CheckCircle2 className={className} size={20} />;
  if (severity === "scheduled") return <CalendarDays className={className} size={20} />;
  if (severity === "dispatch") return <UserRound className={className} size={20} />;
  return <Activity className={className} size={20} />;
}

export default function GlobalActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [search, setSearch] = useState("");

  async function loadEvents() {
    const { data, error } = await supabase
      .from("ticket_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setEvents((data || []) as ActivityEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel("atlas-global-activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_events" },
        (payload) => {
          setEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, 80));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = normalize(search);

    return events.filter((event) => {
      const severity = eventSeverity(event);
      const type = normalize(event.event_type);
      const text = normalize(`${event.title} ${event.description} ${event.created_by} ${event.ticket_id}`);

      const matchesSearch = !q || text.includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "critical" && severity === "critical") ||
        (filter === "ticket" && type.includes("ticket")) ||
        (filter === "dispatch" && (severity === "dispatch" || normalize(event.created_by).includes("dispatch"))) ||
        (filter === "system" && normalize(event.created_by).includes("sistema"));

      return matchesSearch && matchesFilter;
    });
  }, [events, filter, search]);

  const criticalCount = events.filter((event) => eventSeverity(event) === "critical").length;
  const dispatchCount = events.filter((event) => eventSeverity(event) === "dispatch").length;
  const scheduledCount = events.filter((event) => eventSeverity(event) === "scheduled").length;

  const filterOptions: Array<{ key: EventFilter; label: string }> = [
    { key: "all", label: "Tutti" },
    { key: "critical", label: "Critici" },
    { key: "ticket", label: "Ticket" },
    { key: "dispatch", label: "Dispatch" },
    { key: "system", label: "Sistema" },
  ];

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
              ATLAS Activity Engine
            </p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              Activity feed globale
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Flusso eventi enterprise: assegnazioni, stati, pianificazioni, criticità e audit operativo.
            </p>
          </div>

          <button
            onClick={loadEvents}
            className="rounded-3xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-sm font-black text-blue-100 transition hover:bg-blue-500/15"
          >
            Aggiorna feed
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Activity className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{events.length}</p>
            <p className="text-sm font-bold text-slate-400">Eventi tracciati</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <AlertTriangle className="mb-3 text-red-300" size={22} />
            <p className="text-3xl font-black text-white">{criticalCount}</p>
            <p className="text-sm font-bold text-slate-400">Segnali critici</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Zap className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{dispatchCount}</p>
            <p className="text-sm font-bold text-slate-400">Azioni dispatch</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <CalendarDays className="mb-3 text-violet-300" size={22} />
            <p className="text-3xl font-black text-white">{scheduledCount}</p>
            <p className="text-sm font-bold text-slate-400">Pianificazioni</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
        <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca evento, ticket, operatore..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-4 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {filterOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  filter === item.key
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"
                }`}
              >
                <Filter size={14} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
            Caricamento activity feed...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
            Nessun evento trovato con questi filtri.
          </div>
        ) : (
          <div className="relative grid gap-3 before:absolute before:left-6 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-white/10">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="relative grid grid-cols-[3rem_1fr] gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-blue-500/10"
              >
                <div className="z-10 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 shadow-lg shadow-black/20">
                  <EventIcon event={event} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-white">{event.title || "Evento"}</p>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${eventTone(event)}`}>
                      {event.event_type || "event"}
                    </span>
                    {event.ticket_id && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">
                        Ticket #{event.ticket_id}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="mt-2 text-sm font-bold text-slate-400">{event.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      <Clock size={12} className="mr-1 inline" />
                      {formatDateTime(event.created_at)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {event.created_by || "Sistema"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
