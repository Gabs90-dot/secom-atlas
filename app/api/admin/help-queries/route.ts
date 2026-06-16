import { NextRequest, NextResponse } from "next/server";

import type { AtlasRole } from "@/lib/auth";
import { requireAtlasUser } from "@/lib/server/requireAtlasUser";

export const runtime = "nodejs";

const HELP_QUERY_ALLOWED_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function legacyString(value: unknown, fallback = ""): string {
  return String(value || fallback).trim();
}

function getTenantIdFromSearch(request: NextRequest): string | null {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  return tenantId || null;
}

function getTenantIdFromBody(body: unknown): string | null {
  if (!isRecord(body)) {
    return null;
  }

  const tenantId = legacyString(body.tenantId);
  return tenantId || null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function cleanPayload(body: unknown) {
  const record = isRecord(body) ? body : {};
  const kind = record.kind === "procedure" ? "procedure" : "query";
  const title = legacyString(record.title);
  const sql_text = legacyString(record.sql_text);

  if (!title) throw new Error("Titolo obbligatorio.");
  if (!sql_text) throw new Error("Contenuto obbligatorio.");

  return {
    kind,
    category: legacyString(record.category, kind === "procedure" ? "Procedure" : "Query Spot"),
    title,
    keywords: legacyString(record.keywords, title),
    notes: legacyString(record.notes),
    sql_text,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAtlasUser(request, {
      allowedRoles: HELP_QUERY_ALLOWED_ROLES,
      tenantId: getTenantIdFromSearch(request),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { data, error } = await auth.serviceClient
      .from("help_queries")
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, items: data || [] });
  } catch (error: unknown) {
    console.error("GET /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "Errore caricamento Help.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAtlasUser(request, {
      allowedRoles: HELP_QUERY_ALLOWED_ROLES,
      tenantId: getTenantIdFromBody(body),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const payload = cleanPayload(body);

    const { data, error } = await auth.serviceClient
      .from("help_queries")
      .insert(payload)
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (error: unknown) {
    console.error("POST /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "Errore salvataggio Help.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAtlasUser(request, {
      allowedRoles: HELP_QUERY_ALLOWED_ROLES,
      tenantId: getTenantIdFromBody(body),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const record = isRecord(body) ? body : {};
    const id = legacyString(record.id);

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID mancante." }, { status: 400 });
    }

    const payload = cleanPayload(body);

    const { data, error } = await auth.serviceClient
      .from("help_queries")
      .update(payload)
      .eq("id", id)
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "Errore modifica Help.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAtlasUser(request, {
      allowedRoles: HELP_QUERY_ALLOWED_ROLES,
      tenantId: getTenantIdFromSearch(request),
    });

    if (!auth.ok) {
      return auth.response;
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID mancante." }, { status: 400 });
    }

    const { error } = await auth.serviceClient
      .from("help_queries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "Errore eliminazione Help.") }, { status: 500 });
  }
}
