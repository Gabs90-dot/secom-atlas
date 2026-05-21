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
  Package,
  PenLine,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export type TicketWorkspaceProps = {
  ticket: any | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated?: (ticket: any) => void;
};

type WorkspaceTab = "overview" | "timeline" | "operativita" | "materiali" | "ai";

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

const lifecycleStatuses = [
  "Nuovo",
  "Aperto",
  "Pianificato",
  "In lavorazione",
  "In sospeso",
  "Risolto",
  "Chiuso",
];

export default function TicketWorkspace({ ticket, open, onClose, onStatusUpdated }: TicketWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [events, setEvents] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState("Aperto");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setCurrentStatus(displayStatus(ticket));
    setActiveTab("overview");
  }, [ticket?.id]);

  useEffect(() => {
    async function loadEvents() {
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

    if (open) loadEvents();
  }, [ticket?.id, open]);

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

  async function updateStatus(nextStatus: string) {
    if (!ticket?.id || !nextStatus) return;

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
      .eq("id", Number(ticket.id));

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

    const eventPayload = {
      ticket_id: Number(ticket.id),
      customer_id: ticket.customerId || ticket.customer_id || null,
      site_id: ticket.siteId || ticket.site_id || null,
      event_type: "ticket_status_changed",
      title: "Stato ticket aggiornato",
      description: `Ticket #${ticket.id}: ${previousStatus || "n/d"} → ${nextStatus}`,
      created_by: "Operatore",
      tenant_id: ticket.tenantId || ticket.tenant_id || null,
      metadata: {
        previous_status: previousStatus,
        next_status: nextStatus,
      },
    };

    const { data: newEvent, error: eventError } = await supabase
      .from("ticket_events")
      .insert([eventPayload])
      .select()
      .single();

    if (!eventError && newEvent) {
      setEvents((prev) => [newEvent, ...prev]);
    }

    setSavingStatus(false);
  }

  if (!open || !normalizedTicket) return null;

  const tabs: Array<{ key: WorkspaceTab; label: string; icon: any }> = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "timeline", label: "Timeline", icon: History },
    { key: "operativita", label: "Operatività", icon: PenLine },
    { key: "materiali", label: "Materiali", icon: Package },
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
                #{normalizedTicket.id} · {normalizedTicket.site || "Sede n/d"}
              </h2>
              <p className="mt-2 break-words text-sm font-bold text-slate-400">
                {normalizedTicket.customerLabel} · {normalizedTicket.region || "Regione n/d"} · {normalizedTicket.technician || "Tecnico non assegnato"}
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
                {normalizedTicket.glpi_ticket_id && (
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

          {activeTab === "timeline" && (
            <div className="grid gap-4">
              {events.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">
                  Nessun evento collegato a questo ticket. Da ora in poi ATLAS registrerà cambi stato, urgenze, note e chiusure.
                </div>
              ) : (
                <div className="relative grid gap-3 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-white/10">
                  {events.map((event) => (
                    <div key={event.id} className="relative grid grid-cols-[2.5rem_1fr] gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                      <span className="z-10 mt-1 h-4 w-4 rounded-full bg-blue-500" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-white">{event.title || "Evento"}</p>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                            {event.created_by || "Sistema"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-400">{event.description || ""}</p>
                        <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-blue-300">{formatDateTime(event.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "operativita" && (
            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Note operative</p>
                <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-300">
                  {normalizedTicket.closingNotes || normalizedTicket.closing_notes || normalizedTicket.futureNeeds || normalizedTicket.future_needs || "Nessuna nota operativa registrata."}
                </p>
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

          {activeTab === "ai" && (
            <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 text-blue-300" size={22} />
                <div>
                  <p className="text-lg font-black text-white">Insight AI ticket</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-slate-300">
                    Area predisposta per analizzare pattern, ricorrenze, rischio SLA e possibili cause. La qualità aumenterà quando collegheremo eventi, note tecniche e dati GLPI arricchiti.
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
