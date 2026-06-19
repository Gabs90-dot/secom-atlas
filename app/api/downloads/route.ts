import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DOWNLOAD_BUCKET,
  DOWNLOAD_DELETE_ROLES,
  DOWNLOAD_UPLOAD_ROLES,
  DOWNLOAD_VIEW_ROLES,
  isDownloadCategory,
  isDownloadStatus,
  isDownloadVisibility,
  sanitizeDownloadFileName,
  type DownloadCategory,
  type DownloadLibraryRow,
  type DownloadStatus,
  type DownloadVisibility,
} from "@/lib/downloadLibrary";
import { isCustomerRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const DOWNLOAD_SELECT =
  "id,tenant_id,customer_id,title,description,category,product_model,version,release_date,file_name,storage_path,file_size,mime_type,notes,tags,status,visibility,download_count,created_by,created_at,updated_at";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? value : null;
}

function readTags(formData: FormData) {
  return readText(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function readCategory(formData: FormData): DownloadCategory {
  const value = readText(formData, "category");
  return isDownloadCategory(value) ? value : "Altro";
}

function readStatus(formData: FormData): DownloadStatus {
  const value = readText(formData, "status");
  return isDownloadStatus(value) ? value : "active";
}

function readVisibility(formData: FormData): DownloadVisibility {
  const value = readText(formData, "visibility");
  return isDownloadVisibility(value) ? value : "internal";
}

function readFile(formData: FormData) {
  const value = formData.get("file");
  return value instanceof File && value.size > 0 ? value : null;
}

function getTenantId(request: NextRequest) {
  return String(request.nextUrl.searchParams.get("tenantId") || "").trim();
}

function buildStoragePath(tenantId: string, fileName: string) {
  return `${tenantId}/${crypto.randomUUID()}-${sanitizeDownloadFileName(fileName)}`;
}

function canRequesterAccessRow(row: DownloadLibraryRow, roleIsCustomer: boolean, customerId: string | null) {
  if (!roleIsCustomer) return true;
  return row.visibility === "customer" && Boolean(customerId) && row.customer_id === customerId;
}

async function ensureCustomerBelongsToTenant(
  serviceClient: SupabaseClient,
  tenantId: string,
  customerId: string | null,
) {
  if (!customerId) return true;

  const { data, error } = await serviceClient
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", customerId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function uploadDownloadFile(
  serviceClient: SupabaseClient,
  tenantId: string,
  file: File,
) {
  const storagePath = buildStoragePath(tenantId, file.name);
  const { error } = await serviceClient.storage.from(DOWNLOAD_BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) throw error;

  return {
    file_name: sanitizeDownloadFileName(file.name),
    storage_path: storagePath,
    file_size: file.size,
    mime_type: file.type || "application/octet-stream",
  };
}

export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);

  if (!tenantId) {
    return jsonError("tenantId mancante.", 400);
  }

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: DOWNLOAD_VIEW_ROLES,
  });

  if (!auth.ok) return auth.response;

  let query = auth.serviceClient
    .from("download_library")
    .select(DOWNLOAD_SELECT)
    .eq("tenant_id", auth.requester.tenantId)
    .order("updated_at", { ascending: false });

  if (isCustomerRole(auth.requester.role)) {
    if (!auth.requester.customerId) {
      return NextResponse.json({ ok: true, data: [] });
    }

    query = query
      .eq("visibility", "customer")
      .eq("customer_id", auth.requester.customerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[downloads] list failed", error);
    return jsonError("Errore caricamento download.", 500);
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError("Payload non valido.", 400);

  const tenantId = readText(formData, "tenantId");
  if (!tenantId) return jsonError("tenantId mancante.", 400);

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: DOWNLOAD_UPLOAD_ROLES,
  });

  if (!auth.ok) return auth.response;

  const title = readText(formData, "title");
  const file = readFile(formData);

  if (!title) return jsonError("Titolo obbligatorio.", 400);
  if (!file) return jsonError("File obbligatorio.", 400);

  const customerId = nullableText(formData, "customerId");
  const customerOk = await ensureCustomerBelongsToTenant(auth.serviceClient, auth.requester.tenantId, customerId);
  if (!customerOk) return jsonError("Cliente non valido per il tenant.", 403);

  const fileData = await uploadDownloadFile(auth.serviceClient, auth.requester.tenantId, file);

  const payload = {
    tenant_id: auth.requester.tenantId,
    customer_id: customerId,
    title,
    description: nullableText(formData, "description"),
    category: readCategory(formData),
    product_model: nullableText(formData, "productModel"),
    version: nullableText(formData, "version"),
    release_date: nullableText(formData, "releaseDate"),
    notes: nullableText(formData, "notes"),
    tags: readTags(formData),
    status: readStatus(formData),
    visibility: readVisibility(formData),
    created_by: auth.requester.tenantUserId,
    ...fileData,
  };

  const { data, error } = await auth.serviceClient
    .from("download_library")
    .insert([payload])
    .select(DOWNLOAD_SELECT)
    .single();

  if (error) {
    await auth.serviceClient.storage.from(DOWNLOAD_BUCKET).remove([fileData.storage_path]);
    console.error("[downloads] create failed", error);
    return jsonError("Errore salvataggio download.", 500);
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError("Payload non valido.", 400);

  const tenantId = readText(formData, "tenantId");
  const id = readText(formData, "id");
  if (!tenantId || !id) return jsonError("tenantId o id mancante.", 400);

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: DOWNLOAD_UPLOAD_ROLES,
  });

  if (!auth.ok) return auth.response;

  const { data: existing, error: existingError } = await auth.serviceClient
    .from("download_library")
    .select(DOWNLOAD_SELECT)
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) return jsonError("Download non trovato.", 404);

  const title = readText(formData, "title");
  if (!title) return jsonError("Titolo obbligatorio.", 400);

  const customerId = nullableText(formData, "customerId");
  const customerOk = await ensureCustomerBelongsToTenant(auth.serviceClient, auth.requester.tenantId, customerId);
  if (!customerOk) return jsonError("Cliente non valido per il tenant.", 403);

  const file = readFile(formData);
  const oldStoragePath = String(existing.storage_path || "");
  let fileData: Record<string, unknown> = {};

  if (file) {
    fileData = await uploadDownloadFile(auth.serviceClient, auth.requester.tenantId, file);
  }

  const payload = {
    customer_id: customerId,
    title,
    description: nullableText(formData, "description"),
    category: readCategory(formData),
    product_model: nullableText(formData, "productModel"),
    version: nullableText(formData, "version"),
    release_date: nullableText(formData, "releaseDate"),
    notes: nullableText(formData, "notes"),
    tags: readTags(formData),
    status: readStatus(formData),
    visibility: readVisibility(formData),
    ...fileData,
  };

  const { data, error } = await auth.serviceClient
    .from("download_library")
    .update(payload)
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", id)
    .select(DOWNLOAD_SELECT)
    .single();

  if (error) {
    const newPath = typeof fileData.storage_path === "string" ? fileData.storage_path : "";
    if (newPath) await auth.serviceClient.storage.from(DOWNLOAD_BUCKET).remove([newPath]);
    console.error("[downloads] update failed", error);
    return jsonError("Errore aggiornamento download.", 500);
  }

  const newStoragePath = typeof fileData.storage_path === "string" ? fileData.storage_path : "";
  if (newStoragePath && oldStoragePath && oldStoragePath !== newStoragePath) {
    await auth.serviceClient.storage.from(DOWNLOAD_BUCKET).remove([oldStoragePath]);
  }

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tenantId = String(body.tenantId || "").trim();
  const id = String(body.id || "").trim();

  if (!tenantId || !id) return jsonError("tenantId o id mancante.", 400);

  const auth = await requireAtlasUser(request, {
    tenantId,
    allowedRoles: DOWNLOAD_DELETE_ROLES,
  });

  if (!auth.ok) return auth.response;

  const { data: existing, error: existingError } = await auth.serviceClient
    .from("download_library")
    .select(DOWNLOAD_SELECT)
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) return jsonError("Download non trovato.", 404);

  const row = existing as DownloadLibraryRow;
  if (!canRequesterAccessRow(row, false, null)) return jsonError("Non autorizzato.", 403);

  const { error } = await auth.serviceClient
    .from("download_library")
    .delete()
    .eq("tenant_id", auth.requester.tenantId)
    .eq("id", id);

  if (error) {
    console.error("[downloads] delete failed", error);
    return jsonError("Errore eliminazione download.", 500);
  }

  await auth.serviceClient.storage.from(DOWNLOAD_BUCKET).remove([row.storage_path]);

  return NextResponse.json({ ok: true });
}
