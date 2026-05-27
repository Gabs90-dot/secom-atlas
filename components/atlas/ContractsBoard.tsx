"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Info,
  Plus,
  Printer,
  Save,
  Search,
  X,
} from "lucide-react";

type ContractProfile = Record<string, any>;

type ContractField = {
  key: string;
  label: string;
  shortLabel: string;
  rows?: number;
  wide?: boolean;
};

const CONTRACT_FIELDS: ContractField[] = [
  { key: "category", label: "Categoria Cliente", shortLabel: "Categoria" },
  { key: "customer_type", label: "Tipologia Cliente", shortLabel: "Tipologia", wide: true },
  { key: "duration_months", label: "Durata contratto (mesi)", shortLabel: "Durata" },
  { key: "warranty_months", label: "Garanzia (mesi)", shortLabel: "Garanzia" },
  { key: "phone_support", label: "Assistenza telefonica (Sì/No)", shortLabel: "Telefono" },
  { key: "preventive_onsite", label: "Intervento preventivo on site / ordinaria manutenzione", shortLabel: "Preventivo", rows: 3, wide: true },
  { key: "extraordinary_onsite", label: "Intervento straordinario on site / su chiamata", shortLabel: "Straordinario", rows: 3, wide: true },
  { key: "spare_parts_included", label: "Parti di ricambio incluse (Sì/No) - escluso consumabili", shortLabel: "Ricambi", rows: 3, wide: true },
  { key: "blocking_response", label: "Risposta guasto bloccante (giorni)", shortLabel: "Bloccante" },
  { key: "nonblocking_response", label: "Risposta anomalia non bloccante (giorni)", shortLabel: "Non bloccante" },
  { key: "pickup_shipping", label: "Servizio di ritiro e spedizione (Sì/No)", shortLabel: "Ritiro/sped." },
  { key: "service_hours", label: "Orario di servizio", shortLabel: "Orario" },
  { key: "service_days", label: "Giorni di servizio", shortLabel: "Giorni" },
  { key: "drive_link", label: "Link dettaglio contratto (Drive Secom)", shortLabel: "Link", rows: 2, wide: true },
  { key: "commercial_notes", label: "Note commerciali", shortLabel: "Note", rows: 4, wide: true },
  { key: "summary", label: "Riassunto operativo", shortLabel: "Riassunto", rows: 4, wide: true },
  { key: "aliases", label: "Alias ricerca", shortLabel: "Alias", rows: 3, wide: true },
  { key: "keywords", label: "Keyword match", shortLabel: "Keyword", rows: 3, wide: true },
  { key: "match_priority", label: "Priorità match", shortLabel: "Priorità" },
];

