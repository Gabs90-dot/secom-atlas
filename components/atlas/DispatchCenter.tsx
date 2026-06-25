"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { atlasDesign, atlasStatusTone, type AtlasTone } from "@/lib/designSystem";
import AtlasBadge from "@/components/atlas/ui/AtlasBadge";
import AtlasButton from "@/components/atlas/ui/AtlasButton";
import AtlasCard from "@/components/atlas/ui/AtlasCard";
import AtlasEmptyState from "@/components/atlas/ui/AtlasEmptyState";
import AtlasMetric from "@/components/atlas/ui/AtlasMetric";
import AtlasModal from "@/components/atlas/ui/AtlasModal";
import AtlasSection from "@/components/atlas/ui/AtlasSection";
import type { AtlasTenantOperator } from "@/lib/atlasTenantCatalogs";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Save,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";

type DispatchCenterProps = {
  tickets: any[];
  technicians: string[];
  operators?: AtlasTenantOperator[];
  operatorSectors?: string[];
  tenant?: { id?: string | null } | null;
  onOpenTicket?: (ticket: any) => void;
  onAddOperator?: (input: { name: string; title: string; sector: string; status: string }) => void;
  onAddSector?: (name: string) => void;
};

type QueueFilter = "all" | "urgent" | "blocked" | "unassigned" | "aging";
type ScheduleRange = "today" | "tomorrow" | "week";

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

const slotOptions = ["", "Mattina", "Pomeriggio", "Giornata", "Da definire"];

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ticketDateValue(ticket: any) {
  return ticket.openedAt || ticket.opened_at || ticket.date || ticket.intervention_date || ticket.created_at || "";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return String(value);
  }
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function plannedDateValue(ticket: any) {
  return ticket.date || ticket.intervention_date || "";
}

