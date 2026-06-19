import { NextRequest, NextResponse } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";

const DELETE_TICKET_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];
const DELETE_TICKET_ALLOWED_LEGACY_ROLES: readonly LegacyAtlasRole[] = ["owner"];

type DeleteTicketPayload = {
  ticketId?: unknown;
  tenantId?: unknown;
  glpiTicketId?: unknown;
};

function isMissingOptionalTable(error: any) {
  return ["42P01", "PGRST205", "PGRST204"].includes(String(error?.code || ""));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as DeleteTicketPayload;
    const ticketId = Number(body.ticketId);
    const tenantId = String(body.tenantId || "").trim();
    const glpiTicketId = body.glpiTicketId ? Number(body.glpiTicketId) : null;

    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      return NextResponse.json({ ok: false, error: "ticketId non valido." }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId mancante." }, { status: 400 });
    }

    const auth = await requireAtlasUser(request, {
      tenantId,
      allowedRoles: DELETE_TICKET_ALLOWED_ROLES,
      allowedLegacyRoles: DELETE_TICKET_ALLOWED_LEGACY_ROLES,
    });

    if (!auth.ok) {
      return auth.response;
    }

    const admin = auth.serviceClient;

    const { data: candidate, error: candidateError } = await admin
      .from("tickets")
      .select("id,tenant_id,glpi_ticket_id")
      .eq("tenant_id", auth.requester.tenantId)
      .eq("id", ticketId)
      .maybeSingle();

    if (candidateError) throw candidateError;

    if (!candidate) {
      return NextResponse.json(
        { ok: false, error: "Nessun ticket ATLAS trovato con questo ID o tenant non corrispondente." },
        { status: 404 },
      );
    }

    if (glpiTicketId && Number(candidate.glpi_ticket_id || 0) !== glpiTicketId) {
      return NextResponse.json(
        { ok: false, error: "Il ticket GLPI non corrisponde al ticket ATLAS nel tenant richiesto." },
        { status: 409 },
      );
    }

    const ticketIds = [candidate.id];

    const optionalChildTables = ["ticket_events", "ticket_attachments", "ticket_materials", "ticket_timeline"];
    for (const table of optionalChildTables) {
      const { error } = await admin
        .from(table)
        .delete()
        .eq("tenant_id", auth.requester.tenantId)
        .in("ticket_id", ticketIds);
      if (error && !isMissingOptionalTable(error)) {
        console.log(`[delete-ticket] tabella ${table}:`, error.message);
      }
    }

    const detachWorkOrders = await admin
      .from("work_orders")
      .update({ ticket_id: null })
      .eq("tenant_id", auth.requester.tenantId)
      .in("ticket_id", ticketIds);
    if (detachWorkOrders.error) {
      console.log("[delete-ticket] detach work_orders fallito, provo delete:", detachWorkOrders.error.message);
      const deleteWorkOrders = await admin
        .from("work_orders")
        .delete()
        .eq("tenant_id", auth.requester.tenantId)
        .in("ticket_id", ticketIds);
      if (deleteWorkOrders.error) {
        throw new Error(`Impossibile eliminare il ticket: esistono bolle/interventi collegati. Dettaglio: ${deleteWorkOrders.error.message}`);
      }
    }

    const { data: deletedRows, error: deleteError } = await admin
      .from("tickets")
      .delete()
      .eq("tenant_id", auth.requester.tenantId)
      .in("id", ticketIds)
      .select("id");
    if (deleteError) throw deleteError;

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nessun ticket eliminato: la cancellazione ATLAS non ha rimosso righe." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      deleted: deletedRows.length,
      deletedTicketIds: deletedRows.map((row) => row.id),
      glpiDeleted: false,
      glpiError: "",
      message: "Ticket eliminato solo da ATLAS. GLPI non modificato.",
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
