"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CustomerOption = {
  id: string;
  name: string;
};

type EntityOption = {
  id: string;
  customerId: string;
  name: string;
  completeName: string;
  glpiEntityId?: string | number | null;
};

type RegistrationCode = {
  id: string;
  customer_id: string;
  customer_entity_id: string;
  site_id?: string | null;
  code: string;
  label?: string | null;
  max_uses?: number | null;
  used_count?: number | null;
  is_active?: boolean | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  created_at?: string | null;
  customerName?: string | null;
  entityName?: string | null;
  entityCompleteName?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Nessuna";
  try {
    return new Date(value).toLocaleDateString("it-IT");
  } catch {
    return String(value);
  }
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function CustomerInviteCodeCenter() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [entitySearch, setEntitySearch] = useState("");
  const [entityResults, setEntityResults] = useState<EntityOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingEntities, setSearchingEntities] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  async function apiFetch(path: string, init?: RequestInit) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("Sessione scaduta. Fai logout/login e riprova.");
    }

    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result?.ok === false) {
      throw new Error(result?.error || "Errore richiesta codici invito.");
    }

    return result;
  }

  async function loadCodes() {
    setLoading(true);
    setMessage("");

    try {
      const result = await apiFetch("/api/admin/customer-registration-codes");
      setCustomers(result.customers || []);
      setCodes(result.codes || []);
    } catch (error: any) {
      setMessage(error?.message || "Errore caricamento codici invito.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCodes();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId || entitySearch.trim().length < 2) {
      setEntityResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearchingEntities(true);
      setMessage("");

      try {
        const params = new URLSearchParams({
          customerId: selectedCustomerId,
          q: entitySearch.trim(),
        });

        const result = await apiFetch(`/api/admin/customer-registration-codes?${params.toString()}`);
        setEntityResults(result.entities || []);
      } catch (error: any) {
        setMessage(error?.message || "Errore ricerca entità.");
      } finally {
        setSearchingEntities(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [selectedCustomerId, entitySearch]);

  function resetEntity() {
    setSelectedEntity(null);
    setEntitySearch("");
    setEntityResults([]);
  }

  async function createCode() {
    if (!selectedCustomerId || !selectedEntity?.id) {
      setMessage("Seleziona cliente e comando/sede.");
      return;
    }

    const parsedMaxUses = Number(maxUses);

    if (!Number.isFinite(parsedMaxUses) || parsedMaxUses < 1) {
      setMessage("Max utilizzi deve essere almeno 1.");
      return;
    }

    setLoading(true);
    setMessage("");
    setGeneratedCode("");

    try {
      const result = await apiFetch("/api/admin/customer-registration-codes", {
        method: "POST",
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerEntityId: selectedEntity.id,
          maxUses: parsedMaxUses,
          expiresAt: expiresAt || null,
          contactName,
          contactEmail,
          notes,
        }),
      });

      setGeneratedCode(result.code?.code || "");
      setMessage("Codice invito generato correttamente.");
      setMaxUses("1");
      setExpiresAt("");
      setContactName("");
      setContactEmail("");
      setNotes("");
      await loadCodes();
    } catch (error: any) {
      setMessage(error?.message || "Errore generazione codice.");
    } finally {
      setLoading(false);
    }
  }

  async function deactivateCode(codeId: string) {
    const confirmed = window.confirm("Disattivare questo codice invito?");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/api/admin/customer-registration-codes", {
        method: "PATCH",
        body: JSON.stringify({
          codeId,
          isActive: false,
        }),
      });

      setMessage("Codice disattivato.");
      await loadCodes();
    } catch (error: any) {
      setMessage(error?.message || "Errore disattivazione codice.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`Codice copiato: ${value}`);
    } catch {
      setMessage(value);
    }
  }

  return (
    <section className="grid gap-5 rounded-[2rem] border border-blue-500/15 bg-blue-500/[0.055] p-5 shadow-2xl shadow-black/20 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Accessi cliente</p>
          <h3 className="mt-2 text-2xl font-black text-white">Codici invito sede/comando</h3>
          <p className="mt-2 max-w-3xl text-sm font-bold text-slate-400">
            Genera codici autorizzati per collegare un cliente_user a una specifica entità. Il codice viene validato lato server in fase di registrazione.
          </p>
        </div>

        <button
          onClick={loadCodes}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-slate-200 disabled:opacity-50"
        >
          <RefreshCw size={17} /> Aggiorna
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-black text-blue-100">
          {message}
        </div>
      )}

      {generatedCode && (
        <div className="flex flex-col gap-3 rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Nuovo codice</p>
            <p className="mt-1 text-2xl font-black text-white">{generatedCode}</p>
          </div>
          <button
            onClick={() => copyCode(generatedCode)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm font-black text-emerald-100"
          >
            <Copy size={17} /> Copia
          </button>
        </div>
      )}

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-black text-slate-300">
            Cliente
            <select
              value={selectedCustomerId}
              onChange={(event) => {
                setSelectedCustomerId(event.target.value);
                resetEntity();
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            >
              <option value="">Seleziona cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-slate-900">
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Max utilizzi
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            />
          </label>

          <label className="relative grid gap-2 text-sm font-black text-slate-300 md:col-span-2">
            Cerca comando / sede
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={selectedEntity ? selectedEntity.completeName : entitySearch}
                onChange={(event) => {
                  setSelectedEntity(null);
                  setEntitySearch(event.target.value);
                }}
                disabled={!selectedCustomerId}
                placeholder={selectedCustomer ? "Scrivi almeno 2 lettere, es. casoria" : "Prima seleziona un cliente"}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-4 pl-11 pr-11 text-sm font-bold text-white outline-none disabled:opacity-50"
              />
              {(selectedEntity || entitySearch) && (
                <button
                  onClick={resetEntity}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 p-2 text-slate-300"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {!selectedEntity && entitySearch.trim().length >= 2 && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081523]">
                {searchingEntities ? (
                  <div className="p-4 text-xs font-bold text-slate-400">Ricerca...</div>
                ) : entityResults.length === 0 ? (
                  <div className="p-4 text-xs font-bold text-slate-400">Nessuna entità trovata.</div>
                ) : (
                  entityResults.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => {
                        setSelectedEntity(entity);
                        setEntityResults([]);
                      }}
                      className="w-full border-b border-white/10 p-3 text-left text-xs font-bold text-slate-200 hover:bg-blue-500/10 last:border-b-0"
                    >
                      <span className="block text-sm font-black text-white">{entity.name}</span>
                      <span className="mt-1 block text-slate-500">{entity.completeName}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Scadenza
            <input
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Referente
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Nome referente"
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Email referente
            <input
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="referente@cliente.it"
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-slate-300">
            Note
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Motivo, richiesta, protocollo..."
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
            />
          </label>
        </div>

        <button
          onClick={createCode}
          disabled={loading || !selectedCustomerId || !selectedEntity?.id}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <KeyRound size={18} /> {loading ? "Generazione..." : "Genera codice invito"}
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="text-blue-300" size={20} />
          <div>
            <p className="text-sm font-black text-white">Codici generati</p>
            <p className="text-xs font-bold text-slate-500">Ultimi codici accesso cliente.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {codes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-slate-400">
              Nessun codice generato.
            </div>
          ) : (
            codes.map((code) => {
              const used = Number(code.used_count || 0);
              const max = code.max_uses ?? "∞";
              const expired = code.expires_at ? new Date(code.expires_at).getTime() < Date.now() : false;
              const active = code.is_active !== false && !expired;

              return (
                <div key={code.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-white">{code.code}</p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${active ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
                          {active ? "ATTIVO" : "NON ATTIVO"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-400">{code.customerName || "Cliente"} · {code.entityCompleteName || code.entityName || "Entità"}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Utilizzi {used}/{max} · Scadenza {formatDate(code.expires_at)}
                      </p>
                      {(code.contact_name || code.contact_email || code.notes) && (
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {code.contact_name || ""} {code.contact_email ? `· ${code.contact_email}` : ""} {code.notes ? `· ${code.notes}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyCode(code.code)}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-xs font-black text-slate-200"
                      >
                        <Copy size={15} /> Copia
                      </button>
                      {code.is_active !== false && (
                        <button
                          onClick={() => deactivateCode(code.id)}
                          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black text-red-100"
                        >
                          Disattiva
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
