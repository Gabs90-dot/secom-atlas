"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Cpu,
  Flame,
  Lightbulb,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { calculateAISummary, generateAIInsights, type AtlasAIInsight } from "@/lib/aiEngine";

type AIInsightsPanelProps = {
  tickets: any[];
  customers?: any[];
  sites?: any[];
  technicians: string[];
};

const typeLabels: Record<string, string> = {
  all: "Tutti",
  priority: "Priorità",
  dispatch: "Dispatch",
  sla: "SLA",
  customer_risk: "Clienti",
  anomaly: "Anomalie",
  operations: "Sistema",
};

function severityTone(severity: AtlasAIInsight["severity"]) {
  if (severity === "critical") return "border-red-500/30 bg-red-500/15 text-red-200";
  if (severity === "warning") return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (severity === "success") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  return "border-blue-500/30 bg-blue-500/15 text-blue-200";
}

function severityIcon(severity: AtlasAIInsight["severity"]) {
  if (severity === "critical") return Flame;
  if (severity === "warning") return ShieldAlert;
  if (severity === "success") return CheckCircle2;
  return Lightbulb;
}

function typeIcon(type: AtlasAIInsight["type"]) {
  if (type === "priority") return AlertTriangle;
  if (type === "dispatch") return Users;
  if (type === "sla") return Radar;
  if (type === "customer_risk") return ShieldAlert;
  if (type === "anomaly") return Cpu;
  return Sparkles;
}

export default function AIInsightsPanel({ tickets, customers = [], sites = [], technicians }: AIInsightsPanelProps) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const insights = useMemo(
    () => generateAIInsights({ tickets, customers, sites, technicians }),
    [tickets, customers, sites, technicians]
  );

  const summary = useMemo(() => calculateAISummary(insights), [insights]);

  const filteredInsights = useMemo(() => {
    const q = query.toLowerCase().trim();
    return insights.filter((insight) => {
      const matchesFilter = filter === "all" || insight.type === filter;
      const matchesQuery =
        !q ||
        `${insight.title} ${insight.description} ${insight.recommendation} ${insight.evidence.join(" ")}`
          .toLowerCase()
          .includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [insights, filter, query]);

  const topInsight = insights[0];

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ATLAS AI Operations</p>
            <h2 className="mt-3 flex items-center gap-3 text-3xl font-black text-white md:text-5xl">
              <Brain className="text-blue-300" size={38} />
              AI Insights Engine
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Analisi automatica deterministica su ticket, workload, aging, rischio cliente e anomalie operative.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-right">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Stato AI</p>
            <p className={`mt-2 text-3xl font-black ${summary.critical > 0 ? "text-red-300" : summary.warning > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              {summary.label}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">{summary.total} insight · score {summary.avgScore}/100</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Flame className="mb-3 text-red-300" size={22} />
            <p className="text-3xl font-black text-white">{summary.critical}</p>
            <p className="text-sm font-bold text-slate-400">Critici</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <ShieldAlert className="mb-3 text-amber-300" size={22} />
            <p className="text-3xl font-black text-white">{summary.warning}</p>
            <p className="text-sm font-bold text-slate-400">Warning</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Sparkles className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{summary.total}</p>
            <p className="text-sm font-bold text-slate-400">Insight generati</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Cpu className="mb-3 text-violet-300" size={22} />
            <p className="text-3xl font-black text-white">V1</p>
            <p className="text-sm font-bold text-slate-400">No API esterne</p>
          </div>
        </div>
      </div>

      {topInsight && (
        <div className={`rounded-[2rem] border p-5 ${severityTone(topInsight.severity)}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] opacity-80">Insight prioritario</p>
              <h3 className="mt-2 text-2xl font-black text-white">{topInsight.title}</h3>
              <p className="mt-2 text-sm font-bold text-slate-200">{topInsight.description}</p>
            </div>
            <span className="rounded-full bg-black/25 px-4 py-2 text-xs font-black uppercase text-white">
              score {topInsight.score}/100
            </span>
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-black text-white">Azione suggerita</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{topInsight.recommendation}</p>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">AI Control Room</p>
            <h3 className="mt-1 text-2xl font-black text-white">Insight operativi</h3>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 md:w-80">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca insight..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs font-black text-white outline-none"
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filteredInsights.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
              Nessun insight trovato con questi filtri.
            </div>
          ) : (
            filteredInsights.map((insight) => {
              const SeverityIcon = severityIcon(insight.severity);
              const TypeIcon = typeIcon(insight.type);

              return (
                <div key={insight.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-blue-500/40 hover:bg-blue-500/10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase ${severityTone(insight.severity)}`}>
                          <SeverityIcon size={13} />
                          {insight.severity}
                        </span>
                        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-slate-300">
                          <TypeIcon size={13} />
                          {typeLabels[insight.type] || insight.type}
                        </span>
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-black text-blue-200">
                          score {insight.score}/100
                        </span>
                      </div>

                      <h4 className="mt-3 text-lg font-black text-white">{insight.title}</h4>
                      <p className="mt-1 text-sm font-bold text-slate-400">{insight.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Evidenze</p>
                      <div className="mt-2 grid gap-1">
                        {insight.evidence.map((item) => (
                          <p key={item} className="text-xs font-bold text-slate-300">• {item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-blue-300">Raccomandazione</p>
                      <p className="mt-2 text-xs font-bold text-slate-200">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
