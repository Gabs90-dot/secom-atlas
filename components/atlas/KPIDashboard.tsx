"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Flame,
  LineChart,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

type KPIDashboardProps = {
  tickets: any[];
  technicians: string[];
  currentUser?: { tenantId?: string | null } | null;
};

type RangeFilter = "all" | "7" | "30" | "90";

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value: any) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function ticketDateValue(ticket: any) {
  return (
    ticket.openedAt ||
    ticket.opened_at ||
    ticket.created_at ||
    ticket.date ||
    ticket.intervention_date ||
    ""
  );
}

function closeDateValue(ticket: any) {
  return ticket.closedAt || ticket.closed_at || ticket.solved_at || "";
}

function plannedDateValue(ticket: any) {
  return ticket.date || ticket.intervention_date || "";
}

function isClosed(ticket: any) {
  const status = normalize(ticket.status);

  return (
    Boolean(ticket.closedAt || ticket.closed_at) ||
    status.includes("chiuso") ||
    status.includes("validato") ||
    status.includes("risolto") ||
    status.includes("closed") ||
    status === "5" ||
    status === "6"
  );
}

function isBlocked(ticket: any) {
  const status = normalize(ticket.status);

  return (
    status.includes("bloccato") ||
    status.includes("attesa") ||
    status.includes("sospeso") ||
    status.includes("pending")
  );
}

function hasTechnician(ticket: any) {
  return Boolean(String(ticket.technician || "").trim());
}

function hoursBetween(start?: string | null, end?: string | null) {
  const a = parseDate(start);
  const b = parseDate(end) || new Date();

  if (!a || !b) return 0;

  return Math.max(0, (b.getTime() - a.getTime()) / 36e5);
}

function daysBetween(start?: string | null, end?: string | null) {
  return Math.floor(hoursBetween(start, end) / 24);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatDuration(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "0h";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}g`;
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.min(100, Math.max(4, Math.round((value / max) * 100)))}%`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;

  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day);

  return result;
}

function endOfWeek(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

function formatWeekRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();

  const startDay = start.getDate();
  const endDay = end.getDate();

  const startMonth = start.toLocaleDateString("it-IT", { month: "short" });
  const endMonth = end.toLocaleDateString("it-IT", { month: "short" });

  return sameMonth
    ? `${startDay}-${endDay} ${endMonth}`
    : `${startDay} ${startMonth}-${endDay} ${endMonth}`;
}

function getSlaTargetHours(ticket: any) {
  const value =
    ticket.sla_hours ||
    ticket.slaHours ||
    ticket.customer_sla_hours ||
    ticket.sla ||
    48;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 48;
}

function getCustomerLabel(ticket: any) {
  return (
    ticket.customerName ||
    ticket.customer_name ||
    ticket.site ||
    ticket.entity ||
    ticket.glpi_entity_path ||
    ticket.glpiEntityPath ||
    "Cliente n/d"
  );
}

