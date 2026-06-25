"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  History,
  MessageSquare,
  Package,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import TicketAttachmentsPanel from "@/components/atlas/TicketAttachmentsPanel";
import type { WorkOrder } from "@/types/work-orders";

export type TicketWorkspaceProps = {
  ticket: any | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated?: (ticket: any) => void;
  glpiEnabled?: boolean;
};

type WorkspaceTab =
  | "overview"
  | "conversazione"
  | "timeline"
  | "operativita"
  | "materiali"
  | "bolla"
  | "allegati"
  | "ai";

type EnsureWorkOrderResponse = {
  ok: boolean;
  created?: boolean;
  data?: WorkOrder | null;
  error?: string;
};

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function displayStatus(ticket: any) {
  const raw = ticket?.status || ticket?.ticket_status || ticket?.glpi_status || "";
  const value = normalize(raw);

  if (
    ticket?.closedAt ||
    ticket?.closed_at ||
    value === "5" ||
    value === "6" ||
    value.includes("chiuso") ||
    value.includes("closed") ||
    value.includes("risolto") ||
    value.includes("solved") ||
    value.includes("validato")
  ) {
    return "Chiuso";
  }

  if (value.includes("pian")) return "Pianificato";
  if (value.includes("sosp") || value.includes("attesa")) return "In sospeso";
  if (value.includes("lavor") || value.includes("assegn") || value.includes("carico")) return "In lavorazione";
  if (value.includes("nuovo")) return "Nuovo";

  return raw || "Aperto";
}

function statusTone(status: any) {
  const value = normalize(status);
  if (value.includes("chiuso") || value.includes("risolto") || value.includes("validato")) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (value.includes("pian")) return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  if (value.includes("sosp") || value.includes("attesa")) return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (value.includes("lavor") || value.includes("assegn") || value.includes("carico")) return "border-violet-500/30 bg-violet-500/15 text-violet-200";
  return "border-slate-500/30 bg-slate-500/15 text-slate-200";
}

function ticketDescription(ticket: any) {
  return (
    ticket?.problem ||
    ticket?.description ||
    ticket?.content ||
    ticket?.glpi_description ||
    ticket?.glpi_raw?.content ||
    ticket?.glpi_raw?.["21"] ||
    ticket?.glpi_raw?.["Commenti - Descrizione"] ||
    ticket?.glpi_raw?.["Descrizione"] ||
    "Descrizione non disponibile"
  );
}

function ticketTitle(ticket: any) {
  return (
    ticket?.title ||
    ticket?.name ||
    ticket?.glpi_title ||
    ticket?.glpi_raw?.name ||
    ticket?.glpi_raw?.["1"] ||
    `Ticket #${ticket?.id || "n/d"}`
  );
}

function ticketCustomerLabel(ticket: any) {
  return (
    ticket?.customerName ||
    ticket?.customer_name ||
    ticket?.customer?.name ||
    ticket?.customerId ||
    ticket?.customer_id ||
    "Cliente non assegnato"
  );
}

function isWebvimeTicket(ticket: any) {
  const text = normalize(
    `${ticket?.site || ""} ${ticket?.entity || ""} ${ticket?.glpi_entity_path || ""} ${ticket?.source || ""} ${ticket?.problem || ""}`,
  );

  return (
    text.includes("webvime") ||
    String(ticket?.site || "").toLowerCase() === "webvime"
  );
}

function getTicketTenantId(ticket: any) {
  return ticket?.tenantId || ticket?.tenant_id || null;
}

