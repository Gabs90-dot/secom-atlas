import { NextRequest, NextResponse } from "next/server";
import { syncGlpiEntitiesToAtlas } from "@/services/glpiEntitySyncEngine";

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

    const result = await syncGlpiEntitiesToAtlas({ tenantId });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GLPI entity sync error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Errore sync albero entità GLPI",
      },
      { status: 500 },
    );
  }
}
