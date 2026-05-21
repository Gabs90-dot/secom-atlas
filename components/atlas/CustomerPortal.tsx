"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  LifeBuoy,
  MessageSquare,
  Package,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import type { AtlasUser } from "@/lib/auth";
import type { AtlasTenant } from "@/lib/tenant";

type CustomerPortalProps = {
  user: AtlasUser;
  tenant: AtlasTenant | null;
  tickets: any[];
  sites: any[];
  onOpenTicket?: (customer?: any, site?: any) => void;
};

type PortalFilter = "all" | "open" | "urgent" | "planned" | "closed";

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function ticketDateValue(ticket: any) {
  return (
    ticket.openedAt ||
    ticket.opened_at ||
    ticket.created_at ||
    ticket.date ||
    ticket.intervention_date ||
    ""
  );
}

function isClosed(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("chiuso") || status.includes("risolto") || status.includes("validato");
}

function isPlanned(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("pian") || Boolean(ticket.date || ticket.intervention_date);
}

function isSlaRisk(ticket: any) {
  if (isClosed(ticket)) return false;

  const expected = ticket.expectedCloseDate || ticket.expected_close_date;
  if (!expected) return false;

  const expectedTime = new Date(expected).getTime();
  if (!expectedTime) return false;

  return expectedTime < Date.now();
}

