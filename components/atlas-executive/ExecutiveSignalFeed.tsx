import { ChevronRight, Clock, Radio } from "lucide-react";

type SignalItem = {
  id?: string | number;
  time?: string;
  level?: "CRITICO" | "ALTA" | "INFO" | "CHIUSO";
  title: string;
  meta?: string;
  status?: string;
  onClick?: () => void;
};

type ExecutiveSignalFeedProps = {
  items?: SignalItem[];
  emptyLabel?: string;
};

const levelClass = {
  CRITICO: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  ALTA: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  INFO: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
  CHIUSO: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
};

export default function ExecutiveSignalFeed({ items = [], emptyLabel = "Nessuna attività reale disponibile." }: ExecutiveSignalFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5 text-sm font-bold text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 6).map((signal, index) => {
        const level = signal.level || "INFO";
        const clickable = Boolean(signal.onClick);
        return (
          <div
            key={`${signal.id || index}-${signal.title}`}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={signal.onClick}
            onKeyDown={(event) => {
              if (!clickable || !signal.onClick) return;
              if (event.key === "Enter" || event.key === " ") signal.onClick();
            }}
            className={`group grid w-full gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.055] md:grid-cols-[74px_1fr_auto] md:items-center ${clickable ? "cursor-pointer" : ""}`}
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={15} />
              <span className="text-sm font-black text-white">{signal.time || "—"}</span>
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.15em] ${levelClass[level]}`}>
                  {level}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/55">
                  <Radio size={12} /> Reale
                </span>
              </div>
              <p className="truncate text-sm font-black text-white">{signal.title}</p>
              {signal.meta && <p className="mt-1 truncate text-xs font-semibold text-slate-400">{signal.meta}</p>}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black text-slate-300 transition group-hover:border-cyan-300/25 group-hover:text-cyan-100">
              {signal.status || "Apri"} <ChevronRight size={15} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
