import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanAction =
  | "createPlan"
  | "importItems"
  | "updateItemStatus"
  | "createItem"
  | "createConsumption"
  | "archivePlan";

type JsonRecord = Record<string, unknown>;

type RequestBody = {
  action?: PlanAction;
  tenantId?: string;
  plan?: JsonRecord;
  items?: JsonRecord[];
  itemId?: string;
  status?: string;
  itemPatch?: JsonRecord;
  consumption?: JsonRecord;
  planId?: string;
};

const ALLOWED_ROLES = new Set(["super_admin", "admin", "manager", "dispatcher", "tecnico", "commerciale", "owner"]);

function env(name: string): string {
  return process.env[name] || "";
}

function serviceClient() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SERVICE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Variabili Supabase server mancanti: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function anonClient() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Variabili Supabase pubbliche mancanti: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unauthorized(message = "Non autorizzato") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Permesso negato") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Errore server piani operativi.";
  console.error("[operational-plans] server error", error);
  return NextResponse.json({ error: message }, { status: 500 });
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function readRole(row: JsonRecord | null): string {
  if (!row) return "";
  const value = row.role;
  return typeof value === "string" ? value : "";
}

function readActive(row: JsonRecord | null): boolean {
  if (!row) return false;
  if (row.status === "active") return true;
  if (row.active === true) return true;
  if (row.is_active === true) return true;
  if (row.enabled === true) return true;
  // Compat: se la riga esiste e non ha campi stato, non blocchiamo il modulo V1.
  if (!("status" in row) && !("active" in row) && !("is_active" in row) && !("enabled" in row)) return true;
  return false;
}

async function requireUser(request: NextRequest, tenantId: string) {
  const token = bearerToken(request);
  if (!token) return { response: unauthorized("Token Bearer mancante."), userId: "", db: null as ReturnType<typeof serviceClient> | null };

  const authClient = anonClient();
  const { data: authData, error: authError } = await authClient.auth.getUser(token);

  if (authError || !authData.user?.id) {
    return { response: unauthorized("Sessione non valida."), userId: "", db: null as ReturnType<typeof serviceClient> | null };
  }

  const db = serviceClient();
  const { data: tenantUser, error: tenantError } = await db
    .from("tenant_users")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (tenantError) {
    console.error("[operational-plans] tenant user check error", tenantError);
    return { response: forbidden(`Errore verifica permessi: ${tenantError.message}`), userId: authData.user.id, db };
  }

  const row = (tenantUser || null) as JsonRecord | null;
  const role = readRole(row);

  if (!row || !readActive(row) || (role && !ALLOWED_ROLES.has(role))) {
    return { response: forbidden("Utente non abilitato ai Piani Operativi."), userId: authData.user.id, db };
  }

  return { response: null, userId: authData.user.id, db };
}

function compactRecord(input: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get("tenantId") || "";
    if (!tenantId) return badRequest("tenantId mancante.");

    const auth = await requireUser(request, tenantId);
    if (auth.response || !auth.db) return auth.response || unauthorized();

    const db = auth.db;

    const { data: plans, error: plansError } = await db
      .from("operational_plans")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("year", { ascending: false })
      .order("title", { ascending: true });

    if (plansError) return NextResponse.json({ error: plansError.message }, { status: 400 });

    const { data: items, error: itemsError } = await db
      .from("operational_plan_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("site_name", { ascending: true });

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

    const { data: consumptions, error: consumptionsError } = await db
      .from("operational_plan_consumptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (consumptionsError) return NextResponse.json({ error: consumptionsError.message }, { status: 400 });

    return NextResponse.json({ plans: plans || [], items: items || [], consumptions: consumptions || [] });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const tenantId = body.tenantId || "";
    if (!tenantId) return badRequest("tenantId mancante.");

    const auth = await requireUser(request, tenantId);
    if (auth.response || !auth.db) return auth.response || unauthorized();

    const db = auth.db;
    const action = body.action;

    if (action === "createPlan") {
      if (!body.plan) return badRequest("Payload piano mancante.");
      const payload = compactRecord({ ...body.plan, tenant_id: tenantId, created_by: auth.userId, updated_by: auth.userId });
      const { data, error } = await db.from("operational_plans").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ plan: data });
    }

    if (action === "importItems") {
      if (!body.planId) return badRequest("planId mancante.");
      const rows = body.items || [];
      if (rows.length === 0) return badRequest("Nessuna riga da importare.");

      const payload = rows.map((row) => compactRecord({ ...row, tenant_id: tenantId, plan_id: body.planId, created_by: auth.userId, updated_by: auth.userId }));
      const { data, error } = await db.from("operational_plan_items").insert(payload).select("*");
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ items: data || [] });
    }

    if (action === "createItem") {
      if (!body.planId || !body.itemPatch) return badRequest("Payload riga piano mancante.");
      const payload = compactRecord({ ...body.itemPatch, tenant_id: tenantId, plan_id: body.planId, created_by: auth.userId, updated_by: auth.userId });
      const { data, error } = await db.from("operational_plan_items").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: data });
    }

    if (action === "updateItemStatus") {
      if (!body.itemId || !body.itemPatch) return badRequest("itemId o patch mancante.");
      const patch = compactRecord({ ...body.itemPatch, updated_by: auth.userId });
      const { data, error } = await db
        .from("operational_plan_items")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", body.itemId)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: data });
    }

    if (action === "createConsumption") {
      if (!body.planId || !body.consumption) return badRequest("Payload consumo mancante.");
      const payload = compactRecord({ ...body.consumption, tenant_id: tenantId, plan_id: body.planId, created_by: auth.userId, updated_by: auth.userId });
      const { data, error } = await db.from("operational_plan_consumptions").insert(payload).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ consumption: data });
    }

    if (action === "archivePlan") {
      if (!body.planId) return badRequest("planId mancante.");
      const { data, error } = await db
        .from("operational_plans")
        .update({ status: "archived", active: false, updated_by: auth.userId })
        .eq("tenant_id", tenantId)
        .eq("id", body.planId)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ plan: data });
    }

    return badRequest("Azione non riconosciuta.");
  } catch (error) {
    return serverError(error);
  }
}
