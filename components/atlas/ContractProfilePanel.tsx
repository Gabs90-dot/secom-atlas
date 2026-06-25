"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Save,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

type ContractProfilePanelProps = {
  currentCustomer?: any | null;
  selectedSite?: any | null;
  currentLabel?: string;
  glpiEnabled?: boolean;
};

type ContractProfile = Record<string, any>;

type ContractField = {
  key: string;
  label: string;
  rows?: number;
  wide?: boolean;
};

const CONTRACT_FIELDS: ContractField[] = [
  { key: "category", label: "Categoria Cliente" },
  { key: "customer_type", label: "Tipologia Cliente", wide: true },
  { key: "duration_months", label: "Durata contratto (mesi)" },
  { key: "warranty_months", label: "Garanzia (mesi)" },
  { key: "phone_support", label: "Assistenza telefonica (Sì/No)" },
  { key: "preventive_onsite", label: "Intervento preventivo on site / ordinaria manutenzione", rows: 3, wide: true },
  { key: "extraordinary_onsite", label: "Intervento straordinario on site / su chiamata", rows: 3, wide: true },
  { key: "spare_parts_included", label: "Parti di ricambio incluse (Sì/No) - escluso consumabili", rows: 3, wide: true },
  { key: "blocking_response", label: "Risposta guasto bloccante (giorni)" },
  { key: "nonblocking_response", label: "Risposta anomalia non bloccante (giorni)" },
  { key: "pickup_shipping", label: "Servizio di ritiro e spedizione (Sì/No)" },
  { key: "service_hours", label: "Orario di servizio" },
  { key: "service_days", label: "Giorni di servizio" },
  { key: "drive_link", label: "Link dettaglio contratto (Drive Secom)", rows: 2, wide: true },
  { key: "commercial_notes", label: "Note commerciali", rows: 4, wide: true },
  { key: "summary", label: "Riassunto operativo", rows: 4, wide: true },
  { key: "aliases", label: "Alias ricerca", rows: 3, wide: true },
  { key: "keywords", label: "Keyword match", rows: 3, wide: true },
  { key: "match_priority", label: "Priorità match" },
];

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

function profileScore(profile: ContractProfile, haystack: string) {
  const text = normalize(haystack);
  const keywords = [
    profile.category,
    profile.customer_type,
    ...(profile.keywords || []),
    ...(profile.aliases || []),
  ]
    .map(normalize)
    .filter(Boolean);

  let score = Number(profile.match_priority || 0);

  for (const keyword of keywords) {
    if (!keyword) continue;
    if (` ${text} `.includes(` ${keyword} `)) score += 50;
    if (text.includes(keyword)) score += 20;
  }

  return score;
}

function makeDraft(profile: ContractProfile) {
  return {
    ...profile,
    aliases: Array.isArray(profile.aliases)
      ? profile.aliases.join(", ")
      : profile.aliases || "",
    keywords: Array.isArray(profile.keywords)
      ? profile.keywords.join(", ")
      : profile.keywords || "",
  };
}

