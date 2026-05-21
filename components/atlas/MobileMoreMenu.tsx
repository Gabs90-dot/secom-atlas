"use client";

import {
  CalendarDays,
  ListChecks,
  Map,
  Monitor,
  Phone,
  Users,
  X,
  ChevronRight,
  Home as HomeIcon,
  Briefcase,
} from "lucide-react";

type Props = {
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (value: boolean) => void;
  mobileView: string;
  setMobileView: (value: any) => void;
};

export default function MobileMoreMenu({
  mobileMoreOpen,
  setMobileMoreOpen,
  mobileView,
  setMobileView,
}: Props) {
  if (!mobileMoreOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
      <div className="h-full w-[82%] max-w-sm border-r border-white/10 bg-[#07111f] p-6 shadow-2xl overflow-y-auto">
        <button
          onClick={() => setMobileMoreOpen(false)}
          className="mb-8 rounded-2xl p-2 text-slate-300"
        >
          <X size={26} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <img
            src="/secom-logo.png.png"
            alt="Secom"
            className="h-10 w-auto object-contain"
          />
          <p className="text-base font-black text-white">
            Centrale Operativa ATLAS
          </p>
        </div>

        <div className="grid gap-2">
          {[
            { key: "home", label: "Home", icon: HomeIcon },
            { key: "operativo", label: "Operativa", icon: Briefcase },
            { key: "calendario", label: "Calendario", icon: CalendarDays },
            { key: "registro", label: "Registro Ticket", icon: ListChecks },
            { key: "clienti", label: "Clienti", icon: Users },
            { key: "contatti", label: "Contatti", icon: Phone },
            { key: "mappa", label: "Mappa", icon: Map },
            { key: "sistemi", label: "Asset & Sistemi", icon: Monitor },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setMobileView(key);
                setMobileMoreOpen(false);
              }}
              className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left font-bold transition-all ${
                mobileView === key
                  ? "bg-blue-600/25 text-blue-300"
                  : "text-slate-300"
              }`}
            >
              <span className="flex items-center gap-4">
                <Icon size={22} />
                {label}
              </span>

              {key !== "home" && (
                <ChevronRight size={18} className="text-slate-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}