function daysOpen(ticket: any) {
  const raw = ticketDateValue(ticket);
  if (!raw) return 0;

  const time = new Date(raw).getTime();
  if (!time) return 0;

  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function statusTone(ticket: any) {
  if (ticket.urgent) return "border-red-500/30 bg-red-500/15 text-red-200";
  if (isSlaRisk(ticket)) return "border-amber-500/30 bg-amber-500/15 text-amber-200";

  const status = normalize(ticket.status);
  if (isClosed(ticket)) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (status.includes("attesa")) return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (status.includes("pian") || status.includes("assegn") || status.includes("lavor")) {
    return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  }

  return "border-slate-500/30 bg-slate-500/15 text-slate-200";
}


function hasCustomerScope(user: AtlasUser) {
  return user.role === "cliente" && (Boolean(user.customerId) || Boolean(user.siteIds?.length));
}

function belongsToCustomerScope(item: any, user: AtlasUser) {
  if (user.role !== "cliente") return true;

  const customerId = String(user.customerId || "");
  const siteIds = (user.siteIds || []).map((value) => String(value));
  const itemCustomerId = String(item.customerId || item.customer_id || item.customer || "");
  const itemSiteId = String(item.siteId || item.site_id || item.id || "");

  return (
    (customerId && itemCustomerId === customerId) ||
    (itemSiteId && siteIds.includes(itemSiteId))
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}: {
  icon: any;
  label: string;
  value: string | number;
  detail: string;
  tone?: "blue" | "emerald" | "amber" | "red" | "violet";
}) {
  const toneClass = {
    blue: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    red: "text-red-300 bg-red-500/10 border-red-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  }[tone];

  return (
    <div className={`rounded-[1.75rem] border p-4 ${toneClass}`}>
      <Icon size={22} className="mb-3" />
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-black text-white">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{detail}</p>
    </div>
  );
}

export default function CustomerPortal({
  user,
  tenant,
  tickets,
  sites,
  onOpenTicket,
}: CustomerPortalProps) {
  const [filter, setFilter] = useState<PortalFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const scopedSites = useMemo(() => {
    if (user.role !== "cliente") return sites;
    return sites.filter((site) => belongsToCustomerScope(site, user));
  }, [sites, user]);

  const scopedTickets = useMemo(() => {
    if (user.role !== "cliente") return tickets;
    return tickets.filter((ticket) => belongsToCustomerScope(ticket, user));
  }, [tickets, user]);

  const visibleTickets = useMemo(() => {
    let list = [...scopedTickets];

    if (filter === "open") list = list.filter((ticket) => !isClosed(ticket));
    if (filter === "urgent") list = list.filter((ticket) => Boolean(ticket.urgent));
    if (filter === "planned") list = list.filter(isPlanned);
    if (filter === "closed") list = list.filter(isClosed);

    const query = normalize(search);
    if (query) {
      list = list.filter((ticket) =>
        normalize(`${ticket.site} ${ticket.city} ${ticket.region} ${ticket.problem} ${ticket.status}`).includes(query)
      );
    }

    return list.sort((a, b) => {
      if (Boolean(b.urgent) !== Boolean(a.urgent)) return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent));
      if (isSlaRisk(b) !== isSlaRisk(a)) return Number(isSlaRisk(b)) - Number(isSlaRisk(a));
      return new Date(ticketDateValue(b)).getTime() - new Date(ticketDateValue(a)).getTime();
    });
  }, [scopedTickets, filter, search]);

  const openTickets = scopedTickets.filter((ticket) => !isClosed(ticket));
  const urgentTickets = scopedTickets.filter((ticket) => Boolean(ticket.urgent) && !isClosed(ticket));
  const plannedTickets = scopedTickets.filter((ticket) => isPlanned(ticket) && !isClosed(ticket));
  const slaRiskTickets = scopedTickets.filter(isSlaRisk);
  const lastTicket = [...scopedTickets].sort(
    (a, b) => new Date(ticketDateValue(b)).getTime() - new Date(ticketDateValue(a)).getTime()
  )[0];

  const healthScore = Math.max(
    0,
    Math.min(100, 100 - urgentTickets.length * 18 - slaRiskTickets.length * 14 - Math.max(0, openTickets.length - 3) * 6)
  );

  const healthTone =
    healthScore >= 80
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
      : healthScore >= 60
      ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
      : "border-red-500/30 bg-red-500/15 text-red-200";

  return (
    <section className="grid gap-5">
      {user.role === "cliente" && !hasCustomerScope(user) && (
        <div className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
          Portale cliente isolato attivo, ma questo utente non ha ancora customer_id o site_ids assegnati in tenant_users.
        </div>
      )}
      {selectedTicket && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Customer portal</p>
                <h3 className="mt-2 text-2xl font-black text-white">Ticket #{selectedTicket.id}</h3>
                <p className="mt-2 text-sm font-bold text-slate-400">{selectedTicket.site || "Sede n/d"}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
              >
                Chiudi
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stato</p>
                <p className={`mt-2 w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone(selectedTicket)}`}>
                  {selectedTicket.status || "Nuovo"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Aperto</p>
                <p className="mt-2 font-black text-white">{formatDate(ticketDateValue(selectedTicket))}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">SLA / Previsto</p>
                <p className="mt-2 font-black text-white">{formatDate(selectedTicket.expectedCloseDate || selectedTicket.expected_close_date)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-black text-slate-400">Descrizione richiesta</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-200">
                {selectedTicket.problem || "Descrizione non disponibile"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Tecnico</p>
                <p className="mt-2 font-black text-white">{selectedTicket.technician || "Non ancora assegnato"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Pianificazione</p>
                <p className="mt-2 font-black text-white">
                  {formatDate(selectedTicket.date || selectedTicket.intervention_date)}
                  {selectedTicket.slot ? ` · ${selectedTicket.slot}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <Activity className="mt-1 text-blue-300" size={20} />
                <div>
                  <p className="text-sm font-black text-white">Timeline cliente V1</p>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    Qui collegheremo messaggi, allegati, avanzamenti SLA e aggiornamenti automatici del ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[2.25rem] border border-blue-500/20 bg-gradient-to-br from-blue-500/15 via-white/[0.055] to-slate-950/40 p-5 shadow-2xl shadow-black/20 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS Customer Portal</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Area cliente</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Vista esterna premium per ticket, SLA, interventi pianificati, storico e asset collegati.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-200">
                <UserRound size={21} />
              </div>
              <div>
                <p className="text-sm font-black text-white">{user.name}</p>
                <p className="text-xs font-bold text-slate-400">{tenant?.name || user.tenantName || "Tenant"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <MetricCard icon={Ticket} label="Ticket aperti" value={openTickets.length} detail="Richieste ancora attive" tone="blue" />
          <MetricCard icon={AlertTriangle} label="Urgenze" value={urgentTickets.length} detail="Priorità alta" tone="red" />
          <MetricCard icon={CalendarDays} label="Pianificati" value={plannedTickets.length} detail="Interventi in calendario" tone="violet" />
          <MetricCard icon={ShieldCheck} label="SLA risk" value={slaRiskTickets.length} detail="Da monitorare" tone="amber" />
          <MetricCard icon={Package} label="Sedi" value={scopedSites.length} detail="Posizioni collegate" tone="emerald" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Customer health</p>
              <h3 className="mt-1 text-2xl font-black text-white">Stato rapporto</h3>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${healthTone}`}>{healthScore}/100</span>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-5xl font-black text-white">{healthScore}</p>
            <p className="mt-2 text-sm font-bold text-slate-400">Indice sintetico basato su ticket aperti, urgenze e rischio SLA.</p>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-black text-white">Ultima attività</p>
              <p className="mt-1 text-sm font-bold text-slate-400">
                {lastTicket ? `${formatDate(ticketDateValue(lastTicket))} · ${lastTicket.site || "Sede n/d"}` : "Nessuna attività registrata"}
              </p>
            </div>
            <button
              onClick={() => onOpenTicket?.(undefined, undefined)}
              className="flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              <LifeBuoy size={18} />
              Apri nuova richiesta
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Ticket tracking</p>
              <h3 className="mt-1 text-2xl font-black text-white">Le tue richieste</h3>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cerca ticket..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-9 pr-3 text-xs font-bold text-white outline-none placeholder:text-slate-500 md:w-56"
                />
              </div>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as PortalFilter)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-xs font-black text-white outline-none"
              >
                <option value="all">Tutti</option>
                <option value="open">Aperti</option>
                <option value="urgent">Urgenti</option>
                <option value="planned">Pianificati</option>
                <option value="closed">Chiusi</option>
              </select>
            </div>
          </div>

          <div className="grid max-h-[720px] gap-3 overflow-y-auto pr-1">
            {visibleTickets.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
                Nessun ticket trovato per questo filtro.
              </div>
            ) : (
              visibleTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:bg-blue-500/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-white">#{ticket.id}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusTone(ticket)}`}>
                          {ticket.status || "Nuovo"}
                        </span>
                        {ticket.urgent && <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-black text-white">URGENTE</span>}
                        {isSlaRisk(ticket) && <span className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-black text-white">SLA RISK</span>}
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-black text-white">{ticket.site || "Sede n/d"}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">{ticket.problem || "Descrizione non disponibile"}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 text-xs font-black text-slate-300 md:justify-end">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        <Clock size={12} className="mr-1 inline" />
                        {daysOpen(ticket)} gg
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        <CalendarDays size={12} className="mr-1 inline" />
                        {formatDate(ticket.date || ticket.intervention_date || ticketDateValue(ticket))}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <FileText className="mb-3 text-blue-300" size={24} />
          <p className="text-lg font-black text-white">Contratti e SLA</p>
          <p className="mt-2 text-sm font-bold text-slate-400">Area pronta per esporre contratti, SLA e documenti al cliente.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <Package className="mb-3 text-violet-300" size={24} />
          <p className="text-lg font-black text-white">Asset cliente</p>
          <p className="mt-2 text-sm font-bold text-slate-400">Collegheremo asset, sistemi, seriali, garanzie e storico interventi.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <MessageSquare className="mb-3 text-emerald-300" size={24} />
          <p className="text-lg font-black text-white">Comunicazioni</p>
          <p className="mt-2 text-sm font-bold text-slate-400">Prossimo step: messaggi cliente-operatore e allegati ticket.</p>
        </div>
      </div>
    </section>
  );
}
