export const atlasDesign = {
  colors: {
    background: {
      dark: "bg-[#07111f]",
      panel: "bg-[#081523]",
      elevated: "bg-white/[0.055]",
      subtle: "bg-white/[0.04]",
      input: "bg-slate-950/70",
    },
    border: {
      default: "border-white/10",
      blue: "border-blue-500/30",
      red: "border-red-500/30",
      amber: "border-amber-500/30",
      emerald: "border-emerald-500/30",
      violet: "border-violet-500/30",
    },
    text: {
      strong: "text-white",
      muted: "text-slate-400",
      faint: "text-slate-500",
      blue: "text-blue-300",
      red: "text-red-300",
      amber: "text-amber-300",
      emerald: "text-emerald-300",
      violet: "text-violet-300",
    },
  },

  radius: {
    sm: "rounded-xl",
    md: "rounded-2xl",
    lg: "rounded-3xl",
    xl: "rounded-[2rem]",
  },

  shadow: {
    soft: "shadow-xl shadow-black/20",
    deep: "shadow-2xl shadow-black/30",
    blue: "shadow-lg shadow-blue-950/40",
  },

  card: {
    base: "rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/20 md:p-6",
    compact: "rounded-3xl border border-white/10 bg-white/[0.04] p-4",
    action: "rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50",
    danger: "rounded-3xl border border-red-500/30 bg-red-500/10 p-4",
    success: "rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4",
    warning: "rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4",
  },

  button: {
    primary: "rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 disabled:opacity-60",
    secondary: "rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.12] disabled:opacity-60",
    danger: "rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60",
    ghost: "rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15",
  },

  input: {
    base: "rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-400",
    compact: "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-400",
  },

  badge: {
    default: "rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-300",
    blue: "rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200",
    red: "rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-black text-red-200",
    amber: "rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-200",
    emerald: "rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-200",
    violet: "rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-200",
  },

  typography: {
    eyebrow: "text-xs font-black uppercase tracking-[0.28em] text-blue-300",
    title: "text-2xl font-black text-white md:text-4xl",
    sectionTitle: "text-xl font-black text-white md:text-2xl",
    body: "text-sm font-bold text-slate-400",
    metric: "text-3xl font-black text-white md:text-4xl",
  },
};

export type AtlasTone = "default" | "blue" | "red" | "amber" | "emerald" | "violet";

export function atlasToneClasses(tone: AtlasTone = "default") {
  return atlasDesign.badge[tone] || atlasDesign.badge.default;
}

export function atlasStatusTone(status: any, urgent?: boolean): AtlasTone {
  const value = String(status || "").toLowerCase();

  if (urgent) return "red";
  if (value.includes("chiuso") || value.includes("validato") || value.includes("risolto")) return "emerald";
  if (value.includes("bloccato")) return "red";
  if (value.includes("attesa") || value.includes("sospeso")) return "amber";
  if (value.includes("pian") || value.includes("assegnato") || value.includes("carico") || value.includes("lavorazione")) return "blue";

  return "default";
}
