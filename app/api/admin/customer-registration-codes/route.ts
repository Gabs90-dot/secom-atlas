import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  tenant_id: string | null;
  name: string | null;
};

type EntityRow = {
  id: string;
  tenant_id: string | null;
  glpi_entity_id?: number | string | null;
  name: string | null;
  complete_name?: string | null;
  normalized_complete_name?: string | null;
  entity_type?: string | null;
  is_active?: boolean | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

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

function userClient(token: string) {
  return createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

function cleanCodePart(value: unknown, fallback = "ACCESSO") {
  const text = normalize(value)
    .replace(/\broot\b/g, "")
    .replace(/\bcarabinieri\b/g, "")
    .replace(/\bcomando\b/g, "")
    .replace(/\bprovinciale\b/g, "")
    .replace(/\bcompagnia\b/g, "")
    .replace(/\bstazione\b/g, "")
    .replace(/\bpolizia\b/g, "")
    .replace(/\bcomune\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = text.split(" ").filter((part) => part.length >= 3);
  const chosen = tokens[tokens.length - 1] || tokens[0] || fallback;

  return chosen
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || fallback;
}

function customerPrefix(value: unknown) {
  const text = normalize(value);

  if (text.includes("carabinieri")) return "CC";
  if (text.includes("rfi") || text.includes("ferrov")) return "RFI";
  if (text.includes("ministero") || text.includes("polizia")) return "MI";
  if (text.includes("comun")) return "COM";

  return cleanCodePart(value, "CLI").slice(0, 4);
}

function randomChunk() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";

  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return out;
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

function entityMatchesCustomer(entity: EntityRow, customer: CustomerRow) {
  if (!entity?.is_active && entity?.is_active !== null && entity?.is_active !== undefined) return false;

  const entityText = normalize(`${entity.name || ""} ${entity.complete_name || ""} ${entity.normalized_complete_name || ""}`);
  if (!entityText) return false;

  return customerKeywords(customer.name || "").some((keyword) => {
    const cleanKeyword = normalize(keyword);
    return cleanKeyword.length > 0 && (` ${entityText} `).includes(` ${cleanKeyword} `);
  });
}

async function getRequester(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return { error: "Sessione non valida. Effettua di nuovo il login.", status: 401 as const };
  }

  const service = adminClient();
  const auth = userClient(token);
  const { data: authData, error: authError } = await auth.auth.getUser(token);

  if (authError || !authData.user?.id) {
    return { error: "Sessione non valida o scaduta.", status: 401 as const };
  }

  const { data: requester, error: requesterError } = await service
    .from("tenant_users")
    .select("id, tenant_id, user_id, email, role, status")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (requesterError) {
    return { error: requesterError.message, status: 500 as const };
  }

  const allowedRoles = new Set(["super_admin", "admin", "manager"]);

  if (!requester || requester.status !== "active" || !allowedRoles.has(String(requester.role))) {
    return { error: "Non hai permessi sufficienti per gestire i codici invito.", status: 403 as const };
  }

  return { service, requester };
}

async function generateUniqueCode(service: ReturnType<typeof adminClient>, customer: CustomerRow, entity: EntityRow) {
  const prefix = customerPrefix(customer.name);
  const entityName = entity.normalized_complete_name || entity.complete_name || entity.name || "";
  const location = cleanCodePart(entityName, "SEDE");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `${prefix}-${location}-${randomChunk()}`;

    const { data, error } = await service
      .from("customer_registration_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) return code;
  }

  throw new Error("Impossibile generare un codice univoco. Riprova.");
}

export async function GET(request: NextRequest) {
  try {
    const resolved = await getRequester(request);

    if ("error" in resolved) {
      return jsonError(String(resolved.error || "Errore autorizzazione."), resolved.status ?? 400);
    }

    const { service, requester } = resolved;
    const { searchParams } = new URL(request.url);
    const customerId = String(searchParams.get("customerId") || "").trim();
    const q = String(searchParams.get("q") || "").trim();

    const { data: customers, error: customersError } = await service
      .from("customers")
      .select("id, tenant_id, name")
      .eq("tenant_id", requester.tenant_id)
      .order("name", { ascending: true });

    if (customersError) throw customersError;

    const customerRows = (customers || []) as CustomerRow[];

    if (customerId && q.length >= 2) {
      const selectedCustomer = customerRows.find((customer) => String(customer.id) === customerId);

      if (!selectedCustomer?.tenant_id) {
        return jsonError("Cliente non valido o non appartenente al tenant.", 400);
      }

      const cleanQuery = q.replace(/[%_]/g, "").trim();

      const { data: entities, error: entitiesError } = await service
        .from("customer_entities")
        .select("id, tenant_id, glpi_entity_id, name, complete_name, normalized_complete_name, entity_type, is_active")
        .eq("tenant_id", selectedCustomer.tenant_id)
        .eq("is_active", true)
        .or(`name.ilike.%${cleanQuery}%,complete_name.ilike.%${cleanQuery}%,normalized_complete_name.ilike.%${cleanQuery}%`)
        .order("complete_name", { ascending: true })
        .limit(30);

      if (entitiesError) throw entitiesError;

      const entityRows = ((entities || []) as EntityRow[]).filter((entity) =>
        entityMatchesCustomer(entity, selectedCustomer),
      );

      return NextResponse.json({
        ok: true,
        customers: [],
        codes: [],
        entities: entityRows.map((entity) => ({
          id: String(entity.id),
          customerId: String(selectedCustomer.id),
          name: entity.name || "Entità senza nome",
          completeName: entity.normalized_complete_name || entity.complete_name || entity.name || "Entità senza nome",
          glpiEntityId: entity.glpi_entity_id || null,
        })),
      });
    }

    const { data: codes, error: codesError } = await service
      .from("customer_registration_codes")
      .select("*")
      .eq("tenant_id", requester.tenant_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (codesError) throw codesError;

    const customerMap = new Map(customerRows.map((customer) => [String(customer.id), customer.name || "Cliente"]));
    const entityIds = Array.from(new Set((codes || []).map((code: any) => code.customer_entity_id).filter(Boolean)));

    let entityMap = new Map<string, EntityRow>();

    if (entityIds.length > 0) {
      const { data: entities, error: entitiesError } = await service
        .from("customer_entities")
        .select("id, tenant_id, glpi_entity_id, name, complete_name, normalized_complete_name")
        .in("id", entityIds);

      if (entitiesError) throw entitiesError;

      entityMap = new Map(((entities || []) as EntityRow[]).map((entity) => [String(entity.id), entity]));
    }

    return NextResponse.json({
      ok: true,
      customers: customerRows.map((customer) => ({
        id: String(customer.id),
        name: customer.name || "Cliente senza nome",
      })),
      entities: [],
      codes: (codes || []).map((code: any) => {
        const entity = entityMap.get(String(code.customer_entity_id));

        return {
          ...code,
          customerName: customerMap.get(String(code.customer_id)) || "Cliente",
          entityName: entity?.name || "Entità",
          entityCompleteName: entity?.normalized_complete_name || entity?.complete_name || entity?.name || "Entità",
        };
      }),
    });
  } catch (error: any) {
    console.error("GET /api/admin/customer-registration-codes", error);
    return jsonError(error?.message || "Errore caricamento codici invito.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const resolved = await getRequester(request);

    if ("error" in resolved) {
      return jsonError(String(resolved.error || "Errore autorizzazione."), resolved.status ?? 400);
    }

    const { service, requester } = resolved;

    if (!["super_admin", "admin"].includes(String(requester.role))) {
      return jsonError("Solo Super Admin e Admin possono generare codici invito.", 403);
    }

    const body = await request.json();
    const customerId = String(body?.customerId || "").trim();
    const customerEntityId = String(body?.customerEntityId || "").trim();
    const maxUses = Math.max(1, Number(body?.maxUses || 1));
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt).toISOString() : null;
    const contactName = String(body?.contactName || "").trim() || null;
    const contactEmail = String(body?.contactEmail || "").trim().toLowerCase() || null;
    const notes = String(body?.notes || "").trim() || null;

    if (!customerId || !customerEntityId) {
      return jsonError("Cliente ed entità sono obbligatori.", 400);
    }

    const { data: customer, error: customerError } = await service
      .from("customers")
      .select("id, tenant_id, name")
      .eq("id", customerId)
      .eq("tenant_id", requester.tenant_id)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer?.id) {
      return jsonError("Cliente non valido o non appartenente al tenant.", 400);
    }

    const { data: entity, error: entityError } = await service
      .from("customer_entities")
      .select("id, tenant_id, glpi_entity_id, name, complete_name, normalized_complete_name, is_active")
      .eq("id", customerEntityId)
      .eq("tenant_id", requester.tenant_id)
      .maybeSingle();

    if (entityError) throw entityError;

    if (!entity?.id || entity.is_active === false) {
      return jsonError("Entità cliente non valida o non attiva.", 400);
    }

    const code = await generateUniqueCode(service, customer as CustomerRow, entity as EntityRow);

    const { data: createdCode, error: insertError } = await service
      .from("customer_registration_codes")
      .insert([
        {
          tenant_id: requester.tenant_id,
          customer_id: customer.id,
          customer_entity_id: entity.id,
          site_id: null,
          code,
          label: `${customer.name || "Cliente"} · ${entity.normalized_complete_name || entity.complete_name || entity.name || "Entità"}`,
          max_uses: maxUses,
          used_count: 0,
          is_active: true,
          expires_at: expiresAt,
          created_by: requester.user_id || null,
          notes,
          contact_name: contactName,
          contact_email: contactEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      code: {
        ...createdCode,
        customerName: customer.name,
        entityName: entity.name,
        entityCompleteName: entity.normalized_complete_name || entity.complete_name || entity.name,
      },
    });
  } catch (error: any) {
    console.error("POST /api/admin/customer-registration-codes", error);
    return jsonError(error?.message || "Errore generazione codice invito.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const resolved = await getRequester(request);

    if ("error" in resolved) {
      return jsonError(String(resolved.error || "Errore autorizzazione."), resolved.status ?? 400);
    }

    const { service, requester } = resolved;

    if (!["super_admin", "admin"].includes(String(requester.role))) {
      return jsonError("Solo Super Admin e Admin possono modificare i codici invito.", 403);
    }

    const body = await request.json();
    const codeId = String(body?.codeId || "").trim();
    const isActive = Boolean(body?.isActive);

    if (!codeId) {
      return jsonError("Codice obbligatorio.", 400);
    }

    const { data, error } = await service
      .from("customer_registration_codes")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", codeId)
      .eq("tenant_id", requester.tenant_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, code: data });
  } catch (error: any) {
    console.error("PATCH /api/admin/customer-registration-codes", error);
    return jsonError(error?.message || "Errore aggiornamento codice invito.", 500);
  }
}
