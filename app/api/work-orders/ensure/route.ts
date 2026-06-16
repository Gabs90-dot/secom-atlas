import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { createSupabaseWorkOrderRepository } from "@/lib/work-orders/repository";
import { createWorkOrderService } from "@/lib/work-orders/service";
import type {
  CreateWorkOrderPayload,
  WorkOrderMetadata,
  WorkOrderTemplateKey,
} from "@/types/work-orders";

export const runtime = "nodejs";

const WORK_ORDER_ALLOWED_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
];

type TicketRow = {
  id: number | string;
  tenant_id: string | null;
  glpi_ticket_id: number | string | null;
  site: string | null;
  entity: string | null;
  city: string | null;
  region: string | null;
  problem: string | null;
  technician: string | null;
  customer_id: string | null;
  site_id: number | null;
  glpi_entity_path: string | null;
  intervention_date: string | null;
  opened_at: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function legacyString(value: unknown): string {
  return String(value || "").trim();
}

function nullableString(value: unknown): string | null {
  const text = legacyString(value);
  return text ? text : null;
}

function getTenantId(request: NextRequest, body: Record<string, unknown>) {
  return (
    legacyString(body.tenantId) ||
    legacyString(body.tenant_id) ||
    legacyString(request.nextUrl.searchParams.get("tenantId")) ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

function parseTicketId(value: unknown): number | null {
  const ticketId = Number(value);
  return Number.isSafeInteger(ticketId) && ticketId > 0 ? ticketId : null;
}

function getTemplateKey(value: unknown): WorkOrderTemplateKey {
  return legacyString(value) || "generic";
}

function compactParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => legacyString(part)).filter(Boolean).join(" - ");
}

function buildDefaultTitle(ticket: TicketRow) {
  const ticketNumber = ticket.glpi_ticket_id || ticket.id;
  return `Bolla intervento ticket ${ticketNumber}`;
}

function buildInterventionObject(ticket: TicketRow, body: Record<string, unknown>) {
  return (
    nullableString(body.intervention_object) ||
    nullableString(body.interventionObject) ||
    nullableString(ticket.problem) ||
    "Intervento tecnico"
  );
}

function buildMetadata(ticket: TicketRow): WorkOrderMetadata {
  return {
    source: "api/work-orders/ensure",
    ticket_opened_at: ticket.opened_at,
    glpi_ticket_id: ticket.glpi_ticket_id,
    glpi_entity_path: ticket.glpi_entity_path,
    ticket_region: ticket.region,
  };
}

function buildCreatePayload(
  tenantId: string,
  ticket: TicketRow,
  body: Record<string, unknown>,
): CreateWorkOrderPayload {
  const siteLabel = compactParts([ticket.site, ticket.city, ticket.entity]);
  const customerName = nullableString(ticket.entity) || nullableString(ticket.site) || "Cliente non definito";

  return {
    tenant_id: tenantId,
    ticket_id: ticket.id,
    customer_id: ticket.customer_id,
    site_id: ticket.site_id,
    customer_entity_id: null,
    glpi_entity_id: null,
    contract_profile_id: null,
    customer_contract_link_id: null,
    template_key: getTemplateKey(body.template_key || body.templateKey),
    title: nullableString(body.title) || buildDefaultTitle(ticket),
    intervention_object: buildInterventionObject(ticket, body),
    description: nullableString(ticket.problem),
    technician_name: nullableString(ticket.technician),
    customer_name_snapshot: customerName,
    customer_address_snapshot: null,
    site_name_snapshot: siteLabel || nullableString(ticket.glpi_entity_path),
    site_address_snapshot: compactParts([ticket.city, ticket.region]) || null,
    contract_summary_snapshot: null,
    contract_terms_snapshot: {},
    checklist_snapshot: [],
    scheduled_at: ticket.intervention_date,
    metadata: buildMetadata(ticket),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = toRecord(await request.json().catch(() => ({})));
    const tenantId = getTenantId(request, body);
    const ticketId = parseTicketId(body.ticketId || body.ticket_id);

    if (!tenantId || !ticketId) {
      return NextResponse.json(
        { ok: false, error: "tenantId o ticketId mancante/non valido" },
        { status: 400 },
      );
    }

    const auth = await requireAtlasUser(request, {
      allowedRoles: WORK_ORDER_ALLOWED_ROLES,
      tenantId,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { data: ticketData, error: ticketError } = await auth.serviceClient
      .from("tickets")
      .select(
        "id, tenant_id, glpi_ticket_id, site, entity, city, region, problem, technician, customer_id, site_id, glpi_entity_path, intervention_date, opened_at",
      )
      .eq("tenant_id", tenantId)
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    const ticket = ticketData as TicketRow | null;

    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Ticket non trovato per il tenant." },
        { status: 404 },
      );
    }

    const repository = createSupabaseWorkOrderRepository(auth.serviceClient);
    const service = createWorkOrderService(repository);
    const existing = await service.getWorkOrderByTicketId(ticketId);

    if (existing && existing.tenant_id === tenantId) {
      return NextResponse.json({ ok: true, created: false, data: existing });
    }

    const created = await service.createWorkOrder(buildCreatePayload(tenantId, ticket, body));

    return NextResponse.json({ ok: true, created: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("WORK ORDER ENSURE POST ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore creazione bolla ticket") },
      { status: 500 },
    );
  }
}
