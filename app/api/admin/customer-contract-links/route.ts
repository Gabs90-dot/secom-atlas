import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

function getTenantId(request: NextRequest, body?: any) {
  return (
    body?.tenantId ||
    body?.tenant_id ||
    request.nextUrl.searchParams.get("tenantId") ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const tenantId = getTenantId(request);
    const glpiEntityId = request.nextUrl.searchParams.get("glpiEntityId");

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante" }, { status: 400 });
    }

    if (!glpiEntityId) {
      return NextResponse.json({ ok: true, data: null });
    }

    const { data, error } = await supabase
      .from("customer_contract_links")
      .select("*, contract_profiles(*)")
      .eq("tenant_id", tenantId)
      .eq("glpi_entity_id", Number(glpiEntityId))
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("customer-contract-links GET error", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore lettura link contratto" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const tenantId = getTenantId(request, body);

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante" }, { status: 400 });
    }

    const glpiEntityId = body?.glpiEntityId || body?.glpi_entity_id;
    const contractProfileId = body?.contractProfileId || body?.contract_profile_id;

    if (!glpiEntityId) {
      return NextResponse.json({ ok: false, error: "glpiEntityId mancante" }, { status: 400 });
    }

    if (!contractProfileId) {
      return NextResponse.json({ ok: false, error: "contractProfileId mancante" }, { status: 400 });
    }

    const payload = {
      tenant_id: tenantId,
      glpi_entity_id: Number(glpiEntityId),
      customer_entity_id: body?.customerEntityId || body?.customer_entity_id || null,
      customer_id: body?.customerId || body?.customer_id || null,
      contract_profile_id: contractProfileId,
      match_scope: "entity",
      notes: body?.notes || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customer_contract_links")
      .upsert(payload, { onConflict: "tenant_id,glpi_entity_id" })
      .select("*, contract_profiles(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("customer-contract-links POST error", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore salvataggio link contratto" },
      { status: 500 },
    );
  }
}
