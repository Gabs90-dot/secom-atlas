import type { HTMLAttributes, ReactNode } from "react";

type AtlasBadgeTone = "blue" | "green" | "amber" | "red" | "slate";

type AtlasBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: AtlasBadgeTone;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const toneClass: Record<AtlasBadgeTone, string> = {
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  red: "bg-red-500/15 text-red-300 border-red-500/25",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/25",
};

export function AtlasBadge({ children, tone = "slate", className = "", ...props }: AtlasBadgeProps) {
  return (
    <span
      className={cx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-black", toneClass[tone], className)}
      {...props}
    >
      {children}
    </span>
  );
}
