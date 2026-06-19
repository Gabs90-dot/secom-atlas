"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Download,
  FileArchive,
  FileDown,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  DOWNLOAD_CATEGORIES,
  DOWNLOAD_STATUSES,
  DOWNLOAD_VISIBILITIES,
  type DownloadCategory,
  type DownloadLibraryRow,
  type DownloadStatus,
  type DownloadVisibility,
} from "@/lib/downloadLibrary";
import { isCustomerRole } from "@/lib/auth";

type TenantLike = {
  id?: string | null;
};

type UserLike = {
  id?: string | null;
  role?: string | null;
  customerId?: string | null;
};

type CustomerLike = {
  id?: string | null;
  name?: string | null;
};

type DownloadCenterProps = {
  tenant: TenantLike | null;
  currentUser: UserLike | null;
  customers?: CustomerLike[];
  executiveMode?: boolean;
};

type DownloadForm = {
  id: string;
  title: string;
  description: string;
  category: DownloadCategory;
  productModel: string;
  version: string;
  releaseDate: string;
  notes: string;
  tags: string;
  status: DownloadStatus;
  visibility: DownloadVisibility;
  customerId: string;
};

type SortKey = "updated" | "title" | "category" | "downloads";

const EMPTY_FORM: DownloadForm = {
  id: "",
  title: "",
  description: "",
  category: "Altro",
  productModel: "",
  version: "",
  releaseDate: new Date().toISOString().slice(0, 10),
  notes: "",
  tags: "",
  status: "active",
  visibility: "internal",
  customerId: "",
};

const STATUS_LABELS: Record<DownloadStatus, string> = {
  active: "Active",
  beta: "Beta",
  obsolete: "Obsoleto",
  archived: "Archiviato",
};

const VISIBILITY_LABELS: Record<DownloadVisibility, string> = {
  internal: "Interno",
  customer: "Cliente",
  restricted: "Riservato",
};

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "n/d";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("it-IT");
}

