"use client";

import { useState } from "react";
import type { AtlasTicketCategory, AtlasTicketStatus } from "@/lib/atlasTypes";
import SiteSearchDropdown from "@/components/atlas/SiteSearchDropdown";
import CustomerSelect from "@/components/atlas/CustomerSelect";

type Props = {
  input: string;
  siteSearch: string;
  setSiteSearch: (v: string) => void;
  site: string;
  setSite: (v: string) => void;
  setRegion: (v: string) => void;
  setEntity: (v: string) => void;
  setCity: (v: string) => void;
  setSiteId: (v: number | null) => void;
  filteredSites: any[];

  ticketTitle: string;
  setTicketTitle: (v: string) => void;

  problem: string;
  setProblem: (v: string) => void;

  ticketType: AtlasTicketCategory;
  setTicketType: (v: AtlasTicketCategory) => void;

  ticketStatus: AtlasTicketStatus;
  setTicketStatus: (v: AtlasTicketStatus) => void;

  expectedCloseDate: string;
  setExpectedCloseDate: (v: string) => void;

  ticketCategoryOptions: any[];
  ticketStatusOptions: any[];

  addTicket: (customerId: string) => void;
};

export default function TicketForm({
  input,
  siteSearch,
  setSiteSearch,
  site,
  setSite,
  setRegion,
  setEntity,
  setCity,
  setSiteId,
  filteredSites,
  ticketTitle,
  setTicketTitle,
  problem,
  setProblem,
  ticketType,
  setTicketType,
  ticketCategoryOptions,
  addTicket,
}: Props) {
  const [customerId, setCustomerId] = useState("");

  const canSubmit = Boolean(site && ticketTitle.trim() && problem.trim());

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
          Ticket intake
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Apri nuova chiamata
        </h2>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Qui si apre solo il ticket. La pianificazione tecnica resta nel Calendario.
        </p>
      </div>

      <CustomerSelect value={customerId} onChange={setCustomerId} />

      <SiteSearchDropdown
        input={input}
        siteSearch={siteSearch}
        setSiteSearch={setSiteSearch}
        site={site}
        setSite={setSite}
        setRegion={setRegion}
        setEntity={setEntity}
        setCity={setCity}
        setSiteId={setSiteId}
        filteredSites={filteredSites}
      />

      <input
        className={input}
        placeholder="Titolo ticket GLPI"
        value={ticketTitle}
        onChange={(e) => setTicketTitle(e.target.value)}
      />

      <textarea
        className={`${input} min-h-[170px]`}
        placeholder="Descrizione da inviare nel campo descrizione GLPI"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
      />

      <label className="grid gap-2 text-sm font-bold text-slate-300">
        Tipo chiamata
        <select
          className={input}
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value as AtlasTicketCategory)}
        >
          {ticketCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
        <p className="font-black text-white">Apertura ticket</p>
        <p className="mt-1 font-bold text-slate-400">
          Data apertura automatica. Stato iniziale automatico. Tecnico e slot si assegnano dal Calendario.
        </p>
      </div>

      <button
        type="button"
        onClick={() => addTicket(customerId)}
        disabled={!canSubmit}
        className={`rounded-2xl p-4 font-black text-white transition ${
          canSubmit
            ? "bg-blue-600 hover:-translate-y-0.5 hover:bg-blue-500"
            : "cursor-not-allowed bg-slate-700 text-slate-400"
        }`}
      >
        Apri ticket
      </button>
    </div>
  );
}
