import { NextRequest, NextResponse } from "next/server";

import { type AtlasRole } from "@/lib/auth";
import { requireGlpiEnabledForTenant } from "@/lib/server/glpiTenantGuard";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";

const GLPI_DELETE_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];
const GLPI_DELETE_ALLOWED_LEGACY_ROLES: readonly LegacyAtlasRole[] = ["owner"];

type GlpiDeletePayload = {
  ticketId?: unknown;
  tenantId?: unknown;
  tenant_id?: unknown;
};

function cleanBaseUrl(value?: string | null) {
  return String(value || "").replace(/\/+$/, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : String(error);
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function initGlpiSession(baseUrl: string, appToken: string) {
  const staticSessionToken = process.env.GLPI_SESSION_TOKEN || process.env.GLPI_SESSION || "";
  if (staticSessionToken) return staticSessionToken;

  const userToken = process.env.GLPI_USER_TOKEN || "";
  if (userToken) {
    const response = await fetch(`${baseUrl}/initSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        Authorization: `user_token ${userToken}`,
      },
      cache: "no-store",
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.session_token) {
      throw new Error(json?.message || json?.error || "Impossibile inizializzare sessione GLPI con user token.");
    }
    return json.session_token as string;
  }

  const login = process.env.GLPI_LOGIN || process.env.GLPI_USERNAME || "";
  const password = process.env.GLPI_PASSWORD || "";
  if (login && password) {
    const basic = Buffer.from(`${login}:${password}`).toString("base64");
    const response = await fetch(`${baseUrl}/initSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        Authorization: `Basic ${basic}`,
      },
      cache: "no-store",
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.session_token) {
      throw new Error(json?.message || json?.error || "Impossibile inizializzare sessione GLPI con login/password.");
    }
    return json.session_token as string;
  }

  throw new Error("Credenziali GLPI mancanti: configura GLPI_SESSION_TOKEN oppure GLPI_USER_TOKEN oppure GLPI_LOGIN/GLPI_PASSWORD.");
}

async function killGlpiSession(baseUrl: string, appToken: string, sessionToken: string) {
  try {
    await fetch(`${baseUrl}/killSession`, {
      method: "GET",
      headers: {
        "App-Token": appToken,
        "Session-Token": sessionToken,
      },
      cache: "no-store",
    });
  } catch {
    // Non bloccare la cancellazione per il killSession.
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as GlpiDeletePayload;
    const ticketId = parsePositiveInteger(body.ticketId);
    const tenantId = String(body.tenantId || body.tenant_id || "").trim();

    if (!ticketId) {
      return NextResponse.json({ ok: false, error: "ticketId non valido." }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante." }, { status: 400 });
    }

    const auth = await requireAtlasUser(request, {
      tenantId,
      allowedRoles: GLPI_DELETE_ALLOWED_ROLES,
      allowedLegacyRoles: GLPI_DELETE_ALLOWED_LEGACY_ROLES,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const glpiGuard = await requireGlpiEnabledForTenant(auth.serviceClient, auth.requester);

    if (glpiGuard) {
      return glpiGuard;
    }

    const { data: localTicket, error: localTicketError } = await auth.serviceClient
      .from("tickets")
      .select("id")
      .eq("tenant_id", auth.requester.tenantId)
      .eq("glpi_ticket_id", ticketId)
      .maybeSingle();

    if (localTicketError) {
      return NextResponse.json({ ok: false, error: "Errore verifica ticket tenant." }, { status: 500 });
    }

    if (!localTicket) {
      return NextResponse.json({ ok: false, error: "Ticket GLPI non collegato al tenant richiesto." }, { status: 404 });
    }

    const baseUrl = cleanBaseUrl(process.env.GLPI_API_URL || process.env.NEXT_PUBLIC_GLPI_API_URL);
    const appToken = process.env.GLPI_APP_TOKEN || process.env.NEXT_PUBLIC_GLPI_APP_TOKEN || "";

    if (!baseUrl || !appToken) {
      return NextResponse.json(
        { ok: false, error: "Configurazione GLPI incompleta: GLPI_API_URL e GLPI_APP_TOKEN sono obbligatori." },
        { status: 501 },
      );
    }

    const sessionToken = await initGlpiSession(baseUrl, appToken);

    const deleteResponse = await fetch(`${baseUrl}/Ticket/${encodeURIComponent(String(ticketId))}`, {
      method: "DELETE",
      headers: {
        "App-Token": appToken,
        "Session-Token": sessionToken,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = await deleteResponse.json().catch(() => null);
    await killGlpiSession(baseUrl, appToken, sessionToken);

    if (!deleteResponse.ok) {
      return NextResponse.json(
        { ok: false, error: result?.message || result?.error || `GLPI ha risposto ${deleteResponse.status}`, result },
        { status: deleteResponse.status },
      );
    }

    return NextResponse.json({ ok: true, ticketId, result });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
