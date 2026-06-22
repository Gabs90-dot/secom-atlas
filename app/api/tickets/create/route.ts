import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";
import { resolveTicketProviderForTenant } from "@/lib/server/tenantConfig";

export const runtime = "nodejs";

const TICKET_CREATE_ALLOWED_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
];
const TICKET_CREATE_ALLOWED_LEGACY_ROLES: readonly LegacyAtlasRole[] = ["owner"];

const TICKET_SELECT =
  "id,tenant_id,site,region,entity,city,site_id,customer_id,glpi_entity_id,glpi_entity_path,problem,materials,technician,status,cost,slot,intervention_date,opened_at,expected_close_date,closed_at,urgent";

type TicketCreatePayload = {
  tenantId?: unknown;
  tenant_id?: unknown;
  site?: unknown;
  region?: unknown;
  entity?: unknown;
  city?: unknown;
  siteId?: unknown;
  site_id?: unknown;
  customerId?: unknown;
  customer_id?: unknown;
  glpiEntityId?: unknown;
  glpi_entity_id?: unknown;
  glpiEntityPath?: unknown;
  glpi_entity_path?: unknown;
  problem?: unknown;
  materials?: unknown;
  technician?: unknown;
  status?: unknown;
  cost?: unknown;
  slot?: unknown;
  interventionDate?: unknown;
  intervention_date?: unknown;
  openedAt?: unknown;
  opened_at?: unknown;
  expectedCloseDate?: unknown;
  expected_close_date?: unknown;
  urgent?: unknown;
  eventTitle?: unknown;
  eventDescription?: unknown;
  eventMetadata?: unknown;
  createEvent?: unknown;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const cleaned = text(value);
  return cleaned ? cleaned : null;
}

function nullableId(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return nullableText(value);
}

function positiveNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function nullableNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : Boolean(value);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean).slice(0, 100);
}

async function ensureRowBelongsToTenant(
  serviceClient: SupabaseClient,
  table: "customers" | "sites",
  tenantId: string,
  id: number | string | null,
) {
  if (!id) return true;

  const { data, error } = await serviceClient
    .from(table)
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function ensureGlpiEntityBelongsToTenant(
  serviceClient: SupabaseClient,
  tenantId: string,
  glpiEntityId: number | null,
) {
  if (!glpiEntityId) return true;

  const { data, error } = await serviceClient
    .from("customer_entities")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("glpi_entity_id", glpiEntityId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as TicketCreatePayload | null;

    if (!payload || !isRecord(payload)) {
      return jsonError("Payload non valido.", 400);
    }

    const requestedTenantId = text(payload.tenantId ?? payload.tenant_id);

    if (!requestedTenantId) {
      return jsonError("tenantId mancante.", 400);
    }

    const auth = await requireAtlasUser(request, {
      tenantId: requestedTenantId,
      allowedRoles: TICKET_CREATE_ALLOWED_ROLES,
      allowedLegacyRoles: TICKET_CREATE_ALLOWED_LEGACY_ROLES,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const tenantId = auth.requester.tenantId;
    const provider = await resolveTicketProviderForTenant(auth.serviceClient, auth.requester);
    const site = text(payload.site);
    const problem = text(payload.problem);
    const status = text(payload.status) || "Aperto";

    if (!site || !problem) {
      return jsonError("Sede e descrizione intervento sono obbligatorie.", 400);
    }

    const customerId = nullableId(payload.customerId ?? payload.customer_id);
    const siteId = nullableId(payload.siteId ?? payload.site_id);
    const glpiEntityId =
      provider === "glpi" ? positiveNumberOrNull(payload.glpiEntityId ?? payload.glpi_entity_id) : null;
    const glpiEntityPath =
      provider === "glpi" ? nullableText(payload.glpiEntityPath ?? payload.glpi_entity_path) : null;

    const [customerAllowed, siteAllowed, entityAllowed] = await Promise.all([
      ensureRowBelongsToTenant(auth.serviceClient, "customers", tenantId, customerId),
      ensureRowBelongsToTenant(auth.serviceClient, "sites", tenantId, siteId),
      ensureGlpiEntityBelongsToTenant(auth.serviceClient, tenantId, glpiEntityId),
    ]);

    if (!customerAllowed || !siteAllowed || !entityAllowed) {
      return jsonError("Cliente, sede o entita non autorizzati per il tenant.", 403);
    }

    const openedAt = nullableText(payload.openedAt ?? payload.opened_at) || new Date().toISOString();

    const { data, error } = await auth.serviceClient
      .from("tickets")
      .insert([
        {
          site,
          region: text(payload.region) || "Da definire",
          entity: text(payload.entity),
          city: text(payload.city),
          site_id: siteId,
          customer_id: customerId,
          glpi_entity_id: glpiEntityId,
          glpi_entity_path: glpiEntityPath,
          problem,
          materials: stringList(payload.materials),
          technician: text(payload.technician),
          status,
          cost: nullableNumber(payload.cost) ?? 0,
          slot: nullableText(payload.slot),
          intervention_date: nullableText(payload.interventionDate ?? payload.intervention_date),
          opened_at: openedAt,
          expected_close_date: nullableText(payload.expectedCloseDate ?? payload.expected_close_date),
          urgent: booleanValue(payload.urgent),
          tenant_id: tenantId,
        },
      ])
      .select(TICKET_SELECT)
      .single();

    if (error) {
      console.error("create native ticket failed", error);
      return jsonError("Errore salvataggio ticket.", 500);
    }

    if (payload.createEvent !== false) {
      const eventTitle = text(payload.eventTitle) || "Ticket creato";
      const eventDescription = text(payload.eventDescription) || `${site} - ${problem}`;
      const eventMetadata = isRecord(payload.eventMetadata) ? payload.eventMetadata : {};

      const { error: eventError } = await auth.serviceClient.from("ticket_events").insert([
        {
          ticket_id: data.id,
          customer_id: customerId,
          site_id: siteId,
          event_type: "ticket_created",
          title: eventTitle,
          description: eventDescription,
          created_by: auth.requester.displayName || auth.requester.email || "Operatore",
          tenant_id: tenantId,
          metadata: {
            ...eventMetadata,
            ticket_provider: provider,
          },
        },
      ]);

      if (eventError) {
        console.warn("create native ticket event failed", eventError);
      }
    }

    return NextResponse.json({
      ok: true,
      provider,
      ticket: data,
    });
  } catch (error: unknown) {
    console.error("create native ticket exception", error);
    return jsonError("Errore creazione ticket.", 500);
  }
}
