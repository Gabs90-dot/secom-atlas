"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { X } from "lucide-react";
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

type FooterPanel = "support" | "privacy" | "info" | null;

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
  const [footerPanel, setFooterPanel] = useState<FooterPanel>(null);

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
  const appEnvironment = process.env.NODE_ENV === "production" ? "Production" : "Development";
  const currentYear = new Date().getFullYear();

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

      <div className="absolute bottom-6 left-6 right-6 z-30">
        {footerPanel && (
          <div
            className={`mb-3 rounded-2xl border p-4 shadow-2xl ${
              theme === "dark"
                ? "border-white/10 bg-[#0b1726]/98 text-slate-200"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                  {footerPanel === "support"
                    ? "Supporto"
                    : footerPanel === "privacy"
                    ? "Privacy"
                    : "Informazioni"}
                </p>

                {footerPanel === "support" && (
                  <div className="mt-2 space-y-1 text-xs font-semibold leading-5">
                    <p className="font-black">SECOM S.r.l.</p>
                    <p>Via Monte Cervino, 5</p>
                    <p>00071 Pomezia (RM) – Italia</p>
                    <p className="pt-1">
                      Tel.{" "}
                      <a
                        href="tel:+39069146000"
                        className="font-black text-cyan-300 transition hover:text-cyan-200"
                      >
                        +39 06 9146000
                      </a>
                    </p>
                    <p>
                      Assistenza:{" "}
                      <a
                        href="mailto:assistenza@secomitalia.com"
                        className="break-all font-black text-cyan-300 transition hover:text-cyan-200"
                      >
                        assistenza@secomitalia.com
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://www.secomitalia.com"
                        target="_blank"
                        rel="noreferrer"
                        className="font-black text-cyan-300 transition hover:text-cyan-200"
                      >
                        www.secomitalia.com
                      </a>
                    </p>
                  </div>
                )}

                {footerPanel === "privacy" && (
                  <div className="mt-2 space-y-2 text-xs font-semibold leading-5">
                    <p>
                      L’accesso ad ATLAS è riservato esclusivamente agli utenti autorizzati.
                    </p>
                    <p>
                      I dati presenti nella piattaforma sono trattati da SECOM S.r.l. per finalità operative,
                      tecniche e amministrative, nel rispetto dei ruoli e dei permessi assegnati.
                    </p>
                    <p>
                      È vietato consultare, esportare o diffondere dati non pertinenti alla propria attività.
                    </p>
                    <p className="text-[10px] opacity-65">
                      Per l’informativa completa fare riferimento alla documentazione privacy aziendale vigente.
                    </p>
                  </div>
                )}

                {footerPanel === "info" && (
                  <div className="mt-2 space-y-3 text-xs font-semibold leading-5">
                    <div className="space-y-1">
                      <p className="font-black">ATLAS</p>
                      <p>Operational Management Platform</p>
                      <p>Versione {appVersion} · {appEnvironment}</p>
                      <p>Developed by SECOM S.r.l.</p>
                      <p>© {currentYear} SECOM S.r.l. – Tutti i diritti riservati</p>
                    </div>

                    <div className={`h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />

                    <div className="space-y-1">
                      <p className="font-black">Informazioni societarie</p>
                      <p>SECOM S.r.l.</p>
                      <p>Via Monte Cervino, 5</p>
                      <p>00071 Pomezia (RM) – Italia</p>
                      <p>Tel. +39 06 9146000</p>
                      <p>Codice SDI: SUBM70N</p>
                      <a
                        href="https://www.secomitalia.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-black text-cyan-300 transition hover:text-cyan-200"
                      >
                        www.secomitalia.com
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFooterPanel(null)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900"
                }`}
                aria-label="Chiudi informazioni"
                title="Chiudi"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div
          className={`rounded-2xl border px-4 py-3 ${
            theme === "dark"
              ? "border-white/10 bg-black/15 text-slate-400"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <div className="space-y-0.5">
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${
              theme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}>
              ATLAS
            </p>
            <p className="text-[10px] font-semibold">Operational Management Platform</p>
            <p className="pt-1 text-[10px] font-semibold">Developed by SECOM S.r.l.</p>
            <p className="text-[10px] font-semibold">
              v{appVersion} · {appEnvironment}
            </p>
          </div>

          <div className={`my-2 h-px ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`} />

          <div className="flex items-center gap-1 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setFooterPanel((current) => current === "support" ? null : "support")}
              className="rounded-md px-1 py-0.5 transition hover:text-white"
            >
              Supporto
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setFooterPanel((current) => current === "privacy" ? null : "privacy")}
              className="rounded-md px-1 py-0.5 transition hover:text-white"
            >
              Privacy
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setFooterPanel((current) => current === "info" ? null : "info")}
              className="rounded-md px-1 py-0.5 transition hover:text-white"
            >
              Informazioni
            </button>
          </div>

          <p className="mt-2 text-[9px] font-semibold opacity-50">
            © {currentYear} SECOM S.r.l.
          </p>
        </div>
      </div>
    </aside>
  );
}
