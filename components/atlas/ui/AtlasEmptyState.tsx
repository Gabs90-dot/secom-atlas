import type { ReactNode } from "react";

type AtlasEmptyStateProps = {
  title?: string;
  description: ReactNode;
};

export default function AtlasEmptyState({ title = "Nessun dato disponibile", description }: AtlasEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
      <p className="font-black text-white">{title}</p>
      <div className="mt-1">{description}</div>
    </div>
  );
}
