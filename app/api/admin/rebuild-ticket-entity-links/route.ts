import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function getTenantId(request: NextRequest) {
  return (
    request.nextUrl.searchParams.get("tenantId") ||
    process.env.ATLAS_DEFAULT_TENANT_ID ||
    process.env.NEXT_PUBLIC_ATLAS_DEFAULT_TENANT_ID ||
    ""
  );
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "tenantId mancante. Passalo nella query oppure imposta ATLAS_DEFAULT_TENANT_ID.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data, error } = await supabaseAdmin.rpc(
      "rebuild_ticket_entity_links",
      {
        p_tenant_id: tenantId,
      },
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Relazioni ticket/entity ricostruite",
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("REBUILD TICKET ENTITY LINKS ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Errore ricostruzione relazioni ticket/entity",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
