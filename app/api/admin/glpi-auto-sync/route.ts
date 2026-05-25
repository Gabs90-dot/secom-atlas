import { NextRequest, NextResponse } from "next/server";
import { syncGlpiDbToAtlas } from "@/services/glpiSyncEngine";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 500;

function getTenantId(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("tenantId");
  const fromEnv =
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    "";

  return fromQuery || fromEnv;
}

function getNumberParam(request: NextRequest, name: string, fallback: number) {
  const raw = request.nextUrl.searchParams.get(name);
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const limit = getNumberParam(request, "limit", DEFAULT_LIMIT);
    const offset = getNumberParam(request, "offset", 0);
    const glpiTicketId = request.nextUrl.searchParams.get("glpiTicketId") || undefined;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nella query oppure imposta ATLAS_DEFAULT_TENANT_ID nel file .env.local / Vercel.",
        },
        { status: 400 },
      );
    }

    const result = await syncGlpiDbToAtlas({
      tenantId,
      limit,
      offset,
      glpiTicketId,
    });

    return NextResponse.json({
      success: true,
      message: "GLPI auto sync completata",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AUTO SYNC GLPI ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Errore sconosciuto durante GLPI auto sync",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const tenantId =
      body?.tenantId ||
      process.env.ATLAS_DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
      "";

    const limit = Number(body?.limit || DEFAULT_LIMIT);
    const offset = Number(body?.offset || 0);
    const glpiTicketId = body?.glpiTicketId;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nel body oppure imposta ATLAS_DEFAULT_TENANT_ID nel file .env.local / Vercel.",
        },
        { status: 400 },
      );
    }

    const result = await syncGlpiDbToAtlas({
      tenantId,
      limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
      offset: Number.isFinite(offset) ? offset : 0,
      glpiTicketId,
    });

    return NextResponse.json({
      success: true,
      message: "GLPI manual sync completata",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("MANUAL SYNC GLPI ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Errore sconosciuto durante GLPI manual sync",
      },
      { status: 500 },
    );
  }
}
