import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const REBUILD_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

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

function getTenantId(request: NextRequest, body?: Record<string, unknown>) {
  return (
    legacyString(request.nextUrl.searchParams.get("tenantId")) ||
    legacyString(body?.tenantId) ||
    legacyString(body?.tenant_id) ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

async function rebuildTicketEntityLinks(request: NextRequest, body?: Record<string, unknown>) {
  try {
    const tenantId = getTenantId(request, body);

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nella query oppure imposta ATLAS_DEFAULT_TENANT_ID.",
        },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: REBUILD_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { data, error } = await auth.serviceClient.rpc(
      "rebuild_ticket_entity_links",
      {
        p_tenant_id: tenantId,
      },
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Relazioni ticket/entity ricostruite",
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("REBUILD TICKET ENTITY LINKS ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Errore ricostruzione relazioni ticket/entity"),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return rebuildTicketEntityLinks(request);
}

export async function POST(request: NextRequest) {
  const body = toRecord(await request.json().catch(() => ({})));
  return rebuildTicketEntityLinks(request, body);
}
