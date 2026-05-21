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
  UserRound,
  Users,
} from "lucide-react";

type KPIDashboardProps = {
  tickets: any[];
  technicians: string[];
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

function ticketDateValue(ticket: any) {
  return ticket.openedAt || ticket.opened_at || ticket.created_at || ticket.date || ticket.intervention_date || "";
}

function closeDateValue(ticket: any) {
  return ticket.closedAt || ticket.closed_at || "";
}

function plannedDateValue(ticket: any) {
  return ticket.date || ticket.intervention_date || "";
}

function isClosed(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("chiuso") || status.includes("validato") || status.includes("risolto");
}

function isBlocked(ticket: any) {
  const status = normalize(ticket.status);
  return status.includes("bloccato") || status.includes("attesa");
}

function daysBetween(start?: string | null, end?: string | null) {
  if (!start) return 0;
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  if (!a || !b || Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.min(100, Math.max(4, Math.round((value / max) * 100)))}%`;
}

function getWeekKey(raw: string) {
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return "n/d";
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `W${String(weekNo).padStart(2, "0")}`;
}

export default function KPIDashboard({ tickets, technicians }: KPIDashboardProps) {
  const [range, setRange] = useState<RangeFilter>("30");

  const scopedTickets = useMemo(() => {
    if (range === "all") return tickets;
    const days = Number(range);
    const from = Date.now() - days * 86400000;
    return tickets.filter((ticket) => {
      const raw = ticketDateValue(ticket);
      const time = raw ? new Date(raw).getTime() : 0;
      return time >= from;
    });
  }, [tickets, range]);

  const activeTickets = scopedTickets.filter((ticket) => !isClosed(ticket));
  const closedTickets = scopedTickets.filter(isClosed);
  const urgentTickets = activeTickets.filter((ticket) => Boolean(ticket.urgent));
  const blockedTickets = activeTickets.filter(isBlocked);
  const agingTickets = activeTickets.filter((ticket) => daysBetween(ticketDateValue(ticket)) >= 7);
  const scheduledTickets = activeTickets.filter((ticket) => Boolean(plannedDateValue(ticket)));
  const unassignedTickets = activeTickets.filter((ticket) => !ticket.technician);

  const avgResolutionDays = closedTickets.length
    ? closedTickets.reduce((sum, ticket) => sum + daysBetween(ticketDateValue(ticket), closeDateValue(ticket)), 0) / closedTickets.length
    : 0;

  const slaTargetHours = 48;
  const slaCompliant = closedTickets.filter((ticket) => daysBetween(ticketDateValue(ticket), closeDateValue(ticket)) * 24 <= slaTargetHours).length;
  const slaCompliance = closedTickets.length ? (slaCompliant / closedTickets.length) * 100 : 100;

  const riskScore = urgentTickets.length * 18 + blockedTickets.length * 14 + agingTickets.length * 8 + unassignedTickets.length * 5;
  const riskLabel = riskScore >= 80 ? "Alto" : riskScore >= 35 ? "Medio" : "Controllato";
  const riskTone = riskScore >= 80 ? "text-red-300" : riskScore >= 35 ? "text-amber-300" : "text-emerald-300";

  const workload = technicians.map((technician) => {
    const assigned = activeTickets.filter((ticket) => normalize(ticket.technician) === normalize(technician));
    const urgent = assigned.filter((ticket) => Boolean(ticket.urgent));
    const blocked = assigned.filter(isBlocked);
    return {
      technician,
      assigned: assigned.length,
      urgent: urgent.length,
      blocked: blocked.length,
      score: assigned.length * 12 + urgent.length * 10 + blocked.length * 8,
    };
  }).sort((a, b) => b.score - a.score);

  const maxWorkload = Math.max(1, ...workload.map((item) => item.score));

  const customerRisk = Object.values(
    activeTickets.reduce((acc: Record<string, any>, ticket) => {
      const key = ticket.customerId || ticket.customer_id || ticket.site || "Cliente n/d";
      if (!acc[key]) {
        acc[key] = {
          key,
          label: ticket.site || ticket.entity || "Cliente n/d",
          open: 0,
          urgent: 0,
          blocked: 0,
          aging: 0,
          score: 0,
        };
      }
      acc[key].open += 1;
      if (ticket.urgent) acc[key].urgent += 1;
      if (isBlocked(ticket)) acc[key].blocked += 1;
      if (daysBetween(ticketDateValue(ticket)) >= 7) acc[key].aging += 1;
      acc[key].score = acc[key].urgent * 25 + acc[key].blocked * 18 + acc[key].aging * 10 + acc[key].open * 4;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.score - a.score).slice(0, 6) as any[];

  const maxCustomerRisk = Math.max(1, ...customerRisk.map((item: any) => item.score));

  const weeklyTrendMap = scopedTickets.reduce((acc: Record<string, number>, ticket) => {
    const key = getWeekKey(ticketDateValue(ticket));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const weeklyTrend = Object.entries(weeklyTrendMap)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8);
  const maxTrend = Math.max(1, ...weeklyTrend.map((item) => item.count));

  const kpis = [
    {
      label: "Backlog attivo",
      value: activeTickets.length,
      detail: `${unassignedTickets.length} da assegnare`,
      icon: Clock,
      tone: "text-blue-300",
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
      detail: `Target base ${slaTargetHours}h`,
      icon: ShieldCheck,
      tone: slaCompliance >= 85 ? "text-emerald-300" : slaCompliance >= 65 ? "text-amber-300" : "text-red-300",
    },
    {
      label: "Risoluzione media",
      value: `${avgResolutionDays.toFixed(1)}g`,
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
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">ATLAS Intelligence</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">KPI & Analytics</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Vista manageriale per backlog, SLA, saturazione tecnici, aging e clienti a rischio.
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

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {kpis.map(({ label, value, detail, icon: Icon, tone }) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
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
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Operational risk</p>
              <h3 className="mt-1 text-2xl font-black text-white">Rischio sistema</h3>
            </div>
            <AlertTriangle className={riskTone} size={26} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
            <p className={`text-5xl font-black ${riskTone}`}>{riskLabel}</p>
            <p className="mt-2 text-sm font-bold text-slate-400">Score operativo {riskScore}</p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, riskScore)}%` }} />
            </div>
            <div className="mt-5 grid gap-2 text-sm font-bold text-slate-300">
              <p>• {urgentTickets.length} ticket urgenti attivi</p>
              <p>• {blockedTickets.length} ticket bloccati o in attesa</p>
              <p>• {agingTickets.length} ticket aperti da oltre 7 giorni</p>
              <p>• {scheduledTickets.length} ticket pianificati</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Trend</p>
              <h3 className="mt-1 text-2xl font-black text-white">Ticket per settimana</h3>
            </div>
            <LineChart className="text-blue-300" size={26} />
          </div>

          <div className="flex h-72 items-end gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            {weeklyTrend.length === 0 ? (
              <p className="text-sm font-bold text-slate-500">Nessun dato nel periodo selezionato.</p>
            ) : (
              weeklyTrend.map((item) => (
                <div key={item.week} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end rounded-2xl bg-white/[0.04] p-1">
                    <div className="w-full rounded-xl bg-blue-500" style={{ height: `${Math.max(8, Math.round((item.count / maxTrend) * 100))}%` }} />
                  </div>
                  <p className="text-center text-[10px] font-black text-slate-500">{item.week}</p>
                  <p className="text-center text-xs font-black text-white">{item.count}</p>
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
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Team analytics</p>
              <h3 className="mt-1 text-2xl font-black text-white">Saturazione tecnici</h3>
            </div>
            <UserRound className="text-blue-300" size={26} />
          </div>

          <div className="grid gap-3">
            {workload.map((item) => (
              <div key={item.technician} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{item.technician}</p>
                    <p className="text-xs font-bold text-slate-500">{item.assigned} attivi · {item.urgent} urgenti · {item.blocked} bloccati</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{item.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: barWidth(item.score, maxWorkload) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Customer risk</p>
              <h3 className="mt-1 text-2xl font-black text-white">Clienti più problematici</h3>
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
                <div key={item.key} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{item.label}</p>
                      <p className="text-xs font-bold text-slate-500">{item.open} aperti · {item.urgent} urgenti · {item.blocked} bloccati · {item.aging} aging</p>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-200">{item.score}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-red-500" style={{ width: barWidth(item.score, maxCustomerRisk) }} />
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
            <p className="text-sm font-black text-white">KPI Engine V1 attivo</p>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Prossima evoluzione: KPI storicizzati su tabella eventi, SLA reale per contratto e alert predittivi.
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
