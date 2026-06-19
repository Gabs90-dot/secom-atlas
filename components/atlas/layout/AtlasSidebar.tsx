"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import AtlasSidebarGroup from "./AtlasSidebarGroup";
import AtlasSidebarLogo from "./AtlasSidebarLogo";

type SidebarItem = {
  key: string;
  label: string;
  icon: any;
  badge?: number;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

type AtlasSidebarProps = {
  theme: string;
  isExecutiveMode: boolean;
  logoImage: string;
  tabGroups: SidebarGroup[];
  activeTab: string;
  canAccessTab: (key: string) => boolean;
  onTabChange: (key: string) => void;
};

const STORAGE_KEY = "atlas-sidebar-tab-order-v1";

function loadStoredOrder() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

export default function AtlasSidebar({
  theme,
  isExecutiveMode,
  logoImage,
  tabGroups,
  activeTab,
  canAccessTab,
  onTabChange,
}: AtlasSidebarProps) {
  const [sidebarTabOrder, setSidebarTabOrder] = useState<string[]>(loadStoredOrder);
  const [draggingSidebarTab, setDraggingSidebarTab] = useState<string | null>(null);

  const allKeys = useMemo(
    () => tabGroups.flatMap((group) => group.items.map((tab) => String(tab.key))),
    [tabGroups],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarTabOrder));
    } catch {
      // Preferenze menu non salvate: ATLAS continua comunque con ordine di default.
    }
  }, [sidebarTabOrder]);

  function completeSidebarTabOrder(order: string[] = sidebarTabOrder) {
    return [
      ...order.filter((key) => allKeys.includes(key)),
      ...allKeys.filter((key) => !order.includes(key)),
    ];
  }

  function orderSidebarItems(items: SidebarItem[]) {
    const order = completeSidebarTabOrder();
    return [...items].sort((a, b) => {
      const left = order.indexOf(String(a.key));
      const right = order.indexOf(String(b.key));
      return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
    });
  }

  function moveSidebarTab(sourceKey: string, targetKey: string) {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;

    setSidebarTabOrder((current) => {
      const next = completeSidebarTabOrder(current);
      const from = next.indexOf(sourceKey);
      const to = next.indexOf(targetKey);
      if (from === -1 || to === -1) return current;

      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDragStart(key: string, event: DragEvent<HTMLButtonElement>) {
    setDraggingSidebarTab(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(key: string, event: DragEvent<HTMLButtonElement>) {
    if (draggingSidebarTab && draggingSidebarTab !== key) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDrop(key: string, event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const sourceKey = event.dataTransfer.getData("text/plain") || draggingSidebarTab || "";
    moveSidebarTab(sourceKey, key);
    setDraggingSidebarTab(null);
  }

  return (
    <aside
      data-atlas-executive-glow-ignore
      className={`atlas-sidebar relative isolate hidden w-72 shrink-0 overflow-hidden border-r p-6 pb-40 [contain:paint] lg:block ${
        theme === "dark"
          ? "border-white/10 bg-[#081523]"
          : "border-slate-300 bg-white shadow-xl shadow-slate-300/30"
      }`}
    >
      <button
        type="button"
        onClick={() => onTabChange(canAccessTab("home") ? "home" : "customerPortal")}
        className="block w-full border-0 bg-transparent p-0 text-left"
        title={canAccessTab("home") ? "Torna alla Home" : "Torna al Portale Cliente"}
        aria-label={canAccessTab("home") ? "Torna alla Home" : "Torna al Portale Cliente"}
      >
        <AtlasSidebarLogo
          theme={theme}
          isExecutiveMode={isExecutiveMode}
          logoImage={logoImage}
        />
      </button>

      <nav className="atlas-sidebar-nav relative isolate space-y-5 overflow-hidden pb-32">
        {tabGroups.map((group) => {
          const visibleItems = orderSidebarItems(
            group.items.filter((tab) => canAccessTab(tab.key)),
          );

          return (
            <AtlasSidebarGroup
              key={group.title}
              title={group.title}
              items={visibleItems}
              activeTab={activeTab}
              theme={theme}
              isExecutiveMode={isExecutiveMode}
              draggingTab={draggingSidebarTab}
              onTabChange={onTabChange}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={() => setDraggingSidebarTab(null)}
            />
          );
        })}
      </nav>
    </aside>
  );
}
