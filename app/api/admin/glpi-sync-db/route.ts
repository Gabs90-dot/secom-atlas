import { NextRequest, NextResponse } from "next/server";
import { syncGlpiDbToAtlas } from "@/services/glpiSyncEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const tenantId =
      body?.tenantId ||
      body?.tenant_id ||
      process.env.ATLAS_DEFAULT_TENANT_ID;

    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "tenantId mancante. Passa tenantId nel body oppure imposta ATLAS_DEFAULT_TENANT_ID nelle env.",
        },
        { status: 400 },
      );
    }

    const limit = Math.min(Number(body?.limit || 250), 1000);
    const offset = Number(body?.offset || 0);
    const glpiTicketId = body?.glpiTicketId || body?.glpi_ticket_id || body?.id;

    const result = await syncGlpiDbToAtlas({
      tenantId,
      limit,
      offset,
      glpiTicketId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GLPI DB sync error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Errore sync GLPI DB",
      },
      { status: 500 },
    );
  }
}
