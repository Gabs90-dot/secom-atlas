import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { AtlasRequester } from "@/lib/server/requireAtlasUser";
import { isGlpiEnabledForTenant } from "@/lib/server/tenantConfig";

type TenantGuardRequester = Pick<AtlasRequester, "tenantId">;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createGlpiGuardServiceClient(): SupabaseClient {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function glpiDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      code: "glpi_disabled",
      error: "Integrazione GLPI non abilitata per questo tenant.",
    },
    { status: 403 },
  );
}

export async function requireGlpiEnabledForTenant(
  serviceClient: SupabaseClient,
  requester: TenantGuardRequester,
) {
  const glpiEnabled = await isGlpiEnabledForTenant(serviceClient, requester);
  return glpiEnabled ? null : glpiDisabledResponse();
}
