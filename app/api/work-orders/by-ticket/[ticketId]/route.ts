import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";
import { createSupabaseWorkOrderRepository } from "@/lib/work-orders/repository";
import { createWorkOrderService } from "@/lib/work-orders/service";

export const runtime = "nodejs";

const WORK_ORDER_ALLOWED_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
];

type RouteParams = {
  params: Promise<{
    ticketId: string;
  }>;
};

function legacyString(value: unknown): string {
  return String(value || "").trim();
}

function getTenantId(request: NextRequest) {
  return (
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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantId = getTenantId(request);
    const { ticketId: rawTicketId } = await context.params;
    const ticketId = parseTicketId(rawTicketId);

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

    const { data: ticket, error: ticketError } = await auth.serviceClient
      .from("tickets")
      .select("id, tenant_id")
      .eq("tenant_id", tenantId)
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return NextResponse.json(
        { ok: false, error: "Ticket non trovato per il tenant." },
        { status: 404 },
      );
    }

    const repository = createSupabaseWorkOrderRepository(auth.serviceClient);
    const service = createWorkOrderService(repository);
    const workOrder = await service.getWorkOrderByTicketId(ticketId);

    if (workOrder && workOrder.tenant_id !== tenantId) {
      return NextResponse.json(
        { ok: false, error: "Bolla non trovata per il tenant." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: workOrder });
  } catch (error: unknown) {
    console.error("WORK ORDER BY TICKET GET ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore caricamento bolla ticket") },
      { status: 500 },
    );
  }
}
