"use client";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

import { useEffect, useMemo, useState } from "react";
const AtlasMap = dynamic(() => import("@/components/AtlasMap"), {
  ssr: false,
});
const INITIAL_BUDGET = 49043;

const materials = [
  { id: "kit-tlc", name: "Kit TLC", cost: 931 },
  { id: "uccs", name: "UCCS", cost: 821 },
  { id: "monitor", name: "Monitor", cost: 199 },
  { id: "kit-lampade", name: "Kit lampade", cost: 72 },
  { id: "ram", name: "RAM", cost: 56 },
  { id: "hub-usb", name: "Hub USB", cost: 52 },
  { id: "motore-sedia", name: "Motore sedia SPIS", cost: 196 },
  { id: "ups", name: "UPS", cost: 94 },
  { id: "tastiera-mouse", name: "Tastiera e mouse", cost: 31 },
  { id: "numeratore", name: "Circuito numeratore SPIS", cost: 199 },
  { id: "ssd-500", name: "SSD 500GB", cost: 92 },
];

const technicians = [
  "Andrea Fabbri",
  "Ivan Canossi",
  "Francesco Romano",
  "Christian Appolloni",
  "Giuseppe Marafioti",
  "Leonardo Aureli",
];

const initialTickets = [
  {
    id: "ST-001",
    site: "L'Aquila",
    region: "Abruzzo",
    problem: "Numeratore",
    materialIds: ["numeratore"],
    technician: "",
    status: "Aperto",
    date: "",
  },
  {
    id: "ST-002",
    site: "Castrovillari",
    region: "Calabria",
    problem: "TLC / telecamera",
    materialIds: ["kit-tlc"],
    technician: "",
    status: "Aperto",
    date: "",
  },
  {
    id: "ST-003",
    site: "Ferrara",
    region: "Emilia-Romagna",
    problem: "UCCS",
    materialIds: ["uccs"],
    technician: "Ivan Canossi",
    status: "Da pianificare",
    date: "",
  },
  {
    id: "ST-004",
    site: "Latisana",
    region: "Friuli-Venezia Giulia",
    problem: "TLC + UCCS + UPS",
    materialIds: ["kit-tlc", "uccs", "ups"],
    technician: "Ivan Canossi",
    status: "Aperto",
    date: "",
  },
];

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function materialCost(ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((m) => m.id === id);
    return sum + (item?.cost || 0);
  }, 0);
}

export default function Home() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("name");

      if (error) {
        console.log(error);
        return;
      }

      setSites(data || []);
    }

    async function loadTickets() {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const formatted =
  data?.map((t) => ({
    id: t.id,
    site: t.site,
    region: t.region,
    problem: t.problem,
    materialIds: t.materials || [],
    technician: t.technician,
    status: t.status,
    date: t.intervention_date || "",
    resolved: t.resolved,
futureNeeds: t.future_needs || "",
closingNotes: t.closing_notes || "",
    slot: t.slot || "",
  })) || [];

      setTickets(formatted);
    }

    loadTickets();
    loadSites();
  }, []);
const [site, setSite] = useState("");
const [siteSearch, setSiteSearch] = useState("");
const [region, setRegion] = useState("");
const [entity, setEntity] = useState("");
const [city, setCity] = useState("");
const [siteId, setSiteId] = useState<number | null>(null);

const [problem, setProblem] = useState("");
const [technician, setTechnician] = useState("");
const [selectedDate, setSelectedDate] = useState("");
const [selectedSlot, setSelectedSlot] = useState("");
const [closingNotes, setClosingNotes] = useState("");
const [futureNeeds, setFutureNeeds] = useState("");
const [resolved, setResolved] = useState(true);
const [filterTechnician, setFilterTechnician] = useState("");
const [filterRegion, setFilterRegion] = useState("");
const [filterStatus, setFilterStatus] = useState("");
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState<"success" | "error">("success");
function showMessage(text: string, type: "success" | "error" = "success") {
  setMessage(text);
  setMessageType(type);

  setTimeout(() => {
    setMessage("");
  }, 3000);
}
const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

const filteredSites = sites
  .filter((s) => {
    const text = `${s.name} ${s.city} ${s.entity}`.toLowerCase();
    return text.includes(siteSearch.toLowerCase());
  })
  .slice(0, 10);
  const totalForecast = useMemo(
    
    () => tickets.reduce((sum, t) => sum + materialCost(t.materialIds), 0),
    [tickets]
  );

  const remainingBudget = INITIAL_BUDGET - totalForecast;

