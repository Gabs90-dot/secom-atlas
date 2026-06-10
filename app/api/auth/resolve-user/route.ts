import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

async function loadPermissionsForTenantUser(serviceClient: any, tenantUserId: string, roleId?: string | null) {
  if (!tenantUserId) return [];

  let rolePermissions: string[] = [];

  if (roleId) {
    const { data } = await serviceClient
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role_id", roleId);

    rolePermissions = data?.map((item: any) => item.permissions?.key).filter(Boolean) || [];
  }

  const { data: overrides } = await serviceClient
    .from("user_permission_overrides")
    .select("allowed, permissions(key)")
    .eq("tenant_user_id", tenantUserId);

  const map = new Map<string, boolean>();
  rolePermissions.forEach((permission) => map.set(permission, true));

  overrides?.forEach((override: any) => {
    const key = override.permissions?.key;
    if (key) map.set(key, Boolean(override.allowed));
  });

  return Array.from(map.entries())
    .filter(([, allowed]) => allowed)
    .map(([key]) => key);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!token) {
      return jsonError("Sessione non valida.", 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser(token);

    if (authError || !authData.user?.id || !authData.user?.email) {
      return jsonError("Sessione non valida o scaduta.", 401);
    }

    const sessionUser = authData.user;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const byUserId = await serviceClient
      .from("tenant_users")
      .select("*, tenants(*), roles(*)")
      .eq("user_id", sessionUser.id)
      .eq("status", "active")
      .maybeSingle();

    let membership = byUserId.data;

    if (!membership) {
      const byEmail = await serviceClient
        .from("tenant_users")
        .select("*, tenants(*), roles(*)")
        .eq("email", sessionUser.email)
        .eq("status", "active")
        .maybeSingle();

      membership = byEmail.data;

      if (membership?.id && !membership.user_id) {
        await serviceClient
          .from("tenant_users")
          .update({ user_id: sessionUser.id, updated_at: new Date().toISOString() })
          .eq("id", membership.id);
      }
    }

    if (!membership?.id) {
      return NextResponse.json({ ok: true, user: null });
    }

    await serviceClient
      .from("tenant_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", membership.id);

    const tenant = membership.tenants;
    const role = membership.roles;
    const normalizedRole = normalizeRole(role?.key || membership.role);
    const permissions = ["super_admin", "admin"].includes(normalizedRole)
      ? ["*"]
      : await loadPermissionsForTenantUser(serviceClient, membership.id, membership.role_id || role?.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: sessionUser.id,
        tenantUserId: membership.id,
        name: membership.display_name || sessionUser.user_metadata?.name || String(sessionUser.email || "utente").split("@")[0],
        email: sessionUser.email,
        role: normalizedRole,
        tenantId: membership.tenant_id || tenant?.id || "",
        tenantName: tenant?.name || "Tenant",
        permissions,
        customerId: membership.customer_id || null,
        siteId: membership.site_id || null,
        customerEntityId: membership.customer_entity_id || null,
        siteIds: membership.site_id ? [membership.site_id] : [],
        mustChangePassword: Boolean(membership.must_change_password || sessionUser.user_metadata?.temporary_password),
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/resolve-user", error);
    return jsonError(error?.message || "Errore risoluzione utente ATLAS.", 500);
  }
}
