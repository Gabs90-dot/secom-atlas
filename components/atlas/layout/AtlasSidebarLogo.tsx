"use client";

type AtlasSidebarLogoProps = {
  theme: string;
  isExecutiveMode: boolean;
  logoImage: string;
};

export default function AtlasSidebarLogo({ theme, isExecutiveMode, logoImage }: AtlasSidebarLogoProps) {
  return (
    <div
      className={`mb-8 rounded-[2rem] border bg-[#081523] ${
        isExecutiveMode
          ? "border-emerald-300/35 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_45%),linear-gradient(180deg,rgba(8,21,35,0.98),rgba(3,10,20,0.98))] p-2 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_34px_rgba(16,185,129,0.28),inset_0_0_45px_rgba(34,211,238,0.05)]"
          : theme === "dark"
            ? "border-emerald-400/70 shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_0_15px_rgba(34,197,94,0.28)]"
            : "border-slate-300 shadow-lg shadow-slate-300/40"
      }`}
    >
      <div className="overflow-hidden rounded-[1.65rem]">
        <img
          src={logoImage}
          alt="Secom ATLAS Centrale operativa"
          className="block w-full select-none object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
