import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const CONTRACT_PROFILE_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager", "commerciale"];

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

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenantId mancante" },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: CONTRACT_PROFILE_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const search = request.nextUrl.searchParams.get("search") || "";
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

    let query = auth.serviceClient
      .from("contract_profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("category", { ascending: true })
      .order("match_priority", { ascending: false })
      .order("customer_type", { ascending: true });

    if (activeOnly) query = query.eq("is_active", true);

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `category.ilike.${term},customer_type.ilike.${term},summary.ilike.${term},commercial_notes.ilike.${term}`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error: unknown) {
    console.error("CONTRACT PROFILES GET ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore caricamento contratti") },
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
      return NextResponse.json(
        { ok: false, error: "tenantId mancante" },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: CONTRACT_PROFILE_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const payload: Record<string, unknown> = {
      ...bodyRecord,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    delete payload.tenantId;
    delete payload.id;

    const { data, error } = await auth.serviceClient
      .from("contract_profiles")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    console.error("CONTRACT PROFILES POST ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore creazione contratto") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const bodyRecord = toRecord(body);
    const tenantId = getTenantId(request, bodyRecord);
    const id = bodyRecord.id;

    if (!tenantId || !id) {
      return NextResponse.json(
        { ok: false, error: "tenantId o id mancante" },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: CONTRACT_PROFILE_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const payload: Record<string, unknown> = {
      ...bodyRecord,
      updated_at: new Date().toISOString(),
    };

    delete payload.tenantId;
    delete payload.tenant_id;
    delete payload.id;
    delete payload.created_at;

    const { data, error } = await auth.serviceClient
      .from("contract_profiles")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    console.error("CONTRACT PROFILES PATCH ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore aggiornamento contratto") },
      { status: 500 },
    );
  }
}
