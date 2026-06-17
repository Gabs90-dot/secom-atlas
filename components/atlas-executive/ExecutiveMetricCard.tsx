import { ArrowUpRight, Minus } from "lucide-react";

type ExecutiveMetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  tone?: "cyan" | "gold" | "green" | "red" | "blue";
  trend?: string;
  sparkline?: number[];
  onClick?: () => void;
};

const toneMap = {
  cyan: "from-cyan-400/24 to-cyan-500/5 text-cyan-200 border-cyan-300/20 shadow-cyan-950/20",
  gold: "from-amber-300/24 to-amber-500/5 text-amber-200 border-amber-200/20 shadow-amber-950/20",
  green: "from-emerald-400/24 to-emerald-500/5 text-emerald-200 border-emerald-300/20 shadow-emerald-950/20",
  red: "from-rose-400/24 to-rose-500/5 text-rose-200 border-rose-300/20 shadow-rose-950/20",
  blue: "from-blue-400/24 to-blue-500/5 text-blue-200 border-blue-300/20 shadow-blue-950/20",
};

const strokeMap = {
  cyan: "rgba(34,211,238,0.86)",
  gold: "rgba(251,191,36,0.86)",
  green: "rgba(52,211,153,0.86)",
  red: "rgba(251,113,133,0.86)",
  blue: "rgba(96,165,250,0.86)",
};

function buildPath(values: number[]) {
  const series = values.length > 1 ? values : [12, 18, 16, 24, 22, 31, 29, 36];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, 1);
  return series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 100;
      const y = 34 - ((value - min) / range) * 26;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function ExecutiveMetricCard({
  label,
  value,
  detail,
  tone = "cyan",
  trend,
  sparkline = [],
  onClick,
}: ExecutiveMetricCardProps) {
  const path = buildPath(sparkline);
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      className={`group relative overflow-hidden rounded-[26px] border bg-gradient-to-br p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-300 ${toneMap[tone]} ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_0_36px_rgba(34,211,238,0.15)]" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.13),transparent_35%,rgba(255,255,255,0.04))] opacity-75" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-current opacity-10 blur-2xl transition group-hover:opacity-20" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/48">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-1 text-xs font-semibold text-white/58">{detail}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white/80 transition group-hover:bg-white/15">
          {trend || onClick ? <ArrowUpRight size={18} /> : <Minus size={18} />}
        </div>
      </div>

      <div className="relative z-10 mt-4 h-10 overflow-hidden rounded-2xl bg-black/22">
        <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={`metricFill-${label.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeMap[tone]} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeMap[tone]} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L100 38 L0 38 Z`} fill={`url(#metricFill-${label.replace(/\s+/g, "-")})`} />
          <path d={path} fill="none" stroke={strokeMap[tone]} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-px bg-current opacity-20" />
      </div>
    </div>
  );
}
