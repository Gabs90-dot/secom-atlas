"use client";

import {
  Home as HomeIcon,
  Briefcase,
  ListChecks,
  CheckCircle2,
  Monitor,
  MoreHorizontal,
} from "lucide-react";

type Props = {
  mobileView: string;
  setMobileView: (value: any) => void;
  setMobileMoreOpen: (value: boolean) => void;
  todoNewCount?: number;
};

export default function MobileBottomNav({
  mobileView,
  setMobileView,
  setMobileMoreOpen,
  todoNewCount = 0,
}: Props) {
  const items = [
    {
      key: "home",
      label: "Home",
      icon: HomeIcon,
    },
    {
      key: "webvime",
      label: "Webvime",
      icon: Monitor,
    },
    {
      key: "operativo",
      label: "Operativa",
      icon: Briefcase,
    },
    {
      key: "todo",
      label: "To Do",
      icon: CheckCircle2,
      badge: todoNewCount,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07111f]/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        {items.map(({ key, label, icon: Icon, badge }: any) => (
          <button
            key={key}
            onClick={() => {
              setMobileView(key);
              setMobileMoreOpen(false);
            }}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition-all ${
              mobileView === key
                ? "bg-blue-600 text-white"
                : "text-slate-400"
            }`}
          >
            <span className="relative">
              <Icon size={18} />
              {badge > 0 && (
                <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-black text-white">
                  {badge}
                </span>
              )}
            </span>
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