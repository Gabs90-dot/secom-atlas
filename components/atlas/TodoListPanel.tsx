"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, Filter, Plus, Search, UserCheck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TodoStatus = "new" | "in_progress" | "done" | "cancelled";
type TodoUrgency = "low" | "normal" | "urgent";

type TodoTask = {
  id: string;
  title: string;
  description: string | null;
  urgency: TodoUrgency;
  status: TodoStatus;
  created_by?: string | null;
  created_by_name?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  taken_at?: string | null;
  completed_at?: string | null;
  completion_note?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function normalize(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeCsv(value: any) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 12000, label = "Operazione Supabase") {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} scaduta: controlla connessione, tabella todo_tasks e policy Supabase.`)), ms);
    }),
  ]);
}

function statusLabel(status: TodoStatus) {
  if (status === "new") return "Nuova";
  if (status === "in_progress") return "In carico";
  if (status === "done") return "Chiusa";
  return "Annullata";
}

function urgencyLabel(urgency: TodoUrgency) {
  if (urgency === "urgent") return "Urgente";
  if (urgency === "low") return "Bassa";
  return "Normale";
}

function statusClass(status: TodoStatus) {
  if (status === "new") return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  if (status === "in_progress") return "border-amber-500/30 bg-amber-500/15 text-amber-200";
  if (status === "done") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  return "border-slate-500/30 bg-slate-500/15 text-slate-300";
}

function urgencyClass(urgency: TodoUrgency) {
  if (urgency === "urgent") return "border-red-500/40 bg-red-500/15 text-red-200";
  if (urgency === "low") return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  return "border-cyan-500/30 bg-cyan-500/15 text-cyan-200";
}

function Metric({ label, value, icon: Icon, tone }: any) {
  const classes =
    tone === "red"
      ? "border-red-500/25 bg-red-500/10 text-red-200"
      : tone === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
      : tone === "green"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : "border-blue-500/25 bg-blue-500/10 text-blue-200";

  return (
    <div className={`rounded-3xl border p-4 ${classes}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
        <Icon size={24} />
      </div>
    </div>
  );
}

type TodoListPanelProps = { executiveMode?: boolean };

