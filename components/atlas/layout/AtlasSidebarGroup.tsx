"use client";

import type { DragEvent } from "react";

type SidebarItem = {
  key: string;
  label: string;
  icon: any;
  badge?: number;
};

type AtlasSidebarGroupProps = {
  title: string;
  items: SidebarItem[];
  activeTab: string;
  theme: string;
  isExecutiveMode: boolean;
  draggingTab: string | null;
  onTabChange: (key: string) => void;
  onDragStart: (key: string, event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (key: string, event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (key: string, event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

export default function AtlasSidebarGroup({
  title,
  items,
  activeTab,
  theme,
  isExecutiveMode,
  draggingTab,
  onTabChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: AtlasSidebarGroupProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
        {title}
      </p>

      {items.map(({ key, label, icon: Icon, badge }) => {
        const isDraggingThisTab = draggingTab === key;
        const active = activeTab === key;

        return (
          <button
            key={key}
            draggable
            title="Tieni cliccato e trascina per riordinare il menu"
            onClick={() => onTabChange(key)}
            onDragStart={(event) => onDragStart(key, event)}
            onDragOver={(event) => onDragOver(key, event)}
            onDrop={(event) => onDrop(key, event)}
            onDragEnd={onDragEnd}
            className={`relative flex w-full cursor-grab items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all duration-300 active:cursor-grabbing ${
              isDraggingThisTab ? "scale-[0.985] opacity-55 ring-2 ring-amber-200/45" : ""
            } ${
              active
                ? isExecutiveMode
                  ? "border-amber-200/75 bg-[linear-gradient(90deg,rgba(251,191,36,0.18),rgba(34,211,238,0.07),rgba(255,255,255,0.025))] text-white shadow-[inset_0_0_0_1px_rgba(251,191,36,0.28),inset_0_0_28px_rgba(251,191,36,0.06),0_0_34px_rgba(251,191,36,0.32)]"
                  : theme === "dark"
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.14),0_0_22px_rgba(34,197,94,0.18)]"
                    : "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : isExecutiveMode
                  ? "border-white/10 bg-white/[0.018] text-slate-300 hover:border-amber-300/45 hover:bg-[linear-gradient(90deg,rgba(251,191,36,0.10),rgba(34,211,238,0.035))] hover:text-white hover:shadow-[inset_0_0_20px_rgba(251,191,36,0.12)]"
                  : theme === "dark"
                    ? "border-white/10 bg-white/[0.025] text-slate-300 hover:border-emerald-400/55 hover:bg-emerald-500/10 hover:text-emerald-50"
                    : "border-slate-300 bg-white text-slate-900 shadow-sm shadow-slate-200/70 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Icon className="relative z-10" size={18} />
            <span className="relative z-10 min-w-0 flex-1">{label}</span>
            {Number(badge || 0) > 0 && (
              <span className="relative z-10 ml-auto min-w-5 rounded-full bg-red-600 px-2 py-0.5 text-center text-[10px] font-black text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