const filteredTickets = tickets.filter((t) => {
  const matchTechnician =
    !filterTechnician || t.technician === filterTechnician;

  const matchRegion =
    !filterRegion || t.region === filterRegion;

  const matchStatus =
    !filterStatus || t.status === filterStatus;

  return matchTechnician && matchRegion && matchStatus;
});

const availableRegions = Array.from(
  new Set(tickets.map((t) => t.region).filter(Boolean))
);

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

 async function addTicket() {
  if (!site || !problem) return;

  const cost = materialCost(selectedMaterials);

  const { data, error } = await supabase
  .from("tickets")
  .insert([
    {
      site,
      region: region || "Da definire",
      entity,
      city,
      site_id: siteId,
      problem,
      materials: selectedMaterials,
      technician,
      status: "Aperto",
      cost,
      slot: selectedSlot,
      intervention_date: selectedDate || null,
    },
  ])
  .select()
  .single();

  if (error) {
    console.error(error);
    showMessage("Errore salvataggio ticket", "error");
    return;
  }

  const newTicket = {
    id: data.id,
    site,
    region,
    problem,
    materialIds: selectedMaterials,
    technician,
    status: "Aperto",
    date: "",
  };

  setTickets([newTicket, ...tickets]);

 setSite("");
setRegion("");
setEntity("");
setCity("");
setSiteId(null);

setProblem("");
setTechnician("");
setSelectedDate("");
setSelectedSlot("");
setSelectedMaterials([]);


  showMessage("Ticket salvato su database");
}
async function planTicket(id: string) {
  if (!selectedDate || !selectedSlot || !technician) {
    alert("Seleziona tecnico, data e slot prima di pianificare");
    return;
  }

  const { error } = await supabase
    .from("tickets")
    .update({
      technician,
      intervention_date: selectedDate,
      slot: selectedSlot,
      status: "Pianificato",
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage("Errore pianificazione ticket", "error");
    return;
  }

  setTickets((prev) =>
    prev.map((t) =>
      t.id === id
        ? {
            ...t,
            technician,
            date: selectedDate,
            slot: selectedSlot,
            status: "Pianificato",
          }
        : t
    )
  );

  showMessage("Ticket pianificato");
}
 async function closeTicket(id: string) {
  console.log("CLICK CHIUSURA", id);

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("tickets")
    .update({
      status: "Chiuso",
      intervention_date: today,
      closing_notes: closingNotes || "",
      future_needs: futureNeeds || "",
      resolved: resolved,
    })
    .eq("id", Number(id));

  if (error) {
    console.log("ERRORE CHIUSURA:", error);
    showMessage("Errore chiusura ticket", "error");
    return;
  }

  setTickets((prev) =>
    prev.map((t) =>
      String(t.id) === String(id)
        ? {
            ...t,
            status: "Chiuso",
            date: today,
            closingNotes: closingNotes || "",
            futureNeeds: futureNeeds || "",
            resolved: resolved,
          }
        : t
    )
  );

  setClosingNotes("");
  setFutureNeeds("");
  setResolved(true);

  showMessage("Ticket chiuso e salvato");
}

  function exportCsv() {
  const header = [
    "ID",
    "Sede",
    "Ente",
    "Città",
    "Regione",
    "Problema",
    "Materiali",
    "Costo",
    "Tecnico",
    "Stato",
    "Risolto",
    "Data intervento",
    "Slot",
    "Note chiusura",
    "Necessità future",
  ];

  const rows = tickets.map((t) => [
    t.id,
    t.site,
    t.entity || "",
    t.city || "",
    t.region || "",
    t.problem,
    t.materialIds
      .map((id: string) => materials.find((m) => m.id === id)?.name)
      .join(" + "),
    materialCost(t.materialIds),
    t.technician || "",
    t.status,
    t.resolved === false ? "No" : "Sì",
    t.date || "",
    t.slot || "",
    t.closingNotes || "",
    t.futureNeeds || "",
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `secom-atlas-export-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="h-[240px] overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow">
          {message && (
  <div
    className={`rounded-2xl p-4 text-sm font-bold text-white shadow ${
      messageType === "success" ? "bg-green-700" : "bg-red-700"
    }`}
  >
    {message}
  </div>
)}
  <div className="flex flex-col items-center justify-center">
    <img
      src="/secom-logo.png.png"
      alt="Secom"
      className="h-64 w-auto object-contain"
    />

    <div className="mt-0 text-4xl font-bold tracking-[0.45em] text-white">
      ATLAS
    </div>

    <p className="mt-3 text-sm text-slate-400">
      Centrale operativa nazionale interventi SPISPHOTO
    </p>
  </div>
</header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Budget iniziale</p>
            <p className="text-2xl font-bold">{euro(INITIAL_BUDGET)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Costo previsto</p>
            <p className="text-2xl font-bold">{euro(totalForecast)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Budget residuo</p>
            <p className="text-2xl font-bold">{euro(remainingBudget)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">Ticket totali</p>
            <p className="text-2xl font-bold">{tickets.length}</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Apri nuova chiamata</h2>

                    <div className="grid gap-4 md:grid-cols-2">
  <div className="relative">
    <input
      className="w-full rounded-xl border p-3"
      placeholder="Cerca sede: es. Alatri, Bari, Ferrara..."
      value={siteSearch}
      onChange={(e) => {
        setSiteSearch(e.target.value);
        setSite("");
        setRegion("");
        setEntity("");
        setCity("");
        setSiteId(null);
      }}
    />

    {siteSearch && !site && (
      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
        {filteredSites.length === 0 && (
          <div className="p-3 text-sm text-slate-500">
            Nessuna sede trovata
          </div>
        )}

        {filteredSites.map((s) => (
          <button
            key={s.id}
            type="button"
            className="block w-full border-b p-3 text-left hover:bg-slate-100"
            onClick={() => {
              setSite(s.name);
              setSiteSearch(s.name);
              setRegion(s.region || "");
              setEntity(s.entity || "");
              setCity(s.city || "");
              setSiteId(s.id || null);
            }}
          >
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-slate-500">
              {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>

  <input
    className="rounded-xl border bg-slate-100 p-3"
    placeholder="Regione automatica"
    value={region}
    readOnly
  />

  <textarea
    className="rounded-xl border p-3 md:col-span-2"
    placeholder="Descrizione intervento"
    value={problem}
    onChange={(e) => setProblem(e.target.value)}
  />

  <select
    className="rounded-xl border p-3"
    value={technician}
    onChange={(e) => setTechnician(e.target.value)}
  >
    <option value="">Tecnico non assegnato</option>
    {technicians.map((t) => (
      <option key={t}>{t}</option>
    ))}
  </select>

  <input
    type="date"
    className="rounded-xl border p-3"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
  />

  <select
    className="rounded-xl border p-3"
    value={selectedSlot}
    onChange={(e) => setSelectedSlot(e.target.value)}
  >
    <option value="">Seleziona slot</option>
    <option value="Mattina">Mattina</option>
    <option value="Pomeriggio">Pomeriggio</option>
  </select>
</div>

          <h3 className="mt-5 mb-3 font-bold">Materiali necessari</h3>

          <div className="grid gap-3 md:grid-cols-4">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMaterial(m.id)}
                className={`rounded-xl border p-3 text-left ${
                  selectedMaterials.includes(m.id)
                    ? "bg-slate-950 text-white"
                    : "bg-white"
                }`}
              >
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm opacity-70">{euro(m.cost)}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-100 p-4">
            <div>
              <p className="text-sm text-slate-500">Costo nuova chiamata</p>
              <p className="text-2xl font-bold">
                {euro(materialCost(selectedMaterials))}
              </p>
            </div>

            <button
              onClick={addTicket}
              className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
            >
              Apri chiamata
            </button>
          </div>
        </section>

<section className="rounded-3xl bg-white p-6 shadow">
  <h2 className="mb-4 text-xl font-bold">
    Chiusura intervento
  </h2>

  <div className="grid gap-4">
    <textarea
      className="rounded-xl border p-3"
      placeholder="Note chiusura intervento"
      value={closingNotes}
      onChange={(e) => setClosingNotes(e.target.value)}
    />

    <textarea
      className="rounded-xl border p-3"
      placeholder="Necessità future / materiale da ordinare"
      value={futureNeeds}
      onChange={(e) => setFutureNeeds(e.target.value)}
    />

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={resolved}
        onChange={(e) => setResolved(e.target.checked)}
      />

      Intervento risolto
    </label>
  </div>
</section>

<section className="rounded-3xl bg-white p-6 shadow">
  <h2 className="mb-4 text-xl font-bold">Filtri operativi</h2>

  <div className="grid gap-4 md:grid-cols-3">
    <select
      className="rounded-xl border p-3"
      value={filterTechnician}
      onChange={(e) => setFilterTechnician(e.target.value)}
    >
      <option value="">Tutti i tecnici</option>
      {technicians.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>

    <select
      className="rounded-xl border p-3"
      value={filterRegion}
      onChange={(e) => setFilterRegion(e.target.value)}
    >
      <option value="">Tutte le regioni</option>
      {availableRegions.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>

    <select
      className="rounded-xl border p-3"
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
    >
      <option value="">Tutti gli stati</option>
      <option value="Aperto">Aperto</option>
      <option value="Pianificato">Pianificato</option>
      <option value="Chiuso">Chiuso</option>
    </select>
  </div>
</section>

<section className="rounded-3xl bg-white p-6 shadow">
  <h2 className="mb-4 text-xl font-bold">Mappa sedi</h2>

  <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-600">
    Mappa temporaneamente disattivata. La riattiviamo dopo aver stabilizzato il deploy.
  </div>
</section>
<section className="rounded-3xl bg-white p-6 shadow">
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-xl font-bold">Registro chiamate</h2>

    <button
      onClick={exportCsv}
      className="rounded-xl bg-green-700 px-4 py-2 font-bold text-white"
    >
      Esporta CSV
    </button>
  </div>

  <div className="grid gap-4 md:hidden">
  {filteredTickets.map((t) => (
    <div key={t.id} className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-bold">{t.site}</p>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
            t.status === "Chiuso"
              ? t.resolved === false
                ? "bg-red-600"
                : "bg-green-600"
              : t.status === "Pianificato"
              ? "bg-yellow-500"
              : "bg-blue-600"
          }`}
        >
          {t.status}
        </span>
      </div>

      <p className="text-sm text-slate-500">
        {t.region || "Regione n/d"} · {t.technician || "Tecnico non assegnato"}
      </p>

      <p className="mt-3 font-semibold">{t.problem}</p>

      <p className="mt-2 text-sm text-slate-600">
        Materiali:{" "}
        {t.materialIds
          .map((id: string) => materials.find((m) => m.id === id)?.name)
          .join(" + ") || "Nessuno"}
      </p>

      <p className="mt-1 text-sm font-bold">
        Costo: {euro(materialCost(t.materialIds))}
      </p>

      {t.closingNotes && (
        <p className="mt-2 text-xs text-slate-500">
          Chiusura: {t.closingNotes}
        </p>
      )}

      {t.futureNeeds && (
        <p className="mt-2 text-xs text-red-600">
          Future needs: {t.futureNeeds}
        </p>
      )}

      {t.status !== "Chiuso" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => planTicket(String(t.id))}
            className="flex-1 rounded-xl bg-blue-700 px-3 py-2 text-white"
          >
            Pianifica
          </button>

          <button
            onClick={() => closeTicket(String(t.id))}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-white"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  ))}
</div>

<div className="hidden overflow-x-auto md:block">
  <table className="w-full border-collapse text-left text-sm">
    <thead>
      <tr className="bg-slate-200">
        <th className="p-3">ID</th>
        <th>Sede</th>
        <th>Regione</th>
        <th>Problema</th>
        <th>Materiali</th>
        <th>Costo</th>
        <th>Tecnico</th>
        <th>Stato</th>
        <th>Azione</th>
      </tr>
    </thead>

    <tbody>
      {filteredTickets.map((t) => (
        <tr key={t.id} className="border-b">
          <td className="p-3 font-bold">{t.id}</td>
          <td>{t.site}</td>
          <td>{t.region}</td>
          <td>{t.problem}</td>
          <td>
            {t.materialIds
              .map((id: string) => materials.find((m) => m.id === id)?.name)
              .join(" + ") || "Nessuno"}
          </td>
          <td className="font-bold">{euro(materialCost(t.materialIds))}</td>
          <td>{t.technician || "Non assegnato"}</td>
          <td>{t.status}</td>
          <td>
            {t.status !== "Chiuso" && (
              <div className="flex gap-2">
                <button
                  onClick={() => planTicket(String(t.id))}
                  className="rounded-lg bg-blue-700 px-3 py-1 text-white"
                >
                  Pianifica
                </button>

                <button
                  onClick={() => closeTicket(String(t.id))}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-white"
                >
                  Chiudi
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
</section>
      </div>
    </main>
  );
}