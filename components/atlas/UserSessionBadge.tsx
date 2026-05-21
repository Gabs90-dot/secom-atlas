"use client";

import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { AtlasUser } from "@/lib/auth";
import { getRoleLabel } from "@/lib/auth";

type UserSessionBadgeProps = {
  user: AtlasUser;
  compact?: boolean;
  onLogout?: () => void | Promise<void>;
};

function roleTone(role: string) {
  if (role === "admin") return "border-blue-400/30 bg-blue-500/15 text-blue-200";
  if (role === "manager") return "border-violet-400/30 bg-violet-500/15 text-violet-200";
  if (role === "dispatcher") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  if (role === "tecnico") return "border-amber-400/30 bg-amber-500/15 text-amber-200";
  if (role === "cliente") return "border-slate-400/30 bg-slate-500/15 text-slate-200";
  return "border-white/10 bg-white/[0.06] text-slate-200";
}

export default function UserSessionBadge({ user, compact = false, onLogout }: UserSessionBadgeProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${roleTone(user.role)}`}>
        <UserRound size={15} />
        {getRoleLabel(user.role)}
        {onLogout && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void onLogout();
            }}
            className="ml-1 rounded-xl border border-white/10 bg-white/[0.08] p-1.5 text-slate-200 transition hover:bg-red-500/20 hover:text-red-100"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 md:flex">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-200">
        <ShieldCheck size={18} />
      </div>
      <div className="leading-tight">
        <p className="text-xs font-black text-white">{user.name}</p>
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          {getRoleLabel(user.role)} · {user.tenantName}
        </p>
      </div>
      {onLogout && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void onLogout();
          }}
          className="ml-1 rounded-xl border border-white/10 bg-white/[0.06] p-2 text-slate-300 transition hover:bg-red-500/15 hover:text-red-200"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={15} />
        </button>
      )}
    </div>
  );
}
