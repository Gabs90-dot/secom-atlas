"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Search,
  Ticket,
  XCircle,
  HelpCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type WebvimeTicket = Record<string, any>;

type WebvimeHelpSection = {
  id: string;
  title: string;
  category: string;
  type: "query" | "procedure" | "section";
  body: string;
  children: Array<{ id: string; title: string; body: string }>;
};

const WEBVIME_OR =
  "glpi_entity_path.ilike.%webvime%,entity.ilike.%webvime%,site.ilike.%webvime%,city.ilike.%webvime%";

const DEFAULT_HELP_SECTIONS: WebvimeHelpSection[] = [
  {
    id: "query-base",
    title: "Query utili",
    category: "Query",
    type: "query",
    body: "Incolla qui query SQL utili per Webvime, reset utenti, pratiche, stati, costi o diagnostica.",
    children: [],
  },
  {
    id: "procedure-base",
    title: "Procedure operative",
    category: "Procedure",
    type: "procedure",
    body: "Scrivi qui procedure consultabili con titolo, note e passaggi.",
    children: [],
  },
];

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isClosed(ticket: WebvimeTicket) {
  const status = normalize(ticket.status);
  return (
    Boolean(ticket.closed_at) ||
    status.includes("chiuso") ||
    status.includes("closed") ||
    status.includes("risolto") ||
    status.includes("validato") ||
    status === "5" ||
    status === "6"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysSince(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function parseWebvimeDate(ticket: WebvimeTicket) {
  const rawDate =
    ticket.imported_at ||
    ticket.opened_at ||
    ticket.created_at ||
    ticket.expected_close_date;

  if (!rawDate) return 0;

  const parsed = new Date(rawDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function looksLikeFutureWebvimeTicket(ticket: WebvimeTicket) {
  const value = parseWebvimeDate(ticket);
  if (!value) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + 1);
  return value > limit.getTime();
}

function shortText(value: any, limit = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "Nessun dettaglio disponibile.";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
}

function escapeCsv(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function WebvimeBoard() {
  const [tickets, setTickets] = useState<WebvimeTicket[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, closed: 0, old: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "old">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<WebvimeTicket | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSections, setHelpSections] = useState<WebvimeHelpSection[]>(() => {
    if (typeof window === "undefined") return DEFAULT_HELP_SECTIONS;
    try {
      const saved = localStorage.getItem("atlas-webvime-help-sections");
      return saved ? JSON.parse(saved) : DEFAULT_HELP_SECTIONS;
    } catch {
      return DEFAULT_HELP_SECTIONS;
    }
  });
  const [activeHelpId, setActiveHelpId] = useState("query-base");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas-webvime-help-sections", JSON.stringify(helpSections));
    }
  }, [helpSections]);

  async function countQuery(extra?: (query: any) => any) {
    let q = supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("source", "glpi")
      .or(WEBVIME_OR);

    if (extra) q = extra(q);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }

  async function loadWebvime() {
    setRefreshing(true);
    setLoading(true);
    setLoadError("");

    try {
      const [{ data, error }, total, open, closed, old] = await Promise.all([
        supabase
          .from("tickets")
          .select(
            "id, glpi_ticket_id, site, entity, city, glpi_entity_path, problem, status, urgent, opened_at, closed_at, created_at, imported_at, expected_close_date, technician, source, customer_id, tenant_id",
          )
          .eq("source", "glpi")
          .or(WEBVIME_OR)
          .order("imported_at", { ascending: false, nullsFirst: false })
          .order("glpi_ticket_id", { ascending: false, nullsFirst: false })
          .limit(1000),
        countQuery(),
        countQuery((q) => q.is("closed_at", null)),
        countQuery((q) => q.not("closed_at", "is", null)),
        countQuery((q) => q.is("closed_at", null).lt("opened_at", new Date(Date.now() - 7 * 86400000).toISOString())),
      ]);

      if (error) throw error;

      setTickets(data || []);
      setMetrics({ total, open, closed, old });
    } catch (error: any) {
      console.error("Webvime load error", error);
      setLoadError(error?.message || "Errore caricamento ticket Webvime.");
      setTickets([]);
      setMetrics({ total: 0, open: 0, closed: 0, old: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadWebvime();
  }, []);

  const filteredTickets = useMemo(() => {
    const q = normalize(query);

    return tickets.filter((ticket) => {
      const closed = isClosed(ticket);
      const age = daysSince(ticket.opened_at || ticket.created_at) || 0;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && !closed) ||
        (statusFilter === "closed" && closed) ||
        (statusFilter === "old" && !closed && age >= 7);

      if (!matchesStatus) return false;
      if (!q) return true;

      const text = normalize(`
        ${ticket.id}
        ${ticket.glpi_ticket_id}
        ${ticket.problem}
        ${ticket.status}
        ${ticket.technician}
        ${ticket.site}
        ${ticket.entity}
        ${ticket.glpi_entity_path}
      `);

      return text.includes(q);
    }).slice().sort((a, b) => {
      const aFuture = looksLikeFutureWebvimeTicket(a);
      const bFuture = looksLikeFutureWebvimeTicket(b);

      if (aFuture !== bFuture) return aFuture ? 1 : -1;

      const aTime = parseWebvimeDate(a);
      const bTime = parseWebvimeDate(b);

      if (sortOrder === "oldest") return aTime - bTime;
      return bTime - aTime;
    });
  }, [tickets, query, statusFilter, sortOrder]);

  const activeHelp = helpSections.find((section) => section.id === activeHelpId) || helpSections[0];

  function updateHelpSection(id: string, patch: Partial<WebvimeHelpSection>) {
    setHelpSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  }

  function addHelpSection(type: WebvimeHelpSection["type"] = "section") {
    const section: WebvimeHelpSection = {
      id: `webvime-help-${Date.now()}`,
      title: "Nuova sezione",
      category: type === "query" ? "Query" : type === "procedure" ? "Procedure" : "Sezione",
      type,
      body: "",
      children: [],
    };
    setHelpSections((prev) => [section, ...prev]);
    setActiveHelpId(section.id);
  }

  function addChildToHelp(sectionId: string) {
    setHelpSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, children: [...section.children, { id: `child-${Date.now()}`, title: "Nuovo ramo", body: "" }] }
          : section,
      ),
    );
  }

  function updateChild(sectionId: string, childId: string, patch: any) {
    setHelpSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, children: section.children.map((child) => (child.id === childId ? { ...child, ...patch } : child)) }
          : section,
      ),
    );
  }

  function deleteHelpSection(id: string) {
    const next = helpSections.filter((section) => section.id !== id);
    setHelpSections(next.length ? next : DEFAULT_HELP_SECTIONS);
    setActiveHelpId((next[0] || DEFAULT_HELP_SECTIONS[0]).id);
  }

  function exportCsv() {
    const header = ["ID ATLAS", "ID GLPI", "Stato", "Esito", "Sede", "Ente", "Entity path", "Tecnico", "Apertura", "Chiusura", "Descrizione"];
    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      ticket.glpi_ticket_id,
      ticket.status,
      isClosed(ticket) ? "Chiuso" : "Aperto",
      ticket.site,
      ticket.entity,
      ticket.glpi_entity_path,
      ticket.technician,
      formatDate(ticket.opened_at || ticket.created_at),
      formatDate(ticket.closed_at),
      ticket.problem,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-webvime-ticket-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filters = [
    { key: "all", label: "Tutti" },
    { key: "open", label: "Aperti" },
    { key: "closed", label: "Chiusi" },
    { key: "old", label: "Vecchi +7g" },
  ] as const;

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">PROGETTO WEBVIME</p>
          <h2 className="mt-2 text-3xl font-black text-white">Registro separato Webvime</h2>
          <p className="mt-1 max-w-4xl text-sm font-bold text-slate-400">
            Archivio operativo separato: ticket Webvime, help interno, query, procedure e note ramificate.
            La lista sotto mostra gli ultimi 1000 ticket sincronizzati, le metriche sono calcolate sul totale.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadWebvime}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Aggiorno..." : "Aggiorna"}
          </button>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            title="Cambia ordinamento cronologico"
          >
            <ArrowDownUp size={18} />
            Ordine: {sortOrder === "newest" ? "recenti" : "vecchi"}
          </button>

          <button onClick={() => setHelpOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30">
            <HelpCircle size={18} />
            Help Webvime
          </button>
          <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30">
            <Download size={18} />
            Esporta CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={FileSpreadsheet} label="Ticket Webvime totali" value={metrics.total} tone="blue" />
        <Metric icon={Ticket} label="Aperti" value={metrics.open} tone="amber" />
        <Metric icon={CheckCircle2} label="Chiusi" value={metrics.closed} tone="green" />
        <Metric icon={AlertTriangle} label="Aperti oltre 7 giorni" value={metrics.old} tone="red" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca negli ultimi 1000 ticket Webvime sincronizzati..." className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500" />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item.key} onClick={() => setStatusFilter(item.key)} className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${statusFilter === item.key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Caricamento registro Webvime...</div>
      ) : loadError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm font-bold text-red-100">Registro Webvime non caricato: {loadError}</div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Nessun ticket Webvime trovato con questi filtri.</div>
      ) : (
        <div className="grid gap-3">
          {filteredTickets.map((ticket) => {
            const closed = isClosed(ticket);
            const age = daysSince(ticket.opened_at || ticket.created_at);
            const old = !closed && age !== null && age >= 7;

            return (
              <article key={ticket.id} className={`rounded-3xl border p-4 ${old ? "border-amber-500/30 bg-amber-500/10" : closed ? "border-emerald-500/20 bg-emerald-500/10" : "border-white/10 bg-white/[0.045]"}`}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white">WEBVIME</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">ATLAS #{ticket.id}</span>
                      {ticket.glpi_ticket_id && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">GLPI #{ticket.glpi_ticket_id}</span>}
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black ${closed ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>{closed ? "CHIUSO" : "APERTO"}</span>
                      {old && <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white">+7 GIORNI</span>}
                    </div>
                    <h3 className="mt-3 break-words text-lg font-black text-white">{shortText(ticket.problem, 120)}</h3>
                    <p className="mt-2 text-sm font-bold text-slate-400">{ticket.glpi_entity_path || ticket.entity || "Root > Webvime"}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock size={13} />Sync: {formatDate(ticket.imported_at)}</span>
                      <span>Apertura: {formatDate(ticket.opened_at || ticket.created_at)}</span>
                      <span>Chiusura: {formatDate(ticket.closed_at)}</span>
                      <span>Tecnico: {ticket.technician || "N/D"}</span>
                      <span>Stato: {ticket.status || "N/D"}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTicket(ticket)} className="rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white">Apri dettaglio</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedTicket(null)}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Dettaglio Webvime</p>
                <h3 className="mt-2 text-2xl font-black">Ticket GLPI #{selectedTicket.glpi_ticket_id || selectedTicket.id}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="rounded-2xl bg-white/10 p-3 text-white"><XCircle size={20} /></button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Detail label="Stato" value={selectedTicket.status || "N/D"} />
              <Detail label="Tecnico" value={selectedTicket.technician || "N/D"} />
              <Detail label="Sync ATLAS" value={formatDate(selectedTicket.imported_at)} />
              <Detail label="Apertura" value={formatDate(selectedTicket.opened_at || selectedTicket.created_at)} />
              <Detail label="Chiusura" value={formatDate(selectedTicket.closed_at)} />
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Entity path</p>
              <p className="mt-2 text-sm font-bold text-slate-200">{selectedTicket.glpi_entity_path || selectedTicket.entity || "Root > Webvime"}</p>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Contenuto ticket</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-200">{selectedTicket.problem || "Nessun contenuto disponibile."}</p>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setHelpOpen(false)}>
          <div className="grid max-h-[92vh] w-full max-w-7xl grid-cols-1 gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl xl:grid-cols-[320px_1fr]" onMouseDown={(event) => event.stopPropagation()}>
            <aside className="min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">HELP WEBVIME</p>
                  <h3 className="mt-1 text-xl font-black">Base operativa</h3>
                </div>
                <button onClick={() => setHelpOpen(false)} className="rounded-2xl bg-white/10 p-3"><XCircle size={18} /></button>
              </div>
              <div className="mt-4 grid gap-2">
                <button onClick={() => addHelpSection("query")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-3 text-xs font-black"><Plus size={15} />Nuova query</button>
                <button onClick={() => addHelpSection("procedure")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-black"><Plus size={15} />Nuova procedura</button>
                <button onClick={() => addHelpSection("section")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 py-3 text-xs font-black"><Plus size={15} />Nuova sezione</button>
              </div>
              <div className="mt-4 grid gap-2">
                {helpSections.map((section) => (
                  <button key={section.id} onClick={() => setActiveHelpId(section.id)} className={`rounded-2xl border p-3 text-left transition ${activeHelp?.id === section.id ? "border-blue-500 bg-blue-600/20" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{section.category}</p>
                    <p className="mt-1 break-words text-sm font-black">{section.title}</p>
                  </button>
                ))}
              </div>
            </aside>

            {activeHelp && (
              <main className="min-h-0 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">{activeHelp.category}</p>
                    <h3 className="mt-1 text-2xl font-black">Editor Help Webvime</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => addChildToHelp(activeHelp.id)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black"><Plus size={15} />Aggiungi ramo</button>
                    <button onClick={() => deleteHelpSection(activeHelp.id)} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-black"><Trash2 size={15} />Elimina</button>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Titolo</span>
                    <input value={activeHelp.title} onChange={(event) => updateHelpSection(activeHelp.id, { title: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Categoria</span>
                    <input value={activeHelp.category} onChange={(event) => updateHelpSection(activeHelp.id, { category: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Testo / query / procedura</span>
                    <textarea value={activeHelp.body} onChange={(event) => updateHelpSection(activeHelp.id, { body: event.target.value })} rows={12} placeholder="Incolla query, procedura, note operative, passaggi..." className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 font-mono text-sm outline-none focus:border-blue-500" />
                  </label>
                  <div className="grid gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Rami / sottosezioni</p>
                    {activeHelp.children.length === 0 ? (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-400">Nessun ramo. Usa “Aggiungi ramo” per ramificare questa sezione.</p>
                    ) : (
                      activeHelp.children.map((child) => (
                        <div key={child.id} className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                          <input value={child.title} onChange={(event) => updateChild(activeHelp.id, child.id, { title: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-black outline-none focus:border-blue-500" />
                          <textarea value={child.body} onChange={(event) => updateChild(activeHelp.id, child.id, { body: event.target.value })} rows={5} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-semibold outline-none focus:border-blue-500" />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100"><Save className="mr-2 inline" size={16} />Salvataggio automatico locale attivo.</div>
                </div>
              </main>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone }: any) {
  const toneClass = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : tone === "green" ? "text-emerald-300" : "text-blue-300";
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <Icon className={toneClass} size={22} />
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}
