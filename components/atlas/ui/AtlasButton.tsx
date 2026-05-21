import type { ButtonHTMLAttributes, ReactNode } from "react";
import { atlasDesign } from "@/lib/designSystem";

type AtlasButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export default function AtlasButton({ children, variant = "primary", className = "", ...props }: AtlasButtonProps) {
  return (
    <button className={`${atlasDesign.button[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
