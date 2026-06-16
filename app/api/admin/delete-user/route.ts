import { NextResponse, type NextRequest } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser, type LegacyAtlasRole } from "@/lib/server/requireAtlasUser";

export const dynamic = "force-dynamic";

const DELETE_USER_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];
const DELETE_USER_LEGACY_ALLOWED_ROLES: readonly LegacyAtlasRole[] = ["owner"];

type DeletePayload = {
  tenantId?: string;
  tenantUserId?: string;
};

type TargetTenantUser = {
  id: string;
  user_id: string | null;
  email: string | null;
  tenant_id: string | null;
  role: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DeletePayload | null;
  const tenantId = body?.tenantId;
  const tenantUserId = body?.tenantUserId;

  if (!tenantId || !tenantUserId) {
    return jsonError("Tenant e utente sono obbligatori.", 400);
  }

  const auth = await requireAtlasUser(request, {
    allowedRoles: DELETE_USER_ALLOWED_ROLES,
    allowedLegacyRoles: DELETE_USER_LEGACY_ALLOWED_ROLES,
    tenantId,
  });

  if (!auth.ok) {
    return auth.response;
  }

  const serviceClient = auth.serviceClient;

  if (auth.requester.tenantUserId === tenantUserId) {
    return jsonError("Non puoi eliminare la tua utenza mentre sei loggato.", 400);
  }

  const { data: targetUserData, error: targetError } = await serviceClient
    .from("tenant_users")
    .select("id, user_id, email, tenant_id, role")
    .eq("tenant_id", tenantId)
    .eq("id", tenantUserId)
    .maybeSingle();

  if (targetError) {
    return jsonError(targetError.message, 500);
  }

  const targetUser = targetUserData as TargetTenantUser | null;

  if (!targetUser) {
    return jsonError("Utente tenant non trovato.", 404);
  }

  if (targetUser.role === "super_admin" && auth.requester.rawRole !== "super_admin") {
    return jsonError("Solo un Super Admin puo eliminare un Super Admin.", 403);
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
        500,
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
