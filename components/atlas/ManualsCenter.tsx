"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Download, FileText, Pencil, Plus, RefreshCw, Save, Search, UploadCloud, X } from "lucide-react";

type ManualsCenterProps = {
  tenant: any | null;
  currentUser: any | null;
  customers?: any[];
  customerEntities?: any[];
};

type ManualRow = {
  id: string;
  tenant_id: string;
  customer_id?: string | null;
  customer_entity_id?: string | null;
  sector?: string | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  manual_date?: string | null;
  version?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_mime_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ManualForm = {
  id?: string;
  title: string;
  description: string;
  notes: string;
  manualDate: string;
  sector: string;
  version: string;
  customerId: string;
  customerEntityId: string;
};

const EMPTY_FORM: ManualForm = {
  title: "",
  description: "",
  notes: "",
  manualDate: new Date().toISOString().slice(0, 10),
  sector: "",
  version: "",
  customerId: "",
  customerEntityId: "",
};

function formatDate(value?: string | null) {
  if (!value) return "n/d";
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return String(value);
  }
}

function formatFileSize(value?: number | null) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function entityLabel(entity: any) {
  return (
    entity?.normalized_complete_name ||
    entity?.complete_name ||
    entity?.name ||
    "Entità senza nome"
  );
}

function customerName(customers: any[] = [], id?: string | null) {
  if (!id) return "Generale";
  return customers.find((item) => String(item.id) === String(id))?.name || "Cliente";
}

function entityName(entities: any[] = [], id?: string | null) {
  if (!id) return "Tutte le sedi";
  const entity = entities.find((item) => String(item.id) === String(id));
  return entityLabel(entity);
}

