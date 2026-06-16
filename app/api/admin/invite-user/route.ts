import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";

export const dynamic = "force-dynamic";

type InvitePayload = {
  tenantId?: string;
  email?: string;
  displayName?: string;
  roleKey?: string;
  roleId?: string | null;
  status?: string;
  mode?: "email_invite" | "temporary_password";
  temporaryPassword?: string;
  expiresAt?: string | null;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
};

type ExistingTenantUserRow = {
  id: string;
  user_id: string | null;
};

type RoleRow = {
  id: string;
  key: string | null;
};

type TenantUserPayload = {
  tenant_id: string;
  user_id: string | null;
  email: string;
  display_name: string;
  role: string;
  role_id: string | null;
  status: string;
  updated_at: string;
  must_change_password?: boolean;
};

const INVITE_USER_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];
const INVITE_USER_LEGACY_ALLOWED_ROLES: readonly LegacyAtlasRole[] = ["owner"];
const SAFE_DEFAULT_ROLE = "cliente_user";

const INTERNAL_ALLOWED_ROLES = new Set([
  "super_admin",
  "admin",
  "owner",
  "manager",
  "dispatcher",
  "tecnico",
  "commerciale",
  "cliente_admin",
  "cliente_user",
]);

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
  const body = (await request.json().catch(() => null)) as InvitePayload | null;

  const tenantId = String(body?.tenantId || "").trim();
  const email = body?.email?.trim().toLowerCase();
  const displayName = body?.displayName?.trim() || email?.split("@")[0] || "Utente";
  const requestedRoleKey = normalizeRoleKey(body?.roleKey);
  const status = normalizeStatus(body?.status);
  const mode = body?.mode === "temporary_password" ? "temporary_password" : "email_invite";
  const temporaryPassword = String(body?.temporaryPassword || "");

  if (!tenantId || !email) {
    return jsonError("Tenant ed email sono obbligatori.", 400);
  }

  if (mode === "temporary_password" && temporaryPassword.length < 8) {
    return jsonError("La password temporanea deve contenere almeno 8 caratteri.", 400);
  }

  const auth = await requireAtlasUser(request, {
    allowedRoles: INVITE_USER_ALLOWED_ROLES,
    allowedLegacyRoles: INVITE_USER_LEGACY_ALLOWED_ROLES,
    tenantId,
  });

  if (!auth.ok) {
    return auth.response;
  }

  console.log("[invite-user] request", { tenantId, email, requestedRoleKey, status, mode });

  const serviceClient = auth.serviceClient;
  let finalRoleKey = requestedRoleKey;

  if (
    ["super_admin", "admin", "owner"].includes(finalRoleKey) &&
    !["super_admin", "admin", "owner"].includes(auth.requester.rawRole)
  ) {
    finalRoleKey = SAFE_DEFAULT_ROLE;
  }

  let finalRoleId: string | null = null;

  if (body?.roleId) {
    const { data: roleRowData, error: roleError } = await withTimeout(
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

    const roleRow = roleRowData as RoleRow | null;

    if (roleRow?.key === finalRoleKey) {
      finalRoleId = roleRow.id;
    }
  }

  if (!finalRoleId) {
    const { data: roleByKeyData, error: roleByKeyError } = await withTimeout(
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

    const roleByKey = roleByKeyData as RoleRow | null;
    finalRoleId = roleByKey?.id || null;
  }

  let invitedUserId: string | null = null;
  let inviteMessage =
    mode === "temporary_password"
      ? "Utente creato con password temporanea e profilo tenant collegato."
      : "Invito inviato e profilo tenant creato.";

  const { data: existingData, error: existingError } = await withTimeout(
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

  const existing = existingData as ExistingTenantUserRow | null;

  if (mode === "temporary_password") {
    if (existing?.user_id) {
      const { error: updateAuthError } = await withTimeout(
        serviceClient.auth.admin.updateUserById(existing.user_id, {
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            tenant_id: tenantId,
            role: finalRoleKey,
            temporary_password: true,
          },
        }),
        20000,
        "Aggiornamento password temporanea Supabase Auth",
      );

      if (updateAuthError) {
        return jsonError(updateAuthError.message || "Errore aggiornamento password temporanea.", 400);
      }

      invitedUserId = existing.user_id;
      inviteMessage = "Password temporanea aggiornata e profilo tenant collegato.";
    } else {
      const { data: createdAuthData, error: createAuthError } = await withTimeout(
        serviceClient.auth.admin.createUser({
          email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            tenant_id: tenantId,
            role: finalRoleKey,
            temporary_password: true,
          },
        }),
        20000,
        "Creazione utente Supabase Auth con password temporanea",
      );

      if (createAuthError) {
        return jsonError(createAuthError.message || "Errore creazione utente con password temporanea.", 400);
      }

      invitedUserId = createdAuthData?.user?.id || null;
    }
  } else {
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

      inviteMessage = "Utente gia presente in Auth: profilo tenant creato/aggiornato.";
    } else {
      invitedUserId = inviteData?.user?.id || null;
    }
  }

  const baseTenantPayload: TenantUserPayload = {
    tenant_id: tenantId,
    user_id: invitedUserId || existing?.user_id || null,
    email,
    display_name: displayName,
    role: finalRoleKey,
    role_id: finalRoleId,
    status,
    updated_at: new Date().toISOString(),
  };

  const tenantPayloadWithPasswordFlag: TenantUserPayload = {
    ...baseTenantPayload,
    must_change_password: mode === "temporary_password",
  };

  async function upsertTenantUser(payload: TenantUserPayload) {
    const query = existing?.id
      ? serviceClient.from("tenant_users").update(payload).eq("id", existing.id).select().single()
      : serviceClient
          .from("tenant_users")
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select()
          .single();

    return withTimeout(query, 12000, "Creazione/aggiornamento profilo tenant");
  }

  let { data: tenantUser, error: tenantUserError } = await upsertTenantUser(tenantPayloadWithPasswordFlag);

  if (tenantUserError && String(tenantUserError.message || "").includes("must_change_password")) {
    const fallback = await upsertTenantUser(baseTenantPayload);
    tenantUser = fallback.data;
    tenantUserError = fallback.error;
  }

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
