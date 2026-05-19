"use client";

import type { SelectHTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AtlasSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  children: ReactNode;
};

export function AtlasSelect({ label, hint, children, className = "", ...props }: AtlasSelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>}
      <select
        className={cx(
          "w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-blue-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
