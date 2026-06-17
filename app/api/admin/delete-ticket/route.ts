import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
  return { url, anon, service };
}

function isMissingOptionalTable(error: any) {
  return ["42P01", "PGRST205", "PGRST204"].includes(String(error?.code || ""));
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "Authorization Bearer mancante." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ticketId = body?.ticketId;
    const tenantId = body?.tenantId || null;
    const glpiTicketId = body?.glpiTicketId || null;

    if (!ticketId) {
      return NextResponse.json({ ok: false, error: "ticketId mancante." }, { status: 400 });
    }

    const { url, anon, service } = getSupabaseEnv();
    if (!url || !anon || !service) {
      return NextResponse.json(
        { ok: false, error: "Configurazione Supabase server incompleta: servono URL, ANON KEY e SERVICE ROLE KEY." },
        { status: 501 },
      );
    }

    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ ok: false, error: "Sessione utente non valida." }, { status: 401 });
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    let userQuery = admin
      .from("tenant_users")
      .select("role,status,tenant_id")
      .eq("user_id", authData.user.id)
      .in("role", ["super_admin", "admin"]);

    if (tenantId) userQuery = userQuery.eq("tenant_id", tenantId);

    const { data: memberships, error: membershipError } = await userQuery;
    if (membershipError) throw membershipError;

    const allowed = (memberships || []).some((row: any) => String(row.status || "active") !== "inactive");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Permesso negato: solo admin e super_admin possono eliminare ticket." },
        { status: 403 },
      );
    }

    const candidateFilters = [`id.eq.${ticketId}`];
    if (glpiTicketId) candidateFilters.push(`glpi_ticket_id.eq.${glpiTicketId}`);

    let candidateQuery = admin
      .from("tickets")
      .select("id,tenant_id,glpi_ticket_id")
      .or(candidateFilters.join(","));

    if (tenantId) candidateQuery = candidateQuery.eq("tenant_id", tenantId);

    const { data: candidates, error: candidateError } = await candidateQuery;
    if (candidateError) throw candidateError;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nessun ticket ATLAS trovato con questo ID/GLPI ID o tenant non corrispondente." },
        { status: 404 },
      );
    }

    const ticketIds = Array.from(new Set(candidates.map((row: any) => row.id).filter(Boolean)));

    const optionalChildTables = ["ticket_events", "ticket_attachments", "ticket_materials", "ticket_timeline"];
    for (const table of optionalChildTables) {
      const { error } = await admin.from(table).delete().in("ticket_id", ticketIds);
      if (error && !isMissingOptionalTable(error)) {
        console.log(`[delete-ticket] tabella ${table}:`, error.message);
      }
    }

    const detachWorkOrders = await admin.from("work_orders").update({ ticket_id: null }).in("ticket_id", ticketIds);
    if (detachWorkOrders.error) {
      console.log("[delete-ticket] detach work_orders fallito, provo delete:", detachWorkOrders.error.message);
      const deleteWorkOrders = await admin.from("work_orders").delete().in("ticket_id", ticketIds);
      if (deleteWorkOrders.error) {
        throw new Error(`Impossibile eliminare il ticket: esistono bolle/interventi collegati. Dettaglio: ${deleteWorkOrders.error.message}`);
      }
    }

    let deleteQuery = admin.from("tickets").delete().in("id", ticketIds).select("id");
    if (tenantId) deleteQuery = deleteQuery.eq("tenant_id", tenantId);

    const { data: deletedRows, error: deleteError } = await deleteQuery;
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
      deletedTicketIds: deletedRows.map((row: any) => row.id),
      glpiDeleted: false,
      glpiError: "",
      message: "Ticket eliminato solo da ATLAS. GLPI non modificato.",
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}
