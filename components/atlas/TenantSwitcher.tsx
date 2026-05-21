"use client";

import { Building2, ShieldCheck } from "lucide-react";
import type { AtlasTenant } from "@/lib/tenant";
import { storeTenantSlug } from "@/lib/tenant";

type TenantSwitcherProps = {
  tenants: AtlasTenant[];
  activeTenant: AtlasTenant | null;
  onTenantChange: (tenant: AtlasTenant) => void;
};

export default function TenantSwitcher({ tenants, activeTenant, onTenantChange }: TenantSwitcherProps) {
  if (!tenants.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black text-slate-400">
        Organizzazione non configurata
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-sm">
      <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 md:flex">
        <Building2 size={18} />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
          <ShieldCheck size={12} /> Organizzazione
        </div>
        <select
          value={activeTenant?.slug || ""}
          onChange={(event) => {
            const next = tenants.find((tenant) => tenant.slug === event.target.value);
            if (!next) return;
            storeTenantSlug(next.slug);
            onTenantChange(next);
          }}
          className="mt-0.5 max-w-[180px] truncate bg-transparent text-sm font-black text-white outline-none"
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.slug} className="bg-slate-950 text-white">
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
