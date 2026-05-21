import type { ReactNode } from "react";
import { atlasToneClasses, type AtlasTone } from "@/lib/designSystem";

type AtlasBadgeProps = {
  children: ReactNode;
  tone?: AtlasTone;
  className?: string;
};

export default function AtlasBadge({ children, tone = "default", className = "" }: AtlasBadgeProps) {
  return <span className={`${atlasToneClasses(tone)} ${className}`}>{children}</span>;
}
