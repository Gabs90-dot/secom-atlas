"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, type ReactNode } from "react";
import MobileBottomNav from "@/components/atlas/MobileBottomNav";
import MobileMoreMenu from "@/components/atlas/MobileMoreMenu";
import {
  getMobileMoreTabGroups,
  getMobilePrimaryTabs,
} from "@/components/atlas/layout/atlasNavigation";
import { useIsDesktopShell } from "@/components/atlas/layout/useAtlasShellMode";
import AtlasHeader from "./AtlasHeader";
import AtlasSidebar from "./AtlasSidebar";

const TicketWorkspace = dynamic(() => import("@/components/atlas/TicketWorkspace"), { ssr: false });

type AtlasAppFrameProps = {
  children: ReactNode;
  theme: string;
  isExecutiveMode: boolean;
  logoImage: string;
  tabGroups: any[];
  tabs: any[];
  activeTab: string;
  onTabChange: (key: string) => void;
  canAccessTab: (key: string) => boolean;
  tenants: any[];
  activeTenant: any | null;
  currentUser: any | null;
  notificationCount: number;
  siteSearch: string;
  onTenantChange: (tenant: any) => void;
  onLogout: () => void;
  onOpenNotifications: (anchor: NotificationPanelAnchor) => void;
  onOpenMobileMenu: () => void;
  onSwitchUiMode: (mode: "classic" | "executive") => void;
  onThemeChange: (theme: string) => void;
  onSiteSearchChange: (value: string) => void;
  operatorAvatar?: string;
  onOperatorAvatarUpload?: (file?: File | null) => void | Promise<void>;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (value: boolean) => void;
  mobileView: any;
  setMobileView: (value: any) => void;
  todoNewCount: number;
  message?: string;
  messageType?: "success" | "error";
  onClearMessage: () => void;
  selectedTicketWorkspace: any | null;
  onCloseTicketWorkspace: () => void;
  onTicketWorkspaceStatusUpdated: (ticket: any) => void;
  glpiEnabled?: boolean;
};

type NotificationPanelAnchor = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export default function AtlasAppFrame({
  children,
  theme,
  isExecutiveMode,
  logoImage,
  tabGroups,
  tabs,
  activeTab,
  onTabChange,
  canAccessTab,
  tenants,
  activeTenant,
  currentUser,
  notificationCount,
  siteSearch,
  onTenantChange,
  onLogout,
  onOpenNotifications,
  onOpenMobileMenu,
  onSwitchUiMode,
  onThemeChange,
  onSiteSearchChange,
  operatorAvatar = "",
  onOperatorAvatarUpload,
  mobileMoreOpen,
  setMobileMoreOpen,
  mobileView,
  setMobileView,
  todoNewCount,
  message = "",
  messageType = "success",
  onClearMessage,
  selectedTicketWorkspace,
  onCloseTicketWorkspace,
  onTicketWorkspaceStatusUpdated,
  glpiEnabled = true,
}: AtlasAppFrameProps) {
  const isDesktopShell = useIsDesktopShell();
  const mobilePrimaryTabs = useMemo(
    () => getMobilePrimaryTabs(tabGroups, canAccessTab),
    [tabGroups, canAccessTab],
  );
  const mobileMoreGroups = useMemo(
    () => getMobileMoreTabGroups(tabGroups, canAccessTab),
    [tabGroups, canAccessTab],
  );
  const hasMobileMoreItems = mobileMoreGroups.some((group) => group.items.length > 0);

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const frameId = window.requestAnimationFrame(resetScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeTab, mobileView]);

  return (
    <>
      <TicketWorkspace
        ticket={selectedTicketWorkspace}
        open={Boolean(selectedTicketWorkspace)}
        onClose={onCloseTicketWorkspace}
        onStatusUpdated={onTicketWorkspaceStatusUpdated}
        glpiEnabled={glpiEnabled}
      />

      <div className="flex min-h-screen">
        {isDesktopShell && (
          <AtlasSidebar
            theme={theme}
            isExecutiveMode={isExecutiveMode}
            logoImage={logoImage}
            tabGroups={tabGroups}
            activeTab={activeTab}
            canAccessTab={canAccessTab}
            onTabChange={onTabChange}
          />
        )}

        <div className="min-w-0 flex-1 overflow-x-hidden">
          <AtlasHeader
            isDesktopShell={isDesktopShell}
            theme={theme}
            isExecutiveMode={isExecutiveMode}
            tenants={tenants}
            activeTenant={activeTenant}
            currentUser={currentUser}
            notificationCount={notificationCount}
            siteSearch={siteSearch}
            tabs={tabs}
            activeTab={activeTab}
            onTenantChange={onTenantChange}
            onLogout={onLogout}
            onOpenNotifications={onOpenNotifications}
            onOpenMobileMenu={onOpenMobileMenu}
            onSwitchUiMode={onSwitchUiMode}
            onThemeChange={onThemeChange}
            onSiteSearchChange={onSiteSearchChange}
            onTabChange={onTabChange}
            canAccessTab={canAccessTab}
            operatorAvatar={operatorAvatar}
            onOperatorAvatarUpload={onOperatorAvatarUpload}
          />

          {!isDesktopShell && (
            <MobileMoreMenu
              mobileMoreOpen={mobileMoreOpen}
              setMobileMoreOpen={setMobileMoreOpen}
              mobileView={mobileView}
              setMobileView={setMobileView}
              groups={mobileMoreGroups}
              tenants={tenants}
              activeTenant={activeTenant}
              currentUser={currentUser}
              onTenantChange={onTenantChange}
              onLogout={onLogout}
            />
          )}

          <main className="w-full max-w-full overflow-x-hidden space-y-6 p-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:p-8 lg:pb-8">
            {message && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
                <div
                  className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl ${
                    messageType === "success"
                      ? "border-emerald-400/30 bg-emerald-950 text-emerald-100"
                      : "border-red-400/30 bg-red-950 text-red-100"
                  }`}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
                    {messageType === "success" ? "✓" : "!"}
                  </div>

                  <p className="text-lg font-black">
                    {messageType === "success" ? "Operazione completata" : "Attenzione"}
                  </p>

                  <p className="mt-2 text-sm font-bold opacity-90">{message}</p>

                  <button
                    onClick={onClearMessage}
                    className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {children}

            {!isDesktopShell && (
              <MobileBottomNav
                mobileView={mobileView}
                setMobileView={setMobileView}
                setMobileMoreOpen={setMobileMoreOpen}
                items={mobilePrimaryTabs}
                hasMoreItems={hasMobileMoreItems}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
