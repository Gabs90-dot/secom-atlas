import type { ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AtlasStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function AtlasStatCard({ label, value, hint, icon, className = "" }: AtlasStatCardProps) {
  return (
    <div className={cx("rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
        </div>
        {icon && <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300">{icon}</div>}
      </div>
    </div>
  );
}
