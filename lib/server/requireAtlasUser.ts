import { type SupabaseClient, type User, createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { normalizeRole, type AtlasRole } from "@/lib/auth";

type AuthFailureStatus = 401 | 403 | 500;
export type LegacyAtlasRole = "owner";

type TenantUserRow = {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  email: string | null;
  role: string | null;
  role_id: string | null;
  status: string | null;
  display_name: string | null;
  customer_id: string | null;
  customer_entity_id: string | number | null;
  site_id: string | number | null;
};

export type RequireAtlasUserOptions = {
  tenantId?: string | null;
  allowedRoles?: readonly AtlasRole[];
  allowedLegacyRoles?: readonly LegacyAtlasRole[];
};

export type AtlasRequester = {
  authUser: User;
  tenantUserId: string;
  userId: string;
  email: string;
  tenantId: string;
  role: AtlasRole;
  rawRole: string;
  status: "active";
  displayName: string | null;
  roleId: string | null;
  customerId: string | null;
  customerEntityId: string | number | null;
  siteId: string | number | null;
};

export type RequireAtlasUserSuccess = {
  ok: true;
  requester: AtlasRequester;
  serviceClient: SupabaseClient;
};

export type RequireAtlasUserFailure = {
  ok: false;
  response: NextResponse;
};

export type RequireAtlasUserResult = RequireAtlasUserSuccess | RequireAtlasUserFailure;

const TENANT_USER_SELECT =
  "id, tenant_id, user_id, email, role, role_id, status, display_name, customer_id, customer_entity_id, site_id";

function authError(message: string, status: AuthFailureStatus): RequireAtlasUserFailure {
  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: message }, { status }),
  };
}

function readBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, ...tokenParts] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || tokenParts.length === 0) {
    return null;
  }

  const token = tokenParts.join(" ").trim();
  return token.length > 0 ? token : null;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAnonClient(): SupabaseClient {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function createSupabaseServiceClient(): SupabaseClient {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function isLegacyAtlasRole(role: string): role is LegacyAtlasRole {
  return role === "owner";
}

function isRequesterRoleAllowed(requester: AtlasRequester, options: RequireAtlasUserOptions): boolean {
  if (!options.allowedRoles && !options.allowedLegacyRoles) {
    return true;
  }

  if (options.allowedRoles?.includes(requester.role)) {
    return true;
  }

  return isLegacyAtlasRole(requester.rawRole) && Boolean(options.allowedLegacyRoles?.includes(requester.rawRole));
}

function buildRequester(authUser: User, tenantUser: TenantUserRow): AtlasRequester | null {
  if (!tenantUser.tenant_id || tenantUser.status !== "active") {
    return null;
  }

  const email = authUser.email ?? tenantUser.email;
  const rawRole = String(tenantUser.role || "").trim().toLowerCase();

  if (!email) {
    return null;
  }

  return {
    authUser,
    tenantUserId: tenantUser.id,
    userId: tenantUser.user_id ?? authUser.id,
    email,
    tenantId: tenantUser.tenant_id,
    role: normalizeRole(rawRole),
    rawRole,
    status: "active",
    displayName: tenantUser.display_name,
    roleId: tenantUser.role_id,
    customerId: tenantUser.customer_id,
    customerEntityId: tenantUser.customer_entity_id,
    siteId: tenantUser.site_id,
  };
}

export async function requireAtlasUser(
  request: NextRequest,
  options: RequireAtlasUserOptions = {},
): Promise<RequireAtlasUserResult> {
  const token = readBearerToken(request);

  if (!token) {
    return authError("Non autenticato. Authorization Bearer token mancante.", 401);
  }

  try {
    const anonClient = createSupabaseAnonClient();
    const { data: authData, error: authValidationError } = await anonClient.auth.getUser(token);
    const authUser = authData.user;

    if (authValidationError || !authUser) {
      return authError("Non autenticato. Token non valido o scaduto.", 401);
    }

    const serviceClient = createSupabaseServiceClient();
    let tenantUser: TenantUserRow | null = null;

    if (options.tenantId) {
      const { data: tenantUserData, error: tenantUserError } = await serviceClient
        .from("tenant_users")
        .select(TENANT_USER_SELECT)
        .eq("status", "active")
        .eq("user_id", authUser.id)
        .eq("tenant_id", options.tenantId)
        .maybeSingle();

      if (tenantUserError) {
        console.error("requireAtlasUser tenant_users query failed", tenantUserError);
        return authError("Errore server durante la verifica autorizzazioni.", 500);
      }

      tenantUser = tenantUserData as TenantUserRow | null;
    } else {
      const { data: tenantUsersData, error: tenantUsersError } = await serviceClient
        .from("tenant_users")
        .select(TENANT_USER_SELECT)
        .eq("status", "active")
        .eq("user_id", authUser.id);

      if (tenantUsersError) {
        console.error("requireAtlasUser tenant_users query failed", tenantUsersError);
        return authError("Errore server durante la verifica autorizzazioni.", 500);
      }

      const tenantUsers = (tenantUsersData ?? []) as TenantUserRow[];

      if (tenantUsers.length > 1) {
        return authError("Non autorizzato. tenantId richiesto.", 403);
      }

      tenantUser = tenantUsers[0] ?? null;
    }

    const requester = tenantUser ? buildRequester(authUser, tenantUser) : null;

    if (!requester) {
      return authError("Non autorizzato. Utente tenant attivo non trovato.", 403);
    }

    if (options.tenantId && requester.tenantId !== options.tenantId) {
      return authError("Non autorizzato per il tenant richiesto.", 403);
    }

    if (!isRequesterRoleAllowed(requester, options)) {
      return authError("Non autorizzato. Ruolo non abilitato.", 403);
    }

    return {
      ok: true,
      requester,
      serviceClient,
    };
  } catch (error) {
    console.error("requireAtlasUser failed", error);
    return authError("Errore server durante la verifica autenticazione.", 500);
  }
}
