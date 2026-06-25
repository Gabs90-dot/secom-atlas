"use client";

import { Download, Filter, HelpCircle, Radio, RefreshCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import ExecutiveGlassCard from "./ExecutiveGlassCard";
import ExecutiveMetricCard from "./ExecutiveMetricCard";

type WebvimeTicket = {
  id: string;
  glpi: string;
  title: string;
  user: string;
  arrival: string;
  opening: string;
  closing: string;
  technician: string;
  status: "APERTO" | "CHIUSO" | "IN LAVORAZIONE";
  aging: string;
};

type ExecutiveWebvimeProps = {
  glpiEnabled?: boolean;
};

const tickets: WebvimeTicket[] = [
  {
    id: "DEMO #1045",
    glpi: "GLPI DEMO #9001045",
    title: "Richiesta demo: il documento tecnico non risulta disponibile nel portale.",
    user: "Utente Demo",
    arrival: "11/06/2026 11:09",
    opening: "11/06/2026 06:59",
    closing: "—",
    technician: "N/D",
    status: "APERTO",
    aging: "+7 giorni",
  },
  {
    id: "DEMO #1044",
    glpi: "GLPI DEMO #9001044",
    title: "Richiesta demo: reset credenziali per area riservata.",
    user: "Utente Demo",
    arrival: "10/06/2026 18:22",
    opening: "10/06/2026 18:23",
    closing: "10/06/2026 19:02",
    technician: "Tecnico Demo B",
    status: "CHIUSO",
    aging: "Risolto",
  },
  {
    id: "DEMO #1043",
    glpi: "GLPI DEMO #9001043",
    title: "Richiesta demo: timeout durante il download di un allegato tecnico.",
    user: "Utente Demo",
    arrival: "10/06/2026 16:41",
    opening: "10/06/2026 16:42",
    closing: "—",
    technician: "N/D",
    status: "IN LAVORAZIONE",
    aging: "+3 giorni",
  },
  {
    id: "DEMO #1042",
    glpi: "GLPI DEMO #9001042",
    title: "Richiesta demo: verifica contenuti disponibili dopo autenticazione.",
    user: "Utente Demo",
    arrival: "10/06/2026 15:02",
    opening: "10/06/2026 15:03",
    closing: "10/06/2026 15:28",
    technician: "Tecnico Demo A",
    status: "CHIUSO",
    aging: "Risolto",
  },
];

const statusClass = {
  APERTO: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  CHIUSO: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  "IN LAVORAZIONE": "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
};

export default function ExecutiveWebvime({ glpiEnabled = true }: ExecutiveWebvimeProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"TUTTI" | "APERTO" | "CHIUSO" | "VECCHI">("TUTTI");

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchQuery =
        !normalizedQuery ||
        ticket.title.toLowerCase().includes(normalizedQuery) ||
        ticket.id.toLowerCase().includes(normalizedQuery) ||
        (glpiEnabled && ticket.glpi.toLowerCase().includes(normalizedQuery)) ||
        ticket.technician.toLowerCase().includes(normalizedQuery);
      const matchFilter =
        filter === "TUTTI" ||
        (filter === "VECCHI" ? ticket.aging.includes("+7") : ticket.status === filter);
      return matchQuery && matchFilter;
    });
  }, [filter, glpiEnabled, query]);

  if (!glpiEnabled) {
    return (
      <div className="space-y-5">
        <ExecutiveGlassCard>
          <div className="p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-100/55">ATLAS Module</p>
            <h2 className="mt-1 text-2xl font-black text-white">Registro segnali Webvime</h2>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Integrazione GLPI/Webvime non attiva per questo tenant. Nessun dato sincronizzato da mostrare.
            </p>
          </div>
        </ExecutiveGlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-100/55">ATLAS Module</p>
          <h2 className="mt-1 text-2xl font-black text-white">Registro segnali Webvime</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Versione estetica parallela. I ticket sotto sono demo neutrali per il Design Lab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            [RefreshCcw, "Aggiorna"],
            [HelpCircle, "Help"],
            [Filter, "Analisi"],
            [Download, "Export CSV"],
          ].map(([Icon, label]) => {
            const ButtonIcon = Icon as typeof RefreshCcw;
            return (
              <button key={label as string} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs font-black text-slate-300 hover:border-cyan-300/25 hover:text-cyan-100">
                <ButtonIcon size={15} />
                {label as string}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <ExecutiveMetricCard label="Ticket Webvime" value="4" detail="Scenario demo" tone="cyan" trend="+" />
        <ExecutiveMetricCard label="Aperti" value="1" detail="Demo aperti" tone="gold" trend="+" />
        <ExecutiveMetricCard label="Chiusi" value="2" detail="Demo risolti" tone="green" trend="+" />
        <ExecutiveMetricCard label="Aperti +7g" value="1" detail="Demo attenzione" tone="red" trend="+" />
      </div>

      <ExecutiveGlassCard>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-cyan-300/10 bg-black/25 px-4 py-3 text-slate-400">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca negli ultimi ticket Webvime sincronizzati..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ["TUTTI", "Tutti"],
              ["APERTO", "Aperti"],
              ["CHIUSO", "Chiusi"],
              ["VECCHI", "Vecchi +7g"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id as typeof filter)}
                className={`rounded-full border px-4 py-2 text-xs font-black ${
                  filter === id
                    ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.045] text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </ExecutiveGlassCard>

      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="group grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.055] 2xl:grid-cols-[1fr_auto] 2xl:items-center"
          >
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  <Radio size={12} /> Webvime
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{ticket.id}</span>
                {glpiEnabled && (
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{ticket.glpi}</span>
                )}
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="truncate text-base font-black text-white">{ticket.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{ticket.user}</p>
              <div className="mt-4 grid gap-2 text-[11px] font-bold text-slate-400 md:grid-cols-5">
                <span>Arrivo: <b className="text-slate-200">{ticket.arrival}</b></span>
                <span>Apertura: <b className="text-slate-200">{ticket.opening}</b></span>
                <span>Chiusura: <b className="text-slate-200">{ticket.closing}</b></span>
                <span>Tecnico: <b className="text-slate-200">{ticket.technician}</b></span>
                <span>Stato: <b className="text-slate-200">{ticket.status}</b></span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">
                {ticket.aging}
              </span>
              <button className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-400/15">
                Apri dettaglio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
