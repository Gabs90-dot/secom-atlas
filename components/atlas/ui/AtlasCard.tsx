import type { ReactNode } from "react";
import { atlasDesign } from "@/lib/designSystem";

type AtlasCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "base" | "compact" | "action" | "danger" | "success" | "warning";
  onClick?: () => void;
};

export default function AtlasCard({ children, className = "", variant = "base", onClick }: AtlasCardProps) {
  const classes = `${atlasDesign.card[variant]} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${classes} w-full text-left`}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
