type ExecutiveRiskRadarProps = {
  score?: number;
  label?: string;
  metrics?: Array<{ label: string; value: string; percent: number; tone?: "cyan" | "green" | "gold" | "red" }>;
};

const toneMap = {
  cyan: "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.30)]",
  green: "bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.30)]",
  gold: "bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.30)]",
  red: "bg-rose-300 shadow-[0_0_18px_rgba(253,164,175,0.30)]",
};

export default function ExecutiveRiskRadar({
  score = 54,
  label = "MEDIO",
  metrics = [
    { label: "SLA", value: "92%", percent: 92, tone: "green" },
    { label: "Backlog", value: "54", percent: 64, tone: "cyan" },
    { label: "Critici", value: "3", percent: 28, tone: "red" },
    { label: "Aging", value: "7g", percent: 42, tone: "gold" },
  ],
}: ExecutiveRiskRadarProps) {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="relative mx-auto flex h-52 w-52 max-w-full items-center justify-center overflow-hidden rounded-full border border-cyan-300/10 bg-cyan-400/5 shadow-[0_0_85px_rgba(34,211,238,0.14)] md:h-56 md:w-56">
        <div className="absolute inset-4 rounded-full border border-cyan-300/15" />
        <div className="absolute inset-9 rounded-full border border-amber-300/20 shadow-[0_0_45px_rgba(251,191,36,0.10)]" />
        <div className="absolute h-[76%] w-[76%] rounded-[42%_58%_45%_55%] border border-amber-200/28 bg-amber-300/10 shadow-[0_0_48px_rgba(251,191,36,0.16)]" />
        <div className="absolute h-[54%] w-[54%] rounded-full bg-emerald-300/12 blur-sm" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.10),transparent_62%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 100 100">
          <path d="M50 8 V92 M8 50 H92" stroke="rgba(34,211,238,0.18)" strokeWidth="0.7" />
          <path d="M50 18 C68 22 79 36 76 54 C73 72 59 82 43 76 C25 69 20 51 29 35 C34 26 41 20 50 18Z" fill="rgba(251,191,36,0.16)" stroke="rgba(251,191,36,0.50)" strokeWidth="0.8" />
          <path d="M50 27 C62 29 70 39 68 52 C66 65 56 71 45 67 C32 62 30 50 35 39 C39 32 44 28 50 27Z" fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.35)" strokeWidth="0.7" />
        </svg>
        <div className="relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-100/70">Risk</p>
          <p className="text-3xl font-black text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]">{label}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">Score {score}</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="shrink-0 text-xs font-black text-white">{metric.value}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/30">
              <div className={`h-full rounded-full ${toneMap[metric.tone || "cyan"]}`} style={{ width: `${Math.min(Math.max(metric.percent, 0), 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
