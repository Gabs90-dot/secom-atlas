import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { syncGlpiDbToAtlas } from "@/services/glpiSyncEngine";

export const runtime = "nodejs";

type SyncGlpiDbToAtlas = typeof syncGlpiDbToAtlas;

const GLPI_SYNC_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

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

function getTenantId(request: NextRequest, body: Record<string, unknown>) {
  return (
    legacyString(body.tenantId) ||
    legacyString(body.tenant_id) ||
    legacyString(request.nextUrl.searchParams.get("tenantId")) ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

function getSyncFunction(): SyncGlpiDbToAtlas {
  if (typeof syncGlpiDbToAtlas !== "function") {
    throw new Error(
      "Export syncGlpiDbToAtlas mancante in services/glpiSyncEngine.ts. Sostituisci quel file con glpiSyncEngine_FIXED.ts.",
    );
  }

  return syncGlpiDbToAtlas;
}

export async function POST(request: NextRequest) {
  try {
    const runSyncGlpiDbToAtlas = getSyncFunction();
    const body = toRecord(await request.json().catch(() => ({})));
    const tenantId = getTenantId(request, body);

    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "tenantId mancante. Passa tenantId nel body oppure imposta ATLAS_DEFAULT_TENANT_ID nelle env.",
        },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: GLPI_SYNC_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const limit = Math.min(Number(body.limit || 250), 1000);
    const offset = Number(body.offset || 0);
    const glpiTicketId = body.glpiTicketId || body.glpi_ticket_id || body.id;

    const result = await runSyncGlpiDbToAtlas({
      tenantId,
      limit,
      offset,
      glpiTicketId: typeof glpiTicketId === "string" || typeof glpiTicketId === "number" ? glpiTicketId : undefined,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GLPI DB sync error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Errore sync GLPI DB"),
      },
      { status: 500 },
    );
  }
}
