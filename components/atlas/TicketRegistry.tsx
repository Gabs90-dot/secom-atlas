"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { AlertTriangle, ArrowDownUp, CheckCircle2, Clock, Download, Filter, Flame, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { materials, technicians } from "@/lib/atlasConstants";
import { euro, materialCost } from "@/lib/atlasUtils";
import TicketAttachmentsPanel from "@/components/atlas/TicketAttachmentsPanel";

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
  customerEntities?: any[];
  onToggleUrgent?: (ticket: any) => void;
  onOpenTicketDetail?: (ticket: any) => void;
  onRefreshTickets?: () => void;
  refreshingTickets?: boolean;
  onDeleteTicket?: (ticket: any) => void;
  executiveMode?: boolean;
};

function ticketMaterialsLabel(ticket: any) {
  return (
    (ticket.materialIds || [])
      .map((id: string) => materials.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(" + ") || "Nessuno"
  );
}

function ticketCustomerLabel(ticket: any) {
  return (
    ticket.customerName ||
    ticket.customer_name ||
    ticket.customer?.name ||
    ticket.customerId ||
    ticket.customer_id ||
    "Cliente non assegnato"
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function parseTicketDate(ticket: any) {
  const rawDate =
    ticket.openedAt ||
    ticket.opened_at ||
    ticket.created_at ||
    ticket.importedAt ||
    ticket.imported_at ||
    ticket.date;

  if (!rawDate) return 0;

  const parsed = new Date(rawDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function looksLikeFutureTicket(ticket: any) {
  const value = parseTicketDate(ticket);
  if (!value) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + 1);
  return value > limit.getTime();
}


function normalizeStatus(status?: any) {
  return String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim();
}

function displayStatus(ticket: any) {
  const value = normalizeStatus(ticket?.status || ticket?.ticket_status || ticket?.glpi_status);

  if (
    ticket?.closedAt ||
    ticket?.closed_at ||
    value === "5" ||
    value === "6" ||
    value.includes("chiuso") ||
    value.includes("closed") ||
    value.includes("risolto") ||
    value.includes("solved") ||
    value.includes("validato")
  ) {
    return "Chiuso";
  }

  if (value.includes("pian")) return "Pianificato";
  if (value.includes("sosp") || value.includes("attesa")) return "In sospeso";
  if (value.includes("lavor") || value.includes("assegn") || value.includes("carico")) return "In lavorazione";

  return ticket?.status || "Aperto";
}

function statusTone(status?: any) {
  const value = normalizeStatus(status);
  if (value.includes("chiuso") || value.includes("risolto") || value.includes("validato")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (value.includes("pian")) return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (value.includes("sosp") || value.includes("attesa")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (value.includes("lavor") || value.includes("assegn") || value.includes("carico")) return "bg-violet-500/15 text-violet-300 border-violet-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function isClosed(ticket: any) {
  return displayStatus(ticket) === "Chiuso";
}

function ticketDescription(ticket: any) {
  return (
    ticket.problem ||
    ticket.description ||
    ticket.content ||
    ticket.glpi_description ||
    ticket.glpi_raw?.content ||
    ticket.glpi_raw?.["21"] ||
    ticket.glpi_raw?.["Commenti - Descrizione"] ||
    ticket.glpi_raw?.["Descrizione"] ||
    "Descrizione non disponibile"
  );
}

function ticketTitle(ticket: any) {
  return (
    ticket.title ||
    ticket.name ||
    ticket.glpi_title ||
    ticket.glpi_raw?.name ||
    ticket.glpi_raw?.["1"] ||
    `Ticket #${ticket.id}`
  );
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


function entityOptionLabel(entity: any) {
  const level = Math.max(0, Number(entity.level || 0));
  const prefix = level > 0 ? `${"— ".repeat(Math.min(level, 5))}` : "";
  return `${prefix}${entity.name || entity.complete_name || "Entità"}`;
}

function entityOptionValue(entity: any) {
  return entity.complete_name || entity.name || String(entity.glpi_entity_id || "");
}

function buildEntityOptions(customerEntities: any[], availableRegions: string[]) {
  if (customerEntities.length > 0) {
    return customerEntities
      .slice()
      .sort((a, b) =>
        String(a.complete_name || a.name || "").localeCompare(
          String(b.complete_name || b.name || ""),
          "it",
        ),
      )
      .map((entity) => ({
        key: String(entity.id || entity.glpi_entity_id || entity.complete_name),
        value: entityOptionValue(entity),
        label: entityOptionLabel(entity),
      }));
  }

  return availableRegions.map((region) => ({
    key: String(region),
    value: String(region),
    label: String(region),
  }));
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
  customerEntities = [],
}: TicketRegistryProps) {
  const inputClass =
    variant === "mobile"
      ? "rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
      : "rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500";

  const entityOptions = buildEntityOptions(customerEntities, availableRegions);

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
            placeholder="Cerca sede, descrizione, ID ATLAS o ID GLPI"
            value={filterSite}
            onChange={(e) => setFilterSite?.(e.target.value)}
          />
        </div>

        <select className={inputClass} value={filterRegion} onChange={(e) => setFilterRegion?.(e.target.value)}>
          <option value="">Tutte le entità</option>
          {entityOptions.map((entityOption) => (
            <option key={entityOption.key} value={entityOption.value}>
              {entityOption.label}
            </option>
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
          <option value="Aperto">Aperti / non chiusi</option>
          <option value="Nuovo">Nuovo</option>
          <option value="Pianificato">Pianificato</option>
          <option value="In lavorazione">In lavorazione</option>
          <option value="In sospeso">In sospeso</option>
          <option value="Risolto">Risolto</option>
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

function TicketCard({ ticket, variant, onToggleUrgent, promptCloseTicket, setClosingTicketId, onOpenDetail, onDeleteTicket }: any) {
  const overdue = isOverdue(ticket);
  const closed = isClosed(ticket);
  const readableStatus = displayStatus(ticket);

  function openDetail() {
    onOpenDetail?.(ticket);
  }

  function stopAndRun(event: MouseEvent, action?: () => void) {
    event.preventDefault();
    event.stopPropagation();
    action?.();
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      className={`group min-w-0 cursor-pointer overflow-hidden rounded-3xl border p-4 outline-none transition-all focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
        ticket.urgent
          ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-950/20"
          : overdue
          ? "border-amber-500/50 bg-amber-500/10"
          : "border-white/10 bg-white/[0.055] hover:border-cyan-300/25 hover:bg-white/[0.08]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">#{ticket.id}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(readableStatus)}`}>{readableStatus}</span>
            {ticket.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white"><Flame size={13} /> URGENTE</span>}
            {overdue && <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white"><Clock size={13} /> SCADUTO</span>}
            {onDeleteTicket && (
              <button
                type="button"
                onClick={(event) => stopAndRun(event, () => onDeleteTicket(ticket))}
                className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-300/25 bg-red-500/10 text-red-100 opacity-75 transition hover:border-red-200/60 hover:bg-red-500/18 hover:opacity-100 hover:shadow-[0_0_22px_rgba(248,113,113,0.18)]"
                title="Elimina ticket"
                aria-label="Elimina ticket"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <h3 className="max-w-full truncate text-lg font-black text-white group-hover:text-cyan-50">{ticket.site || "Sede n/d"}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200">
              Cliente: {ticketCustomerLabel(ticket)}
            </span>
          </div>

          <p className="mt-2 break-words text-sm text-slate-400">{ticket.region || ticket.entity || "Area n/d"} · {ticket.technician || "Tecnico non assegnato"}</p>
          <p className="mt-3 break-words text-sm text-slate-300">{ticketDescription(ticket)}</p>

          <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/35 p-3"><span className="block font-black text-slate-300">Apertura</span>{formatDateTime(ticket.openedAt || ticket.opened_at || ticket.created_at || ticket.date)}</div>
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

          <button
            type="button"
            onClick={(event) => stopAndRun(event, openDetail)}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 hover:shadow-[0_0_24px_rgba(59,130,246,0.20)]"
          >
            Apri dettaglio
          </button>

          {!closed ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={(event) => stopAndRun(event, () => onToggleUrgent?.(ticket))}
                className={`rounded-2xl px-4 py-3 text-sm font-black text-white ${ticket.urgent ? "bg-slate-700" : "bg-red-600"}`}
              >
                {ticket.urgent ? "Togli urgenza" : "Rendi urgente"}
              </button>
              <button
                type="button"
                onClick={(event) => stopAndRun(event, () => variant === "mobile" ? promptCloseTicket?.(String(ticket.id)) : setClosingTicketId?.(String(ticket.id)))}
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
    </article>
  );
}

export default function TicketRegistry(props: TicketRegistryProps) {
  const { variant, tickets, exportCsv, setMobileView, card = "", onOpenTicketDetail, onRefreshTickets, refreshingTickets = false, executiveMode = false } = props;
  const [boardFilter, setBoardFilter] = useState<"all" | "open" | "urgent" | "overdue" | "closed">("all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);
  function openTicketDetail(ticket: any) {
    // Apertura robusta: il dettaglio interno si apre sempre.
    // Se page.tsx ha anche un workspace esterno, lo notifichiamo senza dipendere da quello.
    setSelectedTicket(ticket);
    onOpenTicketDetail?.(ticket);
  }

  const openCount = tickets.filter((ticket) => !isClosed(ticket)).length;
  const urgentCount = tickets.filter((ticket) => ticket.urgent && !isClosed(ticket)).length;
  const overdueCount = tickets.filter(isOverdue).length;
  const closedCount = tickets.filter(isClosed).length;

  const visibleTickets = useMemo(() => {
    let filtered = tickets;

    if (boardFilter === "open") {
      filtered = filtered.filter((ticket) => !isClosed(ticket));
    }

    if (boardFilter === "urgent") {
      filtered = filtered.filter((ticket) => ticket.urgent && !isClosed(ticket));
    }

    if (boardFilter === "overdue") {
      filtered = filtered.filter(isOverdue);
    }

    if (boardFilter === "closed") {
      filtered = filtered.filter(isClosed);
    }

    if (dateFilter) {
      filtered = filtered.filter((ticket) => {
        const rawDate =
          ticket.openedAt ||
          ticket.opened_at ||
          ticket.created_at ||
          ticket.date;

        if (!rawDate) return false;

        try {
          const ticketDate = new Date(rawDate).toISOString().slice(0, 10);
          return ticketDate === dateFilter;
        } catch {
          return false;
        }
      });
    }

    return filtered.slice().sort((a, b) => {
      const aFuture = looksLikeFutureTicket(a);
      const bFuture = looksLikeFutureTicket(b);

      if (aFuture !== bFuture) return aFuture ? 1 : -1;

      const aTime = parseTicketDate(a);
      const bTime = parseTicketDate(b);

      if (sortOrder === "oldest") return aTime - bTime;
      return bTime - aTime;
    });
  }, [tickets, boardFilter, dateFilter, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [boardFilter, dateFilter, sortOrder, pageSize, props.filterTechnician, props.filterRegion, props.filterStatus, props.filterSite, props.urgentOnly]);

  const totalPages = Math.max(1, Math.ceil(visibleTickets.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTickets = visibleTickets.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const pageStart = visibleTickets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(safeCurrentPage * pageSize, visibleTickets.length);

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
    <div className={executiveMode ? "grid w-full max-w-full min-w-0 gap-5 overflow-x-hidden rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.10),transparent_28%),linear-gradient(135deg,rgba(2,7,19,0.96),rgba(7,19,33,0.92)_48%,rgba(3,7,17,0.98))] p-4 shadow-[0_28px_100px_rgba(0,0,0,0.34)] md:p-5" : "grid w-full max-w-full min-w-0 gap-5 overflow-x-hidden"}>
      {selectedTicket && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                  Dettaglio ticket
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  #{selectedTicket.id} · {selectedTicket.site || "Sede n/d"}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(displayStatus(selectedTicket))}`}>
                    {displayStatus(selectedTicket)}
                  </span>
                  {selectedTicket.urgent && (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                      URGENTE
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Titolo</p>
                <p className="mt-2 text-lg font-black text-white">{ticketTitle(selectedTicket)}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Descrizione problema GLPI / ATLAS</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-200">
                  {ticketDescription(selectedTicket)}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-black text-slate-400">Apertura</p>
                  <p className="mt-1 font-black text-white">{formatDateTime(selectedTicket.openedAt || selectedTicket.opened_at || selectedTicket.created_at || selectedTicket.date)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-black text-slate-400">Chiusura prevista</p>
                  <p className="mt-1 font-black text-white">{formatDate(selectedTicket.expectedCloseDate || selectedTicket.expected_close_date)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-black text-slate-400">Chiusura</p>
                  <p className="mt-1 font-black text-white">{formatDate(selectedTicket.closedAt || selectedTicket.closed_at)}</p>
                </div>
              </div>

              <TicketAttachmentsPanel ticketId={selectedTicket.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-black text-slate-400">Cliente</p>
                  <p className="mt-1 break-words font-black text-white">{ticketCustomerLabel(selectedTicket)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-black text-slate-400">Tecnico / gruppo</p>
                  <p className="mt-1 break-words font-black text-white">{selectedTicket.technician || selectedTicket.glpi_technician_group || "Non assegnato"}</p>
                </div>
              </div>

              {(selectedTicket.closingNotes || selectedTicket.closing_notes || selectedTicket.futureNeeds || selectedTicket.future_needs) && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-black text-slate-400">Note chiusura / necessità future</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-200">
                    {selectedTicket.closingNotes || selectedTicket.closing_notes || selectedTicket.futureNeeds || selectedTicket.future_needs}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-40 -mx-1 grid gap-4 border-b border-white/10 bg-[#0b1524]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 overflow-hidden">
          <p className="break-words text-xs font-black uppercase tracking-[0.3em] text-blue-400">{executiveMode ? "MISSION OPERATIONS BOARD" : "CRM Operations Board"}</p>
          <h2 className="mt-2 break-words text-3xl font-black text-white md:text-4xl">Registro interventi</h2>
          <p className="mt-2 break-words text-sm text-slate-400">Priorità, scadenze, filtri e chiusure operative in un’unica vista.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await onRefreshTickets?.();
                setLastRefreshAt(new Date());

                setTimeout(() => {
                  setLastRefreshAt(null);
                }, 2500);
              } catch (error) {
                console.error(error);
              }
            }}
            disabled={refreshingTickets || !onRefreshTickets}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} className={refreshingTickets ? "animate-spin" : ""} />
            {refreshingTickets ? "Aggiorno..." : "Aggiorna"}
          </button>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600"
            title="Cambia ordinamento cronologico"
          >
            <ArrowDownUp size={18} />
            {sortOrder === "newest" ? "Più recenti" : "Più vecchi"}
          </button>

          <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
            <Download size={18} /> Esporta CSV
          </button>
        </div>
      </div>

      {lastRefreshAt && (
        <div className="fixed bottom-6 right-6 z-[120] rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-300" size={22} />
            <div>
              <p className="text-sm font-black text-emerald-200">
                Registro aggiornato
              </p>
              <p className="text-xs text-emerald-300/80">
                Dati ricaricati
              </p>
            </div>
          </div>
        </div>
      )}

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

      <div className="grid gap-3">
        <RegistryFilters {...props} />

        <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex min-w-[220px] flex-col gap-1">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Filtro data apertura
            </label>

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white"
            >
              Reset data
            </button>
          )}

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/20 hover:bg-blue-500"
            title="Cambia ordinamento cronologico"
          >
            <ArrowDownUp size={18} />
            Ordine: {sortOrder === "newest" ? "più recenti prima" : "più vecchi prima"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/35 p-3 text-xs font-black text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div>Visualizzati {pageStart}-{pageEnd} di {visibleTickets.length} interventi filtrati</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Per pagina</span>
          {[25, 50, 100].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setPageSize(size as 25 | 50 | 100)}
              className={`rounded-2xl px-3 py-2 ${pageSize === size ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="max-h-[58vh] min-h-[430px] overflow-y-auto overscroll-contain pr-2">
        <div className="grid min-w-0 gap-3">
        {visibleTickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">
            <XCircle className="mx-auto mb-3" size={30} />
            Nessuna chiamata trovata con questi filtri.
          </div>
        ) : (
          paginatedTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} {...props} onOpenDetail={openTicketDetail}
                onDeleteTicket={props.onDeleteTicket} />)
        )}
        </div>
      </div>

      {visibleTickets.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0b1524]/95 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black text-slate-400">
            Pagina {safeCurrentPage} di {totalPages} · {pageStart}-{pageEnd} di {visibleTickets.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(1)} className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Prima</button>
            <button type="button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Indietro</button>
            <button type="button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Avanti</button>
            <button type="button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Ultima</button>
          </div>
        </div>
      )}

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
