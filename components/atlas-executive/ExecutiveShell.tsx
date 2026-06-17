import type { ReactNode } from "react";
import ExecutiveHeader from "./ExecutiveHeader";
import ExecutiveSidebar from "./ExecutiveSidebar";

type ExecutiveView = "dashboard" | "analytics" | "webvime";

type ExecutiveShellProps = {
  children: ReactNode;
  view: ExecutiveView;
  onViewChange: (view: ExecutiveView) => void;
};

const pageCopy = {
  dashboard: {
    title: "ATLAS Executive Command",
    subtitle: "Panoramica mission control del tema Executive Command.",
  },
  analytics: {
    title: "Operational Intelligence",
    subtitle: "Vista executive su KPI, rischio, SLA, saturazione tecnica e trend.",
  },
  webvime: {
    title: "Webvime Signal Center",
    subtitle: "Registro Webvime reinterpretato come signal center operativo.",
  },
};

export default function ExecutiveShell({ children, view, onViewChange }: ExecutiveShellProps) {
  const copy = pageCopy[view];

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[#020713] text-white shadow-[0_28px_100px_rgba(0,0,0,0.48)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(251,191,36,0.11),transparent_28%),linear-gradient(135deg,#020713,#071321_48%,#030711)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex min-h-[calc(100vh-120px)]">
        <ExecutiveSidebar view={view} onViewChange={onViewChange} />
        <div className="min-w-0 flex-1">
          <ExecutiveHeader title={copy.title} subtitle={copy.subtitle} />
          <main className="p-5 md:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
