import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_ROLE = "cliente_user";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function adminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const supabase = adminClient();

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, city, region")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, customers: data || [] });
  } catch (error: any) {
    console.error("GET /api/auth/customer-register", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore caricamento clienti." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = adminClient();
    const body = await request.json();

    const email = cleanEmail(body?.email);
    const displayName = String(body?.displayName || "").trim();
    const fiscalCode = String(body?.fiscalCode || "").trim().toUpperCase();
    const customerId = String(body?.customerId || "").trim();
    const userId = body?.userId ? String(body.userId) : null;

    if (!email || !displayName || !fiscalCode || !customerId) {
      return NextResponse.json(
        { ok: false, error: "Email, nome, codice fiscale e cliente sono obbligatori." },
        { status: 400 },
      );
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, tenant_id, name")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer?.id || !customer?.tenant_id) {
      return NextResponse.json(
        { ok: false, error: "Cliente non valido o senza tenant collegato." },
        { status: 400 },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", customer.tenant_id)
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;

    const payload = {
      tenant_id: customer.tenant_id,
      user_id: userId,
      email,
      display_name: displayName,
      role: CLIENT_ROLE,
      role_id: null,
      status: "pending",
      customer_id: customer.id,
      fiscal_code: fiscalCode,
      updated_at: new Date().toISOString(),
    };

    const query = existing?.id
      ? supabase.from("tenant_users").update(payload).eq("id", existing.id).select().single()
      : supabase
          .from("tenant_users")
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select()
          .single();

    const { data: tenantUser, error: tenantUserError } = await query;

    if (tenantUserError) throw tenantUserError;

    return NextResponse.json({ ok: true, user: tenantUser });
  } catch (error: any) {
    console.error("POST /api/auth/customer-register", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore registrazione cliente." },
      { status: 500 },
    );
  }
}
