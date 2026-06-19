import type { ReactNode } from "react";

type ExecutiveGlassCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export default function ExecutiveGlassCard({
  children,
  className = "",
  title,
  eyebrow,
  action,
}: ExecutiveGlassCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#0b1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] ${className}`}
    >
      {(title || eyebrow || action) && (
        <div className="relative z-10 mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/65">
                {eyebrow}
              </p>
            )}
            {title && <h3 className="mt-1 text-lg font-black text-white">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
