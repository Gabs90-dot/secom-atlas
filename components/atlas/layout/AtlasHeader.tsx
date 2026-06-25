"use client";

import { useRef } from "react";
import { Bell, Menu, Search } from "lucide-react";
import TenantSwitcher from "@/components/atlas/TenantSwitcher";
import UserSessionBadge from "@/components/atlas/UserSessionBadge";
import OperatorAvatar from "./OperatorAvatar";
import ThemeToggle from "./ThemeToggle";
import VariableProximity from "./VariableProximity";


function getDisplayName(user: any | null) {
  const raw =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.display_name ||
    user?.email ||
    "Operatore";

  return String(raw).split("@")[0].replace(/[._-]+/g, " ").trim() || "Operatore";
}

function getFirstName(user: any | null) {
  const displayName = getDisplayName(user);
  return displayName.split(/\s+/).filter(Boolean)[0] || displayName || "Operatore";
}

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 14) return "Buongiorno";
  if (hour >= 14 && hour < 17) return "Buon pomeriggio";
  return "Buonasera";
}

type AtlasHeaderProps = {
  isDesktopShell: boolean;
  theme: string;
  isExecutiveMode: boolean;
  tenants: any[];
  activeTenant: any | null;
  currentUser: any | null;
  notificationCount: number;
  siteSearch: string;
  tabs: any[];
  activeTab: string;
  onTenantChange: (tenant: any) => void;
  onLogout: () => void;
  onOpenNotifications: (anchor: NotificationPanelAnchor) => void;
  onOpenMobileMenu: () => void;
  onSwitchUiMode: (mode: "classic" | "executive") => void;
  onThemeChange: (theme: string) => void;
  onSiteSearchChange: (value: string) => void;
  onTabChange: (key: string) => void;
  canAccessTab: (key: string) => boolean;
  operatorAvatar?: string;
  onOperatorAvatarUpload?: (file?: File | null) => void | Promise<void>;
};

type NotificationPanelAnchor = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

function getAnchorFromElement(element: HTMLElement): NotificationPanelAnchor {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export default function AtlasHeader({
  isDesktopShell,
  theme,
  isExecutiveMode,
  tenants,
  activeTenant,
  currentUser,
  notificationCount,
  siteSearch,
  tabs,
  activeTab,
  onTenantChange,
  onLogout,
  onOpenNotifications,
  onOpenMobileMenu,
  onSwitchUiMode,
  onThemeChange,
  onSiteSearchChange,
  onTabChange,
  canAccessTab,
  operatorAvatar = "",
  onOperatorAvatarUpload,
}: AtlasHeaderProps) {
  const canSwitchExecutive = ["super_admin", "admin"].includes(currentUser?.role || "");
  const firstName = getFirstName(currentUser);
  const dayGreeting = getDayGreeting();
  const greetingContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isDesktopShell) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06111f]/95 px-5 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-2xl p-2 text-white"
            aria-label="Apri menu mobile"
          >
            <Menu size={26} />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <img src="/secom-logo.png.png" alt="Secom" className="h-9 w-auto object-contain" />
            <h1 className="truncate text-base font-black text-white">Centrale Operativa ATLAS</h1>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <TenantSwitcher tenants={tenants} activeTenant={activeTenant} onTenantChange={onTenantChange} />
            <UserSessionBadge user={currentUser} compact onLogout={onLogout} />
          </div>

          <button
            onClick={(event) => onOpenNotifications(getAnchorFromElement(event.currentTarget))}
            className="relative rounded-2xl p-2 text-white"
            aria-label="Notifiche"
          >
            <Bell size={24} />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  return (
      <header
        className={`sticky top-0 z-30 hidden border-b backdrop-blur lg:block ${
          theme === "dark" ? "border-white/10 bg-[#07111f]/90" : "border-slate-300 bg-white/95 shadow-sm"
        }`}
      >
        <div className="relative px-4 py-3 md:px-8 md:py-4">
          <div className="relative z-20 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/secom-logo.png.png" alt="Secom" className="h-10 w-auto object-contain lg:hidden" />

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black md:text-2xl">
                  {isExecutiveMode ? "ATLAS Executive Command" : "Centrale Operativa ATLAS"}
                </h1>
                <p className={`hidden text-sm md:block ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  {isExecutiveMode
                    ? "Tema Executive attivo · shell premium su moduli ATLAS reali."
                    : "Clienti, ticket, calendario e operatività."}
                </p>

              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <TenantSwitcher tenants={tenants} activeTenant={activeTenant} onTenantChange={onTenantChange} />

              {isExecutiveMode && (
                <OperatorAvatar avatar={operatorAvatar} displayName={getDisplayName(currentUser)} onUpload={onOperatorAvatarUpload} />
              )}

              <UserSessionBadge user={currentUser} onLogout={onLogout} />

              <button
                onClick={(event) => onOpenNotifications(getAnchorFromElement(event.currentTarget))}
                className={`relative shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                  theme === "dark" ? "border-white/10 bg-white/[0.06] text-white" : "border-slate-200 bg-white text-slate-900"
                }`}
                aria-label="Notifiche"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {notificationCount}
                  </span>
                )}
              </button>

              {canSwitchExecutive && (
                <ThemeToggle
                  kind="uiMode"
                  theme={theme}
                  isExecutiveMode={isExecutiveMode}
                  onClick={() => onSwitchUiMode(isExecutiveMode ? "classic" : "executive")}
                />
              )}

              <ThemeToggle
                kind="colorTheme"
                theme={theme}
                isExecutiveMode={isExecutiveMode}
                onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              />
            </div>
          </div>

          <div className="relative z-20 mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-blue-400"
                    : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-blue-600"
                }`}
                placeholder="Cerca sito, cliente, contratto..."
                value={siteSearch}
                onChange={(event) => onSiteSearchChange(event.target.value)}
              />
            </div>
          </div>

          {isExecutiveMode && (
            <div ref={greetingContainerRef} className="pointer-events-none absolute bottom-3 left-8 z-10 hidden lg:block">
              <h2 className="text-[44px] font-black leading-none tracking-tight text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.18)] xl:text-[50px] 2xl:text-[54px]">
                <VariableProximity
                  label={`${dayGreeting}, ${firstName}`}
                  className="inline-block whitespace-nowrap text-white"
                  fromFontVariationSettings="'wght' 650, 'opsz' 12"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={greetingContainerRef}
                  radius={150}
                  falloff="linear"
                />
              </h2>
            </div>
          )}
        </div>

        <div className={`border-t px-3 py-2 lg:hidden ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs
              .filter((tab) => canAccessTab(tab.key))
              .map(({ key, label, icon: Icon, badge }: any) => (
                <button
                  key={key}
                  onClick={() => onTabChange(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${
                    activeTab === key
                      ? "border-blue-500 bg-blue-600 text-white"
                      : theme === "dark"
                        ? "border-white/10 bg-white/10 text-slate-300"
                        : "border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-1 min-w-4 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[9px] font-black text-white">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </header>
  );
}