function cleanWebvimeText(ticket: any) {
  return String(
    `${ticket?.problem || ""} ${ticket?.description || ""} ${ticket?.content || ""}`,
  )
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function cleanConversationContent(content: string, compact: boolean) {
  let text = String(content || "");
  if (!compact) return text;

  const cutPatterns = [
    /If you have received this message by mistake[\s\S]*/i,
    /Informazione ad uso interno[\s\S]*/i,
    /Rispetta l.?ambiente[\s\S]*/i,
    /Rete Ferroviaria Italiana S\.p\.A\.[\s\S]*/i,
    /Direzione Sanit[aà][\s\S]*/i,
  ];

  for (const p of cutPatterns) {
    text = text.replace(p, "");
  }

  return text.trim();
}
function extractWebvimeOrigin(ticket: any) {
  const text = cleanWebvimeText(ticket);
  const lower = text.toLowerCase();

  const directPatterns = [
    /\bUST\s+([A-ZÀ-Ú][A-Za-zÀ-Úà-ú'’\-\s]{2,45})\b/i,
    /\bUnit[aà]\s+Sanitaria\s+Territoriale\s+([A-ZÀ-Ú][A-Za-zÀ-Úà-ú'’\-\s]{2,45})\b/i,
  ];

  for (const pattern of directPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const city = match[1]
        .replace(/\b(Rete|Ferroviaria|Italiana|S\.?p\.?A\.?|Direzione|Sanit[aà]|Mail|Piazza|Via|Tel|Telefono|Oggetto|Buongiorno|Saluti).*$/i, "")
        .replace(/[.,;:]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (city.length >= 2) return `UST ${city}`;
    }
  }

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
    /(referto|referti|direzionesanita\.rfi\.it|non riesco ad accedere|accesso al referto|link referto)/i.test(text)
  ) {
    return "Utente esterno";
  }

  return "Provenienza n/d";
}

function workspaceHeaderTitle(ticket: any, fallbackSite: string) {
  if (isWebvimeTicket(ticket)) return "Webvime";
  return fallbackSite || "Sede n/d";
}

function workspaceHeaderSubtitle(ticket: any, fallbackCustomer: string) {
  if (isWebvimeTicket(ticket)) {
    return `RFI / Webvime · ${extractWebvimeOrigin(ticket)} · ${ticket?.technician || ticket?.glpi_technician_group || "Tecnico non assegnato"}`;
  }

  return `${fallbackCustomer} · ${ticket?.region || "Regione n/d"} · ${ticket?.technician || "Tecnico non assegnato"}`;
}

function eventVisual(eventType: string) {
  const value = normalize(eventType);

  if (value.includes("solution")) {
    return {
      icon: CheckCircle2,
      dot: "bg-emerald-500",
      card: "border-emerald-500/20 bg-emerald-500/10",
      label: "SOLUZIONE",
    };
  }

  if (value.includes("followup")) {
    return {
      icon: PenLine,
      dot: "bg-blue-500",
      card: "border-blue-500/20 bg-blue-500/10",
      label: "FOLLOW-UP",
    };
  }

  if (value.includes("urgent")) {
    return {
      icon: Flame,
      dot: "bg-red-500",
      card: "border-red-500/20 bg-red-500/10",
      label: "URGENTE",
    };
  }

  if (value.includes("status")) {
    return {
      icon: History,
      dot: "bg-violet-500",
      card: "border-violet-500/20 bg-violet-500/10",
      label: "STATO",
    };
  }

  if (value.includes("closed")) {
    return {
      icon: CheckCircle2,
      dot: "bg-emerald-500",
      card: "border-emerald-500/20 bg-emerald-500/10",
      label: "CHIUSURA",
    };
  }

  return {
    icon: FileText,
    dot: "bg-slate-500",
    card: "border-white/10 bg-white/[0.04]",
    label: "EVENTO",
  };
}

const lifecycleStatuses = [
  "Nuovo",
  "Aperto",
  "Pianificato",
  "In lavorazione",
  "In sospeso",
  "Risolto",
  "Chiuso",
];

const workOrderTemplateOptions = [
  { key: "ordinaria", label: "Ordinaria" },
  { key: "straordinaria", label: "Straordinaria" },
  { key: "verifica_on_site", label: "Verifica on site" },
  { key: "assistenza_software", label: "Assistenza software" },
  { key: "sostituzione_materiale", label: "Sostituzione materiale" },
  { key: "custom", label: "Modello personalizzato" },
];

export default function TicketWorkspace({ ticket, open, onClose, onStatusUpdated, glpiEnabled = true }: TicketWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [events, setEvents] = useState<any[]>([]);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderLoading, setWorkOrderLoading] = useState(false);
  const [workOrderError, setWorkOrderError] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Aperto");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [closeAfterReply, setCloseAfterReply] = useState(true);
  const [syncingConversation, setSyncingConversation] = useState(false);
  const [conversationMessage, setConversationMessage] = useState("");
  const [compactConversation, setCompactConversation] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [savingDuration, setSavingDuration] = useState(false);
  const [durationMessage, setDurationMessage] = useState("");
  const [reportBodyDraft, setReportBodyDraft] = useState("");
  const [savingReportBody, setSavingReportBody] = useState(false);
  const [reportBodyMessage, setReportBodyMessage] = useState("");
  const [templateKeyDraft, setTemplateKeyDraft] = useState("custom");
  const [savingTemplateKey, setSavingTemplateKey] = useState(false);
  const [templateKeyMessage, setTemplateKeyMessage] = useState("");

  useEffect(() => {
    if (!ticket) return;
    setCurrentStatus(displayStatus(ticket));
    setActiveTab("overview");
  }, [ticket?.id]);

  async function loadTicketEvents() {
    if (!ticket?.id) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from("ticket_events")
      .select("*")
      .eq("ticket_id", Number(ticket.id))
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setEvents([]);
      return;
    }

    setEvents(data || []);
  }

  useEffect(() => {
    if (open) loadTicketEvents();
  }, [ticket?.id, open]);

  useEffect(() => {
    let mounted = true;

    async function ensureWorkOrder() {
      if (!open || !ticket?.id) {
        setWorkOrder(null);
        setWorkOrderError("");
        setWorkOrderLoading(false);
        return;
      }

      const tenantId = String(ticket.tenantId || ticket.tenant_id || "").trim();

      if (!tenantId) {
        setWorkOrder(null);
        setWorkOrderError("tenantId mancante: impossibile caricare la bolla.");
        setWorkOrderLoading(false);
        return;
      }

      setWorkOrderLoading(true);
      setWorkOrderError("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          throw new Error("Sessione scaduta. Fai logout/login e riprova.");
        }

        const response = await fetch("/api/work-orders/ensure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId,
            ticketId: Number(ticket.id),
          }),
        });

        const result = (await response.json().catch(() => null)) as EnsureWorkOrderResponse | null;

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || "Errore caricamento bolla.");
        }

        if (!mounted) return;
        setWorkOrder(result.data ?? null);
      } catch (error: unknown) {
        if (!mounted) return;
        setWorkOrder(null);
        setWorkOrderError(error instanceof Error && error.message ? error.message : "Errore caricamento bolla.");
      } finally {
        if (mounted) {
          setWorkOrderLoading(false);
        }
      }
    }

    ensureWorkOrder();

    return () => {
      mounted = false;
    };
  }, [ticket?.id, open]);

  useEffect(() => {
    const rawDuration =
      (workOrder as any)?.duration_minutes ??
      (workOrder as any)?.intervention_duration_minutes ??
      ticket?.intervention_duration_minutes ??
      ticket?.duration_minutes ??
      "";

    setDurationMinutes(rawDuration ? String(rawDuration) : "");
    setDurationMessage("");
    setReportBodyDraft(String((workOrder as any)?.report_body || ""));
    setReportBodyMessage("");
    setTemplateKeyDraft(String((workOrder as any)?.template_key || "custom"));
    setTemplateKeyMessage("");
  }, [workOrder?.id, ticket?.id]);

  const normalizedTicket = useMemo(() => {
    if (!ticket) return null;
    return {
      ...ticket,
      readableStatus: currentStatus || displayStatus(ticket),
      description: ticketDescription(ticket),
      title: ticketTitle(ticket),
      customerLabel: ticketCustomerLabel(ticket),
    };
  }, [ticket, currentStatus]);

  const glpiCommunicationEvents = useMemo(() => {
    return events
      .filter((event) =>
        ["glpi_followup", "glpi_solution"].includes(String(event.event_type || "")),
      )
      .filter((event) => String(event.description || "").trim().length > 0);
  }, [events]);

  const latestGlpiCommunication = glpiCommunicationEvents[0] || null;

  const conversationEvents = useMemo(() => {
    const initialTicketEvent = normalizedTicket?.description
      ? [
          {
            id: `ticket-initial-${normalizedTicket.id}`,
            event_type: glpiEnabled ? "glpi_ticket_content" : "ticket_content",
            title: "Richiesta iniziale",
            description: normalizedTicket.description,
            created_by: normalizedTicket.glpi_requester || normalizedTicket.customerLabel || "Richiedente",
            created_at:
              normalizedTicket.openedAt ||
              normalizedTicket.opened_at ||
              normalizedTicket.created_at ||
              normalizedTicket.date ||
              new Date().toISOString(),
            synthetic: true,
          },
        ]
      : [];

    const communicationEvents = events
      .filter((event) =>
        ["glpi_ticket_content", "glpi_followup", "glpi_solution"].includes(
          String(event.event_type || ""),
        ),
      )
      .filter((event) => String(event.description || "").trim().length > 0);

    const merged = [...initialTicketEvent, ...communicationEvents];
    const seen = new Set<string>();

    return merged
      .filter((event) => {
        const key = `${event.event_type}-${event.created_at}-${String(event.description || "").slice(0, 80)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }, [events, normalizedTicket, glpiEnabled]);

  function isOperatorMessage(event: any) {
    const type = String(event.event_type || "");
    const author = normalize(event.created_by || "");

    return (
      type === "glpi_solution" ||
      author.includes("operatore") ||
      author.includes("secom") ||
      author.includes("dispatch") ||
      author.includes("support")
    );
  }

  function conversationRoleLabel(event: any) {
    const type = String(event.event_type || "");
    if (type === "glpi_solution") return "Soluzione / Operatore";
    if (isOperatorMessage(event)) return "Operatore Secom";
    return event.created_by || (glpiEnabled ? "Richiedente / GLPI" : "Richiedente");
  }


  async function createTicketEvent(payload: {
    event_type: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    if (!ticket?.id) return null;

    const eventPayload = {
      ticket_id: Number(ticket.id),
      customer_id: ticket.customerId || ticket.customer_id || null,
      site_id: ticket.siteId || ticket.site_id || null,
      event_type: payload.event_type,
      title: payload.title,
      description: payload.description || "",
      created_by: "Operatore",
      tenant_id: ticket.tenantId || ticket.tenant_id || null,
      metadata: payload.metadata || {},
    };

    const { data: newEvent, error } = await supabase
      .from("ticket_events")
      .insert([eventPayload])
      .select()
      .single();

    if (error) {
      console.log(error);
      return null;
    }

    if (newEvent) {
      setEvents((prev) => [newEvent, ...prev]);
    }

    return newEvent;
  }

  async function addOperationalNote() {
    const note = noteDraft.trim();
    if (!ticket?.id || !note) return;

    setSavingAction(true);

    await createTicketEvent({
      event_type: "note_added",
      title: "Nota operativa aggiunta",
      description: note,
      metadata: {
        source: "ticket_workspace",
      },
    });

    setNoteDraft("");
    setSavingAction(false);
  }

  async function toggleUrgency() {
    if (!ticket?.id) return;
    const tenantId = getTicketTenantId(ticket);

    if (!tenantId) return;

    const nextUrgent = !Boolean(ticket.urgent);
    setSavingAction(true);

    const { error } = await supabase
      .from("tickets")
      .update({ urgent: nextUrgent })
      .eq("id", Number(ticket.id))
      .eq("tenant_id", tenantId);

    if (error) {
      console.log(error);
      setSavingAction(false);
      return;
    }

    const updatedTicket = {
      ...ticket,
      urgent: nextUrgent,
    };

    onStatusUpdated?.(updatedTicket);

    await createTicketEvent({
      event_type: nextUrgent ? "urgent_enabled" : "urgent_disabled",
      title: nextUrgent ? "Urgenza attivata" : "Urgenza rimossa",
      description: `Ticket #${ticket.id}: ${nextUrgent ? "marcato urgente" : "urgenza rimossa"}`,
      metadata: {
        urgent: nextUrgent,
      },
    });

    setSavingAction(false);
  }


  async function refreshGlpiConversation() {
    if (!ticket?.id) return;
    if (!glpiEnabled) {
      setConversationMessage("Aggiornamento esterno non disponibile per questo tenant.");
      return;
    }

    setConversationMessage("");
    setSyncingConversation(true);

    try {
      if (ticket?.glpi_ticket_id && (ticket.tenantId || ticket.tenant_id)) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          throw new Error("Sessione scaduta. Fai logout/login e riprova.");
        }

        const response = await fetch("/api/admin/glpi-sync-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenantId: ticket.tenantId || ticket.tenant_id,
            glpiTicketId: ticket.glpi_ticket_id,
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || "Sincronizzazione GLPI non riuscita.");
        }
      }

      await loadTicketEvents();
      setConversationMessage("Conversazione aggiornata.");
      window.setTimeout(() => setConversationMessage(""), 2500);
    } catch (error: any) {
      console.log(error);
      setConversationMessage(error?.message || "Errore aggiornamento conversazione.");
    } finally {
      setSyncingConversation(false);
    }
  }


  async function sendGlpiReply() {
    if (!glpiEnabled) return;
    if (!ticket?.glpi_ticket_id || !replyDraft.trim()) return;

    setSendingReply(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        alert("Sessione scaduta. Fai logout/login e riprova.");
        setSendingReply(false);
        return;
      }

      const response = await fetch("/api/admin/glpi-add-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenantId: ticket.tenantId || ticket.tenant_id,
          ticketId: ticket.glpi_ticket_id,
          content: replyDraft.trim(),
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        alert(result.error || "Errore invio risposta GLPI");
        setSendingReply(false);
        return;
      }

      if (closeAfterReply) {
        await updateStatus("Chiuso");
      }

      setReplyDraft("");
      await refreshGlpiConversation();
    } catch (error) {
      console.log(error);
      alert("Errore invio risposta GLPI");
    }

    setSendingReply(false);
  }

  async function saveWorkOrderDuration() {
    if (!ticket?.id) return;
    const tenantId = getTicketTenantId(ticket);

    if (!tenantId) {
      setDurationMessage("Tenant ticket non valido. Riapri il ticket e riprova.");
      return;
    }

    const parsed = Number(durationMinutes);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDurationMessage("Inserisci una durata valida in minuti.");
      return;
    }

    setSavingDuration(true);
    setDurationMessage("");

    try {
      const minutes = Math.round(parsed);
      const ticketId = Number(ticket.id);
      const updates: PromiseLike<any>[] = [];

      if (workOrder?.id) {
        updates.push(
          supabase
            .from("work_orders")
            .update({ duration_minutes: minutes })
            .eq("id", workOrder.id)
            .eq("tenant_id", tenantId),
        );
      }

      updates.push(
        supabase
          .from("tickets")
          .update({ intervention_duration_minutes: minutes })
          .eq("id", ticketId)
          .eq("tenant_id", tenantId),
      );

      const results = await Promise.all(updates);
      const failed = results.find((result: any) => result?.error);

      if (failed?.error) {
        throw failed.error;
      }

      if (workOrder) {
        setWorkOrder({ ...(workOrder as any), duration_minutes: minutes } as WorkOrder);
      }

      onStatusUpdated?.({
        ...ticket,
        intervention_duration_minutes: minutes,
      });

      setDurationMessage("Durata salvata. Comparira sulla bolla PDF e nel registro appena il registro legge il campo.");
      window.setTimeout(() => setDurationMessage(""), 3500);
    } catch (error: any) {
      console.log(error);
      setDurationMessage(error?.message || "Errore salvataggio durata. Controlla se hai eseguito la migrazione SQL.");
    } finally {
      setSavingDuration(false);
    }
  }

  async function saveWorkOrderTemplateKey() {
    if (!ticket?.id || !workOrder?.id) return;
    const tenantId = getTicketTenantId(ticket);

    if (!tenantId) {
      setTemplateKeyMessage("Tenant ticket non valido. Riapri il ticket e riprova.");
      return;
    }

    setSavingTemplateKey(true);
    setTemplateKeyMessage("");

    try {
      const { error } = await supabase
        .from("work_orders")
        .update({ template_key: templateKeyDraft })
        .eq("id", workOrder.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      setWorkOrder({ ...(workOrder as any), template_key: templateKeyDraft } as WorkOrder);
      setTemplateKeyMessage("Modello bolla salvato. Il PDF usera il modello selezionato se non compili manualmente le attivita.");
      window.setTimeout(() => setTemplateKeyMessage(""), 3500);
    } catch (error: any) {
      console.log(error);
      setTemplateKeyMessage(error?.message || "Errore salvataggio modello bolla.");
    } finally {
      setSavingTemplateKey(false);
    }
  }

  async function saveWorkOrderReportBody() {
    if (!ticket?.id) return;
    const tenantId = getTicketTenantId(ticket);

    if (!tenantId) {
      setReportBodyMessage("Tenant ticket non valido. Riapri il ticket e riprova.");
      return;
    }

    setSavingReportBody(true);
    setReportBodyMessage("");

    try {
      if (!workOrder?.id) {
        throw new Error("Bolla non ancora disponibile. Riapri il ticket o attendi il caricamento.");
      }

      const { error } = await supabase
        .from("work_orders")
        .update({ report_body: reportBodyDraft.trim() || null })
        .eq("id", workOrder.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      setWorkOrder({ ...(workOrder as any), report_body: reportBodyDraft.trim() || null } as WorkOrder);
      setReportBodyMessage("Attivita bolla salvate. Il PDF usera questo testo al posto del modello automatico.");
      window.setTimeout(() => setReportBodyMessage(""), 3500);
    } catch (error: any) {
      console.log(error);
      setReportBodyMessage(error?.message || "Errore salvataggio attivita bolla. Controlla SQL report_body.");
    } finally {
      setSavingReportBody(false);
    }
  }

  async function openWorkOrderPdf() {
    if (!ticket?.id) return;

    const opened = window.open("", "_blank");
    if (!opened) {
      setReportBodyMessage("Popup bloccato dal browser.");
      return;
    }
    opened.opener = null;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const tenantId = ticket?.tenantId || ticket?.tenant_id || null;

      if (!token || !tenantId) {
        opened.close();
        setReportBodyMessage("Sessione o tenant non validi. Riapri ATLAS e riprova.");
        return;
      }

      const response = await fetch(
        `/api/work-orders/pdf-by-ticket/${ticket.id}?tenantId=${encodeURIComponent(String(tenantId))}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        opened.close();
        setReportBodyMessage("PDF non disponibile o non autorizzato per questo tenant.");
        return;
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      opened.location.href = url;

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      opened.close();
      setReportBodyMessage("Errore apertura PDF bolla.");
    }
  }

  async function updateStatus(nextStatus: string) {
    if (!ticket?.id || !nextStatus) return;
    const tenantId = getTicketTenantId(ticket);

    if (!tenantId) return;

    setSavingStatus(true);
    const previousStatus = currentStatus;
    const closedAt = nextStatus === "Chiuso" ? new Date().toISOString() : ticket.closedAt || ticket.closed_at || null;

    const { error } = await supabase
      .from("tickets")
      .update({
        status: nextStatus,
        closed_at: closedAt,
        resolved: nextStatus === "Chiuso" ? true : ticket.resolved,
      })
      .eq("id", Number(ticket.id))
      .eq("tenant_id", tenantId);

    if (error) {
      console.log(error);
      setSavingStatus(false);
      return;
    }

    const updatedTicket = {
      ...ticket,
      status: nextStatus,
      closedAt,
      closed_at: closedAt,
      resolved: nextStatus === "Chiuso" ? true : ticket.resolved,
    };

    setCurrentStatus(nextStatus);
    onStatusUpdated?.(updatedTicket);

    await createTicketEvent({
      event_type: nextStatus === "Chiuso" ? "ticket_closed" : "ticket_status_changed",
      title: nextStatus === "Chiuso" ? "Ticket chiuso" : "Stato ticket aggiornato",
      description: `Ticket #${ticket.id}: ${previousStatus || "n/d"} → ${nextStatus}`,
      metadata: {
        previous_status: previousStatus,
        next_status: nextStatus,
      },
    });

    setSavingStatus(false);
  }

  if (!open || !normalizedTicket) return null;

  const tabs: Array<{ key: WorkspaceTab; label: string; icon: any }> = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "conversazione", label: "Conversazione", icon: MessageSquare },
    { key: "timeline", label: "Timeline", icon: History },
    { key: "operativita", label: "Operatività", icon: PenLine },
    { key: "materiali", label: "Materiali", icon: Package },
    { key: "bolla", label: "Bolla", icon: FileText },
    { key: "allegati", label: "Allegati", icon: FileText },
    { key: "ai", label: "Insight AI", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-6xl flex-col border-l border-white/10 bg-[#07111f] shadow-2xl">
        <header className="border-b border-white/10 bg-[#081523] p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Ticket Workspace</p>
              <h2 className="mt-2 break-words text-2xl font-black text-white md:text-4xl">
                #{normalizedTicket.id} · {workspaceHeaderTitle(normalizedTicket, normalizedTicket.site)}
              </h2>
              <p className="mt-2 break-words text-sm font-bold text-slate-400">
                {workspaceHeaderSubtitle(normalizedTicket, normalizedTicket.customerLabel)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(normalizedTicket.readableStatus)}`}>
                  {normalizedTicket.readableStatus}
                </span>
                {normalizedTicket.urgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                    <Flame size={13} /> URGENTE
                  </span>
                )}
                {glpiEnabled && normalizedTicket.glpi_ticket_id && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                    GLPI #{normalizedTicket.glpi_ticket_id}
                  </span>
                )}
              </div>
            </div>

            <button onClick={onClose} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15">
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-[#07111f] px-5 py-3 md:px-7">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition ${
                activeTab === key
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {activeTab === "overview" && (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="grid gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Problema</p>
                  <h3 className="mt-2 text-xl font-black text-white">{normalizedTicket.title}</h3>
                  <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-300">
                    {normalizedTicket.description}
                  </p>
                </div>

                {glpiEnabled && latestGlpiCommunication && (
                  <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                        Comunicazione GLPI
                      </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Ultimo contenuto operativo
                        </h3>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-300">
                        {latestGlpiCommunication.event_type === "glpi_solution" ? "Soluzione" : "Follow-up"}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap rounded-3xl bg-black/20 p-4 text-sm font-bold leading-relaxed text-slate-200">
                      {latestGlpiCommunication.description}
                    </p>
                    <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-blue-300">
                      {formatDateTime(latestGlpiCommunication.created_at)} · {latestGlpiCommunication.created_by || "GLPI"}
                    </p>
                  </div>
                )}

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Stato operativo</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="grid gap-2 text-sm font-black text-slate-300">
                      Cambia stato
                      <select
                        value={currentStatus}
                        onChange={(event) => updateStatus(event.target.value)}
                        disabled={savingStatus}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none"
                      >
                        {lifecycleStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    {savingStatus && <p className="text-xs font-black text-blue-300">Salvataggio...</p>}
                    <button
                      type="button"
                      onClick={toggleUrgency}
                      disabled={savingAction}
                      className={`rounded-2xl px-4 py-3 text-sm font-black text-white transition ${normalizedTicket.urgent ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-500"}`}
                    >
                      {normalizedTicket.urgent ? "Togli urgenza" : "Marca urgente"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                    <CalendarDays className="mb-3 text-blue-300" size={22} />
                    <p className="text-xs font-black text-slate-400">Apertura</p>
                    <p className="mt-1 font-black text-white">{formatDate(normalizedTicket.openedAt || normalizedTicket.opened_at || normalizedTicket.date)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                    <Clock className="mb-3 text-amber-300" size={22} />
                    <p className="text-xs font-black text-slate-400">Chiusura prevista</p>
                    <p className="mt-1 font-black text-white">{formatDate(normalizedTicket.expectedCloseDate || normalizedTicket.expected_close_date)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                    <CheckCircle2 className="mb-3 text-emerald-300" size={22} />
                    <p className="text-xs font-black text-slate-400">Chiusura</p>
                    <p className="mt-1 font-black text-white">{formatDate(normalizedTicket.closedAt || normalizedTicket.closed_at)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                    <UserRound className="mb-3 text-violet-300" size={22} />
                    <p className="text-xs font-black text-slate-400">Tecnico / gruppo</p>
                    <p className="mt-1 break-words font-black text-white">{normalizedTicket.technician || normalizedTicket.glpi_technician_group || "Non assegnato"}</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "conversazione" && (
            <div className="grid min-h-[calc(100vh-260px)] gap-4">
              <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045]">
                <div className="border-b border-white/10 bg-slate-950/35 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                        Conversazione ticket
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {glpiEnabled ? "Botta e risposta GLPI" : "Conversazione ticket"}
                      </h3>
                      {conversationMessage && (
                        <p className="mt-3 w-fit rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-100">
                          {conversationMessage}
                        </p>
                      )}
                      <label className="mt-3 flex items-center gap-2 text-xs font-black text-slate-300">
                        <input type="checkbox" checked={compactConversation} onChange={(e)=>setCompactConversation(e.target.checked)} />
                        Nascondi firme e disclaimer
                      </label>
                    </div>

                    {glpiEnabled && (
                      <button
                        type="button"
                        onClick={refreshGlpiConversation}
                        disabled={syncingConversation || !normalizedTicket.glpi_ticket_id}
                        className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-black text-white hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw size={15} className={syncingConversation ? "animate-spin" : ""} />
                        {syncingConversation ? "Aggiorno..." : "Aggiorna"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {conversationEvents.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
                      {glpiEnabled
                        ? "Nessuna conversazione disponibile. Dopo la prossima sincronizzazione GLPI compariranno follow-up, risposte e soluzioni."
                        : "Nessuna conversazione disponibile per questo ticket."}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {conversationEvents.map((event) => {
                        const operatorMessage = isOperatorMessage(event);
                        const type = String(event.event_type || "");
                        const isSolution = type === "glpi_solution";

                        return (
                          <div
                            key={event.id}
                            className={`flex ${operatorMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-[1.5rem] border p-4 shadow-lg ${
                                operatorMessage
                                  ? isSolution
                                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-50"
                                    : "border-blue-500/30 bg-blue-600/80 text-white"
                                  : "border-white/10 bg-slate-900/90 text-slate-100"
                              }`}
                            >
                              <div className="mb-2">
                                <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide opacity-80">
                                  {conversationRoleLabel(event)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm font-bold leading-relaxed">
                                {cleanConversationContent(event.description || "—", compactConversation)}
                              </p>

                              <p className="mt-3 text-right text-[11px] font-black uppercase tracking-wide opacity-70">
                                {formatDateTime(event.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 bg-slate-950/35 p-5">
                  {!glpiEnabled ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-slate-300">
                      Le risposte operative esterne non sono abilitate per questo tenant.
                    </div>
                  ) : !normalizedTicket.glpi_ticket_id ? (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
                      Questo ticket non ha un ID GLPI associato: non posso inviare una risposta.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <textarea
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        placeholder="Scrivi risposta al richiedente..."
                        className="min-h-28 w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                      />

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
                          <input
                            type="checkbox"
                            checked={closeAfterReply}
                            onChange={(e) => setCloseAfterReply(e.target.checked)}
                          />
                          Chiudi ticket dopo la risposta
                        </label>

                        <button
                          type="button"
                          onClick={sendGlpiReply}
                          disabled={sendingReply || !replyDraft.trim()}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={16} />
                          {sendingReply ? "Invio..." : (closeAfterReply ? "Rispondi e chiudi" : "Rispondi")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="grid gap-4">
              {events.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
                  Nessun evento collegato a questo ticket. Da ora in poi ATLAS registrerà cambi stato, urgenze, note e chiusure.
                </div>
              ) : (
                <div className="relative grid gap-3 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-white/10">
                  {events.map((event) => {
                    const visual = eventVisual(event.event_type);
                    const Icon = visual.icon;

                    return (
                      <div
                        key={event.id}
                        className={`relative grid grid-cols-[2.5rem_1fr] gap-3 rounded-3xl border p-4 ${visual.card}`}
                      >
                        <div className="relative z-10 flex items-start justify-center">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${visual.dot}`}>
                            <Icon size={18} className="text-white" />
                          </div>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-white">
                              {event.title || "Evento"}
                            </p>

                            <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-200">
                              {visual.label}
                            </span>

                            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                              {event.created_by || "Sistema"}
                            </span>
                          </div>

                          <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/20 p-4 text-sm font-bold leading-relaxed text-slate-200">
                            {event.description || "Nessuna descrizione"}
                          </div>

                          <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-blue-300">
                            {formatDateTime(event.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "operativita" && (
            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Note operative</p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-300">
                  {normalizedTicket.closingNotes || normalizedTicket.closing_notes || normalizedTicket.futureNeeds || normalizedTicket.future_needs || "Nessuna nota operativa storica nel ticket."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Aggiungi attività</p>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Scrivi una nota operativa: verifica fatta, chiamata cliente, materiale richiesto, prossima azione..."
                  className="mt-4 min-h-32 w-full rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addOperationalNote}
                    disabled={savingAction || !noteDraft.trim()}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Salva nota in timeline
                  </button>
                </div>
              </div>


              {glpiEnabled && normalizedTicket.glpi_ticket_id && (
                <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center gap-2">
                    <Send className="text-emerald-300" size={18} />
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                      Rispondi ticket GLPI
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-300">
                    La risposta verrà inserita nei follow-up GLPI. Se GLPI è configurato per le notifiche, partirà il normale flusso mail verso il richiedente.
                  </p>

                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Scrivi risposta operativa al ticket..."
                    className="mt-4 min-h-36 w-full rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                  />

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={sendGlpiReply}
                      disabled={sendingReply || !replyDraft.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={16} />
                      {sendingReply ? "Invio..." : "Invia risposta GLPI"}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {events.filter((event) => ["note_added", "ticket_status_changed", "ticket_closed", "urgent_enabled", "urgent_disabled"].includes(event.event_type)).length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                    Nessuna attività operativa registrata nel workspace.
                  </div>
                ) : (
                  events
                    .filter((event) => ["note_added", "ticket_status_changed", "ticket_closed", "urgent_enabled", "urgent_disabled"].includes(event.event_type))
                    .map((event) => (
                      <div key={event.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-white">{event.title || "Attività"}</p>
                          <span className="text-[11px] font-black uppercase tracking-wide text-blue-300">{formatDateTime(event.created_at)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-300">{cleanConversationContent(event.description || "—", compactConversation)}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === "materiali" && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Materiali / asset</p>
              <p className="mt-3 text-sm font-bold text-slate-300">
                {(normalizedTicket.materialIds || []).length > 0
                  ? (normalizedTicket.materialIds || []).join(" + ")
                  : "Nessun materiale collegato al ticket."}
              </p>
            </div>
          )}

          {activeTab === "bolla" && (
            <div className="grid gap-4">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Bolla</p>
                    <h3 className="mt-2 text-xl font-black text-white">Rapporto di intervento</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {workOrder?.status === "draft" && (
                      <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-100">
                        Bolla in bozza
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openWorkOrderPdf}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500"
                    >
                      <FileText size={15} />
                      Genera PDF
                    </button>
                  </div>
                </div>

                {workOrderLoading && (
                  <div className="mt-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm font-black text-blue-100">
                    Caricamento bolla...
                  </div>
                )}

                {!workOrderLoading && workOrderError && (
                  <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/15 p-5 text-sm font-bold text-red-100">
                    {workOrderError}
                  </div>
                )}

                {!workOrderLoading && !workOrderError && !workOrder && (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                    Nessuna bolla disponibile per questo ticket.
                  </div>
                )}

                {!workOrderLoading && !workOrderError && workOrder && (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stato bolla</p>
                      <p className="mt-2 font-black text-white">{workOrder.status}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Numero rapporto</p>
                      <p className="mt-2 font-black text-white">{workOrder.report_number || "Non assegnato"}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Oggetto intervento</p>
                      <p className="mt-2 whitespace-pre-wrap font-black text-white">{workOrder.intervention_object || "Oggetto non definito"}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Template</p>
                      <p className="mt-2 break-words font-black text-white">{workOrder.template_key}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Tecnico</p>
                      <p className="mt-2 break-words font-black text-white">{workOrder.technician_name || "Non assegnato"}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Data apertura</p>
                      <p className="mt-2 font-black text-white">{formatDateTime(workOrder.opened_at)}</p>
                    </div>

                    <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-4 md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-wide text-violet-300">Modello bolla</p>
                      <p className="mt-2 text-xs font-bold text-slate-300">
                        Il modello decide oggetto, attivita standard, visibilita materiali e campi obbligatori. Il cliente non vede il nome del modello nel PDF.
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <label className="grid gap-2 text-sm font-black text-slate-300">
                          Seleziona modello
                          <select
                            value={templateKeyDraft}
                            onChange={(event) => setTemplateKeyDraft(event.target.value)}
                            className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none"
                          >
                            {workOrderTemplateOptions.map((option) => (
                              <option key={option.key} value={option.key}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={saveWorkOrderTemplateKey}
                          disabled={savingTemplateKey || templateKeyDraft === String((workOrder as any)?.template_key || "custom")}
                          className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingTemplateKey ? "Salvo..." : "Salva modello"}
                        </button>
                      </div>
                      {templateKeyMessage && (
                        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-slate-200">
                          {templateKeyMessage}
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4 md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-wide text-blue-300">Durata intervento</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <label className="grid gap-2 text-sm font-black text-slate-300">
                          Minuti effettivi da riportare in bolla
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(event.target.value)}
                            placeholder="Es. 90"
                            className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={saveWorkOrderDuration}
                          disabled={savingDuration || !durationMinutes.trim()}
                          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingDuration ? "Salvo..." : "Salva durata"}
                        </button>
                      </div>
                      {durationMessage && (
                        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-slate-200">
                          {durationMessage}
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 md:col-span-2">
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-300">Attivita da riportare in bolla</p>
                      <p className="mt-2 text-xs font-bold text-slate-300">
                        Se lasci vuoto, il PDF usa le attivita standard del modello selezionato. Se scrivi qui, questo testo sovrascrive il modello solo per questo ticket.
                      </p>
                      <textarea
                        value={reportBodyDraft}
                        onChange={(event) => setReportBodyDraft(event.target.value)}
                        placeholder="Esempio: Verifica richiesta utente e controllo preliminare apparato/postazione. Intervento eseguito secondo indicazioni operative del ticket. Eventuali note finali compilabili dal tecnico prima della chiusura."
                        className="mt-3 min-h-36 w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={saveWorkOrderReportBody}
                          disabled={savingReportBody}
                          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingReportBody ? "Salvo..." : "Salva attivita bolla"}
                        </button>
                      </div>
                      {reportBodyMessage && (
                        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-slate-200">
                          {reportBodyMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}


          {activeTab === "allegati" && (
            <div className="grid gap-4">
              <TicketAttachmentsPanel
                ticketId={normalizedTicket.id}
                title="Allegati ticket"
              />
            </div>
          )}

          {activeTab === "ai" && (
            <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 text-blue-300" size={22} />
                <div>
                  <p className="text-lg font-black text-white">Insight AI ticket</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-slate-300">
                    {glpiEnabled
                      ? `Area predisposta per analizzare pattern, ricorrenze, rischio SLA e possibili cause. La qualità aumenta con eventi, note tecniche, stati e dati GLPI arricchiti. Questo ticket ha già ${events.length} eventi disponibili per la lettura operativa.`
                      : `Area predisposta per analizzare pattern, ricorrenze, rischio SLA e possibili cause. La qualità aumenta con eventi, note tecniche e stati. Questo ticket ha già ${events.length} eventi disponibili per la lettura operativa.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