function formatFileSize(value?: number | null) {
  if (!value) return "n/d";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function customerName(customers: CustomerLike[], customerId?: string | null) {
  if (!customerId) return "";
  return customers.find((customer) => customer.id === customerId)?.name || "Cliente associato";
}

function buildFormData(tenantId: string, form: DownloadForm, file: File | null) {
  const formData = new FormData();
  formData.set("tenantId", tenantId);
  if (form.id) formData.set("id", form.id);
  formData.set("title", form.title);
  formData.set("description", form.description);
  formData.set("category", form.category);
  formData.set("productModel", form.productModel);
  formData.set("version", form.version);
  formData.set("releaseDate", form.releaseDate);
  formData.set("notes", form.notes);
  formData.set("tags", form.tags);
  formData.set("status", form.status);
  formData.set("visibility", form.visibility);
  formData.set("customerId", form.customerId);
  if (file) formData.set("file", file);
  return formData;
}

export default function DownloadCenter({
  tenant,
  currentUser,
  customers = [],
  executiveMode = false,
}: DownloadCenterProps) {
  const [rows, setRows] = useState<DownloadLibraryRow[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | DownloadCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DownloadStatus>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | DownloadVisibility>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DownloadForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const role = String(currentUser?.role || "");
  const tenantId = String(tenant?.id || "");
  const isCustomer = isCustomerRole(role);
  const canWrite = ["super_admin", "admin", "manager"].includes(role);
  const canDelete = ["super_admin", "admin"].includes(role);

  async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadRows() {
    if (!tenantId) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/downloads?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: await authHeaders(),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: DownloadLibraryRow[];
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Errore caricamento download.");
      }

      setRows(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setRows([]);
      setError(loadError instanceof Error ? loadError.message : "Errore caricamento download.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [tenantId]);

  const filteredRows = useMemo(() => {
    const q = normalize(search);
    const filtered = rows.filter((row) => {
      const matchesText =
        !q ||
        normalize(
          [
            row.title,
            row.description,
            row.category,
            row.product_model,
            row.version,
            row.file_name,
            row.notes,
            row.tags?.join(" "),
            customerName(customers, row.customer_id),
          ].join(" "),
        ).includes(q);
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesVisibility = visibilityFilter === "all" || row.visibility === visibilityFilter;
      return matchesText && matchesCategory && matchesStatus && matchesVisibility;
    });

    return filtered.sort((left, right) => {
      if (sortKey === "title") return left.title.localeCompare(right.title);
      if (sortKey === "category") return left.category.localeCompare(right.category);
      if (sortKey === "downloads") return Number(right.download_count || 0) - Number(left.download_count || 0);
      return new Date(right.updated_at || right.created_at).getTime() - new Date(left.updated_at || left.created_at).getTime();
    });
  }, [rows, search, categoryFilter, statusFilter, visibilityFilter, sortKey, customers]);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      customer: rows.filter((row) => row.visibility === "customer").length,
      downloads: rows.reduce((sum, row) => sum + Number(row.download_count || 0), 0),
    }),
    [rows],
  );

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      visibility: isCustomer ? "customer" : "internal",
      customerId: isCustomer ? String(currentUser?.customerId || "") : "",
    });
    setFile(null);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(row: DownloadLibraryRow) {
    setForm({
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      category: row.category || "Altro",
      productModel: row.product_model || "",
      version: row.version || "",
      releaseDate: row.release_date || new Date().toISOString().slice(0, 10),
      notes: row.notes || "",
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : "",
      status: row.status || "active",
      visibility: row.visibility || "internal",
      customerId: row.customer_id || "",
    });
    setFile(null);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  async function saveDownload() {
    if (!tenantId) {
      setError("Tenant non configurato.");
      return;
    }

    if (!form.title.trim()) {
      setError("Il titolo e obbligatorio.");
      return;
    }

    if (!form.id && !file) {
      setError("Seleziona un file da caricare.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/downloads", {
        method: form.id ? "PATCH" : "POST",
        headers: await authHeaders(),
        body: buildFormData(tenantId, form, file),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: DownloadLibraryRow;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Errore salvataggio download.");
      }

      setRows((current) => {
        const next = current.filter((row) => row.id !== payload.data?.id);
        return [payload.data as DownloadLibraryRow, ...next];
      });
      setFormOpen(false);
      setFile(null);
      setMessage(form.id ? "Download aggiornato." : "Download creato.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Errore salvataggio download.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadRow(row: DownloadLibraryRow) {
    if (!tenantId) return;
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/downloads/${encodeURIComponent(row.id)}/download?tenantId=${encodeURIComponent(tenantId)}`,
        { headers: await authHeaders() },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        signedUrl?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.signedUrl) {
        throw new Error(payload.error || "Errore creazione link temporaneo.");
      }

      const link = document.createElement("a");
      link.href = payload.signedUrl;
      link.download = payload.fileName || row.file_name || "download";
      link.rel = "noopener noreferrer";
      link.click();
      setRows((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, download_count: Number(item.download_count || 0) + 1 } : item,
        ),
      );
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Errore download.");
    }
  }

  async function deleteRow(row: DownloadLibraryRow) {
    if (!tenantId) return;
    if (!window.confirm(`Eliminare "${row.title}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/downloads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ tenantId, id: row.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Errore eliminazione download.");
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage("Download eliminato.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Errore eliminazione download.");
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  if (!tenantId) {
    return (
      <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-black">Tenant non configurato</p>
        <p className="mt-2 text-sm font-bold text-amber-200/80">Seleziona un tenant prima di aprire il repository Download.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className={`${executiveMode ? "rounded-[34px] border border-cyan-300/10 bg-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,0.26)]" : "rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/20"} p-5 md:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Repository aziendale</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Download</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-400">
              Firmware, driver, software, utility, configurazioni, certificati, template e pacchetti tecnici.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadRows} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Aggiorna
            </button>
            {canWrite && (
              <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                <Plus size={17} /> Nuovo download
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Totali", kpis.total],
            ["Attivi", kpis.active],
            ["Clienti", kpis.customer],
            ["Download", kpis.downloads],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {(message || error) && (
          <div className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${error ? "border-red-300/20 bg-red-500/10 text-red-100" : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"}`}>
            {error || message}
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-400">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca titolo, modello, versione, tag..." className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:flex">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | DownloadCategory)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm font-bold text-white outline-none">
              <option value="all">Tutte le categorie</option>
              {DOWNLOAD_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | DownloadStatus)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm font-bold text-white outline-none">
              <option value="all">Tutti gli stati</option>
              {DOWNLOAD_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
            </select>
            {!isCustomer && (
              <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as "all" | DownloadVisibility)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm font-bold text-white outline-none">
                <option value="all">Tutte le visibilita</option>
                {DOWNLOAD_VISIBILITIES.map((visibility) => <option key={visibility} value={visibility}>{VISIBILITY_LABELS[visibility]}</option>)}
              </select>
            )}
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm font-bold text-white outline-none">
              <option value="updated">Aggiornati</option>
              <option value="title">Titolo</option>
              <option value="category">Categoria</option>
              <option value="downloads">Download</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-8 text-center text-sm font-bold text-slate-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={28} /> Caricamento download...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-8 text-center text-sm font-bold text-slate-400">
              <FileArchive className="mx-auto mb-3" size={30} /> Nessun file disponibile.
            </div>
          ) : (
            filteredRows.map((row) => (
              <article key={row.id} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-cyan-300/20 hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">{row.category}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{STATUS_LABELS[row.status]}</span>
                      {!isCustomer && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">{VISIBILITY_LABELS[row.visibility]}</span>}
                    </div>
                    <h3 className="truncate text-xl font-black text-white">{row.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-400">{row.description || "Nessuna descrizione."}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {row.file_name} · {formatFileSize(row.file_size)} · {row.version ? `v${row.version}` : "versione n/d"} · {formatDate(row.release_date || row.updated_at)}
                      {row.product_model ? ` · ${row.product_model}` : ""}
                      {row.customer_id && !isCustomer ? ` · ${customerName(customers, row.customer_id)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void downloadRow(row)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                      <FileDown size={17} /> Scarica
                    </button>
                    {canWrite && (
                      <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]">
                        <Pencil size={16} /> Modifica
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => void deleteRow(row)} className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-500/20">
                        <Trash2 size={17} /> Elimina
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {formOpen && canWrite && (
        <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-8 backdrop-blur-sm">
          <div className="grid max-h-[92vh] w-full max-w-5xl gap-4 overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Upload download</p>
                <h3 className="mt-2 text-2xl font-black">{form.id ? "Modifica download" : "Nuovo download"}</h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15"><X size={20} /></button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" placeholder="Titolo" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <select className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as DownloadCategory }))}>
                {DOWNLOAD_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <input className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" placeholder="Modello compatibile" value={form.productModel} onChange={(event) => setForm((current) => ({ ...current, productModel: event.target.value }))} />
              <input className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" placeholder="Versione" value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} />
              <input type="date" className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" value={form.releaseDate} onChange={(event) => setForm((current) => ({ ...current, releaseDate: event.target.value }))} />
              <input className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" placeholder="Tag separati da virgola" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
              <select className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DownloadStatus }))}>
                {DOWNLOAD_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
              <select className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as DownloadVisibility }))}>
                {DOWNLOAD_VISIBILITIES.map((visibility) => <option key={visibility} value={visibility}>{VISIBILITY_LABELS[visibility]}</option>)}
              </select>
              <select className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none lg:col-span-2" value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}>
                <option value="">Nessun cliente associato</option>
                {customers.map((customer) => customer.id ? <option key={customer.id} value={customer.id}>{customer.name || customer.id}</option> : null)}
              </select>
              <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none lg:col-span-2" placeholder="Descrizione" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <textarea className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none lg:col-span-2" placeholder="Note tecniche" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed p-7 text-center lg:col-span-2 ${dragging ? "border-cyan-200 bg-cyan-300/15" : "border-cyan-300/25 bg-cyan-300/5"}`}
              >
                <UploadCloud size={30} />
                <span className="text-sm font-black">{file ? file.name : form.id ? "Trascina un nuovo file per sostituire quello esistente" : "Trascina qui il file o selezionalo"}</span>
                <span className="text-xs font-semibold text-slate-500">ZIP, firmware, driver, utility, configurazioni, certificati, moduli e template.</span>
                <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white hover:bg-white/[0.1]">Annulla</button>
              <button type="button" disabled={saving} onClick={() => void saveDownload()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60">
                <Save size={18} /> {saving ? "Salvataggio..." : "Salva download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
