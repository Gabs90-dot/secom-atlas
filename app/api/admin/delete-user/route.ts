import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type DeletePayload = {
  tenantId?: string;
  tenantUserId?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonError("Configurazione Supabase incompleta: manca SUPABASE_SERVICE_ROLE_KEY o URL/ANON key.", 500);
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return jsonError("Sessione admin non valida. Effettua di nuovo il login.", 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);

  if (authError || !authData.user?.id) {
    return jsonError("Sessione non valida o scaduta.", 401);
  }

  const body = (await request.json().catch(() => null)) as DeletePayload | null;
  const tenantId = body?.tenantId;
  const tenantUserId = body?.tenantUserId;

  if (!tenantId || !tenantUserId) {
    return jsonError("Tenant e utente sono obbligatori.", 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error: requesterError } = await serviceClient
    .from("tenant_users")
    .select("id, role, status, tenant_id, user_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (requesterError) {
    return jsonError(requesterError.message, 500);
  }

  const allowedRoles = new Set(["super_admin", "admin", "owner", "manager"]);

  if (!requester || requester.status !== "active" || !allowedRoles.has(String(requester.role))) {
    return jsonError("Non hai permessi sufficienti per eliminare utenti.", 403);
  }

  if (requester.id === tenantUserId) {
    return jsonError("Non puoi eliminare la tua utenza mentre sei loggato.", 400);
  }

  const { data: targetUser, error: targetError } = await serviceClient
    .from("tenant_users")
    .select("id, user_id, email, tenant_id, role")
    .eq("tenant_id", tenantId)
    .eq("id", tenantUserId)
    .maybeSingle();

  if (targetError) {
    return jsonError(targetError.message, 500);
  }

  if (!targetUser) {
    return jsonError("Utente tenant non trovato.", 404);
  }

  if (targetUser.role === "super_admin" && requester.role !== "super_admin") {
    return jsonError("Solo un Super Admin può eliminare un Super Admin.", 403);
  }

  await serviceClient
    .from("user_permission_overrides")
    .delete()
    .eq("tenant_user_id", tenantUserId);

  const { error: tenantDeleteError } = await serviceClient
    .from("tenant_users")
    .delete()
    .eq("id", tenantUserId)
    .eq("tenant_id", tenantId);

  if (tenantDeleteError) {
    return jsonError(tenantDeleteError.message, 500);
  }

  if (targetUser.user_id) {
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(targetUser.user_id);

    if (authDeleteError) {
      return jsonError(
        `Profilo tenant eliminato, ma errore eliminazione Auth: ${authDeleteError.message}`,
        500
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message: targetUser.user_id
      ? "Utente eliminato da tenant e Supabase Auth. Email riutilizzabile."
      : "Profilo tenant eliminato. Nessun account Auth collegato trovato.",
  });
}
