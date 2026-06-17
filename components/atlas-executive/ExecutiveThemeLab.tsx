"use client";

import { useState } from "react";
import { CheckCircle2, MonitorCog, RotateCcw, Sparkles } from "lucide-react";
import ExecutiveAnalytics from "./ExecutiveAnalytics";
import ExecutiveDashboard from "./ExecutiveDashboard";
import ExecutiveShell from "./ExecutiveShell";
import ExecutiveWebvime from "./ExecutiveWebvime";

type ExecutiveView = "dashboard" | "analytics" | "webvime";
type UiMode = "classic" | "executive";

type ExecutiveThemeLabProps = {
  uiMode?: UiMode;
  onUiModeChange?: (mode: UiMode) => void;
};

export default function ExecutiveThemeLab({ uiMode = "classic", onUiModeChange }: ExecutiveThemeLabProps) {
  const [view, setView] = useState<ExecutiveView>("dashboard");
  const executiveActive = uiMode === "executive";

  return (
    <ExecutiveShell view={view} onViewChange={setView}>
      <div className="mb-5 flex flex-col gap-3 rounded-[26px] border border-cyan-300/10 bg-white/[0.055] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles size={13} /> Design Lab
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                executiveActive
                  ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                  : "border-amber-200/25 bg-amber-300/10 text-amber-100"
              }`}
            >
              <CheckCircle2 size={13} /> {executiveActive ? "Executive attivo" : "Classic attivo"}
            </span>
          </div>
          <p className="text-sm font-semibold leading-6 text-slate-400">
            Qui provi il tema e lo attivi davvero. Classic resta sempre recuperabile.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onUiModeChange?.("executive")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
              executiveActive
                ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-50 shadow-[0_0_28px_rgba(16,185,129,0.16)]"
                : "border-cyan-300/20 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/15"
            }`}
          >
            <MonitorCog size={17} /> Attiva Executive
          </button>
          <button
            type="button"
            onClick={() => onUiModeChange?.("classic")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.09]"
          >
            <RotateCcw size={17} /> Torna Classic
          </button>
        </div>
      </div>

      {view === "dashboard" && <ExecutiveDashboard />}
      {view === "analytics" && <ExecutiveAnalytics />}
      {view === "webvime" && <ExecutiveWebvime />}
    </ExecutiveShell>
  );
}
