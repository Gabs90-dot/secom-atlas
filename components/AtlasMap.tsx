"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

type AtlasMapProps = {
  sites: any[];
  tickets: any[];
};

type MapFilter = "all" | "urgent" | "open" | "planned" | "unassigned";

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
  const status = normalize(ticket?.status);
  return status.includes("chiuso") || status.includes("validato") || status.includes("risolto");
}

function isPlanned(ticket: any) {
  const status = normalize(ticket?.status);
  return status.includes("pian") || Boolean(ticket?.date || ticket?.intervention_date);
}

function ticketDateValue(ticket: any) {
  return (
    ticket?.openedAt ||
    ticket?.opened_at ||
    ticket?.date ||
    ticket?.intervention_date ||
    ticket?.created_at ||
    ""
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

function daysOpen(ticket: any) {
  const raw = ticketDateValue(ticket);
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  if (!time) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function getTicketsForSite(site: any, tickets: any[]) {
  const siteName = normalize(site?.name);
  const siteId = String(site?.id || "");

  return tickets.filter((ticket) => {
    const sameSiteId =
      siteId &&
      (String(ticket.site_id || "") === siteId || String(ticket.siteId || "") === siteId);

    const sameSiteName = siteName && normalize(ticket.site) === siteName;

    return sameSiteId || sameSiteName;
  });
}

function getPrimaryTicket(siteTickets: any[]) {
  if (!siteTickets.length) return null;

  return [...siteTickets].sort((a, b) => {
    if (Boolean(b.urgent) !== Boolean(a.urgent)) {
      return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent));
    }

    if (isClosed(a) !== isClosed(b)) {
      return Number(isClosed(a)) - Number(isClosed(b));
    }

    return daysOpen(b) - daysOpen(a);
  })[0];
}

function getMarkerColor(ticket: any, count: number) {
  if (!ticket && count === 0) return "#64748b";
  if (ticket?.urgent) return "#dc2626";
  if (isClosed(ticket)) return "#16a34a";
  if (isPlanned(ticket)) return "#facc15";
  if (!ticket?.technician) return "#a855f7";
  return "#2563eb";
}

function createIcon(color: string, options?: { urgent?: boolean; count?: number }) {
  const urgent = options?.urgent;
  const count = options?.count || 0;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: ${urgent ? "30px" : "24px"};
        height: ${urgent ? "30px" : "24px"};
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${
          urgent
            ? `<div style="
                position:absolute;
                inset:-8px;
                border-radius:9999px;
                background:${color};
                opacity:.22;
                box-shadow:0 0 24px ${color};
              "></div>`
            : ""
        }
        <div style="
          width: ${urgent ? "22px" : "18px"};
          height: ${urgent ? "22px" : "18px"};
          background: ${color};
          border: 3px solid white;
          border-radius: 9999px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.42);
        "></div>
        ${
          count > 1
            ? `<div style="
                position:absolute;
                right:-8px;
                top:-8px;
                min-width:18px;
                height:18px;
                padding:0 5px;
                border-radius:9999px;
                background:#020617;
                border:1px solid rgba(255,255,255,.7);
                color:white;
                font-size:10px;
                font-weight:900;
                line-height:17px;
                text-align:center;
              ">${count}</div>`
            : ""
        }
      </div>
    `,
    iconSize: [urgent ? 30 : 24, urgent ? 30 : 24],
    iconAnchor: [urgent ? 15 : 12, urgent ? 15 : 12],
  });
}

function statusLabel(ticket: any) {
  if (!ticket) return "Nessun ticket";
  if (ticket.urgent) return "Urgente";
  return ticket.status || "Nuovo";
}

function statusClass(ticket: any) {
  if (!ticket) return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  if (ticket.urgent) return "bg-red-500/15 text-red-200 border-red-500/30";
  if (isClosed(ticket)) return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  if (isPlanned(ticket)) return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  if (!ticket.technician) return "bg-violet-500/15 text-violet-200 border-violet-500/30";
  return "bg-blue-500/15 text-blue-200 border-blue-500/30";
}

export default function AtlasMap({ sites, tickets }: AtlasMapProps) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  const mappedSites = useMemo(() => {
    return sites
      .filter((site) => site.lat && site.lng)
      .map((site) => {
        const siteTickets = getTicketsForSite(site, tickets);
        const primaryTicket = getPrimaryTicket(siteTickets);

        return {
          site,
          tickets: siteTickets,
          primaryTicket,
        };
      });
  }, [sites, tickets]);

  const technicians = useMemo(() => {
    return Array.from(new Set(tickets.map((ticket) => ticket.technician).filter(Boolean))).sort();
  }, [tickets]);

  const filteredSites = useMemo(() => {
    return mappedSites.filter((item) => {
      const ticket = item.primaryTicket;
      const siteTickets = item.tickets;

      if (selectedArea) {
        const area = normalize(`${item.site.region || ""} ${item.site.city || ""}`);
        if (!area.includes(normalize(selectedArea))) return false;
      }

      if (technicianFilter) {
        const hasTechnician = siteTickets.some(
          (siteTicket) => normalize(siteTicket.technician) === normalize(technicianFilter)
        );
        if (!hasTechnician) return false;
      }

      if (filter === "urgent") return siteTickets.some((siteTicket) => Boolean(siteTicket.urgent));
      if (filter === "open") return siteTickets.some((siteTicket) => !isClosed(siteTicket));
      if (filter === "planned") return siteTickets.some(isPlanned);
      if (filter === "unassigned") return siteTickets.some((siteTicket) => !siteTicket.technician && !isClosed(siteTicket));

      return Boolean(ticket) || filter === "all";
    });
  }, [mappedSites, filter, technicianFilter, selectedArea]);

  const activeTickets = tickets.filter((ticket) => !isClosed(ticket));
  const urgentTickets = activeTickets.filter((ticket) => Boolean(ticket.urgent));
  const plannedTickets = activeTickets.filter(isPlanned);
  const unassignedTickets = activeTickets.filter((ticket) => !ticket.technician);
  const criticalAreas = Array.from(
    new Set(
      urgentTickets
        .map((ticket) => ticket.region || ticket.city)
        .filter(Boolean)
    )
  ).slice(0, 5);

  const filterButtons: Array<{ key: MapFilter; label: string; value: number }> = [
    { key: "all", label: "Tutti", value: filteredSites.length },
    { key: "urgent", label: "Urgenti", value: urgentTickets.length },
    { key: "open", label: "Aperti", value: activeTickets.length },
    { key: "planned", label: "Pianificati", value: plannedTickets.length },
    { key: "unassigned", label: "Da assegnare", value: unassignedTickets.length },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <aside className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-400">
            ATLAS Map Engine
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Mappa operativa
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-400">
            Vista geografica di urgenze, pianificazioni e aree critiche.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-3xl font-black text-white">{activeTickets.length}</p>
            <p className="text-xs font-bold text-slate-400">Ticket attivi</p>
          </div>
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-3xl font-black text-red-200">{urgentTickets.length}</p>
            <p className="text-xs font-bold text-red-200/80">Urgenze</p>
          </div>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-3xl font-black text-amber-200">{plannedTickets.length}</p>
            <p className="text-xs font-bold text-amber-200/80">Pianificati</p>
          </div>
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="text-3xl font-black text-violet-200">{unassignedTickets.length}</p>
            <p className="text-xs font-bold text-violet-200/80">Da assegnare</p>
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
            Filtri mappa
          </p>

          <div className="grid grid-cols-2 gap-2">
            {filterButtons.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-2xl border px-3 py-3 text-left text-xs font-black transition ${
                  filter === item.key
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09]"
                }`}
              >
                {item.label}
                <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
                  {item.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Tecnico
            <select
              value={technicianFilter}
              onChange={(event) => setTechnicianFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold normal-case tracking-normal text-white outline-none"
            >
              <option value="">Tutti i tecnici</option>
              {technicians.map((technician) => (
                <option key={technician} value={technician}>
                  {technician}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Area / città
            <input
              value={selectedArea}
              onChange={(event) => setSelectedArea(event.target.value)}
              placeholder="Es. Lazio, Roma..."
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold normal-case tracking-normal text-white outline-none placeholder:text-slate-600"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
            Aree critiche
          </p>

          {criticalAreas.length === 0 ? (
            <p className="mt-3 text-sm font-bold text-slate-400">
              Nessuna area critica attiva.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {criticalAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-left text-xs font-black text-red-200"
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-sm font-black text-white">Legenda operativa</p>
          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-300">
            <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" /> Urgente / rischio alto</p>
            <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-amber-400" /> Pianificato</p>
            <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-violet-500" /> Da assegnare</p>
            <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-blue-600" /> Aperto</p>
            <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-600" /> Chiuso</p>
          </div>
        </div>
      </aside>

      <div className="relative h-[680px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl border border-white/10 bg-[#081523]/85 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-blue-200 shadow-2xl backdrop-blur">
          {filteredSites.length} punti operativi
        </div>

        <MapContainer
          center={[42.5, 12.5]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredSites.map(({ site, tickets: siteTickets, primaryTicket }) => {
            const color = getMarkerColor(primaryTicket, siteTickets.length);
            const urgent = siteTickets.some((ticket) => Boolean(ticket.urgent));

            return (
              <Marker
                key={site.id || site.name}
                position={[Number(site.lat), Number(site.lng)]}
                icon={createIcon(color, { urgent, count: siteTickets.length })}
              >
                <Popup>
                  <div style={{ minWidth: 260 }}>
                    <strong>{site.name}</strong>
                    <br />
                    {site.city || "Città n/d"} · {site.region || "Regione n/d"}
                    <br />
                    {site.entity || "Ente n/d"}

                    <hr />

                    <strong>Stato:</strong> {statusLabel(primaryTicket)}
                    <br />
                    <strong>Ticket collegati:</strong> {siteTickets.length}

                    {primaryTicket && (
                      <>
                        <br />
                        <strong>Ticket principale:</strong> #{primaryTicket.id}
                        <br />
                        <strong>Problema:</strong> {primaryTicket.problem || "n/d"}
                        <br />
                        <strong>Tecnico:</strong>{" "}
                        {primaryTicket.technician || "Non assegnato"}
                        <br />
                        <strong>Data:</strong> {formatDate(primaryTicket.date || primaryTicket.intervention_date)}
                        <br />
                        <strong>Slot:</strong> {primaryTicket.slot || "N/D"}
                        <br />
                        <strong>Aperto da:</strong> {daysOpen(primaryTicket)} giorni
                      </>
                    )}

                    {siteTickets.length > 1 && (
                      <>
                        <hr />
                        <strong>Altri ticket:</strong>
                        <br />
                        {siteTickets.slice(0, 4).map((ticket) => (
                          <span key={ticket.id}>
                            #{ticket.id} · {ticket.status || "Nuovo"}
                            <br />
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-4 right-4 z-[500] max-w-xs rounded-2xl border border-white/10 bg-[#081523]/85 px-4 py-3 text-xs font-bold text-slate-300 shadow-2xl backdrop-blur">
          Map Engine V1 · pronto per clustering, route planning e dispatch geografico.
        </div>
      </div>
    </div>
  );
}