export default function ManualsCenter({ tenant, currentUser, customers = [], customerEntities = [] }: ManualsCenterProps) {
  const [manuals, setManuals] = useState<ManualRow[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ManualForm>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredEntities = useMemo(() => {
    if (!form.customerId) return customerEntities;

    const selectedCustomer = customers.find((item) => String(item.id) === String(form.customerId));
    const tenantId = selectedCustomer?.tenant_id || tenant?.id;

    return customerEntities.filter((entity) => {
      if (entity?.tenant_id && tenantId && String(entity.tenant_id) !== String(tenantId)) return false;
      return true;
    });
  }, [form.customerId, customerEntities, customers, tenant?.id]);

  const filteredManuals = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return manuals;

    return manuals.filter((manual) => {
      const text = `${manual.title} ${manual.description || ""} ${manual.notes || ""} ${manual.sector || ""} ${manual.version || ""} ${manual.file_name || ""} ${customerName(customers, manual.customer_id)} ${entityName(customerEntities, manual.customer_entity_id)}`.toLowerCase();
      return text.includes(q);
    });
  }, [manuals, search, customers, customerEntities]);

  async function loadManuals() {
    if (!tenant?.id) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("manuals")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message || "Errore caricamento manuali.");
      setManuals([]);
      setLoading(false);
      return;
    }

    setManuals((data || []) as ManualRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadManuals();
  }, [tenant?.id]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFile(null);
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(manual: ManualRow) {
    setForm({
      id: manual.id,
      title: manual.title || "",
      description: manual.description || "",
      notes: manual.notes || "",
      manualDate: manual.manual_date || new Date().toISOString().slice(0, 10),
      sector: manual.sector || "",
      version: manual.version || "",
      customerId: manual.customer_id || "",
      customerEntityId: manual.customer_entity_id || "",
    });
    setFile(null);
    setMessage("");
    setFormOpen(true);
  }

  async function saveManual() {
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
      let fileData: Partial<ManualRow> = {};

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${tenant.id}/manuals/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("atlas-manuals")
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        fileData = {
          file_path: path,
          file_name: file.name,
          file_mime_type: file.type || null,
          file_size: file.size,
        };
      }

      const payload = {
        tenant_id: tenant.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        manual_date: form.manualDate || null,
        sector: form.sector.trim() || null,
        version: form.version.trim() || null,
        customer_id: form.customerId || null,
        customer_entity_id: form.customerEntityId || null,
        updated_at: new Date().toISOString(),
        ...fileData,
      };

      const query = form.id
        ? supabase.from("manuals").update(payload).eq("id", form.id).eq("tenant_id", tenant.id).select().single()
        : supabase.from("manuals").insert([{ ...payload, created_by: currentUser?.user_id || currentUser?.id || null }]).select().single();

      const { data, error } = await query;
      if (error) throw error;

      setManuals((prev) => {
        const exists = prev.some((item) => item.id === data.id);
        return exists ? prev.map((item) => (item.id === data.id ? data : item)) : [data, ...prev];
      });

      setFormOpen(false);
      setFile(null);
      setMessage(form.id ? "Manuale aggiornato." : "Manuale creato.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Errore salvataggio manuale.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadManual(manual: ManualRow) {
    if (!manual.file_path) return;

    const { data, error } = await supabase.storage
      .from("atlas-manuals")
      .createSignedUrl(manual.file_path, 60 * 5);

    if (error || !data?.signedUrl) {
      setMessage(error?.message || "Impossibile aprire l'allegato.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!tenant?.id) {
    return (
      <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-black">Tenant non configurato</p>
        <p className="mt-2 text-sm font-bold text-amber-200/80">Seleziona un tenant prima di gestire i manuali.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">ATLAS KNOWLEDGE</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Manuali</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Archivio documentale operativo: manuali tecnici, procedure, allegati, note e versioni per settore o cliente.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5"
          >
            <Plus size={18} /> Nuovo manuale
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <BookOpen className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{manuals.length}</p>
            <p className="text-sm font-bold text-slate-400">Manuali totali</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <FileText className="mb-3 text-emerald-300" size={22} />
            <p className="text-3xl font-black text-white">{manuals.filter((item) => item.file_path).length}</p>
            <p className="text-sm font-bold text-slate-400">Con allegato</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <RefreshCw className="mb-3 text-violet-300" size={22} />
            <p className="text-3xl font-black text-white">{new Set(manuals.map((item) => item.sector).filter(Boolean)).size}</p>
            <p className="text-sm font-bold text-slate-400">Settori</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <UploadCloud className="mb-3 text-amber-300" size={22} />
            <p className="text-3xl font-black text-white">{manuals.filter((item) => item.customer_entity_id).length}</p>
            <p className="text-sm font-bold text-slate-400">Associati a sede</p>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-black text-blue-100">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Archivio</p>
            <h3 className="mt-1 text-2xl font-black text-white">Documentazione operativa</h3>
          </div>
          <button onClick={loadManuals} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-slate-300 hover:bg-white/[0.1]">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca titolo, settore, cliente, note, versione..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-sm font-bold text-white outline-none"
          />
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">Caricamento manuali...</div>
          ) : filteredManuals.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">Nessun manuale trovato.</div>
          ) : (
            filteredManuals.map((manual) => (
              <article key={manual.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {manual.sector && <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-black text-blue-200">{manual.sector}</span>}
                      {manual.version && <span className="rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-black text-violet-200">v{manual.version}</span>}
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-slate-300">{formatDate(manual.manual_date)}</span>
                    </div>
                    <h4 className="mt-3 text-xl font-black text-white">{manual.title}</h4>
                    <p className="mt-2 text-sm font-bold text-slate-400">{manual.description || "Nessuna descrizione."}</p>
                    {manual.notes && <p className="mt-2 text-xs font-bold text-slate-500">Note: {manual.notes}</p>}
                    <p className="mt-3 text-xs font-black text-slate-500">
                      {customerName(customers, manual.customer_id)} · {entityName(customerEntities, manual.customer_entity_id)}
                    </p>
                    {manual.file_name && (
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        Allegato: {manual.file_name} {manual.file_size ? `· ${formatFileSize(manual.file_size)}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {manual.file_path && (
                      <button onClick={() => downloadManual(manual)} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black text-white hover:bg-white/[0.1]">
                        <Download size={16} /> Apri
                      </button>
                    )}
                    <button onClick={() => openEdit(manual)} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white">
                      <Pencil size={16} /> Modifica
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Manuale operativo</p>
                <h3 className="mt-2 text-2xl font-black text-white">{form.id ? "Modifica manuale" : "Nuovo manuale"}</h3>
              </div>
              <button onClick={() => setFormOpen(false)} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titolo" className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none md:col-span-2" />
              <input value={form.sector} onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))} placeholder="Settore / Categoria" className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" />
              <input value={form.version} onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))} placeholder="Versione" className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" />
              <input type="date" value={form.manualDate} onChange={(event) => setForm((prev) => ({ ...prev, manualDate: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none" />
              <select value={form.customerId} onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value, customerEntityId: "" }))} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none">
                <option value="" className="bg-slate-900 text-white">Cliente generale / non associato</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} className="bg-slate-900 text-white">{customer.name}</option>
                ))}
              </select>
              <select value={form.customerEntityId} onChange={(event) => setForm((prev) => ({ ...prev, customerEntityId: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none md:col-span-2">
                <option value="" className="bg-slate-900 text-white">Tutte le sedi / nessuna sede specifica</option>
                {filteredEntities.map((entity) => (
                  <option key={entity.id} value={entity.id} className="bg-slate-900 text-white">{entityLabel(entity)}</option>
                ))}
              </select>
              <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Descrizione" rows={4} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none md:col-span-2" />
              <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Note interne / aggiornamenti" rows={4} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none md:col-span-2" />
              <label className="grid gap-2 rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-4 text-sm font-bold text-slate-300 md:col-span-2">
                Allegato documento
                <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className="text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" />
                <span className="text-xs text-slate-500">Se modifichi un manuale e non scegli un nuovo file, resta valido l'allegato precedente.</span>
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setFormOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white">Annulla</button>
              <button onClick={saveManual} disabled={saving} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60">
                <Save size={18} /> {saving ? "Salvataggio..." : "Salva manuale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
