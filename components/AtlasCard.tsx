import type { HTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AtlasCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  compact?: boolean;
  elevated?: boolean;
};

export function AtlasCard({ children, compact = false, elevated = true, className = "", ...props }: AtlasCardProps) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur",
        compact ? "p-4" : "p-6",
        elevated && "shadow-xl shadow-black/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
