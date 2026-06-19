"use client";

import { ChevronRight, LogOut, X } from "lucide-react";
import { getRoleLabel, normalizeRole } from "@/lib/auth";
import type { AtlasTenant } from "@/lib/tenant";
import { storeTenantSlug } from "@/lib/tenant";
import type { AtlasTabGroup } from "@/components/atlas/layout/atlasNavigation";

type Props = {
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (value: boolean) => void;
  mobileView: string;
  setMobileView: (value: any) => void;
  groups: AtlasTabGroup[];
  tenants: AtlasTenant[];
  activeTenant: AtlasTenant | null;
  currentUser: {
    display_name?: string | null;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  onTenantChange: (tenant: AtlasTenant) => void;
  onLogout: () => void;
};

export default function MobileMoreMenu({
  mobileMoreOpen,
  setMobileMoreOpen,
  mobileView,
  setMobileView,
  groups,
  tenants,
  activeTenant,
  currentUser,
  onTenantChange,
  onLogout,
}: Props) {
  if (!mobileMoreOpen) return null;

  const displayName =
    currentUser?.display_name ||
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.email ||
    "Operatore";
  const roleLabel = getRoleLabel(normalizeRole(currentUser?.role));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden">
      <div className="h-full w-[82%] max-w-sm overflow-y-auto border-r border-white/10 bg-[#07111f] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] shadow-2xl">
        <button
          onClick={() => setMobileMoreOpen(false)}
          className="mb-8 rounded-2xl p-2 text-slate-300"
        >
          <X size={26} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <img
            src="/secom-logo.png.png"
            alt="Secom"
            className="h-10 w-auto object-contain"
          />
          <p className="text-base font-black text-white">
            Centrale Operativa ATLAS
          </p>
        </div>

        <div className="grid gap-5">
          {groups.map((group) => (
            <div key={group.title} className="grid gap-2">
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {group.title}
              </p>
              {group.items.map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => {
                    setMobileView(key);
                    setMobileMoreOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left font-bold transition-all ${
                    mobileView === key
                      ? "bg-blue-600/25 text-blue-300"
                      : "text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <span className="relative">
                      <Icon size={22} />
                      {Number(badge || 0) > 0 && (
                        <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-black text-white">
                          {badge}
                        </span>
                      )}
                    </span>
                    {label}
                  </span>

                  <ChevronRight size={18} className="text-slate-500" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
            Sessione
          </p>
          <p className="mt-3 truncate text-sm font-black text-white">
            {displayName}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            {roleLabel}
          </p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Organizzazione
          </p>
          {tenants.length > 1 ? (
            <select
              value={activeTenant?.slug || ""}
              onChange={(event) => {
                const nextTenant = tenants.find((tenant) => tenant.slug === event.target.value);
                if (!nextTenant) return;
                storeTenantSlug(nextTenant.slug);
                onTenantChange(nextTenant);
                setMobileMoreOpen(false);
              }}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm font-black text-white outline-none"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.slug} className="bg-slate-950 text-white">
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 truncate text-sm font-black text-white">
              {activeTenant?.name || "Organizzazione non configurata"}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMoreOpen(false);
              onLogout();
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
