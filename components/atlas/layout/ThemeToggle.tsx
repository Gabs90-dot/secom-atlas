"use client";

type ThemeToggleProps = {
  kind: "uiMode" | "colorTheme";
  theme: string;
  isExecutiveMode: boolean;
  onClick: () => void;
};

export default function ThemeToggle({ kind, theme, isExecutiveMode, onClick }: ThemeToggleProps) {
  if (kind === "uiMode") {
    return (
      <button
        onClick={onClick}
        className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
          isExecutiveMode
            ? "border-amber-200/30 bg-amber-300/15 text-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.14)]"
            : theme === "dark"
              ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
              : "border-blue-200 bg-blue-50 text-blue-700"
        }`}
      >
        {isExecutiveMode ? "Classic" : "Executive"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
        theme === "dark" ? "border-white/10 bg-white text-slate-900" : "border-slate-300 bg-slate-950 text-white"
      }`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
      <span className="ml-2 hidden md:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
