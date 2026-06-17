"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Home,
  Layers,
  Map,
  Radio,
  RotateCcw,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

type ExecutiveView = "dashboard" | "analytics" | "webvime";

type ExecutiveSidebarProps = {
  view: ExecutiveView;
  onViewChange: (view: ExecutiveView) => void;
};

type SidebarItemId =
  | "dashboard"
  | "analytics"
  | "webvime"
  | "clients"
  | "contracts"
  | "calendar"
  | "map"
  | "risk"
  | "procedures"
  | "settings";

type SidebarItem = {
  id: SidebarItemId;
  label: string;
  section: "Mission Control" | "Modules Preview";
  icon: any;
  view?: ExecutiveView;
};

type SidebarLayout = {
  order: SidebarItemId[];
  hidden: SidebarItemId[];
};

const STORAGE_KEY = "atlas-executive-sidebar-layout-v1";

const DEFAULT_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Command Center", section: "Mission Control", icon: Home, view: "dashboard" },
  { id: "analytics", label: "Operational Intelligence", section: "Mission Control", icon: BarChart3, view: "analytics" },
  { id: "webvime", label: "Webvime Signal Center", section: "Mission Control", icon: Radio, view: "webvime" },
  { id: "clients", label: "Clienti", section: "Modules Preview", icon: Users },
  { id: "contracts", label: "Contratti", section: "Modules Preview", icon: FileText },
  { id: "calendar", label: "Calendario", section: "Modules Preview", icon: CalendarDays },
  { id: "map", label: "Mappa", section: "Modules Preview", icon: Map },
  { id: "risk", label: "Risk Radar", section: "Modules Preview", icon: ShieldAlert },
  { id: "procedures", label: "Procedure", section: "Modules Preview", icon: BookOpen },
  { id: "settings", label: "Settings", section: "Modules Preview", icon: Settings },
];

const DEFAULT_LAYOUT: SidebarLayout = {
  order: DEFAULT_ITEMS.map((item) => item.id),
  hidden: [],
};

function isValidLayout(value: any): value is SidebarLayout {
  if (!value || !Array.isArray(value.order) || !Array.isArray(value.hidden)) return false;
  const validIds = new Set(DEFAULT_ITEMS.map((item) => item.id));
  return value.order.every((id: string) => validIds.has(id as SidebarItemId)) && value.hidden.every((id: string) => validIds.has(id as SidebarItemId));
}

function loadLayout(): SidebarLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (!isValidLayout(parsed)) return DEFAULT_LAYOUT;

    const savedOrder = parsed.order.filter((id) => DEFAULT_LAYOUT.order.includes(id));
    const missingIds = DEFAULT_LAYOUT.order.filter((id) => !savedOrder.includes(id));

    return {
      order: [...savedOrder, ...missingIds],
      hidden: parsed.hidden.filter((id) => DEFAULT_LAYOUT.order.includes(id)),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function itemById(id: SidebarItemId) {
  return DEFAULT_ITEMS.find((item) => item.id === id)!;
}

function moveItem(order: SidebarItemId[], id: SidebarItemId, direction: "up" | "down") {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= order.length) return order;
  const next = [...order];
  const current = next[index];
  next[index] = next[nextIndex];
  next[nextIndex] = current;
  return next;
}

