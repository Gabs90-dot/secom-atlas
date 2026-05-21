import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type InvitePayload = {
  tenantId?: string;
  email?: string;
  displayName?: string;
  roleKey?: string;
  roleId?: string | null;
  status?: string;
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

  const body = (await request.json().catch(() => null)) as InvitePayload | null;

  const tenantId = body?.tenantId;
  const email = body?.email?.trim().toLowerCase();
  const displayName = body?.displayName?.trim() || email?.split("@")[0] || "Utente";
  const roleKey = body?.roleKey || "cliente_user";
  const roleId = body?.roleId || null;
  const status = body?.status || "pending";

  if (!tenantId || !email) {
    return jsonError("Tenant ed email sono obbligatori.", 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error: requesterError } = await serviceClient
    .from("tenant_users")
    .select("id, role, status, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (requesterError) {
    return jsonError(requesterError.message, 500);
  }

  const allowedRoles = new Set(["admin", "owner", "manager"]);

  if (!requester || requester.status !== "active" || !allowedRoles.has(String(requester.role))) {
    return jsonError("Non hai permessi sufficienti per invitare utenti.", 403);
  }

  let invitedUserId: string | null = null;
  let inviteMessage = "Invito inviato e profilo tenant creato.";

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/`
    : undefined;

  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      display_name: displayName,
      tenant_id: tenantId,
      role: roleKey,
    },
    redirectTo,
  });

  if (inviteError) {
    const msg = inviteError.message || "";
    const alreadyExists =
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered") ||
      msg.toLowerCase().includes("exists");

    if (!alreadyExists) {
      return jsonError(msg || "Errore invito Supabase Auth", 400);
    }

    inviteMessage = "Utente già presente in Auth: profilo tenant creato/aggiornato.";
  } else {
    invitedUserId = inviteData?.user?.id || null;
  }

  const { data: existing } = await serviceClient
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  const tenantPayload = {
    tenant_id: tenantId,
    user_id: invitedUserId,
    email,
    display_name: displayName,
    role: roleKey,
    role_id: roleId,
    status,
    updated_at: new Date().toISOString(),
  };

  const query = existing?.id
    ? serviceClient.from("tenant_users").update(tenantPayload).eq("id", existing.id).select().single()
    : serviceClient
        .from("tenant_users")
        .insert([{ ...tenantPayload, created_at: new Date().toISOString() }])
        .select()
        .single();

  const { data: tenantUser, error: tenantUserError } = await query;

  if (tenantUserError) {
    return jsonError(tenantUserError.message, 500);
  }

  return NextResponse.json({
    ok: true,
    message: inviteMessage,
    user: tenantUser,
  });
}
