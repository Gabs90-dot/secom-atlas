import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { importGlpiHistoricalBatch } from "@/services/glpiHistoricalImport";

const GLPI_IMPORT_BATCH_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function legacyString(value: unknown): string {
  return String(value || "").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Errore import batch GLPI");
}

export async function POST(request: NextRequest) {
  try {
    const body = toRecord(await request.json());
    const tenantId = legacyString(body.tenantId);
    const runId = body.runId ? String(body.runId) : null;
    const offset = Number(body.offset || 0);
    const limit = Math.min(Number(body.limit || 500), 1000);

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Missing tenantId" }, { status: 400 });
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: GLPI_IMPORT_BATCH_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const result = await importGlpiHistoricalBatch({
      tenantId,
      runId,
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST to start a GLPI import batch." },
    { status: 405 },
  );
}