const TABLE_FIELDS = CONTRACT_FIELDS.filter((field) =>
  [
    "category",
    "customer_type",
    "duration_months",
    "warranty_months",
    "phone_support",
    "preventive_onsite",
    "extraordinary_onsite",
    "spare_parts_included",
    "blocking_response",
    "nonblocking_response",
    "pickup_shipping",
    "service_hours",
    "service_days",
    "drive_link",
    "commercial_notes",
  ].includes(field.key),
);

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asText(value: any) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function parseArray(value: any) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function xmlEscape(value: any) {
  return asText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildXml(profiles: ContractProfile[]) {
  const rows = profiles
    .map((profile) => {
      const fields = TABLE_FIELDS.map(
        (field) => `    <${field.key}>${xmlEscape(profile[field.key])}</${field.key}>`,
      ).join("\n");

      return `  <contratto id="${xmlEscape(profile.id || "")}">\n${fields}\n  </contratto>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<contratti generated_at="${new Date().toISOString()}">\n${rows}\n</contratti>\n`;
}

function buildPrintableHtml(profiles: ContractProfile[]) {
  const header = TABLE_FIELDS.map(
    (field) => `<th>${xmlEscape(field.label)}</th>`,
  ).join("");

  const rows = profiles
    .map((profile) => {
      const cells = TABLE_FIELDS.map(
        (field) => `<td>${xmlEscape(profile[field.key]) || "—"}</td>`,
      ).join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Prospetto contratti ATLAS</title>
<style>
  body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
  h1 { margin: 0 0 6px; font-size: 22px; }
  p { margin: 0 0 18px; color: #4b5563; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; }
  th { background: #0f172a; color: white; text-align: left; padding: 8px; border: 1px solid #cbd5e1; }
  td { vertical-align: top; padding: 7px; border: 1px solid #cbd5e1; white-space: pre-wrap; }
  tr:nth-child(even) td { background: #f8fafc; }
  @page { size: A3 landscape; margin: 12mm; }
</style>
</head>
<body>
  <h1>SERVIZIO DI ASSISTENZA - SLA CONTRATTUALI</h1>
  <p>Prospetto esportato da ATLAS · ${new Date().toLocaleString("it-IT")}</p>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function openPrintWindow(profiles: ContractProfile[]) {
  const html = buildPrintableHtml(profiles);
  const win = window.open("", "_blank", "width=1400,height=900");

  if (!win) return;

  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

function emptyProfile() {
  return {
    category: "",
    customer_type: "Nuovo contratto",
    duration_months: "",
    warranty_months: "",
    phone_support: "SI",
    preventive_onsite: "",
    extraordinary_onsite: "",
    spare_parts_included: "",
    blocking_response: "",
    nonblocking_response: "",
    pickup_shipping: "",
    service_hours: "09:00/17:30",
    service_days: "Lun-Ven (festivi esclusi)",
    drive_link: "",
    commercial_notes: "",
    summary: "",
    aliases: [],
    keywords: [],
    match_priority: 50,
    is_active: true,
  };
}

export default function ContractsBoard() {
  const [profiles, setProfiles] = useState<ContractProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ContractProfile | null>(null);
  const [draft, setDraft] = useState<ContractProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);

  async function loadProfiles() {
    const response = await fetch("/api/admin/contract-profiles?activeOnly=false", {
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);
    setProfiles(json?.data || []);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(search);

    if (!q) return profiles;

    return profiles.filter((profile) =>
      normalize(
        [
          profile.category,
          profile.customer_type,
          profile.duration_months,
          profile.warranty_months,
          profile.phone_support,
          profile.preventive_onsite,
          profile.extraordinary_onsite,
          profile.spare_parts_included,
          profile.blocking_response,
          profile.nonblocking_response,
          profile.pickup_shipping,
          profile.service_hours,
          profile.service_days,
          profile.drive_link,
          profile.commercial_notes,
          profile.summary,
          asText(profile.aliases),
          asText(profile.keywords),
        ].join(" "),
      ).includes(q),
    );
  }, [profiles, search]);

  const selectedProfiles = useMemo(() => {
    if (selectedIds.size === 0) return filtered;
    return filtered.filter((profile) => selectedIds.has(String(profile.id)));
  }, [filtered, selectedIds]);

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((profile) => selectedIds.has(String(profile.id)));

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allFilteredSelected) {
        filtered.forEach((profile) => next.delete(String(profile.id)));
      } else {
        filtered.forEach((profile) => next.add(String(profile.id)));
      }

      return next;
    });
  }

  function toggleSelected(id: any) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  }

  function openProfile(profile: ContractProfile) {
    setSelected(profile);
    setDraft({
      ...profile,
      aliases: Array.isArray(profile.aliases) ? profile.aliases.join(", ") : profile.aliases || "",
      keywords: Array.isArray(profile.keywords) ? profile.keywords.join(", ") : profile.keywords || "",
    });
  }

  function newProfile() {
    const profile = emptyProfile();
    setSelected(profile);
    setDraft({
      ...profile,
      aliases: "",
      keywords: "",
    });
  }

  async function saveDraft() {
    if (!draft) return;

    setSaving(true);

    try {
      const payload = {
        ...draft,
        aliases: parseArray(draft.aliases),
        keywords: parseArray(draft.keywords),
        match_priority: Number(draft.match_priority || 0),
      };

      const method = (payload as any).id ? "PATCH" : "POST";

      const response = await fetch("/api/admin/contract-profiles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Errore salvataggio contratto");
      }

      await loadProfiles();
      setSelected(json.data);
      setDraft({
        ...json.data,
        aliases: Array.isArray(json.data.aliases) ? json.data.aliases.join(", ") : json.data.aliases || "",
        keywords: Array.isArray(json.data.keywords) ? json.data.keywords.join(", ") : json.data.keywords || "",
      });
    } finally {
      setSaving(false);
    }
  }

  function exportXml() {
    downloadFile(
      "atlas_prospetto_contratti.xml",
      buildXml(selectedProfiles),
      "application/xml;charset=utf-8",
    );
  }

  function exportPdf() {
    openPrintWindow(selectedProfiles);
  }

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
              ATLAS Contracts
            </p>

            <button
              type="button"
              title="Visione generale: apre il prospetto completo in stile Excel, con tutte le colonne della tabella SLA/assistenze."
              onClick={() => setOverviewOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25"
            >
              <Info size={16} />
            </button>
          </div>

          <h1 className="mt-2 text-3xl font-black text-white">
            Contratti, SLA e assistenze
          </h1>

          <p className="mt-1 text-sm font-bold text-slate-400">
            Prospetto operativo con tutte le colonne del file SLA Secom: consultabile, modificabile ed esportabile.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setOverviewOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-black text-white"
          >
            <Eye size={18} />
            Visione generale
          </button>

          <button
            onClick={exportXml}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white"
          >
            <Download size={18} />
            XML
          </button>

          <button
            onClick={exportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
          >
            <Printer size={18} />
            PDF
          </button>

          <button
            onClick={newProfile}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
          >
            <Plus size={18} />
            Nuovo
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca categoria, cliente, SLA, ricambi, note, garanzia..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs font-black text-slate-300">
          <span>{filtered.length} contratti visibili</span>
          <span className="text-slate-600">•</span>
          <span>{selectedIds.size || filtered.length} esportati</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[2200px] text-left text-sm">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                />
              </th>

              {TABLE_FIELDS.map((field) => (
                <th key={field.key} className="px-4 py-3">
                  {field.label}
                </th>
              ))}

              <th className="sticky right-0 bg-slate-950/90 px-4 py-3">Azioni</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((profile) => (
              <tr
                key={profile.id || profile.customer_type}
                className="border-t border-white/10 text-slate-200 hover:bg-blue-500/10"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(String(profile.id))}
                    onChange={() => toggleSelected(profile.id)}
                  />
                </td>

                {TABLE_FIELDS.map((field) => (
                  <td
                    key={field.key}
                    className={
                      field.key === "customer_type"
                        ? "max-w-[360px] px-4 py-3 font-black text-white"
                        : field.wide
                        ? "max-w-[420px] px-4 py-3"
                        : "px-4 py-3"
                    }
                  >
                    <div className={field.wide ? "line-clamp-3 whitespace-pre-wrap" : ""}>
                      {asText(profile[field.key]) || "—"}
                    </div>
                  </td>
                ))}

                <td className="sticky right-0 bg-[#081523] px-4 py-3">
                  <button
                    onClick={() => openProfile(profile)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                  >
                    <FileText size={15} />
                    Apri/modifica
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overviewOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="grid max-h-[94vh] w-full max-w-[96vw] gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  Visione generale
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Prospetto completo contratti / SLA
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Vista tipo file Excel. Selezione corrente: {selectedProfiles.length} contratti.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportXml}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white"
                >
                  <Download size={18} />
                  Esporta XML
                </button>

                <button
                  onClick={exportPdf}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
                >
                  <Printer size={18} />
                  Stampa / PDF
                </button>

                <button
                  onClick={() => setOverviewOpen(false)}
                  className="rounded-2xl bg-white/10 p-3 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-3xl border border-white/10">
              <table className="w-full min-w-[2200px] text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 text-slate-300">
                  <tr>
                    {TABLE_FIELDS.map((field) => (
                      <th key={field.key} className="px-3 py-3">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {selectedProfiles.map((profile) => (
                    <tr key={profile.id || profile.customer_type} className="border-t border-white/10">
                      {TABLE_FIELDS.map((field) => (
                        <td key={field.key} className="max-w-[360px] px-3 py-3 align-top text-slate-200">
                          <div className="whitespace-pre-wrap">
                            {asText(profile[field.key]) || "—"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selected && draft && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  Dettaglio contratto
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  {draft.customer_type}
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-400">
                  Tutti i campi sono modificabili anche dalla sezione Contratti.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "Salvo..." : "Salva"}
                </button>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-2xl bg-white/10 p-3 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {CONTRACT_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className={field.wide ? "md:col-span-2" : ""}
                >
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {field.label}
                  </p>

                  <textarea
                    value={asText(draft[field.key])}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...(prev || {}),
                        [field.key]: event.target.value,
                      }))
                    }
                    rows={field.rows || 2}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
