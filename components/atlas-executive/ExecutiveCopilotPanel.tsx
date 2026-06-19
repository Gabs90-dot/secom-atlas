"use client";

import { useMemo, useState } from "react";
import { Brain, ChevronRight, Loader2, Send, Sparkles, Trash2 } from "lucide-react";

import { isCustomerRole, type AtlasUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type CopilotRecordTarget = "registro" | "clienti" | "calendario" | "analytics";

type ExecutiveCopilotPanelProps = {
  tenant?: { id?: string | null } | null;
  currentUser?: AtlasUser | null;
  onNavigate?: (target: CopilotRecordTarget) => void;
};

type CopilotSource = {
  tool: string;
  label: string;
  rows: number;
  capped?: boolean;
};

type CopilotRecord = {
  id: string;
  type: string;
  label: string;
  detail: string;
  target: CopilotRecordTarget;
};

type CopilotResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  sources?: CopilotSource[];
  results?: CopilotRecord[];
  warnings?: string[];
  aiProvider?: {
    provider: string;
    model: string;
  } | null;
};

type ConversationItem = {
  id: string;
  question: string;
  answer: string;
  sources: CopilotSource[];
  results: CopilotRecord[];
  warnings: string[];
};

const MAX_QUESTION_LENGTH = 500;
const COPILOT_ROLES = new Set(["super_admin", "admin", "manager", "dispatcher", "tecnico", "commerciale"]);

const suggestions = [
  "Quanti ticket aperti ci sono?",
  "Quanti ticket aperti ci sono per Casoria?",
  "Dov'è Fabbri oggi?",
  "Mostrami cinque ticket senza tecnico.",
  "Quali SLA sono a rischio?",
];

function isCopilotAllowed(user?: AtlasUser | null) {
  if (!user || isCustomerRole(user.role)) return false;
  return COPILOT_ROLES.has(user.role);
}

export default function ExecutiveCopilotPanel({ tenant, currentUser, onNavigate }: ExecutiveCopilotPanelProps) {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canUseCopilot = isCopilotAllowed(currentUser);
  const tenantId = String(tenant?.id || currentUser?.tenantId || "");
  const latest = conversation[0] || null;
  const charactersLeft = MAX_QUESTION_LENGTH - input.length;

  const sourceLabel = useMemo(() => {
    if (!latest?.sources.length) return "Nessuna fonte ancora";
    return latest.sources.map((item) => `${item.label}: ${item.rows}`).join(" · ");
  }, [latest]);

  async function submitQuestion(value?: string) {
    const question = String(value ?? input).trim();
    if (!question || loading) return;

    if (!tenantId) {
      setError("Tenant non disponibile.");
      return;
    }

    if (!canUseCopilot) {
      setError("Copilot operativo riservato agli utenti interni autorizzati.");
      return;
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      setError(`Domanda troppo lunga. Massimo ${MAX_QUESTION_LENGTH} caratteri.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("Sessione non valida. Effettua nuovamente il login.");
      }

      const response = await fetch("/api/copilot/query", {
        method: "POST",
        cache: "no-store",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ tenantId, question }),
      });

      const result = (await response.json().catch(() => ({}))) as CopilotResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Errore Copilot.");
      }

      setConversation((current) => [
        {
          id: crypto.randomUUID(),
          question,
          answer: result.answer || "Nessuna risposta disponibile.",
          sources: result.sources || [],
          results: result.results || [],
          warnings: result.warnings || [],
        },
        ...current,
      ].slice(0, 4));
      setInput("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Errore Copilot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="relative overflow-hidden rounded-[30px] border border-amber-200/12 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_36%)]" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
            <Brain size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100/60">ATLAS Copilot</p>
            <h3 className="text-lg font-black text-white">Intelligence laterale</h3>
          </div>
          {conversation.length > 0 && (
            <button
              type="button"
              title="Cancella conversazione"
              onClick={() => {
                setConversation([]);
                setError("");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-red-300/25 hover:bg-red-300/10 hover:text-red-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="rounded-[24px] border border-cyan-300/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-100">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Risposta operativa</span>
          </div>
          <p className="min-h-20 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-300">
            {latest?.answer || "Fai una domanda sui dati reali ATLAS: ticket, SLA, tecnici, clienti, sedi e pianificazione."}
          </p>
          {latest?.warnings.length ? (
            <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">
              {latest.warnings[0]}
            </div>
          ) : null}
          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/55">{sourceLabel}</div>
        </div>

        {latest?.results.length ? (
          <div className="mt-4 grid gap-2">
            {latest.results.slice(0, 4).map((record) => (
              <button
                type="button"
                key={record.id}
                onClick={() => onNavigate?.(record.target)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{record.label}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">{record.detail}</span>
                </span>
                <ChevronRight size={15} className="shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Domande suggerite</p>
          {suggestions.slice(0, 3).map((question) => (
            <button
              key={question}
              type="button"
              disabled={loading || !canUseCopilot}
              onClick={() => {
                setInput(question);
                void submitQuestion(question);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:border-amber-200/20 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-black text-white">{question}</span>
                <span className="text-xs font-semibold text-slate-500">Query reale in sola lettura</span>
              </span>
              <ChevronRight size={15} className="text-slate-400" />
            </button>
          ))}
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitQuestion();
          }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <input
              value={input}
              maxLength={MAX_QUESTION_LENGTH}
              disabled={loading || !canUseCopilot}
              onChange={(event) => setInput(event.target.value)}
              placeholder={canUseCopilot ? "Chiedi ad ATLAS Copilot..." : "Copilot non disponibile per questo ruolo"}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !canUseCopilot}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <span>{conversation.length} messaggi sessione</span>
            <span className={charactersLeft < 40 ? "text-amber-200" : ""}>{charactersLeft}</span>
          </div>
        </form>

        {error && (
          <div className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {error}
          </div>
        )}
      </div>
    </aside>
  );
}
