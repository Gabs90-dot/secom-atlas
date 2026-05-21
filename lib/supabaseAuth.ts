"use client";

import { supabase } from "@/lib/supabase";
import type { AtlasUser } from "@/lib/auth";
import { normalizeRole } from "@/lib/auth";

export async function signInWithEmailPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
    },
  });
}

export async function signOutAtlasUser() {
  return supabase.auth.signOut();
}

async function loadPermissionsForTenantUser(tenantUserId: string, roleId?: string | null) {
  if (!tenantUserId) return [];

  let rolePermissions: string[] = [];

  if (roleId) {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role_id", roleId);

    rolePermissions =
      data?.map((item: any) => item.permissions?.key).filter(Boolean) || [];
  }

  const { data: overrides } = await supabase
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

export async function resolveAtlasUser(sessionUser: any): Promise<AtlasUser | null> {
  if (!sessionUser?.id || !sessionUser?.email) return null;

  const byUserId = await supabase
    .from("tenant_users")
    .select("*, tenants(*), roles(*)")
    .eq("user_id", sessionUser.id)
    .eq("status", "active")
    .maybeSingle();

  let membership = byUserId.data;

  if (!membership) {
    const byEmail = await supabase
      .from("tenant_users")
      .select("*, tenants(*), roles(*)")
      .eq("email", sessionUser.email)
      .eq("status", "active")
      .maybeSingle();

    membership = byEmail.data;

    if (membership?.id && !membership.user_id) {
      await supabase
        .from("tenant_users")
        .update({ user_id: sessionUser.id, updated_at: new Date().toISOString() })
        .eq("id", membership.id);
    }
  }

  if (!membership) {
    const { data: defaultTenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", "secom")
      .maybeSingle();

    if (!defaultTenant?.id) return null;

    const { data: adminRole } = await supabase
      .from("roles")
      .select("*")
      .eq("tenant_id", defaultTenant.id)
      .eq("key", "admin")
      .maybeSingle();

    const payload = {
      tenant_id: defaultTenant.id,
      user_id: sessionUser.id,
      email: sessionUser.email,
      display_name: sessionUser.user_metadata?.name || sessionUser.email.split("@")[0],
      role: "admin",
      role_id: adminRole?.id || null,
      status: "active",
      last_login_at: new Date().toISOString(),
    };

    const inserted = await supabase
      .from("tenant_users")
      .insert([payload])
      .select("*, tenants(*), roles(*)")
      .single();

    membership = inserted.data;
  } else if (membership?.id) {
    await supabase
      .from("tenant_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", membership.id);
  }

  const tenant = membership?.tenants;
  const role = membership?.roles;
  const normalizedRole = normalizeRole(role?.key || membership?.role);
  const permissions = normalizedRole === "admin"
    ? ["*"]
    : await loadPermissionsForTenantUser(membership?.id, membership?.role_id || role?.id);

  return {
    id: sessionUser.id,
    tenantUserId: membership?.id,
    name:
      membership?.display_name ||
      sessionUser.user_metadata?.name ||
      sessionUser.email.split("@")[0],
    email: sessionUser.email,
    role: normalizedRole,
    tenantId: membership?.tenant_id || tenant?.id || "",
    tenantName: tenant?.name || "Tenant",
    permissions,
  };
}
