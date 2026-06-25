import { BarChart3, Gauge, ShieldAlert, Users } from "lucide-react";
import ExecutiveGlassCard from "./ExecutiveGlassCard";
import ExecutiveMetricCard from "./ExecutiveMetricCard";
import ExecutiveRiskRadar from "./ExecutiveRiskRadar";

const weekly = [78, 64, 61, 50, 45, 54];
const techLoad = [
  ["Tecnico Demo A", "92%", "w-[92%]", "bg-rose-300/70"],
  ["Tecnico Demo B", "78%", "w-[78%]", "bg-amber-300/70"],
  ["Tecnico Demo C", "65%", "w-[65%]", "bg-cyan-300/70"],
  ["Tecnico Demo D", "48%", "w-[48%]", "bg-emerald-300/70"],
  ["Tecnico Demo E", "30%", "w-[30%]", "bg-blue-300/70"],
];

const criticalClients = [
  ["Cliente Demo Alfa", "7 criticita", "920"],
  ["Cliente Demo Beta", "4 criticita", "820"],
  ["Cliente Demo Gamma", "3 criticita", "610"],
  ["Cliente Demo Delta", "2 criticita", "540"],
];

export default function ExecutiveAnalytics() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["7g", "30g", "90g", "Tutto"].map((range) => (
            <button
              key={range}
              className={`rounded-full border px-4 py-2 text-xs font-black ${
                range === "30g"
                  ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.045] text-slate-400"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <p className="text-xs font-bold text-slate-500">Dati demo neutrali - Design Lab isolato</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <ExecutiveMetricCard label="Ticket aperti" value="54" detail="Scenario demo" tone="cyan" trend="+8" />
        <ExecutiveMetricCard label="Da assegnare" value="32" detail="Demo senza tecnico" tone="gold" trend="+4" />
        <ExecutiveMetricCard label="Critici" value="3" detail="Demo urgenti" tone="red" trend="+1" />
        <ExecutiveMetricCard label="SLA compliance" value="92%" detail="Ultimi 30 giorni demo" tone="green" trend="+2" />
        <ExecutiveMetricCard label="Risoluzione media" value="2.8g" detail="30 ticket demo chiusi" tone="blue" trend="-0.4" />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[0.8fr_1.2fr_0.8fr]">
        <ExecutiveGlassCard title="Risk Overview" eyebrow="Mission Risk">
          <ExecutiveRiskRadar />
        </ExecutiveGlassCard>

        <ExecutiveGlassCard title="Trend Ticket" eyebrow="Ultime 6 settimane">
          <div className="relative h-72 overflow-hidden rounded-[26px] border border-white/10 bg-black/20 p-5">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />
            <div className="relative z-10 flex h-full items-end gap-4">
              {weekly.map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <span className="text-xs font-black text-white">{value}</span>
                  <div className="flex h-48 w-full items-end rounded-t-2xl bg-white/[0.035]">
                    <div
                      className="w-full rounded-t-2xl bg-cyan-300/50 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
                      style={{ height: `${value}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">W{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </ExecutiveGlassCard>

        <ExecutiveGlassCard title="Technician Load" eyebrow="Saturazione">
          <div className="space-y-4">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-center shadow-[0_0_55px_rgba(251,191,36,0.10)]">
              <div>
                <p className="text-4xl font-black text-white">72%</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/55">media</p>
              </div>
            </div>
            {techLoad.map(([name, value, width, color]) => (
              <div key={name}>
                <div className="mb-2 flex justify-between text-xs font-black">
                  <span className="text-slate-400">{name}</span>
                  <span className="text-white">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/35">
                  <div className={`${width} ${color} h-full rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </ExecutiveGlassCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
        <ExecutiveGlassCard title="Critical Clients" eyebrow="Clienti demo">
          <div className="space-y-3">
            {criticalClients.map(([name, detail, score]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div>
                  <p className="text-sm font-black text-white">{name}</p>
                  <p className="text-xs font-semibold text-slate-500">{detail}</p>
                </div>
                <span className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm font-black text-rose-100">{score}</span>
              </div>
            ))}
          </div>
        </ExecutiveGlassCard>

        <ExecutiveGlassCard title="Priority Distribution" eyebrow="Ticket demo">
          <div className="grid gap-4 md:grid-cols-[150px_1fr] md:items-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-cyan-300/35 bg-black/20 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
              <div className="absolute inset-[-18px] rounded-full border-r-[18px] border-t-[18px] border-rose-300/65" />
              <p className="text-3xl font-black text-white">54</p>
            </div>
            <div className="space-y-3">
              {[
                ["Critici", "3", "bg-rose-300"],
                ["Alti", "12", "bg-amber-300"],
                ["Medi", "24", "bg-cyan-300"],
                ["Bassi", "15", "bg-emerald-300"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between text-sm font-black">
                  <span className="flex items-center gap-2 text-slate-400"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </ExecutiveGlassCard>

        <ExecutiveGlassCard title="SLA Compliance" eyebrow="Performance demo">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                <Gauge size={24} />
              </div>
              <div>
                <p className="text-4xl font-black text-white">92%</p>
                <p className="text-xs font-bold text-slate-500">Ultimi 30 giorni demo</p>
              </div>
            </div>
            <div className="h-28 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex h-full items-end gap-2">
                {[72, 80, 85, 88, 92, 90, 94].map((value, index) => (
                  <div key={index} className="flex-1 rounded-t-xl bg-emerald-300/45" style={{ height: `${value}%` }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [BarChart3, "Trend", "+6%"],
                [Users, "Team", "5"],
                [ShieldAlert, "Risk", "Medio"],
              ].map(([Icon, label, value]) => {
                const StatIcon = Icon as typeof BarChart3;
                return (
                  <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <StatIcon size={15} className="mx-auto mb-1 text-cyan-100" />
                    <p className="text-sm font-black text-white">{value as string}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </ExecutiveGlassCard>
      </div>
    </div>
  );
}
