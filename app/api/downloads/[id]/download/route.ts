import { NextRequest, NextResponse } from "next/server";

import { isCustomerRole } from "@/lib/auth";
import {
  DOWNLOAD_BUCKET,
  DOWNLOAD_VIEW_ROLES,
  type DownloadLibraryRow,
} from "@/lib/downloadLibrary";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const DOWNLOAD_SELECT =
  "id,tenant_id,customer_id,title,file_name,storage_path,visibility,download_count";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function canAccessDownload(row: DownloadLibraryRow, roleIsCustomer: boolean, customerId: string | null) {
  if (!roleIsCustomer) return true;
  return row.visibility === "customer" && Boolean(customerId) && row.customer_id === customerId;
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/downloads/[id]/download">,
) {
  const tenantId = String(request.nextUrl.searchParams.get("tenantId") || "").trim();
  const { id } = await context.params;

  if (!tenantId || !id) {
    return jsonError("tenantId o id mancante.", 400);
  }

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: DOWNLOAD_VIEW_ROLES,
  });

  if (!auth.ok) return auth.response;

  const { data, error } = await auth.serviceClient
    .from("download_library")
    .select(DOWNLOAD_SELECT)
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[downloads] download lookup failed", error);
    return jsonError("Errore ricerca download.", 500);
  }

  if (!data) {
    return jsonError("Download non trovato.", 404);
  }

  const row = data as DownloadLibraryRow;
  const roleIsCustomer = isCustomerRole(auth.requester.role);

  if (!canAccessDownload(row, roleIsCustomer, auth.requester.customerId)) {
    return jsonError("Non autorizzato.", 403);
  }

  const { data: signedData, error: signedError } = await auth.serviceClient.storage
    .from(DOWNLOAD_BUCKET)
    .createSignedUrl(row.storage_path, 60, { download: row.file_name || "download" });

  if (signedError || !signedData?.signedUrl) {
    console.error("[downloads] signed url failed", signedError);
    return jsonError("Errore creazione link temporaneo.", 500);
  }

  await auth.serviceClient
    .from("download_library")
    .update({ download_count: Number(row.download_count || 0) + 1 })
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", row.id);

  return NextResponse.json({
    ok: true,
    signedUrl: signedData.signedUrl,
    fileName: row.file_name || "download",
    expiresIn: 60,
  });
}
