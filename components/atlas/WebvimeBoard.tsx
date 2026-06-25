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
  Copy,
  Edit3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import TicketWorkspace from "@/components/atlas/TicketWorkspace";

type WebvimeTicket = Record<string, any>;

type WebvimeBoardProps = {
  tenant?: { id?: string | null } | null;
  currentUser?: { tenantId?: string | null } | null;
  glpiEnabled?: boolean;
};

type HelpContent = {
  id: string;
  category: string;
  title: string;
  keywords?: string | null;
  sql_text: string;
  notes?: string | null;
  kind?: "query" | "procedure" | null;
  created_at?: string | null;
};

const WEBVIME_OR =
  "glpi_entity_path.ilike.%webvime%,entity.ilike.%webvime%,site.ilike.%webvime%,city.ilike.%webvime%";

const HELP_CATEGORIES = [
  "Agenda",
  "Anagrafiche",
  "Costi",
  "Fatturazione",
  "Indicatori",
  "Portale",
  "Procedure",
  "Query Spot",
  "Report",
  "Utenze",
  "Visite",
  "Altro",
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
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Nessun dettaglio disponibile.";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
}

function escapeCsv(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function cleanLabel(value: any, fallback = "N/D") {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function monthKey(value: any) {
  const raw = value || "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Senza data";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function classifyWebvimeRequest(ticket: WebvimeTicket) {
  const text = normalize(
    `${ticket.problem || ""} ${ticket.description || ""} ${ticket.content || ""} ${ticket.status || ""} ${ticket.entity || ""} ${ticket.glpi_entity_path || ""}`,
  );

  if (
    /(referto|referti|direzionesanita rfi it|direzione sanita rfi it|link referto|accesso al referto|non riesco ad accedere|non accedo al referto|scaricare referto|ottenere il referto)/.test(text)
  )
    return "Portale / accesso referti";

  if (
    /(profilazione|profilare|abilitazione|abilitare|vime|creazione utenza|nuova utenza|utenza nuova|attivazione utenza)/.test(text)
  )
    return "Profilazione / utenze";

  if (
    /(password|utente|login|accesso|credenzial|reset|sbloc|blocco utenza|account)/.test(text)
  )
    return "Utenze / accessi";

  if (
    /(nexi|transazione|authorised|authorized|autorizzata|pagamento elettronico|pos|incasso|storno)/.test(text)
  )
    return "Transazioni / NEXI";

  if (
    /(anagraf|codice fiscale|cf |nominativo|paziente|dipendente|matricola|sesso|data nascita|luogo nascita)/.test(text)
  )
    return "Anagrafiche";

  if (/(effettuato|spunta|visita effettuata|prestazione effettuata|togliere effettuato|rimuovere effettuato)/.test(text))
    return "Effettuato / avanzamento";

  if (
    /(costo|costi|fattur|fattura|importo|tariff|rimborso|nota spese|conteggio|economico)/.test(text)
  )
    return "Costi / fatturazione";

  if (
    /(agenda|appuntamento|prenot|calendario|spost|data visita|pianifica|pianificazione|disdire|anticipare|posticipare)/.test(text)
  )
    return "Agenda / appuntamenti";

  if (/(indicatore|stato pratica|avanzamento|workflow|iter|stato visita|stato richiesta)/.test(text))
    return "Indicatori / stati";

  if (
    /(errore|bug|blocco|non funziona|problema|impossibile|anomalia|error|pagina bianca|timeout|caricamento)/.test(text)
  )
    return "Errore applicativo";

  if (/(report|estrazione|stampa|xls|excel|pdf|elenco|statistica|tabulato)/.test(text))
    return "Report / estrazioni";

  return "Altro / da classificare";
}

function extractUST(ticket: WebvimeTicket) {
  const sourceText = String(
    `${ticket.problem || ""} ${ticket.description || ""} ${ticket.content || ""}`,
  );

  const normalizedText = sourceText
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const directPatterns = [
    /\bUST\s+([A-ZÀ-Ú][A-Za-zÀ-Úà-ú'’\-\s]{2,45})\b/i,
    /\bUnit[aà]\s+Sanitaria\s+Territoriale\s+([A-ZÀ-Ú][A-Za-zÀ-Úà-ú'’\-\s]{2,45})\b/i,
  ];

  for (const pattern of directPatterns) {
    const match = normalizedText.match(pattern);
    if (match?.[1]) {
      const city = match[1]
        .replace(/\b(Rete|Ferroviaria|Italiana|S\.?p\.?A\.?|Direzione|Sanit[aà]|Mail|Piazza|Via|Tel|Telefono|Oggetto|Buongiorno|Saluti).*$/i, "")
        .replace(/[.,;:]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (city.length >= 2) return `UST ${city}`;
    }
  }

  return null;
}


function extractWebvimeOrigin(ticket: WebvimeTicket) {
  const ust = extractUST(ticket);
  if (ust) return ust;

  const sourceText = String(
    `${ticket.problem || ""} ${ticket.description || ""} ${ticket.content || ""}`,
  );

  const normalizedText = sourceText
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = normalizedText.toLowerCase();

  if (
    lower.includes("via f. a. pigafetta") ||
    lower.includes("via pigafetta") ||
    lower.includes("00154 roma") ||
    lower.includes("direzione sanità") ||
    lower.includes("direzione sanita")
  ) {
    return "UST Roma";
  }

  if (
    lower.includes("56125 pisa") ||
    lower.includes("unità sanitaria territoriale pisa") ||
    lower.includes("unita sanitaria territoriale pisa")
  ) {
    return "UST Pisa";
  }

  if (
    /(referto|referti|direzionesanita\.rfi\.it|non riesco ad accedere|accesso al referto|link referto|ottenere il referto)/i.test(
      normalizedText,
    )
  ) {
    return "Utente esterno";
  }

  if (/rete ferroviaria italiana|direzione sanit/i.test(normalizedText)) {
    return "RFI / Direzione Sanità";
  }

  return "Provenienza n/d";
}

function topEntries(
  rows: WebvimeTicket[],
  getter: (ticket: WebvimeTicket) => any,
  limit = 8,
) {
  const counts = new Map<string, number>();

  rows.forEach((ticket) => {
    const label = cleanLabel(getter(ticket));
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, limit);
}

export default function WebvimeBoard({ tenant = null, currentUser = null, glpiEnabled = true }: WebvimeBoardProps) {
  const tenantId = String(currentUser?.tenantId || "").trim();
  const tenantMatchesSession = Boolean(tenantId && tenant?.id && String(tenant.id) === tenantId);
  const [tickets, setTickets] = useState<WebvimeTicket[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    closed: 0,
    old: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "closed" | "old"
  >("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<WebvimeTicket | null>(
    null,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [helpItems, setHelpItems] = useState<HelpContent[]>([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState("");
  const [helpSearch, setHelpSearch] = useState("");
  const [activeHelpCategory, setActiveHelpCategory] = useState("Tutte");
  const [selectedHelpItem, setSelectedHelpItem] = useState<HelpContent | null>(
    null,
  );
  const [copiedHelpId, setCopiedHelpId] = useState<string | null>(null);
  const [helpEditorOpen, setHelpEditorOpen] = useState(false);
  const [editingHelpItem, setEditingHelpItem] = useState<HelpContent | null>(
    null,
  );
  const [savingHelp, setSavingHelp] = useState(false);
  const [helpForm, setHelpForm] = useState({
    kind: "query" as "query" | "procedure",
    category: "Query Spot",
    title: "",
    keywords: "",
    notes: "",
    sql_text: "",
  });

  async function countQuery(extra?: (query: any) => any) {
    let q = supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
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

    if (!glpiEnabled || !tenantMatchesSession) {
      setTickets([]);
      setMetrics({ total: 0, open: 0, closed: 0, old: 0 });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [{ data, error }, total, open, closed, old] = await Promise.all([
        supabase
          .from("tickets")
          .select(
            "id, glpi_ticket_id, site, entity, city, glpi_entity_path, problem, status, urgent, opened_at, closed_at, created_at, imported_at, expected_close_date, technician, source, customer_id, tenant_id",
          )
          .eq("tenant_id", tenantId)
          .eq("source", "glpi")
          .or(WEBVIME_OR)
          .order("imported_at", { ascending: false, nullsFirst: false })
          .order("glpi_ticket_id", { ascending: false, nullsFirst: false })
          .limit(1000),
        countQuery(),
        countQuery((q) => q.is("closed_at", null)),
        countQuery((q) => q.not("closed_at", "is", null)),
        countQuery((q) =>
          q
            .is("closed_at", null)
            .lt("opened_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        ),
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

  async function loadHelpContent() {
    setHelpLoading(true);
    setHelpError("");

    try {
      const response = await fetch("/api/admin/help-queries", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Errore caricamento Help Webvime.");
      }

      const rows = (result.items || []) as HelpContent[];
      setHelpItems(rows);
      setSelectedHelpItem((current) => {
        if (current && rows.some((item) => item.id === current.id))
          return current;
        return rows[0] || null;
      });
    } catch (error: any) {
      console.error("Help Webvime load error", error);
      setHelpError(error?.message || "Errore caricamento Help Webvime.");
      setHelpItems([]);
      setSelectedHelpItem(null);
    } finally {
      setHelpLoading(false);
    }
  }

  useEffect(() => {
    if (helpOpen) {
      loadHelpContent();
    }
  }, [helpOpen]);

  function resetHelpForm() {
    setHelpError("");
    setEditingHelpItem(null);
    setHelpForm({
      kind: "query",
      category: "Query Spot",
      title: "",
      keywords: "",
      notes: "",
      sql_text: "",
    });
  }

  function openNewHelpItem(kind: "query" | "procedure" = "query") {
    setHelpError("");
    setEditingHelpItem(null);
    setHelpForm({
      kind,
      category: kind === "procedure" ? "Procedure" : "Query Spot",
      title: "",
      keywords: "",
      notes: "",
      sql_text: "",
    });
    setHelpEditorOpen(true);
  }

  function openEditHelpItem(item: HelpContent) {
    setHelpError("");
    setEditingHelpItem(item);
    setHelpForm({
      kind: item.kind === "procedure" ? "procedure" : "query",
      category: item.category || "Query Spot",
      title: item.title || "",
      keywords: item.keywords || "",
      notes: item.notes || "",
      sql_text: item.sql_text || "",
    });
    setHelpEditorOpen(true);
  }

  async function saveHelpItem() {
    const title = helpForm.title.trim();
    const body = helpForm.sql_text.trim();

    if (!title || !body) {
      setHelpError("Titolo e contenuto sono obbligatori.");
      return;
    }

    setSavingHelp(true);
    setHelpError("");

    const payload = {
      id: editingHelpItem?.id,
      kind: helpForm.kind,
      category:
        helpForm.category ||
        (helpForm.kind === "procedure" ? "Procedure" : "Query Spot"),
      title,
      keywords: helpForm.keywords.trim() || title,
      notes: helpForm.notes.trim(),
      sql_text: body,
    };

    try {
      const response = await fetch("/api/admin/help-queries", {
        method: editingHelpItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Errore salvataggio contenuto Help.");
      }

      await loadHelpContent();
      setHelpEditorOpen(false);
      resetHelpForm();
    } catch (error: any) {
      console.error("Help save error", error);
      setHelpError(error?.message || "Errore salvataggio contenuto Help.");
    } finally {
      setSavingHelp(false);
    }
  }

  async function deleteHelpItem(item: HelpContent) {
    const ok = window.confirm(`Eliminare "${item.title}"?`);
    if (!ok) return;

    setHelpError("");

    try {
      const response = await fetch(
        `/api/admin/help-queries?id=${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Errore eliminazione contenuto Help.");
      }

      setHelpItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setSelectedHelpItem(null);
    } catch (error: any) {
      console.error("Help delete error", error);
      setHelpError(error?.message || "Errore eliminazione contenuto Help.");
    }
  }

  async function copyHelpContent(item: HelpContent) {
    try {
      await navigator.clipboard.writeText(item.sql_text || "");
      setCopiedHelpId(item.id);
      window.setTimeout(() => setCopiedHelpId(null), 1500);
    } catch {
      setHelpError("Copia non riuscita. Seleziona manualmente il testo.");
    }
  }

  useEffect(() => {
    loadWebvime();
  }, [glpiEnabled, tenantId, tenantMatchesSession]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, sortOrder, pageSize]);

  const filteredTickets = useMemo(() => {
    const q = normalize(query);

    return tickets
      .filter((ticket) => {
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
      })
      .slice()
      .sort((a, b) => {
        const aFuture = looksLikeFutureWebvimeTicket(a);
        const bFuture = looksLikeFutureWebvimeTicket(b);

        if (aFuture !== bFuture) return aFuture ? 1 : -1;

        const aTime = parseWebvimeDate(a);
        const bTime = parseWebvimeDate(b);

        if (sortOrder === "oldest") return aTime - bTime;
        return bTime - aTime;
      });
  }, [tickets, query, statusFilter, sortOrder]);

  const webvimeAnalytics = useMemo(() => {
    const source = filteredTickets;
    const closedTickets = source.filter(isClosed);
    const openTickets = source.filter((ticket) => !isClosed(ticket));
    const olderThan30 = openTickets.filter(
      (ticket) => (daysSince(ticket.opened_at || ticket.created_at) || 0) >= 30,
    ).length;

    const averageClosureDays = closedTickets.length
      ? Math.round(
          closedTickets.reduce((sum, ticket) => {
            const start = new Date(
              ticket.opened_at || ticket.created_at || ticket.imported_at || "",
            ).getTime();
            const end = new Date(ticket.closed_at || "").getTime();
            if (
              !start ||
              !end ||
              Number.isNaN(start) ||
              Number.isNaN(end) ||
              end < start
            )
              return sum;
            return sum + Math.max(0, Math.round((end - start) / 86400000));
          }, 0) / closedTickets.length,
        )
      : 0;

    const trend = topEntries(
      source,
      (ticket) =>
        monthKey(ticket.opened_at || ticket.created_at || ticket.imported_at),
      12,
    ).sort((a, b) => a.label.localeCompare(b.label));

    const classified = topEntries(source, classifyWebvimeRequest, 8);
    const topOrigins = topEntries(
      source,
      (ticket) => extractWebvimeOrigin(ticket),
      12,
    );

    const topSites = topEntries(
      source,
      (ticket) => ticket.site || ticket.city || ticket.glpi_entity_path,
      8,
    );
    const topEntities = topEntries(
      source,
      (ticket) => ticket.entity || ticket.glpi_entity_path,
      8,
    );
    const topTechnicians = topEntries(
      source,
      (ticket) => ticket.technician || "Non assegnato",
      8,
    );

    const mainCategory = classified[0];
    const mainOrigin = topOrigins.find((entry) => entry.label !== "Provenienza n/d") || null;
    const mainSite = topSites[0];
    const mainEntity = topEntities[0];

    const insights = [
      mainCategory
        ? `Categoria prevalente: ${mainCategory.label} (${mainCategory.count} ticket nel campione filtrato).`
        : "Nessuna categoria prevalente rilevata.",
      mainOrigin
        ? `Provenienza più ricorrente: ${mainOrigin.label} (${mainOrigin.count} ticket).`
        : "Nessuna provenienza rilevata nei testi dei ticket filtrati.",
      mainSite
        ? `Sede tecnica più ricorrente: ${mainSite.label} (${mainSite.count} ticket).`
        : "Nessuna sede tecnica ricorrente rilevata.",
      mainEntity
        ? `Entità più presente: ${mainEntity.label} (${mainEntity.count} ticket).`
        : "Nessuna entità ricorrente rilevata.",
      olderThan30 > 0
        ? `${olderThan30} ticket aperti risultano fermi da almeno 30 giorni.`
        : "Nessun ticket aperto oltre 30 giorni nel filtro attuale.",
      averageClosureDays > 0
        ? `Tempo medio di chiusura stimato: ${averageClosureDays} giorni.`
        : "Tempo medio di chiusura non calcolabile sui dati filtrati.",
    ];

    return {
      sourceCount: source.length,
      closedCount: closedTickets.length,
      openCount: openTickets.length,
      olderThan30,
      averageClosureDays,
      classified,
      topOrigins,
      topSites,
      topEntities,
      topTechnicians,
      trend,
      insights,
    };
  }, [filteredTickets]);

  const helpCategories = useMemo(() => {
    const categories = Array.from(
      new Set(helpItems.map((item) => item.category || "Altro")),
    ).sort((a, b) => a.localeCompare(b, "it"));
    return ["Tutte", ...categories];
  }, [helpItems]);

  const filteredHelpItems = useMemo(() => {
    const q = normalize(helpSearch);

    return helpItems.filter((item) => {
      const category = item.category || "Altro";
      const matchesCategory =
        activeHelpCategory === "Tutte" || category === activeHelpCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      const text = normalize(
        `${item.title} ${item.category} ${item.keywords} ${item.notes} ${item.sql_text}`,
      );
      return text.includes(q);
    });
  }, [helpItems, helpSearch, activeHelpCategory]);

  const groupedHelpItems = useMemo(() => {
    const grouped: Record<string, HelpContent[]> = {};

    filteredHelpItems.forEach((item) => {
      const category = item.category || "Altro";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, "it"));
  }, [filteredHelpItems]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );
  const pageStart =
    filteredTickets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(safeCurrentPage * pageSize, filteredTickets.length);



  function exportCsv() {
    const header = [
      "ID ATLAS",
      ...(glpiEnabled ? ["ID GLPI"] : []),
      "Stato",
      "Esito",
      "Provenienza rilevata",
      "Sede",
      "Ente",
      "Entity path",
      "Tecnico",
      "Apertura",
      "Chiusura",
      "Descrizione",
    ];
    const rows = filteredTickets.map((ticket) => [
      ticket.id,
      ...(glpiEnabled ? [ticket.glpi_ticket_id] : []),
      ticket.status,
      isClosed(ticket) ? "Chiuso" : "Aperto",
      extractWebvimeOrigin(ticket) || "",
      ticket.site,
      ticket.entity,
      ticket.glpi_entity_path,
      ticket.technician,
      formatDate(ticket.opened_at || ticket.created_at),
      formatDate(ticket.closed_at),
      ticket.problem,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");
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
      <div className="sticky top-0 z-40 -mx-5 -mt-5 grid gap-4 border-b border-white/10 bg-[#0b1524]/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
              PROGETTO WEBVIME
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              Registro separato Webvime
            </h2>
            <p className="mt-1 max-w-4xl text-sm font-bold text-slate-400">
              Archivio operativo separato: ticket Webvime, help interno, query,
              procedure e note ramificate. La lista sotto mostra gli ultimi 1000
              ticket sincronizzati, con orario di arrivo ATLAS; le metriche sono
              calcolate sul totale.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadWebvime}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Aggiorno..." : "Aggiorna"}
            </button>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) =>
                  prev === "newest" ? "oldest" : "newest",
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
              title="Cambia ordinamento cronologico"
            >
              <ArrowDownUp size={18} />
              Ordine: {sortOrder === "newest" ? "recenti" : "vecchi"}
            </button>

            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30"
            >
              <HelpCircle size={18} />
              Help Webvime
            </button>
            <button
              onClick={() => setAnalyticsOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 hover:bg-violet-500"
            >
              <FileSpreadsheet size={18} />
              Analisi
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30"
            >
              <Download size={18} />
              Esporta CSV
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric
            icon={FileSpreadsheet}
            label="Ticket Webvime totali"
            value={metrics.total}
            tone="blue"
          />
          <Metric
            icon={Ticket}
            label="Aperti"
            value={metrics.open}
            tone="amber"
          />
          <Metric
            icon={CheckCircle2}
            label="Chiusi"
            value={metrics.closed}
            tone="green"
          />
          <Metric
            icon={AlertTriangle}
            label="Aperti oltre 7 giorni"
            value={metrics.old}
            tone="red"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca negli ultimi 1000 ticket Webvime sincronizzati..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${statusFilter === item.key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/35 p-3 text-xs font-black text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Visualizzati {pageStart}-{pageEnd} di {filteredTickets.length}{" "}
            ticket filtrati
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">Per pagina</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size as 25 | 50 | 100)}
                className={`rounded-2xl px-3 py-2 ${pageSize === size ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-h-[58vh] min-h-[430px] overflow-y-auto overscroll-contain pr-2">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
            Caricamento registro Webvime...
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm font-bold text-red-100">
            Registro Webvime non caricato: {loadError}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
            Nessun ticket Webvime trovato con questi filtri.
          </div>
        ) : (
          <div className="grid gap-3">
            {paginatedTickets.map((ticket) => {
              const closed = isClosed(ticket);
              const age = daysSince(ticket.opened_at || ticket.created_at);
              const old = !closed && age !== null && age >= 7;

              return (
                <article
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`cursor-pointer rounded-3xl border p-4 transition hover:bg-blue-500/10 ${old ? "border-amber-500/30 bg-amber-500/10" : closed ? "border-emerald-500/20 bg-emerald-500/10" : "border-white/10 bg-white/[0.045]"}`}
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white">
                          WEBVIME
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">
                          ATLAS #{ticket.id}
                        </span>
                        {glpiEnabled && ticket.glpi_ticket_id && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">
                            GLPI #{ticket.glpi_ticket_id}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${closed ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}
                        >
                          {closed ? "CHIUSO" : "APERTO"}
                        </span>
                        {old && (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white">
                            +7 GIORNI
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 break-words text-lg font-black text-white">
                        {shortText(ticket.problem, 120)}
                      </h3>
                      <p className="mt-2 text-sm font-bold text-slate-400">
                        {extractWebvimeOrigin(ticket) ||
                          ticket.glpi_entity_path ||
                          ticket.entity ||
                          "Webvime"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} />
                          Arrivo: {formatDateTime(ticket.imported_at)}
                        </span>
                        <span>
                          Apertura:{" "}
                          {formatDateTime(
                            ticket.opened_at || ticket.created_at,
                          )}
                        </span>
                        <span>Chiusura: {formatDate(ticket.closed_at)}</span>
                        <span>Tecnico: {ticket.technician || "N/D"}</span>
                        <span>Stato: {ticket.status || "N/D"}</span>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTicket(ticket);
                      }}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white"
                    >
                      Apri dettaglio
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!loading && !loadError && filteredTickets.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0b1524]/95 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black text-slate-400">
            Pagina {safeCurrentPage} di {totalPages} · {pageStart}-{pageEnd} di{" "}
            {filteredTickets.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prima
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Indietro
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Avanti
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ultima
            </button>
          </div>
        </div>
      )}

      {analyticsOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={() => setAnalyticsOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                  ANALISI WEBVIME
                </p>
                <h3 className="mt-1 text-2xl font-black">
                  Statistiche operative
                </h3>
                <p className="mt-1 max-w-4xl text-sm font-bold text-slate-400">
                  Consultazione rapida sul filtro attuale. Clicca fuori per
                  tornare al registro ticket.
                </p>
              </div>
              <button
                onClick={() => setAnalyticsOpen(false)}
                className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="grid gap-4 rounded-[1.75rem] border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
                    ANALISI WEBVIME
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    Statistiche operative sul filtro attuale
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    Analisi calcolata su {webvimeAnalytics.sourceCount} ticket
                    caricati/filtrati. È già utile anche senza AI: evidenzia
                    sedi, entità, tecnici e tipologie ricorrenti.
                  </p>
                </div>
                <div className="grid min-w-[220px] gap-2 rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Tempo medio chiusura
                  </p>
                  <p className="text-3xl font-black text-white">
                    {webvimeAnalytics.averageClosureDays || "—"}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    giorni stimati sui ticket chiusi
                  </p>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-4">
                <AnalyticsList
                  title="Tipologie stimate"
                  rows={webvimeAnalytics.classified}
                />
                <AnalyticsList
                  title="Provenienza richieste"
                  rows={webvimeAnalytics.topOrigins}
                />
                <AnalyticsList
                  title="Top entità"
                  rows={webvimeAnalytics.topEntities}
                />
                <AnalyticsList
                  title="Top tecnici"
                  rows={webvimeAnalytics.topTechnicians}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Trend mensile
                  </p>
                  <div className="mt-4 grid gap-2">
                    {webvimeAnalytics.trend.length === 0 ? (
                      <p className="text-sm font-bold text-slate-500">
                        Nessun dato temporale disponibile.
                      </p>
                    ) : (
                      webvimeAnalytics.trend.map((item) => {
                        const max = Math.max(
                          ...webvimeAnalytics.trend.map((row) => row.count),
                          1,
                        );
                        return (
                          <div
                            key={item.label}
                            className="grid gap-2 md:grid-cols-[90px_1fr_55px] md:items-center"
                          >
                            <span className="text-xs font-black text-slate-400">
                              {item.label}
                            </span>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.max(6, Math.round((item.count / max) * 100))}%`,
                                }}
                              />
                            </div>
                            <span className="text-right text-xs font-black text-white">
                              {item.count}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                    Insight automatici
                  </p>
                  <div className="mt-3 grid gap-2">
                    {webvimeAnalytics.insights.map((insight, index) => (
                      <div
                        key={`${insight}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-slate-200"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <TicketWorkspace
          ticket={selectedTicket}
          open={Boolean(selectedTicket)}
          onClose={() => {
            setSelectedTicket(null);
            loadWebvime();
          }}
          glpiEnabled={glpiEnabled}
          onStatusUpdated={(updatedTicket) => {
            setSelectedTicket(updatedTicket);
            setTickets((prev) =>
              prev.map((ticket) =>
                Number(ticket.id) === Number(updatedTicket.id)
                  ? { ...ticket, ...updatedTicket }
                  : ticket,
              ),
            );
          }}
        />
      )}

      {helpOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={() => setHelpOpen(false)}
        >
          <div
            className="grid h-[92vh] w-full max-w-7xl grid-cols-1 gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl xl:grid-cols-[360px_1fr]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                    HELP WEBVIME
                  </p>
                  <h3 className="mt-1 text-xl font-black">Query e procedure</h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {helpItems.length} contenuti caricati da Supabase
                  </p>
                </div>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="rounded-2xl bg-white/10 p-3"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="mt-4 grid shrink-0 gap-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={helpSearch}
                    onChange={(event) => setHelpSearch(event.target.value)}
                    placeholder="Cerca query, procedura, utenza, fattura..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadHelpContent}
                  disabled={helpLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-3 py-3 text-xs font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={15}
                    className={helpLoading ? "animate-spin" : ""}
                  />
                  {helpLoading ? "Carico..." : "Aggiorna Help"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openNewHelpItem("query")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-3 text-xs font-black text-white hover:bg-blue-500"
                  >
                    <Plus size={15} />
                    Nuova query
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewHelpItem("procedure")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 py-3 text-xs font-black text-white hover:bg-violet-500"
                  >
                    <Plus size={15} />
                    Procedura
                  </button>
                </div>
              </div>

              <div className="mt-4 flex shrink-0 flex-wrap gap-2">
                {helpCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveHelpCategory(category);
                      setSelectedHelpItem(null);
                    }}
                    className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wide ${
                      activeHelpCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-4 h-[52vh] min-h-[360px] overflow-y-auto overscroll-contain pr-2">
                {helpLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-400">
                    Caricamento contenuti...
                  </div>
                ) : helpError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                    {helpError}
                  </div>
                ) : filteredHelpItems.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-400">
                    Nessun contenuto. Crea una query o una procedura verificata.
                  </div>
                ) : (
                  <div className="grid gap-3 pb-4">
                    {groupedHelpItems.map(([category, items]) => (
                      <div key={category} className="grid gap-2">
                        <p className="sticky top-0 z-10 bg-[#0f1c2d] px-2 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                          {category} · {items.length}
                        </p>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedHelpItem(item)}
                            className={`rounded-2xl border p-3 text-left transition ${
                              selectedHelpItem?.id === item.id
                                ? "border-blue-500 bg-blue-600/20"
                                : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-black ${item.kind === "procedure" ? "bg-violet-600" : "bg-blue-600"} text-white`}
                              >
                                {item.kind === "procedure"
                                  ? "PROCEDURA"
                                  : "QUERY"}
                              </span>
                            </div>
                            <p className="mt-2 break-words text-sm font-black text-white">
                              {item.title}
                            </p>
                            {item.keywords && (
                              <p className="mt-1 line-clamp-2 text-[11px] font-bold text-slate-500">
                                {item.keywords}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <main className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              {selectedHelpItem ? (
                <>
                  <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                        {selectedHelpItem.category}
                      </p>
                      <h3 className="mt-1 break-words text-2xl font-black">
                        {selectedHelpItem.title}
                      </h3>
                      {selectedHelpItem.keywords && (
                        <p className="mt-2 text-xs font-bold text-slate-400">
                          Keyword: {selectedHelpItem.keywords}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyHelpContent(selectedHelpItem)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500"
                      >
                        <Copy size={16} />
                        {copiedHelpId === selectedHelpItem.id
                          ? "Copiato"
                          : selectedHelpItem.kind === "procedure"
                            ? "Copia procedura"
                            : "Copia query"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditHelpItem(selectedHelpItem)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                      >
                        <Edit3 size={16} />
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHelpItem(selectedHelpItem)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
                      >
                        <Trash2 size={16} />
                        Elimina
                      </button>
                    </div>
                  </div>

                  {selectedHelpItem.notes && (
                    <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                        Note operative
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-amber-50">
                        {selectedHelpItem.notes}
                      </p>
                    </div>
                  )}

                  <pre className="mt-5 h-[58vh] min-h-[380px] overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm font-semibold leading-relaxed text-slate-100">
                    <code>
                      {selectedHelpItem.sql_text ||
                        "-- Contenuto non presente nel database."}
                    </code>
                  </pre>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center">
                  <div>
                    <HelpCircle className="mx-auto text-blue-300" size={38} />
                    <h3 className="mt-3 text-2xl font-black">
                      Seleziona un contenuto
                    </h3>
                    <p className="mt-2 max-w-md text-sm font-bold text-slate-400">
                      Usa la ricerca a sinistra o scegli una categoria. Puoi
                      copiare query e procedure operative.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {helpEditorOpen && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            setHelpEditorOpen(false);
            resetHelpForm();
          }}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                  HELP WEBVIME
                </p>
                <h3 className="mt-1 text-2xl font-black">
                  {editingHelpItem
                    ? "Modifica contenuto"
                    : "Nuovo contenuto verificato"}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Inserisci solo query o procedure già controllate. Questo
                  archivio deve restare pulito.
                </p>
              </div>
              <button
                onClick={() => {
                  setHelpEditorOpen(false);
                  resetHelpForm();
                }}
                className="rounded-2xl bg-white/10 p-3"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Tipo contenuto
                  </span>
                  <select
                    value={helpForm.kind}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        kind: event.target.value as "query" | "procedure",
                        category:
                          event.target.value === "procedure"
                            ? "Procedure"
                            : prev.category === "Procedure"
                              ? "Query Spot"
                              : prev.category,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500"
                  >
                    <option value="query">Query SQL</option>
                    <option value="procedure">
                      Procedura / Nota operativa
                    </option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Categoria
                  </span>
                  <select
                    value={helpForm.category}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500"
                  >
                    {HELP_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Titolo *
                  </span>
                  <input
                    value={helpForm.title}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Es. Reset password utente portale"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Keyword
                  </span>
                  <input
                    value={helpForm.keywords}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        keywords: event.target.value,
                      }))
                    }
                    placeholder="password, utenza, portale, sblocco"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Note operative / istruzioni
                  </span>
                  <textarea
                    value={helpForm.notes}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Quando usarla, cosa modificare prima di eseguirla, rischi, campi da sostituire..."
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-semibold outline-none focus:border-blue-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    {helpForm.kind === "procedure"
                      ? "Procedura / testo operativo *"
                      : "Query SQL *"}
                  </span>
                  <textarea
                    value={helpForm.sql_text}
                    onChange={(event) =>
                      setHelpForm((prev) => ({
                        ...prev,
                        sql_text: event.target.value,
                      }))
                    }
                    rows={18}
                    placeholder={
                      helpForm.kind === "procedure"
                        ? "Scrivi qui la procedura operativa..."
                        : "Incolla qui la query SQL reale..."
                    }
                    className="min-h-[420px] rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm font-semibold leading-relaxed text-slate-100 outline-none focus:border-blue-500"
                  />
                </label>

                {helpError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                    {helpError}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setHelpEditorOpen(false);
                  resetHelpForm();
                }}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={saveHelpItem}
                disabled={savingHelp}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {savingHelp
                  ? "Salvataggio..."
                  : editingHelpItem
                    ? "Salva modifiche"
                    : "Salva contenuto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {rows.length === 0 ? (
          <p className="text-sm font-bold text-slate-500">Nessun dato.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="grid gap-1">
              <div className="flex items-center justify-between gap-3">
                <p
                  className="min-w-0 truncate text-xs font-black text-white"
                  title={row.label}
                >
                  {row.label}
                </p>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
                  {row.count}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.max(8, Math.round((row.count / max) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: any) {
  const toneClass =
    tone === "red"
      ? "text-red-300"
      : tone === "amber"
        ? "text-amber-300"
        : tone === "green"
          ? "text-emerald-300"
          : "text-blue-300";
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <Icon className={toneClass} size={22} />
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

