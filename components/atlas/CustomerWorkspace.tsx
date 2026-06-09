"use client";

import { useEffect, useMemo, useState } from "react";
import {
  History,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  Flame,
  BookOpen,
  KeyRound,
  Plus,
  MapPin,
  Package,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { systemsCatalog } from "@/lib/systemsCatalog";
import { supabase } from "@/lib/supabase";
import CustomerSitesPanel from "@/components/atlas/CustomerSitesPanel";
import ContractProfilePanel from "@/components/atlas/ContractProfilePanel";

type CustomerWorkspaceProps = {
  currentCustomer: any | null;
  selectedSite: any | null;
  currentLabel: string;
  relatedTickets: any[];
  relatedSites?: any[];
  onSelectSite?: (site: any) => void;
  onOpenTicket?: (customer: any, site?: any) => void;
  onReset: () => void;
};

type WorkspaceTab = "overview" | "tickets" | "sites" | "contracts" | "assets" | "manuals" | "access" | "timeline";
type ModalType = "contract" | "ticket" | "asset" | null;

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return String(value);
  }
}

function ticketDateValue(ticket: any) {
  return ticket.openedAt || ticket.opened_at || ticket.date || ticket.intervention_date || ticket.created_at || "";
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (!time || Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
}

function getSystemName(system: any) {
  if (!system) return "Sistema";
  if (typeof system === "string") return system;
  return system.name || system.title || system.label || system.id || "Sistema";
}

function getStatusTone(status: any) {
  const value = normalize(status);
  if (value.includes("chiuso") || value.includes("validato") || value.includes("risolto")) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (value.includes("bloccato")) return "border-red-500/30 bg-red-500/15 text-red-200";
  if (value.includes("pian") || value.includes("assegnato") || value.includes("carico") || value.includes("lavorazione")) return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  if (value.includes("sosp") || value.includes("attesa")) return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  return "border-slate-500/30 bg-slate-500/15 text-slate-200";
}

const ticketLifecycleStatuses = [
  "Nuovo",
  "Assegnato",
  "Preso in carico",
  "In lavorazione",
  "Attesa cliente",
  "Attesa fornitore",
  "Bloccato",
  "Risolto",
  "Validato",
  "Chiuso",
];

export default function CustomerWorkspace({
  currentCustomer,
  selectedSite,
  currentLabel,
  relatedTickets,
  relatedSites = [],
  onSelectSite,
  onOpenTicket,
  onReset,
}: CustomerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketSort, setTicketSort] = useState<"all" | "newest" | "oldest" | "open" | "closed" | "urgent">("all");
  const [ticketPageSize, setTicketPageSize] = useState(50);
  const [assetDraft, setAssetDraft] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [customerAssets, setCustomerAssets] = useState<any[]>([]);
  const [manuals, setManuals] = useState<any[]>([]);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  function ticketStatus(ticket: any) {
    const rawStatus =
      statusOverrides[String(ticket?.id)] ||
      ticket?.status ||
      ticket?.ticket_status ||
      ticket?.glpi_status ||
      "";

    const value = normalize(rawStatus);

    if (
      value.includes("chiuso") ||
      value.includes("closed") ||
      value.includes("risolto") ||
      value.includes("validato") ||
      value === "5" ||
      value === "6"
    ) {
      return "Chiuso";
    }

    if (value.includes("attesa") || value.includes("sospeso") || value === "4") {
      return "Attesa";
    }

    if (
      value.includes("lavorazione") ||
      value.includes("assegnato") ||
      value.includes("carico") ||
      value === "2" ||
      value === "3"
    ) {
      return "In lavorazione";
    }

    if (value.includes("nuovo") || value === "1") {
      return "Nuovo";
    }

    // Fallback conservativo: se un ticket storico GLPI ha una data chiusura,
    // trattalo come chiuso anche se lo status importato è sporco.
    if (ticket?.closedAt || ticket?.closed_at) {
      return "Chiuso";
    }

    return rawStatus || "Nuovo";
  }

  const selectedEntityId = currentCustomer?.is_glpi_entity
    ? String(currentCustomer.id || "").replace(/^entity-/, "")
    : selectedSite?.customer_entity_id || selectedSite?.customerEntityId || null;
  const resolvedCustomerId =
    (!currentCustomer?.is_glpi_entity && currentCustomer?.id) ||
    selectedSite?.customer_id ||
    selectedSite?.customerId ||
    relatedTickets?.[0]?.customerId ||
    relatedTickets?.[0]?.customer_id ||
    null;
  const resolvedSiteId = selectedSite?.id || relatedTickets?.[0]?.site_id || relatedTickets?.[0]?.siteId || null;
  const resolvedTenantId =
    selectedSite?.tenant_id ||
    selectedSite?.tenantId ||
    currentCustomer?.tenant_id ||
    currentCustomer?.tenantId ||
    relatedTickets?.[0]?.tenantId ||
    relatedTickets?.[0]?.tenant_id ||
    null;
  const currentAssets = customerAssets;
  const openTickets = relatedTickets.filter((ticket) => normalize(ticketStatus(ticket)) !== "chiuso");
  const urgentTickets = relatedTickets.filter((ticket) => Boolean(ticket.urgent));
  const lastActivity = relatedTickets
    .map((ticket) => ticketDateValue(ticket))
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  useEffect(() => {
    setTicketPageSize(50);
  }, [currentLabel, selectedSite?.id, currentCustomer?.id, ticketSort]);

  const sortedTickets = useMemo(() => {
    const list = [...relatedTickets];

    if (ticketSort === "all") {
      return list.sort((a, b) => {
        const aTime = new Date(ticketDateValue(a)).getTime() || 0;
        const bTime = new Date(ticketDateValue(b)).getTime() || 0;
        return bTime - aTime;
      });
    }

    if (ticketSort === "open") {
      return list.filter((ticket) => normalize(ticketStatus(ticket)) !== "chiuso");
    }

    if (ticketSort === "closed") {
      return list.filter((ticket) => normalize(ticketStatus(ticket)) === "chiuso");
    }

    if (ticketSort === "urgent") {
      return list.filter((ticket) => Boolean(ticket.urgent));
    }

    return list.sort((a, b) => {
      const aTime = new Date(ticketDateValue(a)).getTime() || 0;
      const bTime = new Date(ticketDateValue(b)).getTime() || 0;
      return ticketSort === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [relatedTickets, ticketSort]);

  const blockedTickets = relatedTickets.filter((ticket) => normalize(ticketStatus(ticket)).includes("bloccato"));
  const waitingTickets = relatedTickets.filter((ticket) => {
    const status = normalize(ticketStatus(ticket));
    return status.includes("attesa") || status.includes("sospeso");
  });
  const oldOpenTickets = openTickets.filter((ticket) => daysSince(ticketDateValue(ticket)) >= 7);
  const oldestOpenTicketDays = openTickets.reduce((max, ticket) => Math.max(max, daysSince(ticketDateValue(ticket))), 0);

  const healthDeductions =
    urgentTickets.length * 18 +
    blockedTickets.length * 20 +
    waitingTickets.length * 10 +
    oldOpenTickets.length * 8 +
    Math.max(0, openTickets.length - 3) * 5;

  const healthScore = Math.max(0, Math.min(100, 100 - healthDeductions));
  const healthTone = healthScore >= 80 ? "text-emerald-300" : healthScore >= 60 ? "text-amber-300" : "text-red-300";
  const healthRiskLabel = healthScore >= 80 ? "Rischio basso" : healthScore >= 60 ? "Rischio medio" : "Rischio alto";
  const healthRiskTone = healthScore >= 80
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    : healthScore >= 60
    ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
    : "border-red-500/30 bg-red-500/15 text-red-200";
  const healthReasons = [
    openTickets.length > 0 ? `${openTickets.length} ticket aperti` : "Nessun ticket aperto",
    urgentTickets.length > 0 ? `${urgentTickets.length} urgenze attive` : null,
    blockedTickets.length > 0 ? `${blockedTickets.length} ticket bloccati` : null,
    waitingTickets.length > 0 ? `${waitingTickets.length} ticket in attesa` : null,
    oldOpenTickets.length > 0 ? `${oldOpenTickets.length} ticket aperti da oltre 7 giorni` : null,
    oldestOpenTicketDays > 0 ? `Ticket aperto più vecchio: ${oldestOpenTicketDays} giorni` : null,
  ].filter(Boolean);

  useEffect(() => {
    async function loadCustomerAssets() {
      if (!resolvedTenantId || (!resolvedCustomerId && !resolvedSiteId)) {
        setCustomerAssets([]);
        return;
      }

      let query = supabase
        .from("customer_assets")
        .select("*")
        .eq("tenant_id", resolvedTenantId)
        .order("created_at", { ascending: false });

      if (resolvedSiteId) {
        query = query.eq("site_id", resolvedSiteId);
      } else if (resolvedCustomerId) {
        query = query.eq("customer_id", resolvedCustomerId);
      }

      const { data, error } = await query;

      if (error) {
        console.log("Errore caricamento asset cliente:", error);
        setCustomerAssets([]);
        return;
      }

      setCustomerAssets(data || []);
    }

    loadCustomerAssets();
  }, [resolvedTenantId, resolvedCustomerId, resolvedSiteId]);

  useEffect(() => {
    async function loadManuals() {
      if (!resolvedTenantId || (!resolvedCustomerId && !selectedEntityId)) {
        setManuals([]);
        return;
      }

      let query = supabase
        .from("manuals")
        .select("*")
        .eq("tenant_id", resolvedTenantId)
        .order("manual_date", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (selectedEntityId) {
        query = query.eq("customer_entity_id", selectedEntityId);
      } else if (resolvedCustomerId) {
        query = query.eq("customer_id", resolvedCustomerId);
      }

      const { data, error } = await query;

      if (error) {
        console.log("Errore caricamento manuali cliente:", error);
        setManuals([]);
        return;
      }

      setManuals(data || []);
    }

    loadManuals();
  }, [resolvedTenantId, resolvedCustomerId, selectedEntityId]);

  useEffect(() => {
    async function loadAccessCodes() {
      if (!resolvedTenantId || (!resolvedCustomerId && !selectedEntityId)) {
        setAccessCodes([]);
        return;
      }

      let query = supabase
        .from("customer_registration_codes")
        .select("*")
        .eq("tenant_id", resolvedTenantId)
        .order("created_at", { ascending: false });

      if (selectedEntityId) {
        query = query.eq("customer_entity_id", selectedEntityId);
      } else if (resolvedCustomerId) {
        query = query.eq("customer_id", resolvedCustomerId);
      }

      const { data, error } = await query;

      if (error) {
        console.log("Errore caricamento codici accesso:", error);
        setAccessCodes([]);
        return;
      }

      setAccessCodes(data || []);
    }

    loadAccessCodes();
  }, [resolvedTenantId, resolvedCustomerId, selectedEntityId]);

  useEffect(() => {
    async function loadEvents() {
      const customerId =
        currentCustomer?.id ||
        relatedTickets?.[0]?.customerId ||
        null;

      if (!customerId) {
        setTimelineEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from("ticket_events")
        .select("id, ticket_id, customer_id, site_id, event_type, title, description, created_by, created_at, metadata")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .range(0, 99);

      if (error) {
        console.log(error);
        return;
      }

      setTimelineEvents(data || []);
    }

    loadEvents();
  }, [currentCustomer, relatedTickets]);

  function openTicketModal(ticket: any) {
    setSelectedTicket({ ...ticket, status: ticketStatus(ticket) });
    setModal("ticket");
  }

  async function updateTicketStatus(ticket: any, nextStatus: string) {
    if (!ticket?.id || !nextStatus) return;

    const previousStatus = ticketStatus(ticket);

    const { error } = await supabase
      .from("tickets")
      .update({
        status: nextStatus,
        closed_at: nextStatus === "Chiuso" ? new Date().toISOString() : ticket.closedAt || ticket.closed_at || null,
      })
      .eq("id", Number(ticket.id));

    if (error) {
      console.log(error);
      return;
    }

    setStatusOverrides((prev) => ({
      ...prev,
      [String(ticket.id)]: nextStatus,
    }));

    setSelectedTicket((prev: any) =>
      prev ? { ...prev, status: nextStatus, closedAt: nextStatus === "Chiuso" ? new Date().toISOString() : prev.closedAt } : prev
    );

    const eventPayload = {
      ticket_id: Number(ticket.id),
      customer_id: currentCustomer?.id || ticket.customerId || ticket.customer_id || null,
      site_id: selectedSite?.id || ticket.site_id || null,
      event_type: "ticket_status_changed",
      title: "Stato ticket aggiornato",
      description: `Ticket #${ticket.id}: ${previousStatus || "n/d"} → ${nextStatus}`,
      created_by: "Operatore",
      metadata: {
        previous_status: previousStatus,
        next_status: nextStatus,
      },
    };

    const { data: eventData, error: eventError } = await supabase
      .from("ticket_events")
      .insert([eventPayload])
      .select()
      .single();

    if (eventError) {
      console.log(eventError);
      return;
    }

    if (eventData) {
      setTimelineEvents((prev) => [eventData, ...prev]);
    }
  }

  async function saveAsset() {
    if (!assetDraft || !resolvedTenantId) return;

    setWorkspaceMessage("");

    const payload = {
      tenant_id: resolvedTenantId,
      customer_id: resolvedCustomerId || null,
      site_id: resolvedSiteId || null,
      asset_name: assetDraft,
      asset_type: "Sistema",
      serial_number: assetSerial.trim() || null,
      notes: assetNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customer_assets")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.log(error);
      setWorkspaceMessage(error.message || "Errore salvataggio asset.");
      return;
    }

    setCustomerAssets((prev) => [data, ...prev]);
    setAssetDraft("");
    setAssetSerial("");
    setAssetNotes("");
  }

  async function removeAsset(assetId: string) {
    const confirmed = window.confirm("Rimuovere questo asset dal cliente?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("customer_assets")
      .delete()
      .eq("id", assetId);

    if (error) {
      console.log(error);
      setWorkspaceMessage(error.message || "Errore rimozione asset.");
      return;
    }

    setCustomerAssets((prev) => prev.filter((asset) => String(asset.id) !== String(assetId)));
  }

  function renderModal() {
    if (!modal) return null;

    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">ATLAS Workspace</p>
              <h3 className="mt-2 text-2xl font-black text-white">
                {modal === "contract" && "Contratto rapido"}
                {modal === "ticket" && "Dettaglio chiamata"}
                {modal === "asset" && "Asset collegati"}
              </h3>
            </div>
            <button onClick={() => setModal(null)} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15">
              <X size={20} />
            </button>
          </div>

          {modal === "contract" && (
            <ContractProfilePanel
              currentCustomer={currentCustomer}
              selectedSite={selectedSite}
              currentLabel={currentLabel}
            />
          )}

          {modal === "ticket" && selectedTicket && (
            <div className="grid min-w-0 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">#{selectedTicket.id}</p>
                <h4 className="mt-2 text-xl font-black text-white">{selectedTicket.site || "Sede n/d"}</h4>
                <p className={`mt-3 w-fit rounded-full border px-3 py-1 text-xs font-black ${getStatusTone(ticketStatus(selectedTicket))}`}>
                  {ticketStatus(selectedTicket) || "Stato n/d"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <label className="grid gap-2 text-sm font-black text-slate-300">
                  Cambia stato operativo
                  <select
                    value={ticketStatus(selectedTicket)}
                    onChange={(event) => updateTicketStatus(selectedTicket, event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none"
                  >
                    {ticketLifecycleStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid min-w-0 gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs font-black text-slate-400">Aperto</p><p className="mt-1 font-black text-white">{formatDate(selectedTicket.openedAt || selectedTicket.date)}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs font-black text-slate-400">Previsto</p><p className="mt-1 font-black text-white">{formatDate(selectedTicket.expectedCloseDate)}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"><p className="text-xs font-black text-slate-400">Chiuso</p><p className="mt-1 font-black text-white">{formatDate(selectedTicket.closedAt)}</p></div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Descrizione</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-200">{selectedTicket.problem || "Descrizione non disponibile"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-sm font-black text-slate-400">Note chiusura / necessità future</p>
                <p className="mt-2 text-sm font-bold text-slate-200">{selectedTicket.closingNotes || selectedTicket.futureNeeds || "Nessuna nota disponibile"}</p>
              </div>
            </div>
          )}

          {modal === "asset" && renderAssetsTab()}
        </div>
      </div>
    );
  }

  function renderTicketList(limit?: number) {
    const effectiveLimit = typeof limit === "number" ? limit : ticketPageSize;
    const list = sortedTickets.slice(0, effectiveLimit);
    const hasMoreTickets = sortedTickets.length > list.length;

    if (list.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
          Nessuna chiamata collegata trovata. Puoi aprire la prima chiamata da questa posizione.
        </div>
      );
    }

    return (
      <div className="grid min-w-0 gap-3">
        {list.map((ticket) => (
          <button key={ticket.id} onClick={() => openTicketModal(ticket)} className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-blue-500/10 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">#{ticket.id} · {ticket.site || "Sede n/d"}</p>
              <p className="truncate text-xs font-bold text-slate-500">{ticket.problem || "Descrizione non disponibile"}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-end justify-end gap-2 text-xs font-black md:max-w-[180px]">
              <span className={`max-w-full break-words rounded-full border px-3 py-1 text-center ${getStatusTone(ticketStatus(ticket))}`}>{ticketStatus(ticket) || "Stato n/d"}</span>
              <span className="w-fit rounded-full bg-blue-500/15 px-3 py-1 text-blue-200"><CalendarDays size={12} className="mr-1 inline" />{formatDate(ticketDateValue(ticket))}</span>
              {ticket.urgent && <span className="w-fit rounded-full bg-red-600 px-3 py-1 text-white">URGENTE</span>}
            </div>
          </button>
        ))}

        {hasMoreTickets && (
          <button
            type="button"
            onClick={() => setTicketPageSize((prev) => prev + 50)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]"
          >
            Carica altri 50 ticket · visualizzati {list.length} di {sortedTickets.length}
          </button>
        )}
      </div>
    );
  }

  function renderTicketToolbar() {
    return (
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Chiamate collegate</p>
          <p className="mt-1 text-sm font-bold text-slate-400">Ordina e apri il dettaglio operativo.</p>
        </div>
        <select value={ticketSort} onChange={(event) => setTicketSort(event.target.value as any)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-black text-white outline-none">
          <option value="all">Tutti</option>
          <option value="newest">Più recenti</option>
          <option value="oldest">Più vecchie</option>
          <option value="open">Solo aperte</option>
          <option value="closed">Solo chiuse</option>
          <option value="urgent">Solo urgenti</option>
        </select>
      </div>
    );
  }

  function renderAssetsTab() {
    return (
      <div className="grid min-w-0 gap-4">
        {workspaceMessage && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-black text-amber-100">
            {workspaceMessage}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="text-violet-300" size={20} />
            <div>
              <p className="text-sm font-black text-white">Collega asset al cliente/sede</p>
              <p className="text-xs font-bold text-slate-500">Ora gli asset vengono salvati su Supabase, non più nel browser locale.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
            <select
              value={assetDraft}
              onChange={(event) => setAssetDraft(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            >
              <option value="">Seleziona sistema / asset</option>
              {systemsCatalog.map((system: any, index: number) => {
                const name = getSystemName(system);
                return (
                  <option key={`${name}-${index}`} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>

            <input
              value={assetSerial}
              onChange={(event) => setAssetSerial(event.target.value)}
              placeholder="Seriale / matricola"
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={assetNotes}
              onChange={(event) => setAssetNotes(event.target.value)}
              placeholder="Note asset, posizione, stato, accessori..."
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />

            <button onClick={saveAsset} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white">
              <Plus size={16} /> Collega asset
            </button>
          </div>
        </div>

        {currentAssets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-sm font-bold text-slate-400">
            Nessun asset collegato. Seleziona un sistema dal menu per iniziare.
          </div>
        ) : (
          <div className="grid min-w-0 gap-3">
            {currentAssets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <div className="min-w-0">
                  <p className="font-black text-white">{asset.asset_name || asset.name || "Asset"}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {asset.serial_number ? `Seriale: ${asset.serial_number}` : "Seriale non indicato"} · Collegato a {currentLabel}
                  </p>
                  {asset.notes && <p className="mt-2 text-xs font-bold text-slate-400">{asset.notes}</p>}
                </div>
                <button onClick={() => removeAsset(String(asset.id))} className="rounded-2xl bg-red-600/80 px-3 py-2 text-xs font-black text-white">
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderContractsTab() {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
        <ContractProfilePanel
          currentCustomer={currentCustomer}
          selectedSite={selectedSite}
          currentLabel={currentLabel}
        />
      </div>
    );
  }

  function renderManualsTab() {
    return (
      <div className="grid min-w-0 gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Manuali collegati</p>
            <p className="mt-1 text-sm font-bold text-slate-400">Documenti filtrati per cliente/sede selezionata.</p>
          </div>
        </div>

        {manuals.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
            Nessun manuale collegato a questa posizione. Caricalo dal tab Manuali e associalo a cliente o entità.
          </div>
        ) : (
          <div className="grid gap-3">
            {manuals.map((manual) => (
              <div key={manual.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{manual.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {manual.sector || "Settore n/d"} · {manual.version ? `v${manual.version}` : "Versione n/d"} · {formatDate(manual.manual_date)}
                    </p>
                    {manual.description && <p className="mt-2 text-sm font-bold text-slate-300">{manual.description}</p>}
                    {manual.notes && <p className="mt-2 text-xs font-bold text-slate-500">Note: {manual.notes}</p>}
                  </div>

                  {manual.file_path ? (
                    <button
                      onClick={async () => {
                        const { data, error } = await supabase.storage
                          .from("atlas-manuals")
                          .createSignedUrl(manual.file_path, 60);
                        if (error || !data?.signedUrl) return;
                        window.open(data.signedUrl, "_blank");
                      }}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white"
                    >
                      Apri allegato
                    </button>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-400">Nessun file</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderAccessTab() {
    const activeCodes = accessCodes.filter((code) => code.is_active !== false);

    return (
      <div className="grid min-w-0 gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <KeyRound className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{activeCodes.length}</p>
            <p className="text-sm font-bold text-slate-400">Codici attivi</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <ShieldCheck className="mb-3 text-emerald-300" size={22} />
            <p className="text-3xl font-black text-white">{accessCodes.reduce((sum, code) => sum + Number(code.used_count || 0), 0)}</p>
            <p className="text-sm font-bold text-slate-400">Utilizzi totali</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <Clock className="mb-3 text-amber-300" size={22} />
            <p className="text-3xl font-black text-white">{accessCodes.filter((code) => code.expires_at && new Date(code.expires_at).getTime() < Date.now()).length}</p>
            <p className="text-sm font-bold text-slate-400">Scaduti</p>
          </div>
        </div>

        {accessCodes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
            Nessun codice invito collegato a questo cliente/sede.
          </div>
        ) : (
          <div className="grid gap-3">
            {accessCodes.map((code) => (
              <div key={code.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-lg font-black text-white">{code.code}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {code.contact_name || "Referente n/d"} · {code.contact_email || "email n/d"}
                    </p>
                    {code.notes && <p className="mt-2 text-xs font-bold text-slate-400">{code.notes}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-black">
                    <span className={`rounded-full px-3 py-1 ${code.is_active === false ? "bg-red-500/15 text-red-200" : "bg-emerald-500/15 text-emerald-200"}`}>
                      {code.is_active === false ? "Disattivo" : "Attivo"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">
                      {Number(code.used_count || 0)}/{code.max_uses || "∞"} usi
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">
                      Scade: {formatDate(code.expires_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderTimelineTab() {
    const events = timelineEvents.map((event) => ({
      id: event.id,
      title: event.title || "Evento",
      detail: event.description || "",
      date: event.created_at,
      author: event.created_by || "Sistema",
      tone:
        event.event_type === "ticket_closed"
          ? "emerald"
          : event.event_type === "ticket_urgent"
          ? "red"
          : "blue",
    }));

    if (events.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
          Nessun evento ancora disponibile.
        </div>
      );
    }

    return (
      <div className="relative grid gap-3 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-white/10">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative grid grid-cols-[2.5rem_1fr] gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-blue-500/10"
          >
            <span
              className={`z-10 mt-1 h-4 w-4 rounded-full ${
                event.tone === "red"
                  ? "bg-red-500"
                  : event.tone === "emerald"
                  ? "bg-emerald-500"
                  : "bg-blue-500"
              }`}
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-white">
                  {event.title}
                </p>

                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                  {event.author}
                </span>
              </div>

              <p className="mt-1 text-xs font-bold text-slate-400">
                {event.detail}
              </p>

              <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-blue-300">
                {formatDate(event.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tabs: Array<{ key: WorkspaceTab; label: string; icon: any }> = [
    { key: "overview", label: "Overview", icon: ShieldCheck },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "sites", label: "Sedi", icon: Building2 },
    { key: "contracts", label: "Contratti", icon: FileText },
    { key: "assets", label: "Assets", icon: Package },
    { key: "manuals", label: "Manuali", icon: BookOpen },
    { key: "access", label: "Accessi", icon: KeyRound },
    { key: "timeline", label: "Timeline", icon: History },
  ];

  return (
    <div className="grid w-full min-w-0 overflow-x-hidden gap-5 rounded-[2rem] border border-blue-500/30 bg-blue-500/10 p-5 animate-in fade-in slide-in-from-bottom-3">
      {renderModal()}

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Customer workspace</p>
          <h2 className="mt-2 break-words text-2xl font-black text-white md:text-4xl">{currentLabel}</h2>
          <p className="mt-2 text-sm font-bold text-slate-400">
            {selectedSite
              ? [selectedSite.city, selectedSite.region, selectedSite.entity]
                  .filter(Boolean)
                  .join(" · ")
              : currentCustomer?.linked_contract_name
                ? `Contratto collegato · ${currentCustomer.linked_contract_name}`
                : currentCustomer?.contract_type || "Cliente selezionato"}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:w-auto">
          <button onClick={() => onOpenTicket?.(currentCustomer || selectedSite, selectedSite || undefined)} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5">
            + Apri chiamata
          </button>
          <button onClick={onReset} className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.12]">
            Nuova ricerca
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-5">
        <button onClick={() => setModal("contract")} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50">
          <FileText className="mb-3 text-blue-300" size={22} />
          <p className="text-sm font-black text-slate-400">Contratto</p>
          <p className="mt-1 break-words text-lg font-black text-white">
            {currentCustomer?.linked_contract_name ||
              currentCustomer?.contract_type ||
              selectedSite?.entity ||
              "Da collegare"}
          </p>
        </button>

        <button onClick={() => { setTicketSort("open"); setActiveTab("tickets"); }} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-500/50">
          <Ticket className="mb-3 text-emerald-300" size={22} />
          <p className="text-3xl font-black text-white">{openTickets.length}</p>
          <p className="text-sm font-bold text-slate-400">Chiamate aperte</p>
        </button>

        <button onClick={() => { setTicketSort("urgent"); setActiveTab("tickets"); }} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-500/50">
          <Flame className="mb-3 text-red-300" size={22} />
          <p className="text-3xl font-black text-white">{urgentTickets.length}</p>
          <p className="text-sm font-bold text-slate-400">Urgenze</p>
        </button>

        <button onClick={() => setActiveTab("sites")} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50">
          <Building2 className="mb-3 text-blue-300" size={22} />
          <p className="text-3xl font-black text-white">{relatedSites.length || new Set(relatedTickets.map((ticket) => ticket.site_id || ticket.site).filter(Boolean)).size}</p>
          <p className="text-sm font-bold text-slate-400">Sedi collegate</p>
        </button>

        <button onClick={() => setActiveTab("assets")} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-500/50">
          <Package className="mb-3 text-violet-300" size={22} />
          <p className="text-3xl font-black text-white">{currentAssets.length}</p>
          <p className="text-sm font-bold text-slate-400">Asset collegati</p>
        </button>
      </div>

      <div className="flex w-full min-w-0 gap-2 overflow-x-auto border-b border-white/10 pb-3">
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

      {activeTab === "overview" && (
        <div className="grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <ShieldCheck className={healthTone} size={22} />
                <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${healthRiskTone}`}>
                  {healthRiskLabel}
                </span>
              </div>
              <p className={`text-4xl font-black ${healthTone}`}>{healthScore}</p>
              <p className="text-sm font-bold text-slate-400">Health score cliente</p>
              <div className="mt-3 grid gap-1 text-xs font-bold text-slate-400">
                {healthReasons.slice(0, 3).map((reason: any) => (
                  <p key={reason}>• {reason}</p>
                ))}
              </div>
            </div>
            <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <Clock className="mb-3 text-blue-300" size={22} />
              <p className="text-2xl font-black text-white">{currentCustomer?.sla_hours ? `${currentCustomer.sla_hours}h` : "N/D"}</p>
              <p className="text-sm font-bold text-slate-400">SLA operativo</p>
            </div>
            <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <CalendarDays className="mb-3 text-violet-300" size={22} />
              <p className="text-2xl font-black text-white">{formatDate(lastActivity)}</p>
              <p className="text-sm font-bold text-slate-400">Ultima attività</p>
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Customer risk analysis</p>
                <p className="mt-1 text-lg font-black text-white">{healthRiskLabel}</p>
              </div>
              <p className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${healthRiskTone}`}>
                Score {healthScore}/100
              </p>
            </div>
            <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
              {healthReasons.map((reason: any) => (
                <div key={reason} className="min-w-0 break-words rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-300">
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {renderTicketToolbar()}
          {renderTicketList()}
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="grid min-w-0 gap-4">
          {renderTicketToolbar()}
          {renderTicketList()}
        </div>
      )}

      {activeTab === "sites" && (
        <CustomerSitesPanel
          currentCustomer={currentCustomer}
          selectedSite={selectedSite}
          relatedSites={relatedSites}
          relatedTickets={relatedTickets}
          onSelectSite={onSelectSite}
          onOpenTicket={onOpenTicket}
        />
      )}

      {activeTab === "contracts" && renderContractsTab()}

      {activeTab === "assets" && renderAssetsTab()}

      {activeTab === "manuals" && renderManualsTab()}

      {activeTab === "access" && renderAccessTab()}

      {activeTab === "timeline" && renderTimelineTab()}
    </div>
  );
}
