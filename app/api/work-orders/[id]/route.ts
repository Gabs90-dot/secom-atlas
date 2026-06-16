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
    id: string;
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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await context.params;
    const workOrderId = legacyString(id);

    if (!tenantId || !workOrderId) {
      return NextResponse.json(
        { ok: false, error: "tenantId o id mancante" },
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

    const repository = createSupabaseWorkOrderRepository(auth.serviceClient);
    const service = createWorkOrderService(repository);
    const workOrder = await service.getWorkOrderById(workOrderId);

    if (!workOrder || workOrder.tenant_id !== tenantId) {
      return NextResponse.json(
        { ok: false, error: "Bolla non trovata per il tenant." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: workOrder });
  } catch (error: unknown) {
    console.error("WORK ORDER GET ERROR", error);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "Errore caricamento bolla") },
      { status: 500 },
    );
  }
}
