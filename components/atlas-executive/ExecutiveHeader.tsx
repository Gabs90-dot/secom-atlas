import { Bell, Building2, Camera, Moon, Search } from "lucide-react";

type ExecutiveHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
};

export default function ExecutiveHeader({ title, subtitle, badge = "SUPER ADMIN" }: ExecutiveHeaderProps) {
  return (
    <header className="relative z-20 border-b border-cyan-300/10 bg-slate-950/40 px-5 py-5 text-white backdrop-blur-2xl md:px-7">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-200/55">
            ATLAS Command Intelligence Platform
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
            <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
              {badge}
            </span>
          </div>
          {subtitle && <p className="mt-2 text-sm font-semibold text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
            <Building2 size={17} className="text-cyan-100" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Organizzazione</p>
              <p className="text-xs font-black text-white">SECOM S.r.l.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-200/18 to-cyan-300/10 text-[11px] font-black text-white shadow-[0_0_26px_rgba(251,191,36,0.12)]">
              <Camera size={16} className="text-amber-100/80" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Gabriele Pedroli</p>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Spazio foto operatore</p>
            </div>
          </div>
          <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300">
            <Moon size={18} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex max-w-4xl items-center gap-3 rounded-2xl border border-cyan-300/10 bg-black/25 px-4 py-3 text-slate-400">
        <Search size={17} />
        <span className="text-sm font-bold">Cerca sito, cliente, contratto, ticket...</span>
        <span className="ml-auto rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-slate-500">CTRL K</span>
      </div>
    </header>
  );
}
