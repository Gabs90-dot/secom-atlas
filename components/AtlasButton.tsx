"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AtlasButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type AtlasButtonSize = "sm" | "md" | "lg";

type AtlasButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AtlasButtonVariant;
  size?: AtlasButtonSize;
  fullWidth?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const variantClass: Record<AtlasButtonVariant, string> = {
  primary: "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-950/20 hover:bg-blue-500",
  secondary: "border-white/10 bg-white/[0.07] text-slate-100 hover:bg-white/[0.12]",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.08] hover:text-white",
  danger: "border-red-500/30 bg-red-500/15 text-red-200 hover:bg-red-500/25",
  success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
};

const sizeClass: Record<AtlasButtonSize, string> = {
  sm: "rounded-xl px-3 py-2 text-xs",
  md: "rounded-2xl px-4 py-3 text-sm",
  lg: "rounded-3xl px-5 py-4 text-base",
};

export function AtlasButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: AtlasButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 border font-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
