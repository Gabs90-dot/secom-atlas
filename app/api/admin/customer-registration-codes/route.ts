import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

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

type RegistrationCodeRow = {
  id?: string;
  customer_id?: string | number | null;
  customer_entity_id?: string | number | null;
  [key: string]: unknown;
};

const CUSTOMER_REGISTRATION_READ_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager"];
const CUSTOMER_REGISTRATION_WRITE_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

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

function getTenantIdFromSearch(request: NextRequest): string | null {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  return tenantId || null;
}

function getTenantIdFromBody(body: Record<string, unknown>): string | null {
  const tenantId = legacyString(body.tenantId) || legacyString(body.tenant_id);
  return tenantId || null;
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

  return chosen.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || fallback;
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
    return cleanKeyword.length > 0 && ` ${entityText} `.includes(` ${cleanKeyword} `);
  });
}

async function generateUniqueCode(service: SupabaseClient, customer: CustomerRow, entity: EntityRow) {
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
    const auth = await requireAtlasUser(request, {
      allowedRoles: CUSTOMER_REGISTRATION_READ_ROLES,
      tenantId: getTenantIdFromSearch(request),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const service = auth.serviceClient;
    const tenantId = auth.requester.tenantId;
    const { searchParams } = new URL(request.url);
    const customerId = String(searchParams.get("customerId") || "").trim();
    const q = String(searchParams.get("q") || "").trim();

    const { data: customers, error: customersError } = await service
      .from("customers")
      .select("id, tenant_id, name")
      .eq("tenant_id", tenantId)
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
          name: entity.name || "Entit\u00e0 senza nome",
          completeName: entity.normalized_complete_name || entity.complete_name || entity.name || "Entit\u00e0 senza nome",
          glpiEntityId: entity.glpi_entity_id || null,
        })),
      });
    }

    const { data: codes, error: codesError } = await service
      .from("customer_registration_codes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (codesError) throw codesError;

    const codeRows = (codes || []) as RegistrationCodeRow[];
    const customerMap = new Map(customerRows.map((customer) => [String(customer.id), customer.name || "Cliente"]));
    const entityIds = Array.from(new Set(codeRows.map((code) => code.customer_entity_id).filter(Boolean)));

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
      codes: codeRows.map((code) => {
        const entity = entityMap.get(String(code.customer_entity_id));

        return {
          ...code,
          customerName: customerMap.get(String(code.customer_id)) || "Cliente",
          entityName: entity?.name || "Entit\u00e0",
          entityCompleteName: entity?.normalized_complete_name || entity?.complete_name || entity?.name || "Entit\u00e0",
        };
      }),
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/customer-registration-codes", error);
    return jsonError(getErrorMessage(error, "Errore caricamento codici invito."), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = toRecord(await request.json());
    const auth = await requireAtlasUser(request, {
      allowedRoles: CUSTOMER_REGISTRATION_WRITE_ROLES,
      tenantId: getTenantIdFromBody(body),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const service = auth.serviceClient;
    const tenantId = auth.requester.tenantId;
    const customerId = legacyString(body.customerId);
    const customerEntityId = legacyString(body.customerEntityId);
    const maxUses = Math.max(1, Number(body.maxUses || 1));
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)).toISOString() : null;
    const contactName = legacyString(body.contactName) || null;
    const contactEmail = legacyString(body.contactEmail).toLowerCase() || null;
    const notes = legacyString(body.notes) || null;

    if (!customerId || !customerEntityId) {
      return jsonError("Cliente ed entit\u00e0 sono obbligatori.", 400);
    }

    const { data: customer, error: customerError } = await service
      .from("customers")
      .select("id, tenant_id, name")
      .eq("id", customerId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer?.id) {
      return jsonError("Cliente non valido o non appartenente al tenant.", 400);
    }

    const { data: entity, error: entityError } = await service
      .from("customer_entities")
      .select("id, tenant_id, glpi_entity_id, name, complete_name, normalized_complete_name, is_active")
      .eq("id", customerEntityId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (entityError) throw entityError;

    if (!entity?.id || entity.is_active === false) {
      return jsonError("Entit\u00e0 cliente non valida o non attiva.", 400);
    }

    const code = await generateUniqueCode(service, customer as CustomerRow, entity as EntityRow);

    const { data: createdCode, error: insertError } = await service
      .from("customer_registration_codes")
      .insert([
        {
          tenant_id: tenantId,
          customer_id: customer.id,
          customer_entity_id: entity.id,
          site_id: null,
          code,
          label: `${customer.name || "Cliente"} \u00b7 ${entity.normalized_complete_name || entity.complete_name || entity.name || "Entit\u00e0"}`,
          max_uses: maxUses,
          used_count: 0,
          is_active: true,
          expires_at: expiresAt,
          created_by: auth.requester.userId || null,
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
  } catch (error: unknown) {
    console.error("POST /api/admin/customer-registration-codes", error);
    return jsonError(getErrorMessage(error, "Errore generazione codice invito."), 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = toRecord(await request.json());
    const auth = await requireAtlasUser(request, {
      allowedRoles: CUSTOMER_REGISTRATION_WRITE_ROLES,
      tenantId: getTenantIdFromBody(body),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const service = auth.serviceClient;
    const tenantId = auth.requester.tenantId;
    const codeId = legacyString(body.codeId);
    const isActive = Boolean(body.isActive);

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
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, code: data });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/customer-registration-codes", error);
    return jsonError(getErrorMessage(error, "Errore aggiornamento codice invito."), 500);
  }
}
