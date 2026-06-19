import type { CopilotQueryResult } from "@/lib/server/copilot/catalog";

export type CopilotLlmSummary = {
  answer: string;
  provider: "openai-compatible";
  model: string;
};

type LlmPayload = {
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
};

type LlmChoice = {
  message?: {
    content?: string;
  };
};

type LlmResponse = {
  choices?: LlmChoice[];
};

function readEnv(name: string) {
  return String(process.env[name] || "").trim();
}

function configuredEndpoint() {
  const explicitEndpoint = readEnv("ATLAS_COPILOT_LLM_ENDPOINT");
  if (explicitEndpoint) return explicitEndpoint;

  if (readEnv("ATLAS_COPILOT_LLM_API_KEY") && readEnv("ATLAS_COPILOT_LLM_MODEL")) {
    return "https://api.openai.com/v1/chat/completions";
  }

  return "";
}

function compactResultForModel(result: CopilotQueryResult) {
  return {
    baselineAnswer: result.answer,
    warnings: result.warnings,
    sources: result.sources.map((item) => ({
      tool: item.tool,
      label: item.label,
      rows: item.rows,
      capped: Boolean(item.capped),
    })),
    records: result.results.slice(0, 8).map((record) => ({
      type: record.type,
      label: record.label,
      detail: record.detail,
      target: record.target,
      date: record.date || null,
    })),
  };
}

export async function summarizeWithCopilotLlm(
  question: string,
  result: CopilotQueryResult,
  timeoutMs: number,
): Promise<CopilotLlmSummary | null> {
  const endpoint = configuredEndpoint();
  const apiKey = readEnv("ATLAS_COPILOT_LLM_API_KEY");
  const model = readEnv("ATLAS_COPILOT_LLM_MODEL");

  if (!endpoint || !apiKey || !model) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const payload: LlmPayload = {
    model,
    temperature: 0.1,
    max_tokens: 420,
    messages: [
      {
        role: "system",
        content:
          "Sei ATLAS Copilot. Rispondi in italiano, sintetico e operativo. Usa solo i fatti forniti nel payload. Non inventare dati, non aggiungere record, non proporre SQL o mutazioni. Distingui fatti e inferenze quando serve.",
      },
      {
        role: "user",
        content: JSON.stringify({
          question,
          toolResult: compactResultForModel(result),
        }),
      },
    ],
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[copilot] LLM provider failed", { status: response.status, model });
      return null;
    }

    const data = (await response.json().catch(() => ({}))) as LlmResponse;
    const answer = String(data.choices?.[0]?.message?.content || "").trim();

    if (!answer) return null;

    return {
      answer,
      provider: "openai-compatible",
      model,
    };
  } catch (error) {
    console.warn("[copilot] LLM provider unavailable", error instanceof Error ? error.message : "unknown");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
