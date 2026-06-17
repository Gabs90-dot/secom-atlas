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
      className={`relative overflow-hidden rounded-[28px] border border-cyan-300/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-2xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.1),transparent_36%)]" />
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
