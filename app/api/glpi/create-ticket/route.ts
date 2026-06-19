import { NextRequest, NextResponse } from "next/server";

import { type AtlasRole } from "@/lib/auth";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";

const GLPI_CREATE_ALLOWED_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
];
const GLPI_CREATE_ALLOWED_LEGACY_ROLES: readonly LegacyAtlasRole[] = ["owner"];

type GlpiTicketPayload = {
  atlasTicketId?: string | number;
  tenantId?: string | null;
  tenant_id?: string | null;
  site?: string;
  region?: string;
  entity?: string;
  city?: string;
  title?: string;
  ticketCategory?: string;
  ticketStatus?: string;
  problem?: string;
  materialIds?: string[];
  materials?: string[];
  cost?: number;
  technician?: string;
  status?: string;
  date?: string;
  slot?: string;
  ticketType?: "ordinaria" | "straordinaria" | string;
  contractName?: string;
  contractEntity?: string;
  glpiEntityId?: number | null;
};

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function mapGlpiStatus(value?: string) {
  const key = String(value || "nuova").toLowerCase().trim();
  const map: Record<string, number> = {
    nuova: 1,
    "in lavorazione": 2,
    pianificata: 3,
    "in sospeso": 4,
    chiusa: 6,
  };
  return map[key] || 1;
}

function normalizeCategory(value?: string) {
  const key = String(value || "ordinaria").toLowerCase().trim();
  const map: Record<string, string> = {
    ordinaria: "Ordinaria",
    straordinaria: "Straordinaria",
    garanzia: "In garanzia",
    materiale: "Materiale fornito/sostituito",
  };
  return map[key] || key;
}

function buildTicketContent(payload: GlpiTicketPayload) {
  const materials = payload.materials?.length
    ? payload.materials.map((material) => htmlEscape(material)).join(" + ")
    : "Nessun materiale indicato";

  return [
    `<strong>Ticket creato da ATLAS</strong>`,
    `<br><br><strong>ID ATLAS:</strong> ${htmlEscape(payload.atlasTicketId ?? "n/d")}`,
    `<br><strong>Titolo:</strong> ${htmlEscape(payload.title || "n/d")}`,
    `<br><strong>Sede:</strong> ${htmlEscape(payload.site || "n/d")}`,
    `<br><strong>Ente:</strong> ${htmlEscape(payload.entity || "n/d")}`,
    `<br><strong>Città:</strong> ${htmlEscape(payload.city || "n/d")}`,
    `<br><strong>Regione:</strong> ${htmlEscape(payload.region || "n/d")}`,
    `<br><strong>Contratto rilevato:</strong> ${htmlEscape(payload.contractName || "n/d")}`,
    `<br><strong>Macro entità:</strong> ${htmlEscape(payload.contractEntity || "n/d")}`,
    `<br><strong>Categoria chiamata:</strong> ${htmlEscape((payload.ticketCategory || payload.ticketType || "ordinaria").toUpperCase())}`,
    `<br><strong>Stato ATLAS:</strong> ${htmlEscape(payload.ticketStatus || payload.status || "nuova")}`,
    `<br><strong>Tecnico ATLAS:</strong> ${htmlEscape(payload.technician || "Non assegnato")}`,
    `<br><strong>Data/slot:</strong> ${htmlEscape(payload.date || "n/d")} ${htmlEscape(payload.slot || "")}`,
    `<br><strong>Materiali:</strong> ${materials}`,
    `<br><strong>Costo stimato:</strong> ${Number(payload.cost || 0).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    })}`,
    `<br><br><strong>Descrizione intervento:</strong><br>${htmlEscape(payload.problem || "Nessuna descrizione")}`,
  ].join("");
}

