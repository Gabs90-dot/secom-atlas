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

const SAFE_DEFAULT_ROLE = "cliente_user";

const INTERNAL_ALLOWED_ROLES = new Set([
  "admin",
  "owner",
  "manager",
  "dispatcher",
  "tecnico",
  "commerciale",
  "cliente_admin",
  "cliente_user",
]);

const REQUESTER_ALLOWED_ROLES = new Set(["admin", "owner", "manager"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeRoleKey(value?: string | null) {
  const role = String(value || "").trim();

  if (!role) return SAFE_DEFAULT_ROLE;
  if (!INTERNAL_ALLOWED_ROLES.has(role)) return SAFE_DEFAULT_ROLE;

  return role;
}

function normalizeStatus(value?: string | null) {
  const status = String(value || "").trim();

  if (["active", "pending", "disabled"].includes(status)) return status;

  return "pending";
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 20000, label = "Operazione") {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} scaduta dopo ${ms / 1000}s.`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

  const tenantId = String(body?.tenantId || "").trim();
  const email = body?.email?.trim().toLowerCase();
  const displayName = body?.displayName?.trim() || email?.split("@")[0] || "Utente";
  const requestedRoleKey = normalizeRoleKey(body?.roleKey);
  const status = normalizeStatus(body?.status);

  if (!tenantId || !email) {
    return jsonError("Tenant ed email sono obbligatori.", 400);
  }

  console.log("[invite-user] request", { tenantId, email, requestedRoleKey, status });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: requester, error: requesterError } = await withTimeout(
    serviceClient
      .from("tenant_users")
      .select("id, role, status, tenant_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", authData.user.id)
      .maybeSingle(),
    12000,
    "Controllo permessi requester",
  );

  if (requesterError) {
    return jsonError(requesterError.message, 500);
  }

  if (!requester || requester.status !== "active" || !REQUESTER_ALLOWED_ROLES.has(String(requester.role))) {
    return jsonError("Non hai permessi sufficienti per invitare utenti.", 403);
  }

  let finalRoleKey = requestedRoleKey;

  // Freno di sicurezza: solo admin/owner può creare altri admin/owner.
  if (["admin", "owner"].includes(finalRoleKey) && !["admin", "owner"].includes(String(requester.role))) {
    finalRoleKey = SAFE_DEFAULT_ROLE;
  }

  let finalRoleId: string | null = null;

  // Non fidarsi del roleId ricevuto dal client: lo validiamo lato server contro role key e tenant.
  if (body?.roleId) {
    const { data: roleRow, error: roleError } = await withTimeout(
      serviceClient
        .from("roles")
        .select("id, key")
        .eq("tenant_id", tenantId)
        .eq("id", body.roleId)
        .maybeSingle(),
      12000,
      "Validazione roleId",
    );

    if (roleError) {
      return jsonError(roleError.message, 500);
    }

    if (roleRow?.key === finalRoleKey) {
      finalRoleId = roleRow.id;
    }
  }

  // Se roleId è assente/non valido, provo a ricavarlo dalla key, ma senza mai cambiare roleKey.
  if (!finalRoleId) {
    const { data: roleByKey, error: roleByKeyError } = await withTimeout(
      serviceClient
        .from("roles")
        .select("id, key")
        .eq("tenant_id", tenantId)
        .eq("key", finalRoleKey)
        .maybeSingle(),
      12000,
      "Ricerca roleId da roleKey",
    );

    if (roleByKeyError) {
      return jsonError(roleByKeyError.message, 500);
    }

    finalRoleId = roleByKey?.id || null;
  }

  let invitedUserId: string | null = null;
  let inviteMessage = "Invito inviato e profilo tenant creato.";

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/`
    : undefined;

  const { data: inviteData, error: inviteError } = await withTimeout(
    serviceClient.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        tenant_id: tenantId,
        role: finalRoleKey,
      },
      redirectTo,
    }),
    20000,
    "Invio email invito Supabase Auth",
  );

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

  const { data: existing, error: existingError } = await withTimeout(
    serviceClient
      .from("tenant_users")
      .select("id, user_id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .maybeSingle(),
    12000,
    "Ricerca profilo tenant esistente",
  );

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  const tenantPayload = {
    tenant_id: tenantId,
    user_id: invitedUserId || existing?.user_id || null,
    email,
    display_name: displayName,
    role: finalRoleKey,
    role_id: finalRoleId,
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

  const { data: tenantUser, error: tenantUserError } = await withTimeout(
    query,
    12000,
    "Creazione/aggiornamento profilo tenant",
  );

  if (tenantUserError) {
    return jsonError(tenantUserError.message, 500);
  }

  console.log("[invite-user] completed", { email, finalRoleKey, status });

  return NextResponse.json({
    ok: true,
    message: inviteMessage,
    user: tenantUser,
  });
}
