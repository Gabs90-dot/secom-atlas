import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_ROLE = "cliente_user";

type CustomerRow = {
  id: string;
  tenant_id: string | null;
  name: string | null;
};

type CustomerEntityRow = {
  id: string;
  tenant_id: string | null;
  glpi_entity_id?: number | string | null;
  name: string | null;
  complete_name?: string | null;
  normalized_complete_name?: string | null;
  entity_type?: string | null;
  is_active?: boolean | null;
};

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

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function customerKeywords(customerName: string) {
  const text = normalize(customerName);
  const keywords = new Set(text.split(" ").filter((part) => part.length >= 3));

  if (text.includes("carabinieri")) {
    ["carabinieri", "arma", "cc", "comando", "compagnia", "stazione"].forEach((word) => keywords.add(word));
  }

  if (text.includes("polizia") || text.includes("ministero") || text.includes("intern")) {
    ["polizia", "questura", "commissariato", "ministero", "interno", "interni", "polfer"].forEach((word) => keywords.add(word));
  }

  if (text.includes("rfi") || text.includes("ferrov")) {
    ["rfi", "ferroviaria", "ferrovie", "polfer"].forEach((word) => keywords.add(word));
  }

  if (text.includes("comun")) {
    ["comune", "comuni", "municipio", "polizia locale", "locale"].forEach((word) => keywords.add(word));
  }

  return Array.from(keywords);
}

function entityMatchesCustomer(entity: CustomerEntityRow, customer: CustomerRow) {
  if (!entity?.is_active && entity?.is_active !== null && entity?.is_active !== undefined) return false;

  const entityText = normalize(`${entity.name || ""} ${entity.complete_name || ""} ${entity.normalized_complete_name || ""}`);
  if (!entityText) return false;

  return customerKeywords(customer.name || "").some((keyword) => {
    const cleanKeyword = normalize(keyword);
    return cleanKeyword.length > 0 && (` ${entityText} `).includes(` ${cleanKeyword} `);
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = adminClient();
    const { searchParams } = new URL(request.url);
    const customerId = String(searchParams.get("customerId") || "").trim();
    const q = String(searchParams.get("q") || "").trim();

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, tenant_id, name")
      .order("name", { ascending: true });

    if (customersError) throw customersError;

    const customerRows = (customers || []) as CustomerRow[];

    // Prima chiamata: torna solo i clienti.
    // Le entità non vengono più pre-caricate tutte: erano troppe e il dropdown si fermava a metà.
    if (!customerId) {
      return NextResponse.json({
        ok: true,
        customers: customerRows.map((customer) => ({
          id: String(customer.id),
          name: customer.name || "Cliente senza nome",
        })),
        entities: [],
      });
    }

    const selectedCustomer = customerRows.find((customer) => String(customer.id) === customerId);

    if (!selectedCustomer?.tenant_id) {
      return NextResponse.json(
        { ok: false, error: "Cliente non valido o senza tenant collegato." },
        { status: 400 },
      );
    }

    if (q.length < 2) {
      return NextResponse.json({
        ok: true,
        customers: [],
        entities: [],
      });
    }

    const cleanQuery = q.replace(/[%_]/g, "").trim();

    let entityQuery = supabase
      .from("customer_entities")
      .select("id, tenant_id, glpi_entity_id, name, complete_name, normalized_complete_name, entity_type, is_active")
      .eq("tenant_id", selectedCustomer.tenant_id)
      .eq("is_active", true)
      .or(
        `name.ilike.%${cleanQuery}%,complete_name.ilike.%${cleanQuery}%,normalized_complete_name.ilike.%${cleanQuery}%`,
      )
      .order("complete_name", { ascending: true })
      .limit(30);

    const { data: entities, error: entitiesError } = await entityQuery;

    if (entitiesError) throw entitiesError;

    const entityRows = ((entities || []) as CustomerEntityRow[]).filter((entity) =>
      entityMatchesCustomer(entity, selectedCustomer),
    );

    return NextResponse.json({
      ok: true,
      customers: [],
      entities: entityRows.map((entity) => ({
        id: String(entity.id),
        customerId: String(selectedCustomer.id),
        name: entity.name || "Entità senza nome",
        completeName: entity.normalized_complete_name || entity.complete_name || entity.name || "Entità senza nome",
        glpiEntityId: entity.glpi_entity_id || null,
      })),
    });
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
    const customerEntityId = String(body?.customerEntityId || "").trim();
    const registrationCode = String(body?.registrationCode || "").trim().toUpperCase();
    const userId = body?.userId ? String(body.userId) : null;

    if (!email || !displayName || !fiscalCode || !customerId || !registrationCode) {
      return NextResponse.json(
        { ok: false, error: "Email, nome, codice fiscale, cliente e codice invito sono obbligatori." },
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

    let inviteQuery = supabase
      .from("customer_registration_codes")
      .select("id, tenant_id, customer_id, customer_entity_id, site_id, code, is_active, max_uses, used_count, expires_at")
      .eq("tenant_id", customer.tenant_id)
      .eq("customer_id", customer.id)
      .eq("code", registrationCode);

    if (customerEntityId) {
      inviteQuery = inviteQuery.eq("customer_entity_id", customerEntityId);
    }

    const { data: inviteCode, error: inviteCodeError } = await inviteQuery.maybeSingle();

    if (inviteCodeError) throw inviteCodeError;

    if (!inviteCode?.id || inviteCode.is_active === false) {
      return NextResponse.json(
        { ok: false, error: "Codice invito non valido per il cliente selezionato." },
        { status: 403 },
      );
    }

    const resolvedCustomerEntityId = String(inviteCode.customer_entity_id || customerEntityId || "").trim();

    if (!resolvedCustomerEntityId) {
      return NextResponse.json(
        { ok: false, error: "Il codice invito non è associato a nessuna entità cliente." },
        { status: 400 },
      );
    }

    const { data: entity, error: entityError } = await supabase
      .from("customer_entities")
      .select("id, tenant_id, name, complete_name, normalized_complete_name")
      .eq("id", resolvedCustomerEntityId)
      .eq("tenant_id", customer.tenant_id)
      .maybeSingle();

    if (entityError) throw entityError;

    if (!entity?.id) {
      return NextResponse.json(
        { ok: false, error: "Entità collegata al codice invito non valida." },
        { status: 400 },
      );
    }

    if (inviteCode.expires_at && new Date(inviteCode.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Codice invito scaduto." },
        { status: 403 },
      );
    }

    if (inviteCode.max_uses !== null && inviteCode.max_uses !== undefined && Number(inviteCode.used_count || 0) >= Number(inviteCode.max_uses)) {
      return NextResponse.json(
        { ok: false, error: "Codice invito già utilizzato." },
        { status: 403 },
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
      customer_entity_id: entity.id,
      site_id: inviteCode.site_id || null,
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

    await supabase
      .from("customer_registration_codes")
      .update({
        used_count: Number(inviteCode.used_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteCode.id);

    return NextResponse.json({ ok: true, user: tenantUser });
  } catch (error: any) {
    console.error("POST /api/auth/customer-register", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Errore registrazione cliente." },
      { status: 500 },
    );
  }
}
