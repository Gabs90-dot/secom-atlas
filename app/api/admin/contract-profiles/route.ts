import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function getTenantId(request: NextRequest, body?: any) {
  return (
    request.nextUrl.searchParams.get("tenantId") ||
    body?.tenantId ||
    body?.tenant_id ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

function supabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
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

    const search = request.nextUrl.searchParams.get("search") || "";
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

    let query = supabaseAdmin()
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
  } catch (error: any) {
    console.error("CONTRACT PROFILES GET ERROR", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore caricamento contratti" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = getTenantId(request, body);

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenantId mancante" },
        { status: 400 },
      );
    }

    const payload = {
      ...body,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    delete (payload as any).tenantId;
    delete (payload as any).id;

    const { data, error } = await supabaseAdmin()
      .from("contract_profiles")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("CONTRACT PROFILES POST ERROR", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore creazione contratto" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = getTenantId(request, body);
    const id = body?.id;

    if (!tenantId || !id) {
      return NextResponse.json(
        { ok: false, error: "tenantId o id mancante" },
        { status: 400 },
      );
    }

    const payload = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    delete (payload as any).tenantId;
    delete (payload as any).tenant_id;
    delete (payload as any).id;
    delete (payload as any).created_at;

    const { data, error } = await supabaseAdmin()
      .from("contract_profiles")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("CONTRACT PROFILES PATCH ERROR", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore aggiornamento contratto" },
      { status: 500 },
    );
  }
}
