import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireGlpiEnabledForTenant } from "@/lib/server/glpiTenantGuard";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { syncGlpiEntitiesToAtlas } from "@/services/glpiEntitySyncEngine";

const GLPI_SYNC_ENTITIES_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

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
    ""
  );
}

export async function POST(request: NextRequest) {
  try {
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
      allowedRoles: GLPI_SYNC_ENTITIES_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const glpiGuard = await requireGlpiEnabledForTenant(auth.serviceClient, auth.requester);

    if (glpiGuard) {
      return glpiGuard;
    }

    const result = await syncGlpiEntitiesToAtlas({ tenantId });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GLPI entity sync error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Errore sync albero entita GLPI"),
      },
      { status: 500 },
    );
  }
}