export default function ContractProfilePanel({
  currentCustomer,
  selectedSite,
  currentLabel,
  glpiEnabled = true,
}: ContractProfilePanelProps) {
  const [profiles, setProfiles] = useState<ContractProfile[]>([]);
  const [linkedContract, setLinkedContract] = useState<any | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ContractProfile | null>(null);
  const [draft, setDraft] = useState<ContractProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");

  const glpiEntityId = glpiEnabled ? currentCustomer?.glpi_entity_id || selectedSite?.glpi_entity_id || null : null;

  const matchText = useMemo(
    () =>
      [
        currentLabel,
        currentCustomer?.name,
        currentCustomer?.complete_name,
        currentCustomer?.normalized_complete_name,
        currentCustomer?.contract_type,
        selectedSite?.name,
        selectedSite?.entity,
        selectedSite?.glpi_entity_path,
        selectedSite?.city,
      ]
        .filter(Boolean)
        .join(" "),
    [currentCustomer, selectedSite, currentLabel],
  );

  async function loadProfiles() {
    const response = await fetch("/api/admin/contract-profiles?activeOnly=false", {
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);
    setProfiles(json?.data || []);
  }

  async function loadLinkedContract() {
    if (!glpiEntityId) {
      setLinkedContract(null);
      return;
    }

    const response = await fetch(
      `/api/admin/customer-contract-links?glpiEntityId=${encodeURIComponent(glpiEntityId)}`,
      { cache: "no-store" },
    );

    const json = await response.json().catch(() => null);
    setLinkedContract(json?.data || null);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadLinkedContract();
  }, [glpiEntityId]);

  useEffect(() => {
    if (!profiles.length) return;

    const linkedProfile = linkedContract?.contract_profiles;
    if (linkedProfile?.id) {
      setSelectedProfile(linkedProfile);
      setDraft(makeDraft(linkedProfile));
      setSelectedContractId(linkedProfile.id);
      return;
    }

    const best = [...profiles]
      .map((profile) => ({ profile, score: profileScore(profile, matchText) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best?.score > 0) {
      setSelectedProfile(best.profile);
      setDraft(makeDraft(best.profile));
      setSelectedContractId(best.profile.id);
      return;
    }

    setSelectedProfile(null);
    setDraft(null);
    setSelectedContractId("");
  }, [profiles, linkedContract, matchText]);

  async function saveDraft() {
    if (!draft?.id) return;

    setSaving(true);

    try {
      const payload = {
        ...draft,
        aliases: parseArray(draft.aliases),
        keywords: parseArray(draft.keywords),
        match_priority: Number(draft.match_priority || 0),
      };

      const response = await fetch("/api/admin/contract-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Errore salvataggio contratto");
      }

      setSelectedProfile(json.data);
      setDraft(makeDraft(json.data));

      setProfiles((prev) =>
        prev.map((item) => (item.id === json.data.id ? json.data : item)),
      );

      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function saveLink() {
    if (!selectedContractId || !glpiEntityId) return;

    setLinking(true);

    try {
      const response = await fetch("/api/admin/customer-contract-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glpiEntityId,
          contractProfileId: selectedContractId,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Errore collegamento contratto");
      }

      setLinkedContract(json.data);
    } finally {
      setLinking(false);
    }
  }

  if (!profiles.length) {
    return (
      <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
        Nessun profilo contratto disponibile. Importa o crea i contratti nella sezione Contratti.
      </div>
    );
  }

  const source = editing ? draft : selectedProfile;

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="grid flex-1 gap-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              {glpiEnabled ? "Contratto collegato al cliente / entity GLPI" : "Contratto collegato al cliente / sede"}
            </span>

            <select
              value={selectedContractId}
              onChange={(event) => setSelectedContractId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none"
            >
              <option value="">Seleziona contratto...</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.customer_type || profile.category || profile.id}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={saveLink}
            disabled={!selectedContractId || !glpiEntityId || linking}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            <Link2 size={18} />
            {linking ? "Collego..." : "Collega contratto"}
          </button>
        </div>
      </div>

      {!source ? (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
          Nessun contratto selezionato.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                Dettaglio contratto / SLA
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                {source.customer_type}
              </h3>

              <p className="mt-1 text-sm font-bold text-slate-400">
                {source.category || "Categoria n/d"}
              </p>

              {source.summary && (
                <p className="mt-3 text-sm font-bold text-slate-200">
                  {source.summary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {source.drive_link && !editing && (
                <a
                  href={source.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
                >
                  <ExternalLink size={18} />
                  Apri allegato
                </a>
              )}

              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setDraft(makeDraft(selectedProfile || source));
                      setEditing(false);
                    }}
                    className="rounded-2xl bg-white/10 p-3 text-white"
                  >
                    <X size={18} />
                  </button>

                  <button
                    onClick={saveDraft}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    <Save size={18} />
                    {saving ? "Salvo..." : "Salva"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                >
                  <Pencil size={18} />
                  Modifica
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <InfoCard icon={Clock} label="Bloccante" value={source.blocking_response || "N/D"} />
            <InfoCard icon={Clock} label="Non bloccante" value={source.nonblocking_response || "N/D"} />
            <InfoCard icon={ShieldCheck} label="Garanzia" value={source.warranty_months || "N/D"} />
            <InfoCard icon={Truck} label="Ritiro/spedizione" value={source.pickup_shipping || "N/D"} />
            <InfoCard icon={FileText} label="Durata" value={source.duration_months || "N/D"} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {CONTRACT_FIELDS.map((field) => (
              <label key={field.key} className={field.wide ? "md:col-span-2" : ""}>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {field.label}
                </p>

                {editing ? (
                  <textarea
                    value={asText(draft?.[field.key])}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...(prev || {}),
                        [field.key]: event.target.value,
                      }))
                    }
                    rows={field.rows || 2}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                  />
                ) : (
                  <div className="min-h-[48px] rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm font-bold text-slate-200">
                    {asText(source[field.key]) || "—"}
                  </div>
                )}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <Icon className="mb-3 text-blue-300" size={20} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}
