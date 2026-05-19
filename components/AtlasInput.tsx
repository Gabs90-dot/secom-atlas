"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AtlasInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function AtlasInput({ label, hint, leftIcon, rightIcon, className = "", ...props }: AtlasInputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>}
      <span className="relative block">
        {leftIcon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>}
        <input
          className={cx(
            "w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400",
            leftIcon && "pl-11",
            rightIcon && "pr-11",
            className
          )}
          {...props}
        />
        {rightIcon && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</span>}
      </span>
      {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
