"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Database, Play, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type GlpiImportCenterProps = {
  tenant: any | null;
};

export default function GlpiImportCenter({ tenant }: GlpiImportCenterProps) {
  const [batchSize, setBatchSize] = useState(500);
  const [offset, setOffset] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  const storageKey = `atlas-glpi-import-${tenant?.id || "default"}`;

  useEffect(() => {
    async function hydrateImportState() {
      if (!tenant?.id) return;

      setHydrated(false);
      setError("");

      let savedState: any = null;

      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) savedState = JSON.parse(saved);
        } catch (err) {
          console.log("Errore lettura stato import locale", err);
        }
      }

      const { data: latestRun, error: runError } = await supabase
        .from("glpi_import_runs")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (runError) {
        console.log(runError);
      }

      const savedOffset = Number(savedState?.offset || 0);
      const dbOffset = Number(latestRun?.cursor_offset || latestRun?.total_processed || 0);
      const nextOffset = Math.max(savedOffset, dbOffset, 0);
      const nextBatchSize = Number(savedState?.batchSize || latestRun?.batch_size || 500);
      const nextRunId = latestRun?.status === "running" ? latestRun.id : savedState?.runId || null;

      setBatchSize(nextBatchSize);
      setOffset(nextOffset);
      setRunId(nextRunId);
      setLastResult(
        savedState?.lastResult ||
          (latestRun
            ? {
                ok: true,
                runId: latestRun.id,
                status: latestRun.status,
                processed: latestRun.batch_size || 0,
                inserted: latestRun.total_inserted || 0,
                updated: latestRun.total_updated || 0,
                skipped: latestRun.total_skipped || 0,
                errors: latestRun.total_errors || 0,
                nextOffset,
                source: "glpi_import_runs",
              }
            : null)
      );
      setHydrated(true);
    }

    hydrateImportState();
  }, [tenant?.id, storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          batchSize,
          offset,
          runId,
          lastResult,
        })
      );
    } catch (err) {
      console.log("Errore salvataggio stato import locale", err);
    }
  }, [batchSize, offset, runId, lastResult, storageKey, hydrated]);

  async function runBatch() {
    if (!tenant?.id || running || !hydrated) return;

    setRunning(true);
    setError("");

    try {
      const response = await fetch("/api/admin/glpi-import/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          runId,
          offset,
          limit: batchSize,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Import batch fallito");
      }

      setLastResult(result);
      setRunId(result.runId);
      setOffset(result.nextOffset || offset + batchSize);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setRunning(false);
    }
  }

  function resetImport() {
    setRunId(null);
    setOffset(0);
    setLastResult(null);
    setError("");

    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }

  if (!tenant?.id) {
    return (
      <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-black">Tenant non configurato</p>
        <p className="mt-2 text-sm font-bold text-amber-200/80">
          Seleziona un tenant prima di importare lo storico GLPI.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">
              ATLAS IMPORT ENGINE
            </p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              GLPI Historical Import
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Import batch dello storico GLPI: ticket, descrizione, richiedente, stato,
              priorità, gruppo tecnico e attività timeline.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-100">
            <Database size={24} />
            <p className="mt-2 text-sm font-black">Tenant</p>
            <p className="text-xs font-bold text-blue-200/80">{tenant.name || tenant.slug || tenant.id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
            Controllo batch
          </p>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-300">
              Batch size
              <input
                type="number"
                min={100}
                max={1000}
                value={batchSize}
                onChange={(event) => setBatchSize(Number(event.target.value || 500))}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black text-slate-300">
              Offset corrente
              <input
                type="number"
                min={0}
                value={offset}
                onChange={(event) => setOffset(Number(event.target.value || 0))}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
              />
            </label>

            <button
              onClick={runBatch}
              disabled={running || !hydrated}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              <Play size={18} />
              {running ? "Import in corso..." : !hydrated ? "Carico stato import..." : "Esegui prossimo batch"}
            </button>

            <button
              onClick={resetImport}
              disabled={running}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-slate-200 disabled:opacity-60"
            >
              <RotateCcw size={18} />
              Reset sessione UI
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
            <div className="flex gap-3">
              <AlertTriangle size={20} />
              <p className="text-xs font-bold leading-relaxed">
                Con 100k+ ticket non usare import totale. Esegui batch progressivi,
                controlla errori e solo dopo automatizziamo resume/worker.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
            Stato import
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm font-bold text-slate-400">Offset</p>
              <p className="mt-2 text-3xl font-black text-white">{offset}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm font-bold text-slate-400">Ultimo batch</p>
              <p className="mt-2 text-3xl font-black text-white">{lastResult?.processed || 0}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm font-bold text-slate-400">Errori</p>
              <p className="mt-2 text-3xl font-black text-red-300">{lastResult?.errors || 0}</p>
            </div>
          </div>

          {lastResult && (
            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="mb-3 text-sm font-black text-white">Ultimo risultato</p>
              <pre className="max-h-96 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-300">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
