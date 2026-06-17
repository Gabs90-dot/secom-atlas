"use client";

import dynamic from "next/dynamic";

const AtlasMap = dynamic(() => import("@/components/AtlasMap"), {
  ssr: false,
});

type AtlasMapManagerProps = {
  mode: "mobile" | "desktop";
  card?: string;
  input: string;
  sites: any[];
  filteredTickets: any[];
  technicians: string[];
  filterTechnician: string;
  setFilterTechnician: (value: string) => void;
  filterRegion: string;
  setFilterRegion: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  availableRegions: string[];
};

export default function AtlasMapManager({
  mode,
  card = "",
  input,
  sites,
  filteredTickets,
  technicians,
  filterTechnician,
  setFilterTechnician,
  filterRegion,
  setFilterRegion,
  filterStatus,
  setFilterStatus,
  availableRegions,
}: AtlasMapManagerProps) {
  const filters = (
    <>
      <select
        className={input}
        value={filterTechnician}
        onChange={(event) => setFilterTechnician(event.target.value)}
      >
        <option value="">Tutti i tecnici</option>
        {technicians.map((technician) => (
          <option key={technician} value={technician}>
            {technician}
          </option>
        ))}
      </select>

      <select
        className={input}
        value={filterRegion}
        onChange={(event) => setFilterRegion(event.target.value)}
      >
        <option value="">Tutte le regioni</option>
        {availableRegions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <select
        className={input}
        value={filterStatus}
        onChange={(event) => setFilterStatus(event.target.value)}
      >
        <option value="">Tutti gli stati</option>
        <option value="Aperto">Aperto</option>
        <option value="Pianificato">Pianificato</option>
        <option value="Chiuso">Chiuso</option>
      </select>
    </>
  );

  if (mode === "mobile") {
    return (
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-3xl font-black text-white">Mappa operativa</h2>

        {filters}

        <div className="h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
          <AtlasMap sites={sites} tickets={filteredTickets} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <span>
            <b className="text-blue-400">●</b> Tecnico
          </span>
          <span>
            <b className="text-emerald-400">●</b> Sede operativa
          </span>
          <span>
            <b className="text-yellow-400">●</b> Cliente
          </span>
          <span>
            <b className="text-red-400">●</b> Intervento
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className={card}>
      <h2 className="mb-5 text-2xl font-black">Mappa operativa</h2>

      <div className="mb-5 grid gap-4 md:grid-cols-3">{filters}</div>

      <div className="h-[500px] overflow-hidden rounded-3xl border border-white/10">
        <AtlasMap sites={sites} tickets={filteredTickets} />
      </div>
    </section>
  );
}
