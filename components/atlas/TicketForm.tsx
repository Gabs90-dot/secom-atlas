"use client";

import type { AtlasTicketCategory, AtlasTicketStatus } from "@/lib/atlasTypes";
import SiteSearchDropdown from "@/components/atlas/SiteSearchDropdown";

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

  ticketCategoryOptions: any[];
  ticketStatusOptions: any[];

  addTicket: () => void;
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
  ticketStatus,
  setTicketStatus,
  ticketCategoryOptions,
  ticketStatusOptions,
  addTicket,
}: Props) {
  return (
    <div className="grid gap-4">
      <h2 className="text-3xl font-black text-white">
        Apri nuova chiamata
      </h2>

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
        placeholder="Titolo ticket"
        value={ticketTitle}
        onChange={(e) => setTicketTitle(e.target.value)}
      />

      <textarea
        className={`${input} min-h-[140px]`}
        placeholder="Descrizione intervento"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
      />

      <select
        className={input}
        value={ticketType}
        onChange={(e) =>
          setTicketType(e.target.value as AtlasTicketCategory)
        }
      >
        {ticketCategoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className={input}
        value={ticketStatus}
        onChange={(e) =>
          setTicketStatus(e.target.value as AtlasTicketStatus)
        }
      >
        {ticketStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={addTicket}
        className="rounded-2xl bg-blue-600 p-4 font-black text-white"
      >
        Apri chiamata
      </button>
    </div>
  );
}