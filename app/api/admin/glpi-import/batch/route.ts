import { NextResponse } from "next/server";
import { importGlpiHistoricalBatch } from "@/services/glpiHistoricalImport";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tenantId = body?.tenantId;
    const runId = body?.runId || null;
    const offset = Number(body?.offset || 0);
    const limit = Math.min(Number(body?.limit || 500), 1000);

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Missing tenantId" }, { status: 400 });
    }

    const result = await importGlpiHistoricalBatch({
      tenantId,
      runId,
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST to start a GLPI import batch." },
    { status: 405 }
  );
}
