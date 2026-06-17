import { Brain, ChevronRight, Sparkles } from "lucide-react";

const suggestions = [
  ["Assegna 5 ticket senza tecnico", "Priorità media"],
  ["Verifica SLA in scadenza", "3 casi"],
  ["Rivedi procedure Webvime Roma", "Suggerito"],
];

export default function ExecutiveCopilotPanel() {
  return (
    <aside className="relative overflow-hidden rounded-[30px] border border-amber-200/12 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_36%)]" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
            <Brain size={21} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100/60">ATLAS Copilot</p>
            <h3 className="text-lg font-black text-white">Intelligence laterale</h3>
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-300/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-100">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Insight prioritario</span>
          </div>
          <p className="text-sm font-semibold leading-6 text-slate-300">
            Incremento ticket critici del 15% negli ultimi 7 giorni. Possibile saturazione su Webvime e sedi Lazio.
          </p>
          <button className="mt-4 flex items-center gap-2 text-xs font-black text-cyan-100">
            Analizza trend <ChevronRight size={15} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Azioni suggerite</p>
          {suggestions.map(([title, tag]) => (
            <button
              key={title}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left hover:border-amber-200/20 hover:bg-amber-300/10"
            >
              <span>
                <span className="block text-sm font-black text-white">{title}</span>
                <span className="text-xs font-semibold text-slate-500">{tag}</span>
              </span>
              <ChevronRight size={15} className="text-slate-400" />
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-slate-400">
          Chiedi ad ATLAS Copilot...
        </div>
      </div>
    </aside>
  );
}
