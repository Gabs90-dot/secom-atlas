type NetworkNode = {
  label: string;
  city?: string;
  x?: number;
  y?: number;
  status?: "ok" | "warning" | "critical";
};

type ExecutiveNetworkMapProps = {
  nodes?: NetworkNode[];
  stats?: {
    sites?: number;
    critical?: number;
    offline?: number;
    uptime?: string;
  };
};

const fallbackNodes: NetworkNode[] = [
  { label: "Roma", x: 48, y: 54, status: "ok" },
  { label: "Milano", x: 38, y: 35, status: "ok" },
  { label: "Torino", x: 31, y: 42, status: "ok" },
  { label: "Napoli", x: 53, y: 68, status: "warning" },
  { label: "Bari", x: 60, y: 74, status: "critical" },
  { label: "Palermo", x: 43, y: 84, status: "ok" },
];

const toneClass = {
  ok: "bg-emerald-300 shadow-emerald-300/50",
  warning: "bg-amber-300 shadow-amber-300/50",
  critical: "bg-rose-300 shadow-rose-300/50",
};

function normalizeNodes(nodes: NetworkNode[] = []) {
  const useful = nodes.filter((node) => node.label).slice(0, 8);
  if (useful.length === 0) return fallbackNodes;

  return useful.map((node, index) => ({
    ...node,
    x: node.x ?? [48, 38, 31, 53, 60, 43, 68, 28][index % 8],
    y: node.y ?? [54, 35, 42, 68, 74, 84, 46, 60][index % 8],
    status: node.status ?? "ok",
  }));
}

export default function ExecutiveNetworkMap({ nodes = [], stats }: ExecutiveNetworkMapProps) {
  const mapped = normalizeNodes(nodes);
  const hub = mapped[0] || fallbackNodes[0];
  const safeStats = {
    sites: stats?.sites ?? mapped.length,
    critical: stats?.critical ?? mapped.filter((node) => node.status === "critical").length,
    offline: stats?.offline ?? 0,
    uptime: stats?.uptime ?? "98.7%",
  };

  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#06101d] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_65%_68%,rgba(251,191,36,0.12),transparent_22%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

      <svg className="absolute inset-0 h-full w-full opacity-55" viewBox="0 0 100 100" preserveAspectRatio="none">
        {mapped.slice(1).map((node) => (
          <path
            key={`${hub.label}-${node.label}`}
            d={`M${hub.x} ${hub.y} C ${(hub.x! + node.x!) / 2} ${Math.min(hub.y!, node.y!) - 8} ${(hub.x! + node.x!) / 2} ${Math.max(hub.y!, node.y!) + 8} ${node.x} ${node.y}`}
            stroke={node.status === "critical" ? "rgba(251,113,133,0.52)" : node.status === "warning" ? "rgba(251,191,36,0.52)" : "rgba(34,211,238,0.48)"}
            strokeWidth="0.32"
            fill="none"
          />
        ))}
      </svg>

      {mapped.map((node, index) => (
        <div key={`${node.label}-${index}`} className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
          <div className={`${index === 0 ? "h-5 w-5" : "h-4 w-4"} rounded-full ${toneClass[node.status || "ok"]} shadow-[0_0_22px_currentColor]`} />
          <span className="absolute left-5 top-[-4px] whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-white/72">
            {node.label}
          </span>
        </div>
      ))}

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/60">Operational Network</p>
          <h3 className="mt-1 text-xl font-black text-white">Mappa sedi operative</h3>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
          Live
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 grid grid-cols-4 gap-3">
        {[
          [String(safeStats.sites), "Sedi"],
          [String(safeStats.critical), "Criticità"],
          [String(safeStats.offline), "Offline"],
          [safeStats.uptime, "Uptime"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-xl">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
