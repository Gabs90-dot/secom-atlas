"use client";

import {
  Home as HomeIcon,
  AlertTriangle,
  CalendarDays,
  ListChecks,
  MoreHorizontal,
} from "lucide-react";

type Props = {
  mobileView: string;
  setMobileView: (value: any) => void;
  setMobileMoreOpen: (value: boolean) => void;
};

export default function MobileBottomNav({
  mobileView,
  setMobileView,
  setMobileMoreOpen,
}: Props) {
  const items = [
    {
      key: "home",
      label: "Home",
      icon: HomeIcon,
    },
    {
      key: "operativo",
      label: "Apri",
      icon: AlertTriangle,
    },
    {
      key: "calendario",
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      key: "registro",
      label: "Registro",
      icon: ListChecks,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07111f]/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMobileView(key)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition-all ${
              mobileView === key
                ? "bg-blue-600 text-white"
                : "text-slate-400"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

        <button
          onClick={() => setMobileMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-slate-400"
        >
          <MoreHorizontal size={18} />
          Altro
        </button>
      </div>
    </div>
  );
}