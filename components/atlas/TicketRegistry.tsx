"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, Filter, Flame, Search, XCircle } from "lucide-react";
import { materials, technicians } from "@/lib/atlasConstants";
import { euro, materialCost } from "@/lib/atlasUtils";

type TicketRegistryProps = {
  variant: "mobile" | "desktop";
  tickets: any[];
  exportCsv: () => void;
  promptCloseTicket?: (id: string) => void;
  setClosingTicketId?: (id: string) => void;
  setMobileView?: (value: any) => void;
  card?: string;
  filterTechnician?: string;
  setFilterTechnician?: (value: string) => void;
  filterRegion?: string;
  setFilterRegion?: (value: string) => void;
  filterStatus?: string;
  setFilterStatus?: (value: string) => void;
  filterSite?: string;
  setFilterSite?: (value: string) => void;
  urgentOnly?: boolean;
  setUrgentOnly?: (value: boolean) => void;
  availableRegions?: string[];
  onToggleUrgent?: (ticket: any) => void;
};

function ticketMaterialsLabel(ticket: any) {
  return (
    (ticket.materialIds || [])
      .map((id: string) => materials.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(" + ") || "Nessuno"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return String(value);
  }
}

function normalizeStatus(status?: string) {
  return String(status || "").toLowerCase();
}

function statusTone(status?: string) {
  const value = normalizeStatus(status);
  if (value.includes("chiuso")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (value.includes("pian")) return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (value.includes("sosp")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (value.includes("lavor")) return "bg-violet-500/15 text-violet-300 border-violet-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function isClosed(ticket: any) {
  return normalizeStatus(ticket.status).includes("chiuso");
}

function isOverdue(ticket: any) {
  if (!ticket.expectedCloseDate || isClosed(ticket)) return false;
  const expected = new Date(ticket.expectedCloseDate);
  const today = new Date();
  expected.setHours(23, 59, 59, 999);
  return expected.getTime() < today.getTime();
}

function StatCard({ label, value, tone, icon: Icon, onClick, active }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 overflow-hidden rounded-3xl border p-4 text-left transition-all ${tone} ${
        active ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#07111f]" : "hover:scale-[1.01]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <Icon size={24} />
      </div>
    </button>
  );
}

function RegistryFilters({
  variant,
  filterTechnician = "",
  setFilterTechnician,
  filterRegion = "",
  setFilterRegion,
  filterStatus = "",
  setFilterStatus,
  filterSite = "",
  setFilterSite,
  urgentOnly = false,
  setUrgentOnly,
  availableRegions = [],
}: TicketRegistryProps) {
  const inputClass =
    variant === "mobile"
      ? "rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
      : "rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500";

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
        <Filter size={16} /> Filtri registro
      </div>
      <div className={`grid min-w-0 gap-3 ${variant === "desktop" ? "xl:grid-cols-5" : ""}`}>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className={`${inputClass} w-full pl-10`}
            placeholder="Filtra per sede"
            value={filterSite}
            onChange={(e) => setFilterSite?.(e.target.value)}
          />
        </div>

        <select className={inputClass} value={filterRegion} onChange={(e) => setFilterRegion?.(e.target.value)}>
          <option value="">Tutte le regioni</option>
          {availableRegions.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>

        <select className={inputClass} value={filterTechnician} onChange={(e) => setFilterTechnician?.(e.target.value)}>
          <option value="">Tutti i tecnici</option>
          {technicians.map((technician) => (
            <option key={technician} value={technician}>{technician}</option>
          ))}
        </select>

        <select className={inputClass} value={filterStatus} onChange={(e) => setFilterStatus?.(e.target.value)}>
          <option value="">Tutti gli stati</option>
          <option value="Aperto">Aperto</option>
          <option value="Pianificato">Pianificato</option>
          <option value="In lavorazione">In lavorazione</option>
          <option value="In sospeso">In sospeso</option>
          <option value="Chiuso">Chiuso</option>
        </select>

        <button
          type="button"
          onClick={() => setUrgentOnly?.(!urgentOnly)}
          className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
            urgentOnly
              ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-950/30"
              : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"
          }`}
        >
          Solo urgenti
        </button>
      </div>
    </div>
  );
}

function TicketCard({ ticket, variant, onToggleUrgent, promptCloseTicket, setClosingTicketId }: any) {
  const overdue = isOverdue(ticket);
  const closed = isClosed(ticket);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-3xl border p-4 transition-all ${
        ticket.urgent
          ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-950/20"
          : overdue
          ? "border-amber-500/50 bg-amber-500/10"
          : "border-white/10 bg-white/[0.055] hover:bg-white/[0.08]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">#{ticket.id}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(ticket.status)}`}>{ticket.status || "Stato n/d"}</span>
            {ticket.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white"><Flame size={13} /> URGENTE</span>}
            {overdue && <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white"><Clock size={13} /> SCADUTO</span>}
          </div>

          <h3 className="max-w-full truncate text-lg font-black text-white">{ticket.site || "Sede n/d"}</h3>
          <p className="mt-1 break-words text-sm text-slate-400">{ticket.region || "Regione n/d"} · {ticket.technician || "Tecnico non assegnato"}</p>
          <p className="mt-3 break-words text-sm text-slate-300">{ticket.problem || "Descrizione non disponibile"}</p>

          <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/35 p-3"><span className="block font-black text-slate-300">Apertura</span>{formatDate(ticket.openedAt)}</div>
            <div className={`rounded-2xl p-3 ${overdue ? "bg-amber-500/15 text-amber-200" : "bg-slate-950/35"}`}><span className="block font-black text-slate-300">Chiusura prevista</span>{formatDate(ticket.expectedCloseDate)}</div>
            <div className="rounded-2xl bg-slate-950/35 p-3"><span className="block font-black text-slate-300">Chiusura</span>{formatDate(ticket.closedAt)}</div>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 rounded-3xl bg-slate-950/30 p-4 xl:w-[220px] xl:min-w-[220px]">
          <div className="min-w-0 overflow-hidden">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Costo materiali</p>
            <p className="mt-1 text-2xl font-black text-white">{euro(materialCost(ticket.materialIds || []))}</p>
            <p className="mt-1 break-words text-xs text-slate-500">{ticketMaterialsLabel(ticket)}</p>
          </div>

          {!closed ? (
            <div className="grid gap-2">
              <button
                onClick={() => onToggleUrgent?.(ticket)}
                className={`rounded-2xl px-4 py-3 text-sm font-black text-white ${ticket.urgent ? "bg-slate-700" : "bg-red-600"}`}
              >
                {ticket.urgent ? "Togli urgenza" : "Rendi urgente"}
              </button>
              <button
                onClick={() => (variant === "mobile" ? promptCloseTicket?.(String(ticket.id)) : setClosingTicketId?.(String(ticket.id)))}
                className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white"
              >
                Chiudi intervento
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-300">
              <CheckCircle2 size={17} /> Intervento chiuso
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketRegistry(props: TicketRegistryProps) {
  const { variant, tickets, exportCsv, setMobileView, card = "" } = props;
  const [boardFilter, setBoardFilter] = useState<"all" | "open" | "urgent" | "overdue" | "closed">("all");

  const openCount = tickets.filter((ticket) => !isClosed(ticket)).length;
  const urgentCount = tickets.filter((ticket) => ticket.urgent && !isClosed(ticket)).length;
  const overdueCount = tickets.filter(isOverdue).length;
  const closedCount = tickets.filter(isClosed).length;

  const visibleTickets = useMemo(() => {
    if (boardFilter === "open") return tickets.filter((ticket) => !isClosed(ticket));
    if (boardFilter === "urgent") return tickets.filter((ticket) => ticket.urgent && !isClosed(ticket));
    if (boardFilter === "overdue") return tickets.filter(isOverdue);
    if (boardFilter === "closed") return tickets.filter(isClosed);
    return tickets;
  }, [tickets, boardFilter]);

  const boardFilterLabel =
    boardFilter === "open"
      ? "Aperti"
      : boardFilter === "urgent"
      ? "Urgenti"
      : boardFilter === "overdue"
      ? "Scaduti"
      : boardFilter === "closed"
      ? "Chiusi"
      : "";

  const board = (
    <div className="grid w-full max-w-full min-w-0 gap-5 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 overflow-hidden">
          <p className="break-words text-xs font-black uppercase tracking-[0.3em] text-blue-400">CRM Operations Board</p>
          <h2 className="mt-2 break-words text-3xl font-black text-white md:text-4xl">Registro interventi</h2>
          <p className="mt-2 break-words text-sm text-slate-400">Priorità, scadenze, filtri e chiusure operative in un’unica vista.</p>
        </div>

        <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
          <Download size={18} /> Esporta CSV
        </button>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aperti" value={openCount} icon={Clock} tone="border-blue-500/30 bg-blue-500/10 text-blue-200" active={boardFilter === "open"} onClick={() => setBoardFilter(boardFilter === "open" ? "all" : "open")} />
        <StatCard label="Urgenti" value={urgentCount} icon={Flame} tone="border-red-500/40 bg-red-500/10 text-red-200" active={boardFilter === "urgent"} onClick={() => setBoardFilter(boardFilter === "urgent" ? "all" : "urgent")} />
        <StatCard label="Scaduti" value={overdueCount} icon={AlertTriangle} tone="border-amber-500/40 bg-amber-500/10 text-amber-200" active={boardFilter === "overdue"} onClick={() => setBoardFilter(boardFilter === "overdue" ? "all" : "overdue")} />
        <StatCard label="Chiusi" value={closedCount} icon={CheckCircle2} tone="border-emerald-500/30 bg-emerald-500/10 text-emerald-200" active={boardFilter === "closed"} onClick={() => setBoardFilter(boardFilter === "closed" ? "all" : "closed")} />
      </div>

      {boardFilter !== "all" && (
        <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Vista filtrata</p>
            <p className="mt-1 break-words text-lg font-black">{boardFilterLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setBoardFilter("all")}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
          >
            Reset filtro board
          </button>
        </div>
      )}

      <RegistryFilters {...props} />

      <div className="grid min-w-0 gap-3">
        {visibleTickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">
            <XCircle className="mx-auto mb-3" size={30} />
            Nessuna chiamata trovata con questi filtri.
          </div>
        ) : (
          visibleTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} {...props} />)
        )}
      </div>

      {variant === "mobile" && (
        <button onClick={() => setMobileView?.("operativo")} className="sticky bottom-4 w-full max-w-full rounded-3xl bg-blue-600 p-5 text-xl font-black text-white shadow-lg shadow-blue-950/40">
          + Nuova chiamata/intervento
        </button>
      )}
    </div>
  );

  if (variant === "mobile") return board;

  return <section className={`${card} hidden md:block`}>{board}</section>;
}