export default function TodoListPanel({ executiveMode = false }: TodoListPanelProps = {}) {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<TodoUrgency>("normal");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<"" | TodoUrgency>("");
  const [statusFilter, setStatusFilter] = useState<"" | TodoStatus>("");
  const [closingTask, setClosingTask] = useState<TodoTask | null>(null);
  const [closingNote, setClosingNote] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("todo_tasks")
          .select("id,title,description,urgency,status,created_by,created_by_name,assigned_to,assigned_to_name,taken_at,completed_at,completion_note,created_at,updated_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        12000,
        "Caricamento To Do List",
      );
      if (error) throw error;
      setTasks((data || []) as TodoTask[]);
    } catch (err: any) {
      console.error("Todo load error", err);
      setError(err?.message || "Errore caricamento To Do List. Verifica di aver eseguito todo_tasks_v1.sql su Supabase.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    loadTasks();
  }, []);

  const userLabel = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Operatore ATLAS";

  async function createTask() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");

    const liveUser = user || (await supabase.auth.getUser()).data.user || null;
    const liveUserLabel =
      liveUser?.user_metadata?.full_name ||
      liveUser?.user_metadata?.name ||
      liveUser?.email ||
      "Operatore ATLAS";

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("todo_tasks")
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            urgency,
            status: "new",
            created_by: liveUser?.id || null,
            created_by_name: liveUserLabel,
          })
          .select("id,title,description,urgency,status,created_by,created_by_name,assigned_to,assigned_to_name,taken_at,completed_at,completion_note,created_at,updated_at")
          .single(),
        12000,
        "Inserimento To Do List",
      );

      if (error) throw error;

      if (data) {
        setTasks((prev) => [data as TodoTask, ...prev]);
      } else {
        await loadTasks();
      }

      setTitle("");
      setDescription("");
      setUrgency("normal");
      window.dispatchEvent(new Event("atlas-todo-updated"));
    } catch (err: any) {
      console.error("Todo create error", err);
      setError(err?.message || "Errore salvataggio richiesta. Verifica tabella todo_tasks e policy Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function takeTask(task: TodoTask) {
    setError("");
    try {
      const { error } = await supabase
        .from("todo_tasks")
        .update({
          status: "in_progress",
          assigned_to: user?.id || null,
          assigned_to_name: userLabel,
          taken_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) throw error;
      await loadTasks();
      window.dispatchEvent(new Event("atlas-todo-updated"));
    } catch (err: any) {
      console.error("Todo take error", err);
      setError(err?.message || "Errore presa in carico.");
    }
  }

  async function closeTask() {
    if (!closingTask) return;
    setError("");
    try {
      const { error } = await supabase
        .from("todo_tasks")
        .update({
          status: "done",
          completion_note: closingNote.trim() || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", closingTask.id);
      if (error) throw error;
      setClosingTask(null);
      setClosingNote("");
      await loadTasks();
      window.dispatchEvent(new Event("atlas-todo-updated"));
    } catch (err: any) {
      console.error("Todo close error", err);
      setError(err?.message || "Errore chiusura richiesta.");
    }
  }

  const technicians = useMemo(() => Array.from(new Set(tasks.map((task) => task.assigned_to_name).filter(Boolean))) as string[], [tasks]);

  const filteredTasks = useMemo(() => {
    const q = normalize(query);
    return tasks.filter((task) => {
      if (dateFilter && (task.created_at || "").slice(0, 10) !== dateFilter) return false;
      if (technicianFilter && task.assigned_to_name !== technicianFilter) return false;
      if (urgencyFilter && task.urgency !== urgencyFilter) return false;
      if (statusFilter && task.status !== statusFilter) return false;
      if (!q) return true;
      return normalize(`${task.title} ${task.description} ${task.created_by_name} ${task.assigned_to_name} ${task.completion_note}`).includes(q);
    });
  }, [tasks, query, dateFilter, technicianFilter, urgencyFilter, statusFilter]);

  const metrics = useMemo(() => ({
    new: tasks.filter((task) => task.status === "new").length,
    progress: tasks.filter((task) => task.status === "in_progress").length,
    urgent: tasks.filter((task) => task.urgency === "urgent" && task.status !== "done").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  function exportCsv() {
    const header = ["Titolo", "Descrizione", "Urgenza", "Stato", "Richiedente", "Tecnico", "Creata", "Presa in carico", "Chiusa", "Nota chiusura"];
    const rows = filteredTasks.map((task) => [
      task.title,
      task.description,
      urgencyLabel(task.urgency),
      statusLabel(task.status),
      task.created_by_name,
      task.assigned_to_name,
      formatDate(task.created_at),
      formatDate(task.taken_at),
      formatDate(task.completed_at),
      task.completion_note,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-todo-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={executiveMode ? "grid gap-5 rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(251,191,36,0.09),transparent_24%),linear-gradient(135deg,rgba(2,7,19,0.96),rgba(7,19,33,0.92)_48%,rgba(3,7,17,0.98))] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-7" : "grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl"}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">{executiveMode ? "ATLAS TASK COMMAND" : "ATLAS TASK CENTER"}</p>
          <h2 className="mt-2 text-3xl font-black text-white">To Do List aziendale</h2>
          <p className="mt-1 max-w-4xl text-sm font-bold text-slate-400">Richieste interne non GLPI: chiunque inserisce una cosa da fare, un operatore la prende in carico e la chiude con nota opzionale.</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
          <Download size={18} /> Esporta CSV
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={CheckCircle2} label="Nuove" value={metrics.new} tone="blue" />
        <Metric icon={UserCheck} label="In carico" value={metrics.progress} tone="amber" />
        <Metric icon={AlertTriangle} label="Urgenti aperte" value={metrics.urgent} tone="red" />
        <Metric icon={CheckCircle2} label="Chiuse" value={metrics.done} tone="green" />
      </div>

      {error && <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo cosa da fare, es. Pulire scrivania primo piano" className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500" />
          <div className="flex min-w-[310px] flex-nowrap items-center gap-2">
            <button type="button" onClick={() => setUrgency("low")} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition-all ${urgency === "low" ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-400"}`}>
              Bassa
            </button>
            <button type="button" onClick={() => setUrgency("normal")} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition-all ${urgency === "normal" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400"}`}>
              Normale
            </button>
            <button type="button" onClick={() => setUrgency("urgent")} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition-all ${urgency === "urgent" ? "bg-red-600 text-white" : "bg-white/5 text-slate-400"}`}>
              Urgente
            </button>
          </div>
          <button onClick={createTask} disabled={saving || !title.trim()} className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            <Plus size={18} /> {saving ? "Inserisco..." : "Inserisci"}
          </button>
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione opzionale" rows={3} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300"><Filter size={16} /> Filtri</div>
        <div className="grid gap-3 xl:grid-cols-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca titolo, nota, operatore" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none" />
          <select value={technicianFilter} onChange={(e) => setTechnicianFilter(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none">
            <option value="">Tutti i tecnici</option>
            {technicians.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as any)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none">
            <option value="">Tutte le urgenze</option>
            <option value="low">Bassa</option>
            <option value="normal">Normale</option>
            <option value="urgent">Urgente</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none">
            <option value="">Tutti gli stati</option>
            <option value="new">Nuove</option>
            <option value="in_progress">In carico</option>
            <option value="done">Chiuse</option>
            <option value="cancelled">Annullate</option>
          </select>
        </div>
      </div>

      <div className="max-h-[58vh] min-h-[430px] overflow-y-auto overscroll-contain pr-2">
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Caricamento TO DO LIST...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm font-bold text-slate-400">Nessuna richiesta trovata.</div>
      ) : (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <article key={task.id} className={`rounded-3xl border p-4 ${task.urgency === "urgent" && task.status !== "done" ? "border-red-500/35 bg-red-500/10" : "border-white/10 bg-white/[0.045]"}`}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusClass(task.status)}`}>{statusLabel(task.status)}</span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${urgencyClass(task.urgency)}`}>{urgencyLabel(task.urgency)}</span>
                  </div>
                  <h3 className="mt-3 break-words text-lg font-black text-white">{task.title}</h3>
                  {task.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-slate-300">{task.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                    <span><Clock size={13} className="inline" /> Creata: {formatDate(task.created_at)}</span>
                    <span>Richiedente: {task.created_by_name || "N/D"}</span>
                    <span>Tecnico: {task.assigned_to_name || "Non presa"}</span>
                    {task.completed_at && <span>Chiusa: {formatDate(task.completed_at)}</span>}
                  </div>
                  {task.completion_note && <p className="mt-3 rounded-2xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">Nota chiusura: {task.completion_note}</p>}
                </div>
                <div className="flex min-w-[220px] flex-col gap-2">
                  {task.status === "new" && (
                    <button onClick={() => takeTask(task)} className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Prendi in carico</button>
                  )}
                  {task.status === "in_progress" && (
                    <button onClick={() => setClosingTask(task)} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Chiudi richiesta</button>
                  )}
                  {task.status === "done" && <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-300"><CheckCircle2 size={17} /> Completata</div>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      </div>

      {closingTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setClosingTask(null)}>
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Chiusura richiesta</p>
                <h3 className="mt-2 text-2xl font-black">{closingTask.title}</h3>
              </div>
              <button onClick={() => setClosingTask(null)} className="rounded-2xl bg-white/10 p-3"><XCircle size={20} /></button>
            </div>
            <textarea value={closingNote} onChange={(e) => setClosingNote(e.target.value)} rows={5} placeholder="Nota opzionale di chiusura" className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setClosingTask(null)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white">Annulla</button>
              <button onClick={closeTask} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Chiudi definitivamente</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
