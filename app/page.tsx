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

const contracts = [
  {
    name: "POLFER SPIS",
    match: ["POLFER", "POLIZIA FERROVIARIA"],
    clientType: "Polizia Ferroviaria",
    status: "Attivo",
    period: "Fornitura SPIS",
    warranty: "Sì",
    shipping: "Sì, se previsto da garanzia",
    spareParts: "Ricambi gestibili secondo contratto",
    sla: "7 giorni bloccante / 14 giorni non bloccante",
    notes: "Assistenza su apparati SPIS Polfer. Verificare sempre se la parte richiesta è coperta da garanzia o ricambio contrattuale.",
  },
  {
    name: "FRONTIERE 26 SPIS",
    match: ["FRONTIERA", "POLIZIA DI FRONTIERA"],
    clientType: "Polizia di Frontiera",
    status: "Attivo",
    period: "Assistenza 36 mesi",
    warranty: "24 mesi",
    shipping: "Inclusa",
    spareParts: "Sostituzione/ripristino apparati inclusa",
    sla: "12 ore bloccante / 24 ore non bloccante",
    notes: "Trasporto, ritiro, ripristino e sostituzione apparati inclusi.",
  },
  {
    name: "HOTSPOT ALBANIA 2024-2026",
    match: ["ALBANIA", "HOTSPOT"],
    clientType: "Estero",
    status: "Attivo",
    period: "2024-2026",
    warranty: "24 mesi",
    shipping: "Inclusa",
    spareParts: "Riparazione o sostituzione inclusa",
    sla: "5 giorni bloccante / 10 giorni non bloccante",
    notes: "Ritiro apparati, trasporto e supporto tecnico inclusi.",
  },
  {
    name: "CARABINIERI ASSISTENZA 2024-2026",
    match: [
      "CARABINIERI",
      "COMANDO PROVINCIALE",
      "GRUPPO CC",
      "REPARTO TERRITORIALE CC",
      "COMANDO GRUPPO",
    ],
    clientType: "Carabinieri",
    status: "Attivo",
    period: "2024-2026",
    warranty: "Sì",
    shipping: "Sì, previa autorizzazione",
    spareParts: "Ricambi inclusi entro limiti contrattuali",
    sla: "7 giorni bloccante / 14 giorni non bloccante",
    notes: "Interventi e ricambi soggetti ad autorizzazione AES. Verificare sempre se il comando rientra nella copertura.",
  },
  {
    name: "CC 75 SPIS",
    match: ["CC 75", "75 SPIS"],
    clientType: "Carabinieri",
    status: "Attivo",
    period: "Fornitura 75 SPIS",
    warranty: "Sì",
    shipping: "Da verificare",
    spareParts: "Gestibili secondo garanzia apparato",
    sla: "Da contratto specifico",
    notes: "Supporto su apparati SPIS della fornitura.",
  },
  {
    name: "POLIZIE LOCALI",
    match: [
      "POLIZIA LOCALE",
      "POLIZIA MUNICIPALE",
      "POLIZIA PROVINCIALE",
      "COMUNE",
    ],
    clientType: "Polizia Locale / Comuni",
    status: "Attivo se contratto sottoscritto",
    period: "12/24/36 mesi",
    warranty: "Sì, secondo contratto",
    shipping: "Sì, se previsto",
    spareParts: "Secondo formula sottoscritta",
    sla: "Entro 5 giorni / entro 10 giorni",
    notes: "Verificare formula commerciale sottoscritta dal Comune prima di autorizzare ricambi o spedizioni.",
  },
  {
    name: "RFI AULE SEPA",
    match: ["RFI", "AULA SEPA", "SEPA"],
    clientType: "RFI",
    status: "Attivo",
    period: "48 mesi",
    warranty: "Sì",
    shipping: "Sì",
    spareParts: "Incluse salvo esclusioni contrattuali",
    sla: "2 giorni bloccante / 7 giorni non bloccante",
    notes: "Assistenza su Aule SEPA RFI.",
  },
  {
    name: "RFI WEBVIME",
    match: ["WEBVIME"],
    clientType: "RFI / Webvime",
    status: "Attivo",
    period: "12 mesi",
    warranty: "Sì",
    shipping: "No",
    spareParts: "Non applicabile / software",
    sla: "Secondo allegato contratto",
    notes: "Assistenza software Webvime.",
  },
  {
    name: "SMARTFAD CARE-PACK",
    match: ["SMARTFAD"],
    clientType: "SmartFAD",
    status: "Attivo se Care-Pack sottoscritto",
    period: "12/24/36 mesi",
    warranty: "Copertura danni accidentali",
    shipping: "Andata cliente / ritorno Secom",
    spareParts: "Riparazione o sostituzione dispositivo",
    sla: "Massimo 5 giorni lavorativi, spedizione esclusa",
    notes: "Non copre furto, manomissioni, uso improprio o danni dolosi.",
  },
  {
    name: "SEEKS / BEESCO PORTI",
    match: ["SEEKS", "BEESCO", "PORTI", "TERMINAL", "VESPUCCI"],
    clientType: "Porti / EES",
    status: "Attivo",
    period: "12/24/36 mesi",
    warranty: "On-center",
    shipping: "Sì se nei termini di garanzia",
    spareParts: "Riparazione o sostituzione gratuita se difetto originario",
    sla: "2 giorni bloccante / 4 giorni non bloccante",
    notes: "Fuori garanzia serve valutazione e offerta.",
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

function getContractInfo(site: string, entity: string) {
  const text = `${site} ${entity}`.toLowerCase();

  return contracts.find((contract) =>
    contract.match.some((word) => text.includes(word.toLowerCase()))
  );
}

function normalizeSiteRegion(site: any) {
  if (site.region && !String(site.region).toLowerCase().includes("n/d")) {
    return site;
  }

  const text = `${site.name || ""} ${site.city || ""}`.toLowerCase();

  const rules: [string[], string][] = [
    [["padova", "venezia", "verona", "vicenza", "treviso", "rovigo"], "Veneto"],
    [["parma", "rimini", "reggio emilia", "bologna", "ferrara"], "Emilia-Romagna"],
    [["ragusa", "siracusa", "trapani", "palermo", "catania", "gela"], "Sicilia"],
    [["salerno", "avellino", "caserta", "napoli", "aversa", "nocera"], "Campania"],
    [["viterbo", "rieti", "roma", "ostia", "frascati", "aprilia"], "Lazio"],
    [["trento", "bolzano", "merano"], "Trentino-Alto Adige"],
    [["varese", "milano", "brescia", "pavia", "rho", "sondrio"], "Lombardia"],
    [["trieste", "udine", "pordenone", "gorizia"], "Friuli-Venezia Giulia"],
    [["taranto", "trani", "bari", "brindisi", "lecce"], "Puglia"],
    [["reggio calabria", "vibo valentia", "cosenza", "locri", "lamezia"], "Calabria"],
    [["olbia", "sassari", "cagliari", "sanluri"], "Sardegna"],
    [["verbania", "torino", "vercelli", "cuneo", "asti"], "Piemonte"],
    [["massa", "siena", "pisa", "lucca", "firenze"], "Toscana"],
    [["ancona", "macerata", "fermo", "ascoli"], "Marche"],
    [["perugia", "terni", "orvieto"], "Umbria"],
    [["teramo", "pescara", "chieti", "aquila"], "Abruzzo"],
    [["isernia", "campobasso"], "Molise"],
    [["aosta"], "Valle d'Aosta"],
    [["savona", "genova", "imperia", "la spezia"], "Liguria"],
    [["potenza", "matera"], "Basilicata"],
  ];

  for (const [keywords, region] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return { ...site, region };
    }
  }

  return { ...site, region: "Da verificare" };
}

export default function Home() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

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
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const [closingNotes, setClosingNotes] = useState("");
  const [futureNeeds, setFutureNeeds] = useState("");
  const [resolved, setResolved] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [activeTab, setActiveTab] = useState<
    "operativo" | "budget" | "mappa" | "registro" | "clienti" | "contratti"
  >("operativo");

  const [budgetVisible, setBudgetVisible] = useState(true);
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budget");
      return saved ? Number(saved) : INITIAL_BUDGET;
    }

    return INITIAL_BUDGET;
  });

  const [clientSearch, setClientSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase.from("sites").select("*").order("name");

      if (error) {
        console.log(error);
        return;
      }

      setSites((data || []).map(normalizeSiteRegion));
    }

    async function loadTickets() {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log(error);
        return;
      }

      const formatted =
        data?.map((t) => ({
          id: t.id,
          site: t.site,
          region: t.region,
          entity: t.entity || "",
          city: t.city || "",
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

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  const filteredSites = sites
    .filter((s) => {
      const text = `${s.name} ${s.city} ${s.entity}`.toLowerCase();
      return text.includes(siteSearch.toLowerCase());
    })
    .slice(0, 10);

  const totalForecast = useMemo(
    () => tickets.reduce((sum, t) => sum + materialCost(t.materialIds || []), 0),
    [tickets]
  );

  const remainingBudget = budget - totalForecast;

  const filteredTickets = tickets.filter((t) => {
    const matchTechnician = !filterTechnician || t.technician === filterTechnician;
    const matchRegion = !filterRegion || t.region === filterRegion;
    const matchStatus = !filterStatus || t.status === filterStatus;

    return matchTechnician && matchRegion && matchStatus;
  });

  const availableRegions = Array.from(
    new Set(tickets.map((t) => t.region).filter(Boolean))
  );

  const clientCategories = {
    "Ministero Interni": sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("minister")
    ),

    Carabinieri: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("carabin")
    ),

    "Polizia Locale": sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();
      return (
        text.includes("polizia locale") ||
        text.includes("polizia municipale") ||
        text.includes("polizia provinciale")
      );
    }),

    Questure: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("questura")
    ),

    Prefetture: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("prefettura")
    ),

    Tribunali: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("tribunale")
    ),

    Comuni: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("comune")
    ),

    RFI: sites.filter((s) => `${s.name} ${s.entity}`.toLowerCase().includes("rfi")),

    Altro: sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();

      return ![
        "minister",
        "carabin",
        "polizia locale",
        "polizia municipale",
        "polizia provinciale",
        "questura",
        "prefettura",
        "tribunale",
        "comune",
        "rfi",
      ].some((k) => text.includes(k));
    }),
  };

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function addTicket() {
    if (!site || !problem) {
      showMessage("Sede e descrizione intervento sono obbligatorie", "error");
      return;
    }

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
      console.log(error);
      showMessage("Errore salvataggio ticket", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      site,
      region,
      entity,
      city,
      problem,
      materialIds: selectedMaterials,
      technician,
      status: "Aperto",
      date: selectedDate || "",
      slot: selectedSlot || "",
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
    };

    setTickets([newTicket, ...tickets]);

    setSite("");
    setSiteSearch("");
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
      showMessage("Seleziona tecnico, data e slot prima di pianificare", "error");
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
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
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
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closing_notes: closingNotes || "",
        future_needs: futureNeeds || "",
        resolved,
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
              resolved,
            }
          : t
      )
    );

    setClosingNotes("");
    setFutureNeeds("");
    setResolved(true);
    setClosingTicketId(null);

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
      (t.materialIds || [])
        .map((id: string) => materials.find((m) => m.id === id)?.name)
        .join(" + "),
      materialCost(t.materialIds || []),
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
        row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `secom-atlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  const selectedContract = getContractInfo(site, entity);

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold text-white shadow ${
              messageType === "success" ? "bg-green-700" : "bg-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <nav className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow md:grid-cols-6">
          {[
            ["operativo", "Operativo"],
            ["budget", "Budget"],
            ["mappa", "Mappa"],
            ["registro", "Registro"],
            ["clienti", "Clienti"],
            ["contratti", "Contratti"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`rounded-xl px-3 py-3 text-sm font-bold ${
                activeTab === key
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <header className="h-[240px] overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow">
          <div className="flex h-full flex-col items-center justify-center">
            <img
              src="/secom-logo.png.png"
              alt="Secom"
              className="h-44 w-auto object-contain md:h-56"
            />

            <div className="-mt-4 text-4xl font-bold tracking-[0.45em] text-white">
              ATLAS
            </div>

            <p className="mt-3 text-center text-sm text-slate-400">
              Centrale operativa nazionale interventi SPISPHOTO
            </p>
          </div>
        </header>

        {activeTab === "budget" && (
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow">
              <p className="text-sm text-slate-500">Budget iniziale</p>

              <div className="flex items-center justify-between gap-2">
                <p className="text-2xl font-bold">
                  {budgetVisible ? euro(budget) : "••••••"}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const value = prompt("Nuovo budget:");
                      if (!value) return;

                      const parsed = Number(value);
                      if (isNaN(parsed)) return;

                      setBudget(parsed);
                      localStorage.setItem("atlas-budget", String(parsed));
                      showMessage("Budget aggiornato");
                    }}
                    className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-bold"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => setBudgetVisible(!budgetVisible)}
                    className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-bold"
                  >
                    {budgetVisible ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>
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
        )}

        {activeTab === "operativo" && (
          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Apri nuova chiamata</h2>

            {site && (
              <div
                className={`mb-5 rounded-2xl border p-4 ${
                  selectedContract
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {selectedContract ? (
                  <>
                    <div className="mb-2 text-lg font-bold text-blue-900">
                      {selectedContract.name}
                    </div>

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p>
                        <b>Cliente:</b> {selectedContract.clientType}
                      </p>
                      <p>
                        <b>Stato:</b> {selectedContract.status}
                      </p>
                      <p>
                        <b>Periodo:</b> {selectedContract.period}
                      </p>
                      <p>
                        <b>Garanzia:</b> {selectedContract.warranty}
                      </p>
                      <p>
                        <b>Spedizione:</b> {selectedContract.shipping}
                      </p>
                      <p>
                        <b>Ricambi:</b> {selectedContract.spareParts}
                      </p>
                      <p>
                        <b>SLA:</b> {selectedContract.sla}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
                      {selectedContract.notes}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    Nessun contratto specifico riconosciuto per questa sede.
                  </p>
                )}
              </div>
            )}

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
        )}

        {activeTab === "mappa" && (
          <>
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
                Mappa temporaneamente disattivata. La riattiviamo dopo aver
                stabilizzato il deploy.
              </div>
            </section>
          </>
        )}

        {activeTab === "contratti" && (
          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-6 text-2xl font-bold">
              Contratti / Accordi commerciali
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map((contract) => (
                <div
                  key={contract.name}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="mb-3">
                    <p className="text-lg font-bold">{contract.name}</p>
                    <p className="text-sm text-slate-500">{contract.clientType}</p>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <p>
                      <b>Stato:</b> {contract.status}
                    </p>
                    <p>
                      <b>Periodo:</b> {contract.period}
                    </p>
                    <p>
                      <b>Garanzia:</b> {contract.warranty}
                    </p>
                    <p>
                      <b>Spedizione:</b> {contract.shipping}
                    </p>
                    <p>
                      <b>Ricambi:</b> {contract.spareParts}
                    </p>
                    <p>
                      <b>SLA:</b> {contract.sla}
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm">
                    {contract.notes}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "clienti" && (
          <section className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Clienti / Enti</h2>
                <p className="text-sm text-slate-500">{sites.length} sedi totali</p>
              </div>

              <input
                className="rounded-xl border p-3 md:w-96"
                placeholder="Cerca cliente, città, sede..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {Object.entries(clientCategories).map(([category, categorySites]) => {
                const filtered = categorySites.filter((s) => {
                  const q = clientSearch.toLowerCase();

                  return (
                    s.name?.toLowerCase().includes(q) ||
                    s.city?.toLowerCase().includes(q) ||
                    s.entity?.toLowerCase().includes(q) ||
                    s.region?.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) return null;

                return (
                  <div key={category} className="rounded-2xl border bg-slate-50">
                    <button
                      onClick={() =>
                        setOpenCategory(openCategory === category ? null : category)
                      }
                      className="flex w-full items-center justify-between p-5 text-left"
                    >
                      <div>
                        <p className="text-lg font-bold">{category}</p>
                        <p className="text-sm text-slate-500">
                          {filtered.length} sedi
                        </p>
                      </div>

                      <div className="text-2xl">
                        {openCategory === category ? "−" : "+"}
                      </div>
                    </button>

                    {openCategory === category && (
                      <div className="grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-2xl bg-white p-4 shadow-sm"
                          >
                            <p className="font-bold">{s.name}</p>

                            <p className="mt-1 text-sm text-slate-500">
                              {s.entity || "Ente n/d"}
                            </p>

                            <p className="mt-2 text-sm">
                              {s.city || "Città n/d"} ·{" "}
                              {s.region || "Regione n/d"}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              {s.address || "Indirizzo n/d"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "registro" && (
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
                <div
                  key={t.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
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
                    {t.region || "Regione n/d"} ·{" "}
                    {t.technician || "Tecnico non assegnato"}
                  </p>

                  <p className="mt-3 font-semibold">{t.problem}</p>

                  <p className="mt-2 text-sm text-slate-600">
                    Materiali:{" "}
                    {(t.materialIds || [])
                      .map(
                        (id: string) => materials.find((m) => m.id === id)?.name
                      )
                      .join(" + ") || "Nessuno"}
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    Costo: {euro(materialCost(t.materialIds || []))}
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
                        onClick={() => setClosingTicketId(String(t.id))}
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
                        {(t.materialIds || [])
                          .map(
                            (id: string) =>
                              materials.find((m) => m.id === id)?.name
                          )
                          .join(" + ") || "Nessuno"}
                      </td>

                      <td className="font-bold">
                        {euro(materialCost(t.materialIds || []))}
                      </td>
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
                              onClick={() => setClosingTicketId(String(t.id))}
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
        )}

        {closingTicketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">Chiudi intervento</h2>

              <textarea
                className="mb-3 w-full rounded-xl border p-3"
                placeholder="Note chiusura intervento"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
              />

              <textarea
                className="mb-3 w-full rounded-xl border p-3"
                placeholder="Necessità future / materiale da ordinare"
                value={futureNeeds}
                onChange={(e) => setFutureNeeds(e.target.value)}
              />

              <label className="mb-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={(e) => setResolved(e.target.checked)}
                />
                Intervento risolto
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setClosingTicketId(null);
                    setClosingNotes("");
                    setFutureNeeds("");
                    setResolved(true);
                  }}
                  className="flex-1 rounded-xl bg-slate-200 px-4 py-3 font-bold"
                >
                  Annulla
                </button>

                <button
                  onClick={() => closeTicket(closingTicketId)}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white"
                >
                  Conferma chiusura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}