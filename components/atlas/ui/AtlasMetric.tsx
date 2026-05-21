import type { ReactNode } from "react";
import AtlasCard from "./AtlasCard";
import { atlasDesign } from "@/lib/designSystem";

type AtlasMetricProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  toneClass?: string;
  onClick?: () => void;
};

export default function AtlasMetric({ label, value, icon, hint, toneClass = "text-white", onClick }: AtlasMetricProps) {
  return (
    <AtlasCard variant="action" onClick={onClick}>
      {icon && <div className="mb-3">{icon}</div>}
      <p className={`${atlasDesign.typography.metric} ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
      {hint && <div className="mt-2 text-xs font-bold text-slate-500">{hint}</div>}
    </AtlasCard>
  );
}
