"use client";

import BorderGlow from "@/components/atlas/ui/BorderGlow";

type AtlasSidebarLogoProps = {
  theme: string;
  isExecutiveMode: boolean;
  logoImage: string;
};

export default function AtlasSidebarLogo({ theme, isExecutiveMode, logoImage }: AtlasSidebarLogoProps) {
  const logoContent = (
    <div className="overflow-hidden rounded-[1.65rem]">
      <img
        src={logoImage}
        alt="Secom ATLAS Centrale operativa"
        className="block w-full select-none object-contain"
        draggable={false}
      />
    </div>
  );

  if (isExecutiveMode) {
    return (
      <BorderGlow
        className="mb-8 p-2"
        edgeSensitivity={18}
        glowColor="112 100 70"
        backgroundColor="rgba(3,10,20,0.98)"
        borderRadius={32}
        glowRadius={24}
        glowIntensity={0.65}
        coneSpread={22}
        colors={["#7CFF67", "#06B6D4", "#C6A76F"]}
        fillOpacity={0.18}
      >
        {logoContent}
      </BorderGlow>
    );
  }

  return (
    <div
      className={`mb-8 rounded-[2rem] border bg-[#081523] ${
        theme === "dark"
          ? "border-emerald-400/70 shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_0_15px_rgba(34,197,94,0.28)]"
          : "border-slate-300 shadow-lg shadow-slate-300/40"
      }`}
    >
      {logoContent}
    </div>
  );
}