function buildSafePayloadSummary(payload: GlpiTicketPayload) {
  return {
    atlasTicketId: payload.atlasTicketId ?? null,
    hasTitle: Boolean(payload.title?.trim()),
    hasProblem: Boolean(payload.problem?.trim()),
    hasSite: Boolean(payload.site?.trim()),
    hasEntity: Boolean(payload.entity?.trim()),
    hasRegion: Boolean(payload.region?.trim()),
    glpiEntityIdPresent: Boolean(payload.glpiEntityId),
    materialCount: payload.materialIds?.length || payload.materials?.length || 0,
    ticketType: payload.ticketType || payload.ticketCategory || null,
    ticketStatus: payload.ticketStatus || payload.status || null,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  const apiUrl = process.env.GLPI_API_URL;
  const appToken = process.env.GLPI_APP_TOKEN;
  const userToken = process.env.GLPI_USER_TOKEN;

  if (!apiUrl || !appToken || !userToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configurazione GLPI mancante. Controlla GLPI_API_URL, GLPI_APP_TOKEN e GLPI_USER_TOKEN in .env.local.",
      },
      { status: 500 }
    );
  }

  const payload = (await request.json().catch(() => null)) as GlpiTicketPayload | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Payload non valido." }, { status: 400 });
  }

  const baseUrl = cleanBaseUrl(apiUrl);
  const payloadSummary = buildSafePayloadSummary(payload);
  const tenantId = String(payload.tenantId || payload.tenant_id || "").trim();
  const atlasTicketId = parsePositiveInteger(payload.atlasTicketId);
  const glpiEntityId = parsePositiveInteger(payload.glpiEntityId);

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId mancante." }, { status: 400 });
  }

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: GLPI_CREATE_ALLOWED_ROLES,
    allowedLegacyRoles: GLPI_CREATE_ALLOWED_LEGACY_ROLES,
  });

  if (!auth.ok) {
    return auth.response;
  }

  if (!atlasTicketId) {
    return NextResponse.json({ ok: false, error: "atlasTicketId non valido." }, { status: 400 });
  }

  if (!glpiEntityId) {
    console.warn("GLPI create-ticket rejected: missing entity", payloadSummary);
    return NextResponse.json(
      {
        ok: false,
        stage: "validatePayload",
        code: "missing_glpi_entity",
        error: "Entita GLPI mancante.",
      },
      { status: 400 }
    );
  }

  const { data: ticketRow, error: ticketError } = await auth.serviceClient
    .from("tickets")
    .select("id, glpi_entity_id")
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", atlasTicketId)
    .maybeSingle();

  if (ticketError) {
    return NextResponse.json({ ok: false, error: "Errore verifica ticket ATLAS." }, { status: 500 });
  }

  if (!ticketRow) {
    return NextResponse.json({ ok: false, error: "Ticket ATLAS non trovato nel tenant richiesto." }, { status: 404 });
  }

  const ticketGlpiEntityId = parsePositiveInteger(ticketRow.glpi_entity_id);
  if (!ticketGlpiEntityId) {
    return NextResponse.json(
      { ok: false, error: "Ticket ATLAS senza entita GLPI coerente." },
      { status: 400 },
    );
  }

  if (ticketGlpiEntityId !== glpiEntityId) {
    return NextResponse.json(
      { ok: false, error: "Entita GLPI non coerente con il ticket ATLAS." },
      { status: 403 },
    );
  }

  const { data: entityRow, error: entityError } = await auth.serviceClient
    .from("customer_entities")
    .select("id")
    .eq("tenant_id", auth.requester.tenantId)
    .eq("glpi_entity_id", glpiEntityId)
    .maybeSingle();

  if (entityError) {
    return NextResponse.json({ ok: false, error: "Errore verifica entita GLPI." }, { status: 500 });
  }

  if (!entityRow) {
    return NextResponse.json({ ok: false, error: "Entita GLPI non autorizzata per il tenant richiesto." }, { status: 403 });
  }

  payload.atlasTicketId = atlasTicketId;
  payload.glpiEntityId = glpiEntityId;

  let sessionToken = "";

  try {
    const sessionResponse = await fetch(`${baseUrl}/initSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        Authorization: `user_token ${userToken}`,
      },
      cache: "no-store",
    });

    const sessionData = await sessionResponse.json().catch(() => null);

    if (!sessionResponse.ok || !sessionData?.session_token) {
      return NextResponse.json(
        {
          ok: false,
          stage: "initSession",
          status: sessionResponse.status,
          error: sessionData || "GLPI non ha restituito session_token.",
        },
        { status: 502 }
      );
    }

    sessionToken = sessionData.session_token;

    const categoryLabel = normalizeCategory(payload.ticketCategory || payload.ticketType);
    const ticketName = payload.title?.trim() || `[ATLAS] ${categoryLabel.toUpperCase()} - ${payload.site || "Nuova chiamata"}`;

    const ticketResponse = await fetch(`${baseUrl}/Ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "App-Token": appToken,
        "Session-Token": sessionToken,
      },
      body: JSON.stringify({
        input: {
          name: ticketName,
          content: buildTicketContent(payload),
          ...(payload.glpiEntityId ? { entities_id: Number(payload.glpiEntityId) } : {}),
          status: mapGlpiStatus(payload.ticketStatus || payload.status),
          urgency: (payload.ticketCategory || payload.ticketType) === "straordinaria" ? 4 : 3,
          impact: (payload.ticketCategory || payload.ticketType) === "straordinaria" ? 4 : 3,
          priority: (payload.ticketCategory || payload.ticketType) === "straordinaria" ? 4 : 3,
          type: 1,
        },
      }),
    });

    const ticketData = await ticketResponse.json().catch(() => null);

    if (!ticketResponse.ok) {
      console.error("GLPI create-ticket failed", {
        ...payloadSummary,
        stage: "createTicket",
        status: ticketResponse.status,
      });
      return NextResponse.json(
        {
          ok: false,
          stage: "createTicket",
          status: ticketResponse.status,
          error: ticketData || "Errore creazione ticket GLPI.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      glpiTicketId: ticketData?.id ?? ticketData?.[0]?.id ?? null,
      glpiEntityId: payload.glpiEntityId ?? null,
      glpiResponse: ticketData,
    });
  } catch (error: unknown) {
    console.error("GLPI create-ticket exception", {
      ...payloadSummary,
      message: getErrorMessage(error, "Errore sconosciuto"),
    });
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "GLPI non raggiungibile dal server Next.js."),
      },
      { status: 502 }
    );
  } finally {
    if (sessionToken) {
      fetch(`${baseUrl}/killSession`, {
        method: "GET",
        headers: {
          "App-Token": appToken,
          "Session-Token": sessionToken,
        },
      }).catch(() => undefined);
    }
  }
}
