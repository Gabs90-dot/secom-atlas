import { NextRequest, NextResponse } from "next/server";
import * as glpiSyncEngine from "@/services/glpiSyncEngine";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 25;

function getSyncFunction() {
  const syncFn = (glpiSyncEngine as any).syncGlpiDbToAtlas;

  if (typeof syncFn !== "function") {
    throw new Error(
      "Export syncGlpiDbToAtlas mancante in services/glpiSyncEngine.ts. Sostituisci quel file con glpiSyncEngine_FIXED.ts.",
    );
  }

  return syncFn;
}

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
    const syncGlpiDbToAtlas = getSyncFunction();

    const tenantId = getTenantId(request);
    const limit = getNumberParam(request, "limit", DEFAULT_LIMIT);
    const offset = getNumberParam(request, "offset", 0);
    const glpiTicketId =
      request.nextUrl.searchParams.get("glpiTicketId") || undefined;
    const incremental = request.nextUrl.searchParams.get("full") !== "1";

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
      incremental,
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
    const syncGlpiDbToAtlas = getSyncFunction();

    const body = await request.json().catch(() => ({}));

    const tenantId =
      body?.tenantId ||
      body?.tenant_id ||
      process.env.ATLAS_DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
      "";

    const queryLimit = request.nextUrl.searchParams.get("limit");
    const queryOffset = request.nextUrl.searchParams.get("offset");
    const queryFull = request.nextUrl.searchParams.get("full");
    const queryGlpiTicketId = request.nextUrl.searchParams.get("glpiTicketId");

    const limit = Number(body?.limit ?? queryLimit ?? DEFAULT_LIMIT);
    const offset = Number(body?.offset ?? queryOffset ?? 0);
    const glpiTicketId = body?.glpiTicketId || body?.glpi_ticket_id || body?.id || queryGlpiTicketId || undefined;
    const incremental = body?.full === true || queryFull === "1" ? false : true;

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
      incremental,
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