export default function ExecutiveSidebar({ view, onViewChange }: ExecutiveSidebarProps) {
  const [editMode, setEditMode] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [layout, setLayout] = useState<SidebarLayout>(DEFAULT_LAYOUT);
  const [draggingId, setDraggingId] = useState<SidebarItemId | null>(null);

  useEffect(() => {
    setLayout(loadLayout());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const visibleItems = useMemo(
    () => layout.order.map(itemById).filter((item) => !layout.hidden.includes(item.id)),
    [layout],
  );

  const hiddenItems = useMemo(
    () => layout.order.map(itemById).filter((item) => layout.hidden.includes(item.id)),
    [layout],
  );

  function setHidden(id: SidebarItemId, hidden: boolean) {
    setLayout((prev) => ({
      ...prev,
      hidden: hidden
        ? Array.from(new Set([...prev.hidden, id]))
        : prev.hidden.filter((itemId) => itemId !== id),
    }));
  }

  function resetLayout() {
    setLayout(DEFAULT_LAYOUT);
    setShowHidden(false);
  }

  function move(id: SidebarItemId, direction: "up" | "down") {
    setLayout((prev) => ({ ...prev, order: moveItem(prev.order, id, direction) }));
  }

  function dropOn(targetId: SidebarItemId) {
    if (!draggingId || draggingId === targetId) return;

    setLayout((prev) => {
      const nextOrder = prev.order.filter((id) => id !== draggingId);
      const targetIndex = nextOrder.indexOf(targetId);
      nextOrder.splice(targetIndex, 0, draggingId);
      return { ...prev, order: nextOrder };
    });

    setDraggingId(null);
  }

  function renderItem(item: SidebarItem) {
    const Icon = item.icon;
    const active = item.view ? view === item.view : false;
    const canNavigate = Boolean(item.view);

    return (
      <div
        key={item.id}
        draggable={editMode}
        onDragStart={() => setDraggingId(item.id)}
        onDragOver={(event) => editMode && event.preventDefault()}
        onDrop={() => dropOn(item.id)}
        className={`group relative rounded-2xl ${draggingId === item.id ? "opacity-45" : "opacity-100"}`}
      >
        <button
          type="button"
          onClick={() => {
            if (!editMode && item.view) onViewChange(item.view);
          }}
          disabled={!canNavigate && !editMode}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
            active
              ? "border-amber-200/55 bg-[linear-gradient(90deg,rgba(251,191,36,0.24),rgba(34,211,238,0.08))] text-white shadow-[0_0_34px_rgba(251,191,36,0.22)]"
              : "border-white/8 bg-white/[0.035] text-slate-400 hover:border-amber-200/25 hover:bg-white/[0.065] hover:text-white"
          } ${!canNavigate && !editMode ? "cursor-default opacity-65" : ""}`}
        >
          {editMode && <GripVertical size={15} className="shrink-0 text-slate-500" />}
          <Icon size={18} className={active ? "text-amber-100" : "text-slate-400"} />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {editMode && (
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  move(item.id, "up");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-slate-300 hover:text-white"
                aria-label="Sposta su"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  move(item.id, "down");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-slate-300 hover:text-white"
                aria-label="Sposta giù"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setHidden(item.id, true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-300/15 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                aria-label="Nascondi voce"
              >
                <EyeOff size={13} />
              </button>
            </span>
          )}
        </button>
      </div>
    );
  }

  const groupedItems = ["Mission Control", "Modules Preview"].map((section) => ({
    section,
    items: visibleItems.filter((item) => item.section === section),
  }));

  return (
    <aside className="hidden h-full w-[282px] shrink-0 border-r border-cyan-300/10 bg-slate-950/70 text-white backdrop-blur-2xl xl:block">
      <div className="flex h-full min-h-0 flex-col p-5">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[0_0_35px_rgba(16,185,129,0.12)]">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight">ATLAS</p>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200/60">Executive</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditMode((value) => !value)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                editMode
                  ? "border-amber-200/40 bg-amber-300/15 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.16)]"
                  : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-amber-200/25 hover:text-white"
              }`}
              title="Personalizza menu"
              aria-label="Personalizza menu"
            >
              <SlidersHorizontal size={16} />
            </button>
            <button
              type="button"
              onClick={resetLayout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-300/25 hover:text-white"
              title="Ripristina menu"
              aria-label="Ripristina menu"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {editMode && (
          <div className="mb-4 rounded-2xl border border-amber-200/18 bg-amber-300/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-100">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Menu edit</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHidden((value) => !value)}
                className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-50/80 hover:text-white"
              >
                {showHidden ? "Chiudi" : `Nascosti ${hiddenItems.length}`}
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-amber-50/70">
              Trascina, sposta o nascondi le voci. Salvataggio automatico su questo browser.
            </p>
          </div>
        )}

        {editMode && showHidden && (
          <div className="mb-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/8 p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/60">Riattiva voci</p>
            {hiddenItems.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Nessuna voce nascosta.</p>
            ) : (
              <div className="space-y-2">
                {hiddenItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHidden(item.id, false)}
                      className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-slate-300 hover:border-cyan-300/25 hover:text-white"
                    >
                      <Eye size={13} className="text-cyan-100" />
                      <Icon size={14} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(148,163,184,0.35)_transparent] [scrollbar-width:thin]">
          <div className="space-y-6 pb-5">
            {groupedItems.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <div key={group.section}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{group.section}</p>
                  <div className="space-y-2">{group.items.map(renderItem)}</div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="mt-5 rounded-[24px] border border-emerald-300/15 bg-emerald-400/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100/60">Stato sistema</p>
          <p className="mt-1 text-sm font-black text-white">Operativo</p>
          <p className="mt-2 text-xs font-semibold text-emerald-100/65">Classic sempre disponibile</p>
        </div>
      </div>
    </aside>
  );
}
