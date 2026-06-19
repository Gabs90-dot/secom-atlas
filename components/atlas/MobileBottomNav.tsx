"use client";

import { MoreHorizontal } from "lucide-react";
import type { AtlasTabItem } from "@/components/atlas/layout/atlasNavigation";

type Props = {
  mobileView: string;
  setMobileView: (value: any) => void;
  setMobileMoreOpen: (value: boolean) => void;
  items: AtlasTabItem[];
  hasMoreItems: boolean;
};

export default function MobileBottomNav({
  mobileView,
  setMobileView,
  setMobileMoreOpen,
  items,
  hasMoreItems,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07111f]/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        {items.map(({ key, label, icon: Icon, badge }) => (
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
              {Number(badge || 0) > 0 && (
                <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-black text-white">
                  {badge}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}

        {hasMoreItems && (
          <button
            onClick={() => setMobileMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-slate-400"
          >
            <MoreHorizontal size={18} />
            Altro
          </button>
        )}
      </div>
    </div>
  );
}
