"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileDown, FileText, Package, Plus, RefreshCw, Save, Search, Trash2, UploadCloud, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DownloadCenterProps = {
  tenant: any | null;
  currentUser: any | null;
  assets?: any[];
  executiveMode?: boolean;
};

type DownloadRow = {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  version?: string | null;
  resource_date?: string | null;
  asset_key?: string | null;
  asset_name?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DownloadForm = {
  id?: string;
  title: string;
  description: string;
  version: string;
  resourceDate: string;
  assetKey: string;
};

const EMPTY_FORM: DownloadForm = {
  title: "",
  description: "",
  version: "1.0",
  resourceDate: new Date().toISOString().slice(0, 10),
  assetKey: "",
};

const BUCKET = "atlas-downloads";

function formatDate(value?: string | null) {
  if (!value) return "n/d";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("it-IT");
}

function formatFileSize(value?: number | null) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function assetLabel(asset: any) {
  return asset?.name || asset?.label || asset?.title || asset?.id || "Asset";
}

function assetKey(asset: any) {
  return String(asset?.id || asset?.key || asset?.code || assetLabel(asset));
}

export default function DownloadCenter({ tenant, currentUser, assets = [], executiveMode = false }: DownloadCenterProps) {
  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DownloadForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isManager = ["super_admin", "admin", "manager", "dispatcher"].includes(String(currentUser?.role || ""));
  const safeAssets = useMemo(() => (Array.isArray(assets) ? assets : Object.values(assets || {})), [assets]);

  const filteredRows = useMemo(() => {
    const q = normalize(search);
    if (!q) return rows;
    return rows.filter((row) =>
      normalize(`${row.title} ${row.description || ""} ${row.version || ""} ${row.asset_name || ""} ${row.file_name || ""}`).includes(q),
    );
  }, [rows, search]);

  async function loadRows() {
    if (!tenant?.id) return;
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("download_resources")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      setRows([]);
      setMessage(error.message || "Errore caricamento download. Verifica tabella download_resources e policy Supabase.");
      setLoading(false);
      return;
    }

    setRows((data || []) as DownloadRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, [tenant?.id]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFile(null);
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(row: DownloadRow) {
    setForm({
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      version: row.version || "1.0",
      resourceDate: row.resource_date || new Date().toISOString().slice(0, 10),
      assetKey: row.asset_key || "",
    });
    setFile(null);
    setMessage("");
    setFormOpen(true);
  }

  async function saveResource() {
    if (!tenant?.id) {
      setMessage("Tenant non configurato.");
      return;
    }

    if (!form.title.trim()) {
      setMessage("Il titolo è obbligatorio.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const selectedAsset = safeAssets.find((asset) => assetKey(asset) === form.assetKey);
      let fileData: Partial<DownloadRow> = {};

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${tenant.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;

        fileData = {
          file_path: path,
          file_name: file.name,
          file_mime_type: file.type || null,
          file_size: file.size,
        };
      }

      const payload: Partial<DownloadRow> = {
        tenant_id: tenant.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        version: form.version.trim() || null,
        resource_date: form.resourceDate || null,
        asset_key: form.assetKey || null,
        asset_name: selectedAsset ? assetLabel(selectedAsset) : null,
        created_by: currentUser?.email || currentUser?.display_name || null,
        updated_at: new Date().toISOString(),
        ...fileData,
      };

      const request = form.id
        ? supabase.from("download_resources").update(payload).eq("id", form.id).eq("tenant_id", tenant.id)
        : supabase.from("download_resources").insert([{ ...payload, created_at: new Date().toISOString() }]);

      const { error } = await request;
      if (error) throw error;

      setFormOpen(false);
      setFile(null);
      setForm(EMPTY_FORM);
      setMessage("Download salvato.");
      await loadRows();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Errore salvataggio download.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadFile(row: DownloadRow) {
    if (!row.file_path) {
      setMessage("Nessun file associato a questa risorsa.");
      return;
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.file_path, 60);
    if (error || !data?.signedUrl) {
      setMessage(error?.message || "Errore creazione link download.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteResource(row: DownloadRow) {
    if (!tenant?.id || !row.id) return;
    if (!window.confirm(`Eliminare il download "${row.title}"?`)) return;

    try {
      const { error } = await supabase.from("download_resources").delete().eq("id", row.id).eq("tenant_id", tenant.id);
      if (error) throw error;
      if (row.file_path) {
        await supabase.storage.from(BUCKET).remove([row.file_path]);
      }
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      setMessage("Download eliminato.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Errore eliminazione download.");
    }
  }

  if (!tenant?.id) {
    return (
      <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-black">Tenant non configurato</p>
        <p className="mt-2 text-sm font-bold text-amber-200/80">Seleziona un tenant prima di gestire i download tecnici.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className={`${executiveMode ? "rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(135deg,rgba(2,7,19,0.96),rgba(7,19,33,0.92))] shadow-[0_28px_100px_rgba(0,0,0,0.34)]" : "rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/20"} p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Gestione file tecnici</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Download Center</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-400">
              Carica documenti, driver, procedure, firmware o file utili da mettere a disposizione dei tecnici.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadRows} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Aggiorna
            </button>
            {isManager && (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(37,99,235,0.24)]">
                <Plus size={17} /> Nuovo download
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">{message}</div>
        )}
      </div>

      {formOpen && isManager && (
        <div className="rounded-[2rem] border border-cyan-300/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Upload risorsa</p>
              <h3 className="mt-2 text-2xl font-black text-white">{form.id ? "Modifica download" : "Nuovo download tecnico"}</h3>
            </div>
            <button onClick={() => setFormOpen(false)} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15"><X size={20} /></button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 font-bold text-white outline-none focus:border-cyan-300/40" placeholder="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 font-bold text-white outline-none focus:border-cyan-300/40" placeholder="Versione es. 1.0 / 2026.06" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <input type="date" className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 font-bold text-white outline-none focus:border-cyan-300/40" value={form.resourceDate} onChange={(e) => setForm({ ...form, resourceDate: e.target.value })} />
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 font-bold text-white outline-none focus:border-cyan-300/40" value={form.assetKey} onChange={(e) => setForm({ ...form, assetKey: e.target.value })}>
              <option value="">Asset generico / tutti</option>
              {safeAssets.map((asset) => (
                <option key={assetKey(asset)} value={assetKey(asset)}>{assetLabel(asset)}</option>
              ))}
            </select>
            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/50 p-3 font-bold text-white outline-none focus:border-cyan-300/40 lg:col-span-2" placeholder="Descrizione, note operative, quando usarlo..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-cyan-300/25 bg-cyan-300/5 p-6 text-center text-cyan-100 lg:col-span-2">
              <UploadCloud size={28} />
              <span className="text-sm font-black">{file ? file.name : "Carica file dal computer"}</span>
              <span className="text-xs font-semibold text-slate-500">PDF, DOCX, XLSX, ZIP, driver, immagini, procedure</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button disabled={saving} onClick={saveResource} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
              <Save size={17} /> {saving ? "Salvataggio..." : "Salva download"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Archivio tecnico</p>
            <h3 className="mt-2 text-2xl font-black text-white">File disponibili</h3>
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-400 md:min-w-[360px]">
            <Search size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca titolo, asset, versione..." className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>

        <div className="grid gap-3">
          {filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-10 text-center text-slate-400">
              <FileText className="mx-auto mb-3" size={30} />
              {loading ? "Caricamento download..." : "Nessun file disponibile."}
            </div>
          ) : (
            filteredRows.map((row) => (
              <div key={row.id} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-cyan-300/20 hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{row.version || "v n/d"}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{formatDate(row.resource_date)}</span>
                      {row.asset_name && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100"><Package size={12} className="inline" /> {row.asset_name}</span>}
                    </div>
                    <h4 className="truncate text-xl font-black text-white">{row.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-400">{row.description || "Nessuna descrizione."}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{row.file_name || "Nessun file"} {row.file_size ? `· ${formatFileSize(row.file_size)}` : ""}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => downloadFile(row)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                      <FileDown size={17} /> Scarica
                    </button>
                    {isManager && (
                      <>
                        <button onClick={() => openEdit(row)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]">Modifica</button>
                        <button onClick={() => deleteResource(row)} className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-500/20">
                          <Trash2 size={17} /> Elimina
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