function daysOpen(ticket: any) {
  const raw = ticketDateValue(ticket);
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  if (!time || Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function isClosed(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("chiuso") || status.includes("validato") || status.includes("risolto");
}

function isBlocked(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("bloccato") || status.includes("attesa");
}

function getTicketTone(ticket: any): AtlasTone {
  return atlasStatusTone(ticket.status, Boolean(ticket.urgent));
}

function getRiskTone(level: number): AtlasTone {
  if (level >= 8) return "red";
  if (level >= 3) return "amber";
  return "emerald";
}

function getRiskTextClass(level: number) {
  if (level >= 8) return "text-red-300";
  if (level >= 3) return "text-amber-300";
  return "text-emerald-300";
}

export default function DispatchCenter({
  tickets,
  technicians,
  operators = [],
  operatorSectors = [],
  tenant = null,
  onOpenTicket,
  onAddOperator,
  onAddSector,
}: DispatchCenterProps) {
  const tenantId = String(tenant?.id || "").trim();
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [scheduleRange, setScheduleRange] = useState<ScheduleRange>("today");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftTechnician, setDraftTechnician] = useState("");
  const [draftStatus, setDraftStatus] = useState("Nuovo");
  const [draftDate, setDraftDate] = useState("");
  const [draftSlot, setDraftSlot] = useState("");
  const [localOverrides, setLocalOverrides] = useState<Record<string, any>>({});
  const [operatorForm, setOperatorForm] = useState({
    name: "",
    title: "",
    sector: "",
    status: "active",
  });
  const [sectorDraft, setSectorDraft] = useState("");
  const visibleOperators = operators.length
    ? operators
    : technicians.map((name) => ({
        id: `fallback-${normalize(name)}`,
        tenantId,
        name,
        title: "Tecnico",
        sector: "Assistenza tecnica",
        status: "active" as const,
      }));

  const mergedTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      ...ticket,
      ...(localOverrides[String(ticket.id)] || {}),
    }));
  }, [tickets, localOverrides]);

  const activeTickets = useMemo(() => mergedTickets.filter((ticket) => !isClosed(ticket)), [mergedTickets]);

  const urgentTickets = activeTickets.filter((ticket) => Boolean(ticket.urgent));
  const blockedTickets = activeTickets.filter(isBlocked);
  const unassignedTickets = activeTickets.filter((ticket) => !ticket.technician);
  const agingTickets = activeTickets.filter((ticket) => daysOpen(ticket) >= 7);

  const workload = useMemo(() => {
    return technicians.map((technician) => {
      const assigned = activeTickets.filter((ticket) => normalize(ticket.technician) === normalize(technician));
      const urgent = assigned.filter((ticket) => Boolean(ticket.urgent));
      const blocked = assigned.filter(isBlocked);
      const planned = assigned.filter((ticket) => normalize(ticket.status).includes("pian"));

      return {
        technician,
        assigned: assigned.length,
        urgent: urgent.length,
        blocked: blocked.length,
        planned: planned.length,
        load: Math.min(100, assigned.length * 12 + urgent.length * 10 + blocked.length * 8),
      };
    });
  }, [activeTickets, technicians]);

  const queueTickets = useMemo(() => {
    let list = [...activeTickets];

    if (queueFilter === "urgent") list = urgentTickets;
    if (queueFilter === "blocked") list = blockedTickets;
    if (queueFilter === "unassigned") list = unassignedTickets;
    if (queueFilter === "aging") list = agingTickets;

    return list.sort((a, b) => {
      if (Boolean(b.urgent) !== Boolean(a.urgent)) return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent));
      if (daysOpen(b) !== daysOpen(a)) return daysOpen(b) - daysOpen(a);
      return new Date(ticketDateValue(b)).getTime() - new Date(ticketDateValue(a)).getTime();
    });
  }, [activeTickets, urgentTickets, blockedTickets, unassignedTickets, agingTickets, queueFilter]);

  const riskLevel = urgentTickets.length + blockedTickets.length + agingTickets.length;
  const riskLabel = riskLevel >= 8 ? "Alto" : riskLevel >= 3 ? "Medio" : "Controllato";
  const riskTone = getRiskTone(riskLevel);

  const todayIso = formatLocalDate(new Date());
  const tomorrowIso = formatLocalDate(addDays(new Date(), 1));
  const weekDays = Array.from({ length: 7 }, (_, index) => formatLocalDate(addDays(new Date(), index)));

  const scheduleDays = scheduleRange === "today" ? [todayIso] : scheduleRange === "tomorrow" ? [tomorrowIso] : weekDays;
  const plannedTickets = activeTickets.filter((ticket) => scheduleDays.includes(plannedDateValue(ticket)));
  const unscheduledTickets = activeTickets.filter((ticket) => !plannedDateValue(ticket));

  const scheduleByTechnician = technicians.map((technician) => {
    const technicianTickets = plannedTickets.filter((ticket) => normalize(ticket.technician) === normalize(technician));

    return {
      technician,
      tickets: technicianTickets,
      mattina: technicianTickets.filter((ticket) => normalize(ticket.slot).includes("mattina")),
      pomeriggio: technicianTickets.filter((ticket) => normalize(ticket.slot).includes("pomeriggio")),
      altri: technicianTickets.filter(
        (ticket) => !normalize(ticket.slot).includes("mattina") && !normalize(ticket.slot).includes("pomeriggio")
      ),
      overload: technicianTickets.length >= 5 || technicianTickets.filter((ticket) => ticket.urgent).length >= 2,
    };
  });

  function submitOperator() {
    onAddOperator?.(operatorForm);
    setOperatorForm({ name: "", title: "", sector: "", status: "active" });
  }

  function submitSector() {
    onAddSector?.(sectorDraft);
    setSectorDraft("");
  }

  function openDispatchModal(ticket: any) {
    setSelectedTicket(ticket);
    setDraftTechnician(ticket.technician || "");
    setDraftStatus(ticket.status || "Nuovo");
    setDraftDate(ticket.date || ticket.intervention_date || "");
    setDraftSlot(ticket.slot || "");
  }

  async function saveDispatchUpdate() {
    if (!selectedTicket?.id) return;
    if (!tenantId) return;

    setSaving(true);

    const previousTechnician = selectedTicket.technician || "";
    const previousStatus = selectedTicket.status || "Nuovo";
    const previousDate = selectedTicket.date || selectedTicket.intervention_date || "";
    const previousSlot = selectedTicket.slot || "";

    const payload = {
      technician: draftTechnician || null,
      status: draftStatus || "Nuovo",
      intervention_date: draftDate || null,
      slot: draftSlot || null,
      closed_at: draftStatus === "Chiuso" ? new Date().toISOString() : selectedTicket.closedAt || selectedTicket.closed_at || null,
    };

    const { error } = await supabase
      .from("tickets")
      .update(payload)
      .eq("id", Number(selectedTicket.id))
      .eq("tenant_id", tenantId);

    if (error) {
      console.log(error);
      setSaving(false);
      return;
    }

    const nextTicket = {
      ...selectedTicket,
      technician: draftTechnician,
      status: draftStatus,
      date: draftDate,
      intervention_date: draftDate,
      slot: draftSlot,
      closedAt: payload.closed_at,
      closed_at: payload.closed_at,
    };

    setLocalOverrides((prev) => ({
      ...prev,
      [String(selectedTicket.id)]: nextTicket,
    }));
    setSelectedTicket(nextTicket);

    const events: any[] = [];

    if (normalize(previousTechnician) !== normalize(draftTechnician)) {
      events.push({
        ticket_id: Number(selectedTicket.id),
        tenant_id: tenantId,
        customer_id: selectedTicket.customerId || selectedTicket.customer_id || null,
        site_id: selectedTicket.site_id || null,
        event_type: "ticket_assigned",
        title: "Ticket assegnato",
        description: `Ticket #${selectedTicket.id}: ${draftTechnician || "nessun tecnico"}`,
        created_by: "Dispatch",
        metadata: {
          previous_technician: previousTechnician,
          next_technician: draftTechnician,
        },
      });
    }

    if (normalize(previousStatus) !== normalize(draftStatus)) {
      events.push({
        ticket_id: Number(selectedTicket.id),
        tenant_id: tenantId,
        customer_id: selectedTicket.customerId || selectedTicket.customer_id || null,
        site_id: selectedTicket.site_id || null,
        event_type: "ticket_status_changed",
        title: "Stato ticket aggiornato",
        description: `Ticket #${selectedTicket.id}: ${previousStatus || "n/d"} → ${draftStatus}`,
        created_by: "Dispatch",
        metadata: {
          previous_status: previousStatus,
          next_status: draftStatus,
        },
      });
    }

    if ((previousDate || "") !== (draftDate || "") || (previousSlot || "") !== (draftSlot || "")) {
      events.push({
        ticket_id: Number(selectedTicket.id),
        tenant_id: tenantId,
        customer_id: selectedTicket.customerId || selectedTicket.customer_id || null,
        site_id: selectedTicket.site_id || null,
        event_type: "ticket_scheduled",
        title: "Ticket pianificato",
        description: `Ticket #${selectedTicket.id}: ${draftDate || "data n/d"}${draftSlot ? ` · ${draftSlot}` : ""}`,
        created_by: "Dispatch",
        metadata: {
          previous_date: previousDate,
          next_date: draftDate,
          previous_slot: previousSlot,
          next_slot: draftSlot,
        },
      });
    }

    if (events.length > 0) {
      const { error: eventError } = await supabase.from("ticket_events").insert(events);
      if (eventError) console.log(eventError);
    }

    setSaving(false);
    setSelectedTicket(null);
  }

  function renderDispatchModal() {
    return (
      <AtlasModal
        open={Boolean(selectedTicket)}
        eyebrow="Dispatch operativo"
        title={selectedTicket ? `Ticket #${selectedTicket.id}` : "Ticket"}
        onClose={() => setSelectedTicket(null)}
      >
        {selectedTicket && (
          <div className="grid gap-4">
            <AtlasCard variant="compact">
              <p className="text-sm font-black text-slate-400">Sede</p>
              <p className="mt-1 text-lg font-black text-white">{selectedTicket.site || "Sede n/d"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-300">
                {selectedTicket.problem || "Descrizione non disponibile"}
              </p>
            </AtlasCard>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-300">
                Tecnico assegnato
                <select value={draftTechnician} onChange={(event) => setDraftTechnician(event.target.value)} className={atlasDesign.input.base}>
                  <option value="">Da assegnare</option>
                  {technicians.map((technician) => (
                    <option key={technician} value={technician}>
                      {technician}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-black text-slate-300">
                Stato operativo
                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className={atlasDesign.input.base}>
                  {ticketLifecycleStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-black text-slate-300">
                Data pianificazione
                <input type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} className={atlasDesign.input.base} />
              </label>

              <label className="grid gap-2 text-sm font-black text-slate-300">
                Slot
                <select value={draftSlot} onChange={(event) => setDraftSlot(event.target.value)} className={atlasDesign.input.base}>
                  {slotOptions.map((slot) => (
                    <option key={slot || "empty"} value={slot}>
                      {slot || "Nessuno"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <AtlasCard variant="compact">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Aperto</p>
                <p className="mt-1 text-sm font-black text-white">{formatDate(ticketDateValue(selectedTicket))}</p>
              </AtlasCard>
              <AtlasCard variant="compact">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Età ticket</p>
                <p className="mt-1 text-sm font-black text-white">{daysOpen(selectedTicket)} giorni</p>
              </AtlasCard>
              <AtlasCard variant="compact">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Area</p>
                <p className="mt-1 text-sm font-black text-white">{selectedTicket.region || selectedTicket.city || "n/d"}</p>
              </AtlasCard>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <AtlasButton variant="secondary" onClick={() => onOpenTicket?.(selectedTicket)}>
                Apri dettaglio
              </AtlasButton>
              <AtlasButton onClick={saveDispatchUpdate} disabled={saving}>
                <span className="flex items-center justify-center gap-2">
                  <Save size={18} />
                  {saving ? "Salvataggio..." : "Salva dispatch"}
                </span>
              </AtlasButton>
            </div>
          </div>
        )}
      </AtlasModal>
    );
  }

  function renderQueueTicket(ticket: any) {
    return (
      <AtlasCard key={ticket.id} variant="action" onClick={() => openDispatchModal(ticket)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black text-white">#{ticket.id}</p>
              <AtlasBadge tone={getTicketTone(ticket)}>{ticket.status || "Nuovo"}</AtlasBadge>
              {ticket.urgent && <AtlasBadge tone="red">URGENTE</AtlasBadge>}
            </div>

            <p className="mt-2 line-clamp-1 text-sm font-black text-white">{ticket.site || "Sede n/d"}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">{ticket.problem || "Descrizione non disponibile"}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 text-xs font-black text-slate-300 md:justify-end">
            <AtlasBadge>
              <CalendarDays size={12} className="mr-1 inline" />
              {formatDate(ticketDateValue(ticket))}
            </AtlasBadge>
            <AtlasBadge>{daysOpen(ticket)} gg</AtlasBadge>
            <AtlasBadge>
              <MapPin size={12} className="mr-1 inline" />
              {ticket.region || ticket.city || "Area n/d"}
            </AtlasBadge>
          </div>
        </div>
      </AtlasCard>
    );
  }

  function renderScheduleSlot(label: string, list: any[]) {
    return (
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
        {list.length === 0 ? (
          <p className="text-xs font-bold text-slate-600">Vuoto</p>
        ) : (
          <div className="grid gap-2">
            {list.slice(0, 3).map((ticket) => (
              <button key={ticket.id} onClick={() => openDispatchModal(ticket)} className="rounded-xl bg-white/[0.06] p-2 text-left transition hover:bg-blue-500/10">
                <p className="truncate text-xs font-black text-white">#{ticket.id} · {ticket.site || "Sede n/d"}</p>
                <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{formatDate(plannedDateValue(ticket))}</p>
              </button>
            ))}
            {list.length > 3 && <p className="text-[11px] font-black text-blue-300">+{list.length - 3} altri</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="grid gap-5">
      {renderDispatchModal()}

      <AtlasSection
        eyebrow="ATLAS Dispatch Center"
        title="Centrale operativa"
        description="Vista live per backlog, urgenze, workload tecnici e ticket da governare."
        action={
          <AtlasCard variant="compact" className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Rischio operativo</p>
            <p className={`mt-2 text-3xl font-black ${getRiskTextClass(riskLevel)}`}>{riskLabel}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{riskLevel} segnali da monitorare</p>
          </AtlasCard>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <AtlasMetric label="Backlog attivo" value={activeTickets.length} icon={<Clock className="text-blue-300" size={22} />} onClick={() => setQueueFilter("all")} />
          <AtlasMetric label="Urgenti" value={urgentTickets.length} icon={<Flame className="text-red-300" size={22} />} toneClass="text-red-300" onClick={() => setQueueFilter("urgent")} />
          <AtlasMetric label="Bloccati / attesa" value={blockedTickets.length} icon={<ShieldAlert className="text-amber-300" size={22} />} toneClass="text-amber-300" onClick={() => setQueueFilter("blocked")} />
          <AtlasMetric label="Da assegnare" value={unassignedTickets.length} icon={<Users className="text-violet-300" size={22} />} toneClass="text-violet-300" onClick={() => setQueueFilter("unassigned")} />
        </div>
      </AtlasSection>

      <AtlasSection
        eyebrow="Scheduling engine"
        title="Pianificazione operativa"
        description="Vista rapida per tecnico, slot e saturazione."
        action={
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: "today", label: "Oggi" },
              { key: "tomorrow", label: "Domani" },
              { key: "week", label: "Settimana" },
            ].map((item) => (
              <AtlasButton
                key={item.key}
                variant={scheduleRange === item.key ? "primary" : "secondary"}
                onClick={() => setScheduleRange(item.key as ScheduleRange)}
                className="shrink-0 px-4 py-3 text-xs"
              >
                {item.label}
              </AtlasButton>
            ))}
          </div>
        }
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <AtlasCard variant="compact">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Operatori tenant</p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  {visibleOperators.length > 0 ? `${visibleOperators.length} operatori configurati` : "Nessun operatore configurato"}
                </p>
              </div>
              <AtlasBadge tone={visibleOperators.length > 0 ? "emerald" : "amber"}>
                {visibleOperators.length > 0 ? "Attivo" : "Empty state"}
              </AtlasBadge>
            </div>

            {visibleOperators.length === 0 ? (
              <AtlasEmptyState description="Questo tenant non ha ancora tecnici o operatori. Aggiungi un operatore o almeno una mansione per iniziare." />
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {visibleOperators.slice(0, 6).map((operator) => (
                  <div key={operator.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="truncate text-sm font-black text-white">{operator.name}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {operator.title || "Operatore"} · {operator.sector || "Mansione n/d"}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-500">{operator.status}</p>
                  </div>
                ))}
              </div>
            )}
          </AtlasCard>

          <AtlasCard variant="compact">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Nuovo operatore</p>
            <div className="grid gap-2">
              <input
                value={operatorForm.name}
                onChange={(event) => setOperatorForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nome operatore"
                className={atlasDesign.input.compact}
              />
              <input
                value={operatorForm.title}
                onChange={(event) => setOperatorForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Titolo / qualifica"
                className={atlasDesign.input.compact}
              />
              <input
                value={operatorForm.sector}
                onChange={(event) => setOperatorForm((prev) => ({ ...prev, sector: event.target.value }))}
                placeholder="Settore / mansione"
                list="atlas-operator-sectors"
                className={atlasDesign.input.compact}
              />
              <datalist id="atlas-operator-sectors">
                {operatorSectors.map((sector) => (
                  <option key={sector} value={sector} />
                ))}
              </datalist>
              <select
                value={operatorForm.status}
                onChange={(event) => setOperatorForm((prev) => ({ ...prev, status: event.target.value }))}
                className={atlasDesign.input.compact}
              >
                <option value="active">Attivo</option>
                <option value="paused">Sospeso</option>
                <option value="inactive">Non attivo</option>
              </select>
              <AtlasButton onClick={submitOperator} disabled={!tenantId || !operatorForm.name.trim()}>
                Aggiungi operatore
              </AtlasButton>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Mansione personalizzata</p>
              <div className="flex gap-2">
                <input
                  value={sectorDraft}
                  onChange={(event) => setSectorDraft(event.target.value)}
                  placeholder="Es. Networking"
                  className={atlasDesign.input.compact}
                />
                <AtlasButton variant="secondary" onClick={submitSector} disabled={!tenantId || !sectorDraft.trim()}>
                  Salva
                </AtlasButton>
              </div>
            </div>
          </AtlasCard>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <AtlasMetric label="Ticket pianificati" value={plannedTickets.length} />
          <AtlasMetric label="Non pianificati" value={unscheduledTickets.length} toneClass="text-violet-300" onClick={() => setQueueFilter("unassigned")} />
          <AtlasCard variant="compact">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Finestra</p>
            <p className="mt-2 text-lg font-black text-white">
              {scheduleRange === "today" ? "Oggi" : scheduleRange === "tomorrow" ? "Domani" : "Prossimi 7 giorni"}
            </p>
          </AtlasCard>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {scheduleByTechnician.length === 0 ? (
            <AtlasEmptyState description="Nessun tecnico attivo configurato per la pianificazione." />
          ) : scheduleByTechnician.map((item) => (
            <AtlasCard key={item.technician} variant={item.overload ? "danger" : "compact"}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{item.technician}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.tickets.length} interventi pianificati</p>
                </div>
                {item.overload && <AtlasBadge tone="red">OVERLOAD</AtlasBadge>}
              </div>

              {renderScheduleSlot("Mattina", item.mattina)}
              {renderScheduleSlot("Pomeriggio", item.pomeriggio)}
              {renderScheduleSlot("Altro", item.altri)}
            </AtlasCard>
          ))}
        </div>
      </AtlasSection>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AtlasSection eyebrow="Team workload" title="Carico tecnici" action={<UserRound className="text-blue-300" size={26} />}>
          <div className="grid gap-3">
            {workload.length === 0 ? (
              <AtlasEmptyState description="Nessun tecnico attivo configurato per il calcolo del carico." />
            ) : workload.map((item) => (
              <AtlasCard key={item.technician} variant="compact">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{item.technician}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {item.assigned} attivi · {item.urgent} urgenti · {item.blocked} bloccati
                    </p>
                  </div>
                  <AtlasBadge tone={item.load >= 80 ? "red" : item.load >= 45 ? "amber" : "emerald"}>{item.load}%</AtlasBadge>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${item.load >= 80 ? "bg-red-500" : item.load >= 45 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${item.load}%` }} />
                </div>
              </AtlasCard>
            ))}
          </div>
        </AtlasSection>

        <AtlasSection
          eyebrow="Operational queue"
          title="Coda ticket"
          action={
            <select value={queueFilter} onChange={(event) => setQueueFilter(event.target.value as QueueFilter)} className={atlasDesign.input.compact}>
              <option value="all">Tutti attivi</option>
              <option value="urgent">Solo urgenti</option>
              <option value="blocked">Bloccati / attesa</option>
              <option value="unassigned">Da assegnare</option>
              <option value="aging">Aperti da 7+ giorni</option>
            </select>
          }
        >
          <div className="grid max-h-[640px] gap-3 overflow-y-auto pr-1">
            {queueTickets.length === 0 ? (
              <AtlasEmptyState description="Nessun ticket in questa coda." />
            ) : (
              queueTickets.map((ticket) => renderQueueTicket(ticket))
            )}
          </div>
        </AtlasSection>
      </div>

      <AtlasCard variant="action">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 text-blue-300" size={22} />
          <div>
            <p className="text-sm font-black text-white">Dispatch premium UI attivo</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Layout standardizzato con componenti ATLAS UI: cards, badge, metriche, pulsanti e modal coerenti.
            </p>
          </div>
        </div>
      </AtlasCard>
    </section>
  );
}
