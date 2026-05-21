"use client";

import {
  ArrowRight,
  Building2,
  Flame,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";

type CustomerSitesPanelProps = {
  currentCustomer: any | null;
  selectedSite: any | null;
  relatedSites: any[];
  relatedTickets: any[];
  onSelectSite?: (site: any) => void;
  onOpenTicket?: (customer: any, site?: any) => void;
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

function isClosed(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("chiuso") || status.includes("risolto") || status.includes("validato");
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (!time || Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function ticketDateValue(ticket: any) {
  return ticket.openedAt || ticket.opened_at || ticket.date || ticket.intervention_date || ticket.created_at || "";
}

function siteKey(site: any) {
  return String(site?.id || site?.name || site?.site || "site");
}

function ticketBelongsToSite(ticket: any, site: any) {
  const ticketSiteId = String(ticket.site_id || ticket.siteId || "");
  const siteId = String(site.id || "");

  if (ticketSiteId && siteId && ticketSiteId === siteId) return true;

  return normalize(ticket.site) === normalize(site.name || site.site);
}

function getSiteHealthScore(tickets: any[]) {
  const open = tickets.filter((ticket) => !isClosed(ticket));
  const urgent = tickets.filter((ticket) => Boolean(ticket.urgent) && !isClosed(ticket));
  const oldOpen = open.filter((ticket) => daysSince(ticketDateValue(ticket)) >= 7);

  return Math.max(
    0,
    Math.min(100, 100 - urgent.length * 20 - oldOpen.length * 10 - Math.max(0, open.length - 2) * 7)
  );
}

function healthTone(score: number) {
  if (score >= 80) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (score >= 60) return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  return "border-red-500/30 bg-red-500/15 text-red-200";
}

export default function CustomerSitesPanel({
  currentCustomer,
  selectedSite,
  relatedSites,
  relatedTickets,
  onSelectSite,
  onOpenTicket,
}: CustomerSitesPanelProps) {
  const normalizedSites = relatedSites.length
    ? relatedSites
    : Array.from(
        relatedTickets
          .reduce((map: Map<string, any>, ticket: any) => {
            const key = String(ticket.site_id || ticket.site || ticket.siteId || "");
            if (!key) return map;

            if (!map.has(key)) {
              map.set(key, {
                id: ticket.site_id || ticket.siteId || key,
                name: ticket.site || "Sede n/d",
                city: ticket.city || "",
                region: ticket.region || "",
                entity: ticket.entity || "",
                customer_id: ticket.customerId || ticket.customer_id || currentCustomer?.id || null,
              });
            }

            return map;
          }, new Map<string, any>())
          .values()
      );

  const rows = normalizedSites
    .map((site) => {
      const tickets = relatedTickets.filter((ticket) => ticketBelongsToSite(ticket, site));
      const open = tickets.filter((ticket) => !isClosed(ticket));
      const urgent = tickets.filter((ticket) => Boolean(ticket.urgent) && !isClosed(ticket));
      const score = getSiteHealthScore(tickets);
      const lastActivity = tickets
        .map(ticketDateValue)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

      return {
        site,
        tickets,
        open,
        urgent,
        score,
        lastActivity,
      };
    })
    .sort((a, b) => {
      if (b.urgent.length !== a.urgent.length) return b.urgent.length - a.urgent.length;
      if (b.open.length !== a.open.length) return b.open.length - a.open.length;
      return a.score - b.score;
    });

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
        Nessuna sede collegata trovata. I ticket storici sono presenti, ma non abbiamo ancora una lista sedi associata a questo cliente.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <Building2 className="mb-3 text-blue-300" size={22} />
          <p className="text-3xl font-black text-white">{rows.length}</p>
          <p className="text-sm font-bold text-slate-400">Sedi collegate</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <Ticket className="mb-3 text-emerald-300" size={22} />
          <p className="text-3xl font-black text-white">{relatedTickets.length}</p>
          <p className="text-sm font-bold text-slate-400">Ticket storici</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <Flame className="mb-3 text-red-300" size={22} />
          <p className="text-3xl font-black text-white">
            {rows.reduce((sum, row) => sum + row.urgent.length, 0)}
          </p>
          <p className="text-sm font-bold text-slate-400">Urgenze sedi</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <ShieldCheck className="mb-3 text-violet-300" size={22} />
          <p className="text-3xl font-black text-white">
            {Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)}
          </p>
          <p className="text-sm font-bold text-slate-400">Health medio</p>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map(({ site, tickets, open, urgent, score, lastActivity }) => {
          const active = selectedSite && String(selectedSite.id || selectedSite.name) === String(site.id || site.name);

          return (
            <div
              key={siteKey(site)}
              className={`rounded-3xl border p-4 transition ${
                active
                  ? "border-blue-500/60 bg-blue-500/15"
                  : "border-white/10 bg-white/[0.04] hover:bg-blue-500/10"
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  onClick={() => onSelectSite?.(site)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-200">
                      <MapPin size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white">{site.name || site.site || "Sede n/d"}</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {[site.city, site.region, site.entity].filter(Boolean).join(" · ") || "Dettagli sede non disponibili"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">
                          {tickets.length} ticket
                        </span>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">
                          {open.length} aperti
                        </span>
                        {urgent.length > 0 && (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-white">
                            {urgent.length} urgenze
                          </span>
                        )}
                        <span className={`rounded-full border px-3 py-1 ${healthTone(score)}`}>
                          Health {score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <p className="text-xs font-bold text-slate-500">
                    Ultima attività: {lastActivity ? new Date(lastActivity).toLocaleDateString("it-IT") : "—"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectSite?.(site)}
                      className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white hover:bg-white/[0.12]"
                    >
                      Apri sede
                    </button>
                    <button
                      onClick={() => onOpenTicket?.(currentCustomer || site, site)}
                      className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-500"
                    >
                      Ticket
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
