import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function supabaseAdmin() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

function cleanPayload(body: any) {
  const kind = body?.kind === "procedure" ? "procedure" : "query";
  const title = String(body?.title || "").trim();
  const sql_text = String(body?.sql_text || "").trim();

  if (!title) throw new Error("Titolo obbligatorio.");
  if (!sql_text) throw new Error("Contenuto obbligatorio.");

  return {
    kind,
    category: String(body?.category || (kind === "procedure" ? "Procedure" : "Query Spot")).trim(),
    title,
    keywords: String(body?.keywords || title).trim(),
    notes: String(body?.notes || "").trim(),
    sql_text,
  };
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("help_queries")
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, items: data || [] });
  } catch (error: any) {
    console.error("GET /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: error?.message || "Errore caricamento Help." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const body = await request.json();
    const payload = cleanPayload(body);

    const { data, error } = await supabase
      .from("help_queries")
      .insert(payload)
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (error: any) {
    console.error("POST /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: error?.message || "Errore salvataggio Help." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const body = await request.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID mancante." }, { status: 400 });
    }

    const payload = cleanPayload(body);

    const { data, error } = await supabase
      .from("help_queries")
      .update(payload)
      .eq("id", id)
      .select("id, category, title, keywords, sql_text, notes, kind, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (error: any) {
    console.error("PATCH /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: error?.message || "Errore modifica Help." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID mancante." }, { status: 400 });
    }

    const { error } = await supabase
      .from("help_queries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/help-queries", error);
    return NextResponse.json({ ok: false, error: error?.message || "Errore eliminazione Help." }, { status: 500 });
  }
}