export default function KPIDashboard({ tickets, currentUser = null }: KPIDashboardProps) {
  const [range, setRange] = useState<RangeFilter>("30");
  const tenantId = String(currentUser?.tenantId || "").trim();

  const tenantScopedTickets = useMemo(() => {
    if (!tenantId) return [];
    return tickets.filter((ticket) => String(ticket?.tenantId || ticket?.tenant_id || "") === tenantId);
  }, [tickets, tenantId]);

  const tenantTechnicians = useMemo(() => {
    const seen = new Set<string>();
    tenantScopedTickets.forEach((ticket) => {
      const technician = String(ticket?.technician || "").trim();
      if (technician) seen.add(technician);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "it"));
  }, [tenantScopedTickets]);

  const scopedTickets = useMemo(() => {
    if (range === "all") return tenantScopedTickets;

    const days = Number(range);
    const from = new Date();

    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    return tenantScopedTickets.filter((ticket) => {
      const parsed = parseDate(ticketDateValue(ticket));
      return parsed ? parsed >= from : false;
    });
  }, [tenantScopedTickets, range]);

  const activeTickets = useMemo(
    () => scopedTickets.filter((ticket) => !isClosed(ticket)),
    [scopedTickets],
  );

  const closedTickets = useMemo(
    () => scopedTickets.filter(isClosed),
    [scopedTickets],
  );

  const urgentTickets = activeTickets.filter((ticket) => Boolean(ticket.urgent));
  const blockedTickets = activeTickets.filter(isBlocked);
  const agingTickets = activeTickets.filter(
    (ticket) => daysBetween(ticketDateValue(ticket)) >= 7,
  );
  const scheduledTickets = activeTickets.filter((ticket) =>
    Boolean(plannedDateValue(ticket)),
  );
  const unassignedTickets = activeTickets.filter((ticket) => !hasTechnician(ticket));

  const avgResolutionHours = closedTickets.length
    ? closedTickets.reduce(
        (sum, ticket) =>
          sum + hoursBetween(ticketDateValue(ticket), closeDateValue(ticket)),
        0,
      ) / closedTickets.length
    : 0;

  const slaEvaluatedTickets = scopedTickets.filter((ticket) =>
    Boolean(parseDate(ticketDateValue(ticket))),
  );

  const slaCompliant = slaEvaluatedTickets.filter((ticket) => {
    const opened = ticketDateValue(ticket);
    const end = closeDateValue(ticket) || new Date().toISOString();

    return hoursBetween(opened, end) <= getSlaTargetHours(ticket);
  }).length;

  const slaCompliance = slaEvaluatedTickets.length
    ? (slaCompliant / slaEvaluatedTickets.length) * 100
    : 100;

  const workload = tenantTechnicians
    .map((technician) => {
      const assigned = activeTickets.filter(
        (ticket) => normalize(ticket.technician) === normalize(technician),
      );
      const urgent = assigned.filter((ticket) => Boolean(ticket.urgent));
      const blocked = assigned.filter(isBlocked);
      const aging = assigned.filter(
        (ticket) => daysBetween(ticketDateValue(ticket)) >= 7,
      );

      return {
        technician,
        assigned: assigned.length,
        urgent: urgent.length,
        blocked: blocked.length,
        aging: aging.length,
        score:
          assigned.length * 10 +
          urgent.length * 20 +
          blocked.length * 16 +
          aging.length * 8,
      };
    })
    .sort((a, b) => b.score - a.score);

  const maxWorkload = Math.max(1, ...workload.map((item) => item.score));

  const saturatedTechnicians = workload.filter((item) => item.assigned >= 8);

  const customerRisk = Object.values(
    activeTickets.reduce((acc: Record<string, any>, ticket) => {
      const key =
        ticket.customerId ||
        ticket.customer_id ||
        getCustomerLabel(ticket) ||
        "Cliente n/d";

      if (!acc[key]) {
        acc[key] = {
          key,
          label: getCustomerLabel(ticket),
          open: 0,
          urgent: 0,
          blocked: 0,
          aging: 0,
          unassigned: 0,
          score: 0,
        };
      }

      acc[key].open += 1;
      if (ticket.urgent) acc[key].urgent += 1;
      if (isBlocked(ticket)) acc[key].blocked += 1;
      if (daysBetween(ticketDateValue(ticket)) >= 7) acc[key].aging += 1;
      if (!hasTechnician(ticket)) acc[key].unassigned += 1;

      acc[key].score =
        acc[key].urgent * 35 +
        acc[key].blocked * 25 +
        acc[key].aging * 12 +
        acc[key].unassigned * 8 +
        acc[key].open * 4;

      return acc;
    }, {}),
  )
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 6) as any[];

  const maxCustomerRisk = Math.max(
    1,
    ...customerRisk.map((item: any) => item.score),
  );

  const riskParts = [
    {
      label: "Ticket urgenti aperti",
      count: urgentTickets.length,
      weight: 40,
      points: urgentTickets.length * 40,
    },
    {
      label: "Ticket bloccati / in attesa",
      count: blockedTickets.length,
      weight: 25,
      points: blockedTickets.length * 25,
    },
    {
      label: "Ticket aperti oltre 7 giorni",
      count: agingTickets.length,
      weight: 8,
      points: agingTickets.length * 8,
    },
    {
      label: "Ticket senza tecnico",
      count: unassignedTickets.length,
      weight: 10,
      points: unassignedTickets.length * 10,
    },
    {
      label: "Tecnici saturi",
      count: saturatedTechnicians.length,
      weight: 30,
      points: saturatedTechnicians.length * 30,
    },
  ];

  const riskScore = riskParts.reduce((sum, item) => sum + item.points, 0);
  const riskLabel =
    riskScore >= 500 ? "Alto" : riskScore >= 220 ? "Medio" : "Controllato";
  const riskTone =
    riskScore >= 500
      ? "text-red-300"
      : riskScore >= 220
        ? "text-amber-300"
        : "text-emerald-300";

  const weeklyTrend = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date());

    return Array.from({ length: 5 }, (_, index) => {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (4 - index) * 7);

      const weekEnd = endOfWeek(new Date(weekStart));

      const count = tenantScopedTickets.filter((ticket) => {
        const parsed = parseDate(ticketDateValue(ticket));
        return parsed ? parsed >= weekStart && parsed <= weekEnd : false;
      }).length;

      return {
        label: formatWeekRange(weekStart, weekEnd),
        count,
      };
    });
  }, [tenantScopedTickets]);

  const maxTrend = Math.max(1, ...weeklyTrend.map((item) => item.count));

  const kpis = [
    {
      label: "Ticket aperti",
      value: activeTickets.length,
      detail: "Backlog operativo: tutti i non chiusi",
      icon: Clock,
      tone: "text-blue-300",
    },
    {
      label: "Da assegnare",
      value: unassignedTickets.length,
      detail: "Aperti senza tecnico assegnato",
      icon: UserCheck,
      tone: "text-amber-300",
    },
    {
      label: "Critici",
      value: urgentTickets.length + blockedTickets.length,
      detail: `${urgentTickets.length} urgenti · ${blockedTickets.length} bloccati`,
      icon: Flame,
      tone: "text-red-300",
    },
    {
      label: "SLA compliance",
      value: formatPercent(slaCompliance),
      detail: "Calcolata su aperti e chiusi",
      icon: ShieldCheck,
      tone:
        slaCompliance >= 85
          ? "text-emerald-300"
          : slaCompliance >= 65
            ? "text-amber-300"
            : "text-red-300",
    },
    {
      label: "Risoluzione media",
      value: formatDuration(avgResolutionHours),
      detail: `${closedTickets.length} ticket chiusi`,
      icon: CheckIcon,
      tone: "text-emerald-300",
    },
  ];

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
              ATLAS Intelligence
            </p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              KPI & Analytics
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Vista operativa leggibile: backlog reale, ticket da assegnare, SLA,
              saturazione tecnici, aging e rischio sistema spiegabile.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: "7", label: "7g" },
              { key: "30", label: "30g" },
              { key: "90", label: "90g" },
              { key: "all", label: "Tutto" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setRange(item.key as RangeFilter)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                  range === item.key
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {kpis.map(({ label, value, detail, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
            >
              <Icon className={`mb-3 ${tone}`} size={22} />
              <p className={`text-3xl font-black ${tone}`}>{value}</p>
              <p className="mt-1 text-sm font-black text-white">{label}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Operational risk
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">
                Rischio sistema
              </h3>
            </div>
            <AlertTriangle className={riskTone} size={26} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
            <p className={`text-5xl font-black ${riskTone}`}>{riskLabel}</p>
            <p className="mt-2 text-sm font-bold text-slate-400">
              Score operativo {riskScore}
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${Math.min(100, Math.round((riskScore / 700) * 100))}%`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-2 text-sm font-bold text-slate-300">
              {riskParts.map((part) => (
                <div
                  key={part.label}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3"
                >
                  <span>{part.label}</span>
                  <span className="shrink-0 text-white">
                    {part.count} × {part.weight} = {part.points}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-xs font-bold text-blue-100">
                La formula è visibile e auditabile: niente score magico.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Trend
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">
                Ticket per settimana
              </h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Intervalli reali, non sigle W17/W18.
              </p>
            </div>
            <LineChart className="text-blue-300" size={26} />
          </div>

          <div className="flex h-72 items-end gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            {weeklyTrend.length === 0 ? (
              <p className="text-sm font-bold text-slate-500">
                Nessun dato nel periodo selezionato.
              </p>
            ) : (
              weeklyTrend.map((item) => (
                <div
                  key={item.label}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div className="flex flex-1 items-end rounded-2xl bg-white/[0.04] p-1">
                    <div
                      className="w-full rounded-xl bg-blue-500"
                      style={{
                        height: `${Math.max(
                          8,
                          Math.round((item.count / maxTrend) * 100),
                        )}%`,
                      }}
                      title={`${item.label}: ${item.count} ticket`}
                    />
                  </div>
                  <p className="min-h-[28px] text-center text-[10px] font-black leading-tight text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-center text-xs font-black text-white">
                    {item.count}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Team analytics
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">
                Saturazione tecnici
              </h3>
            </div>
            <UserRound className="text-blue-300" size={26} />
          </div>

          <div className="grid gap-3">
            {workload.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                Nessun tecnico configurato.
              </div>
            ) : (
              workload.map((item) => (
                <div
                  key={item.technician}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {item.technician}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {item.assigned} attivi · {item.urgent} urgenti ·{" "}
                        {item.blocked} bloccati · {item.aging} oltre 7g
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                      {item.score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: barWidth(item.score, maxWorkload) }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Customer risk
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">
                Clienti più problematici
              </h3>
            </div>
            <Users className="text-violet-300" size={26} />
          </div>

          <div className="grid gap-3">
            {customerRisk.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                Nessun cliente a rischio nel periodo selezionato.
              </div>
            ) : (
              customerRisk.map((item: any) => (
                <div
                  key={item.key}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {item.label}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {item.open} aperti · {item.urgent} urgenti ·{" "}
                        {item.blocked} bloccati · {item.aging} aging ·{" "}
                        {item.unassigned} senza tecnico
                      </p>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-200">
                      {item.score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: barWidth(item.score, maxCustomerRisk) }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-1 text-blue-300" size={22} />
          <div>
            <p className="text-sm font-black text-white">KPI Engine V2 attivo</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Corretto: backlog ≠ da assegnare, trend con date leggibili,
              rischio operativo spiegato per componenti, SLA su aperti e chiusi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon(props: any) {
  return <BarChart3 {...props} />;
}
