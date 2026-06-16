import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { syncGlpiDbToAtlas } from "@/services/glpiSyncEngine";

export const runtime = "nodejs";

type SyncGlpiDbToAtlas = typeof syncGlpiDbToAtlas;

const DEFAULT_LIMIT = 25;
const GLPI_AUTO_SYNC_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function legacyString(value: unknown): string {
  return String(value || "").trim();
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function hasBearerToken(request: NextRequest): boolean {
  const authorization = request.headers.get("authorization") || "";
  return authorization.trim().toLowerCase().startsWith("bearer ");
}

function jsonAuthError(message: string, status: 401 | 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function authorizeSyncRequest(request: NextRequest, tenantId: string) {
  const authorization = request.headers.get("authorization");

  if (authorization && hasBearerToken(request)) {
    const auth = await requireAtlasUser(request, {
      allowedRoles: GLPI_AUTO_SYNC_ALLOWED_ROLES,
      tenantId,
    });

    return auth.ok ? null : auth.response;
  }

  if (authorization) {
    return jsonAuthError("Non autenticato.", 401);
  }

  const configuredSecret = process.env.ATLAS_CRON_SECRET;

  if (!configuredSecret) {
    return jsonAuthError("Configurazione cron mancante: ATLAS_CRON_SECRET non impostato.", 500);
  }

  const providedSecret = request.headers.get("x-atlas-cron-secret") || "";

  if (!providedSecret || providedSecret !== configuredSecret) {
    return jsonAuthError("Non autenticato.", 401);
  }

  return null;
}

function getSyncFunction(): SyncGlpiDbToAtlas {
  if (typeof syncGlpiDbToAtlas !== "function") {
    throw new Error(
      "Export syncGlpiDbToAtlas mancante in services/glpiSyncEngine.ts. Sostituisci quel file con glpiSyncEngine_FIXED.ts.",
    );
  }

  return syncGlpiDbToAtlas;
}

function getTenantIdFromRequest(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("tenantId");
  const fromEnv =
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    "";

  return legacyString(fromQuery) || fromEnv;
}

function getTenantIdFromBody(request: NextRequest, body: Record<string, unknown>) {
  const fromEnv =
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    "";

  return (
    legacyString(body.tenantId) ||
    legacyString(body.tenant_id) ||
    legacyString(request.nextUrl.searchParams.get("tenantId")) ||
    fromEnv
  );
}

function getNumberParam(request: NextRequest, name: string, fallback: number) {
  const raw = request.nextUrl.searchParams.get(name);
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getOptionalStringOrNumber(value: unknown): string | number | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const runSyncGlpiDbToAtlas = getSyncFunction();
    const tenantId = getTenantIdFromRequest(request);
    const limit = getNumberParam(request, "limit", DEFAULT_LIMIT);
    const offset = getNumberParam(request, "offset", 0);
    const glpiTicketId = request.nextUrl.searchParams.get("glpiTicketId") || undefined;
    const incremental = request.nextUrl.searchParams.get("full") !== "1";

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nella query oppure imposta ATLAS_DEFAULT_TENANT_ID nel file .env.local / Vercel.",
        },
        { status: 400 },
      );
    }

    const authResponse = await authorizeSyncRequest(request, tenantId);

    if (authResponse) {
      return authResponse;
    }

    const result = await runSyncGlpiDbToAtlas({
      tenantId,
      limit,
      offset,
      glpiTicketId,
      incremental,
    });

    return NextResponse.json({
      success: true,
      message: "GLPI auto sync completata",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("AUTO SYNC GLPI ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Errore sconosciuto durante GLPI auto sync"),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const runSyncGlpiDbToAtlas = getSyncFunction();
    const body = toRecord(await request.json().catch(() => ({})));
    const tenantId = getTenantIdFromBody(request, body);
    const queryLimit = request.nextUrl.searchParams.get("limit");
    const queryOffset = request.nextUrl.searchParams.get("offset");
    const queryFull = request.nextUrl.searchParams.get("full");
    const queryGlpiTicketId = request.nextUrl.searchParams.get("glpiTicketId");
    const limit = Number(body.limit ?? queryLimit ?? DEFAULT_LIMIT);
    const offset = Number(body.offset ?? queryOffset ?? 0);
    const glpiTicketId =
      getOptionalStringOrNumber(body.glpiTicketId) ||
      getOptionalStringOrNumber(body.glpi_ticket_id) ||
      getOptionalStringOrNumber(body.id) ||
      queryGlpiTicketId ||
      undefined;
    const incremental = body.full === true || queryFull === "1" ? false : true;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nel body oppure imposta ATLAS_DEFAULT_TENANT_ID nel file .env.local / Vercel.",
        },
        { status: 400 },
      );
    }

    const authResponse = await authorizeSyncRequest(request, tenantId);

    if (authResponse) {
      return authResponse;
    }

    const result = await runSyncGlpiDbToAtlas({
      tenantId,
      limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
      offset: Number.isFinite(offset) ? offset : 0,
      glpiTicketId,
      incremental,
    });

    return NextResponse.json({
      success: true,
      message: "GLPI manual sync completata",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("MANUAL SYNC GLPI ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Errore sconosciuto durante GLPI manual sync"),
      },
      { status: 500 },
    );
  }
}
