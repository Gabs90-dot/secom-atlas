"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

function getTicketForSite(site: any, tickets: any[]) {
  return tickets.find(
    (t) =>
      t.site?.toLowerCase().trim() === site.name?.toLowerCase().trim()
  );
}

function getMarkerColor(ticket: any) {
  if (!ticket) return "#64748b";

  if (ticket.status === "Chiuso" && ticket.resolved === false) {
    return "#dc2626";
  }

  if (ticket.status === "Chiuso") {
    return "#16a34a";
  }

  if (ticket.status === "Pianificato") {
    return "#facc15";
  }

  return "#2563eb";
}

function createIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 18px;
      height: 18px;
      background: ${color};
      border: 3px solid white;
      border-radius: 9999px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function AtlasMap({
  sites,
  tickets,
}: {
  sites: any[];
  tickets: any[];
}) {
  const mappedSites = sites.filter((s) => s.lat && s.lng);

  return (
    <div className="h-[500px] overflow-hidden rounded-3xl border">
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

        {mappedSites.map((s) => {
          const ticket = getTicketForSite(s, tickets);
          const color = getMarkerColor(ticket);

          return (
            <Marker
              key={s.id}
              position={[Number(s.lat), Number(s.lng)]}
              icon={createIcon(color)}
            >
              <Popup>
                <strong>{s.name}</strong>
                <br />
                {s.city || "Città n/d"} · {s.region || "Regione n/d"}
                <br />
                {s.entity || "Ente n/d"}

                {ticket && (
                  <>
                    <hr />
                    <strong>Ticket:</strong> {ticket.status}
                    <br />
                    <strong>Problema:</strong> {ticket.problem}
                    <br />
                    <strong>Tecnico:</strong>{" "}
                    {ticket.technician || "Non assegnato"}
                    <br />
                    <strong>Data:</strong> {ticket.date || "Non pianificata"}
                    <br />
                    <strong>Slot:</strong> {ticket.slot || "N/D"}
                    {ticket.futureNeeds && (
                      <>
                        <br />
                        <strong>Necessità future:</strong>{" "}
                        {ticket.futureNeeds}
                      </>
                    )}
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}