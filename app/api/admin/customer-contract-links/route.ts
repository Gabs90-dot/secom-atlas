import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const CUSTOMER_CONTRACT_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager", "commerciale"];

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
    legacyString(body?.tenantId) ||
    legacyString(body?.tenant_id) ||
    legacyString(request.nextUrl.searchParams.get("tenantId")) ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const glpiEntityId = request.nextUrl.searchParams.get("glpiEntityId");

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante" }, { status: 400 });
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: CUSTOMER_CONTRACT_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    if (!glpiEntityId) {
      return NextResponse.json({ ok: true, data: null });
    }

    const { data, error } = await auth.serviceClient
      .from("customer_contract_links")
      .select("*, contract_profiles(*)")
      .eq("tenant_id", tenantId)
      .eq("glpi_entity_id", Number(glpiEntityId))
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    console.error("customer-contract-links GET error", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore lettura link contratto") },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const bodyRecord = toRecord(body);
    const tenantId = getTenantId(request, bodyRecord);

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante" }, { status: 400 });
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: CUSTOMER_CONTRACT_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const glpiEntityId = bodyRecord.glpiEntityId || bodyRecord.glpi_entity_id;
    const contractProfileId = bodyRecord.contractProfileId || bodyRecord.contract_profile_id;

    if (!glpiEntityId) {
      return NextResponse.json({ ok: false, error: "glpiEntityId mancante" }, { status: 400 });
    }

    if (!contractProfileId) {
      return NextResponse.json({ ok: false, error: "contractProfileId mancante" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      tenant_id: tenantId,
      glpi_entity_id: Number(glpiEntityId),
      customer_entity_id: bodyRecord.customerEntityId || bodyRecord.customer_entity_id || null,
      customer_id: bodyRecord.customerId || bodyRecord.customer_id || null,
      contract_profile_id: contractProfileId,
      match_scope: "entity",
      notes: bodyRecord.notes || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auth.serviceClient
      .from("customer_contract_links")
      .upsert(payload, { onConflict: "tenant_id,glpi_entity_id" })
      .select("*, contract_profiles(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    console.error("customer-contract-links POST error", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore salvataggio link contratto") },
      { status: 500 },
    );
  }
}
