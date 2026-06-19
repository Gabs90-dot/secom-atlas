import { NextResponse, type NextRequest } from "next/server";

import {
  COPILOT_ALLOWED_ROLES,
  COPILOT_MAX_QUESTION_LENGTH,
  answerCopilotQuestion,
  type CopilotQueryResult,
} from "@/lib/server/copilot/catalog";
import { summarizeWithCopilotLlm } from "@/lib/server/copilot/llmAdapter";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const COPILOT_TIMEOUT_MS = 12000;
const COPILOT_LLM_TIMEOUT_MS = 4500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

type QueryBody = {
  tenantId?: unknown;
  tenant_id?: unknown;
  question?: unknown;
};

type RateLimitBucket = {
  startedAt: number;
  count: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function readText(value: unknown) {
  return String(value || "").trim();
}

function checkRateLimit(key: string, now: number) {
  const current = rateLimitBuckets.get(key);

  if (!current || now - current.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  return true;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("ATLAS Copilot timeout")), timeoutMs);
    }),
  ]);
}

function buildResponse(result: CopilotQueryResult, aiProvider: { provider: string; model: string } | null) {
  return NextResponse.json({
    ok: true,
    answer: result.answer,
    sources: result.sources,
    results: result.results,
    warnings: result.warnings,
    aiProvider,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as QueryBody;
  const tenantId = readText(body.tenantId || body.tenant_id);
  const question = readText(body.question);

  if (!tenantId) return jsonError("tenantId mancante.", 400);
  if (!question) return jsonError("Domanda mancante.", 400);
  if (question.length > COPILOT_MAX_QUESTION_LENGTH) {
    return jsonError(`Domanda troppo lunga. Massimo ${COPILOT_MAX_QUESTION_LENGTH} caratteri.`, 400);
  }

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: COPILOT_ALLOWED_ROLES,
  });

  if (!auth.ok) return auth.response;

  const rateKey = `${auth.requester.tenantId}:${auth.requester.tenantUserId}`;
  if (!checkRateLimit(rateKey, Date.now())) {
    return jsonError("Troppe richieste al Copilot. Riprova tra poco.", 429);
  }

  try {
    const toolResult = await withTimeout(
      answerCopilotQuestion({
        client: auth.serviceClient,
        requester: auth.requester,
        question,
        now: new Date(),
      }),
      COPILOT_TIMEOUT_MS,
    );

    const llmSummary = await summarizeWithCopilotLlm(question, toolResult, COPILOT_LLM_TIMEOUT_MS);
    const result = llmSummary ? { ...toolResult, answer: llmSummary.answer } : toolResult;

    console.info("[copilot] query", {
      tenantId: auth.requester.tenantId,
      tenantUserId: auth.requester.tenantUserId,
      role: auth.requester.role,
      questionLength: question.length,
      tools: result.toolNames,
      resultCount: result.results.length,
      aiProvider: llmSummary?.provider || "deterministic",
    });

    return buildResponse(result, llmSummary ? { provider: llmSummary.provider, model: llmSummary.model } : null);
  } catch (error) {
    console.error("[copilot] query failed", {
      tenantId: auth.requester.tenantId,
      tenantUserId: auth.requester.tenantUserId,
      message: error instanceof Error ? error.message : "unknown",
    });

    return jsonError("Errore durante l'interrogazione Copilot.", error instanceof Error && error.message.includes("timeout") ? 504 : 500);
  }
}
