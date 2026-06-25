import { CornerDownLeft, Search } from "lucide-react";

type ExecutiveCommandBarProps = {
  compact?: boolean;
  placeholder?: string;
  glpiEnabled?: boolean;
};

export default function ExecutiveCommandBar({
  compact = false,
  placeholder = "Cerca cliente, sede, ticket, contratto o asset...",
  glpiEnabled = true,
}: ExecutiveCommandBarProps) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/15 bg-slate-950/55 p-5 shadow-[0_24px_80px_rgba(8,47,73,0.25)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_90%_100%,rgba(212,175,55,0.11),transparent_35%)]" />
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <Search size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/60">Command Bar</p>
          <p className={`${compact ? "text-lg" : "text-xl md:text-2xl"} truncate font-black text-white`}>
            {placeholder}
          </p>
          {!compact && (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {glpiEnabled
                ? "Esempi: Casoria · GLPI #2059045627 · SLA critici · Webvime Roma"
                : "Esempi: Casoria · ATLAS #1024 · SLA critici · Webvime Roma"}
            </p>
          )}
        </div>
        <button className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white hover:border-cyan-300/30 hover:bg-cyan-400/10">
          Esegui <CornerDownLeft size={16} />
        </button>
      </div>
    </div>
  );
}
