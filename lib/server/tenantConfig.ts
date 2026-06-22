import type { SupabaseClient } from "@supabase/supabase-js";

import type { AtlasRequester } from "@/lib/server/requireAtlasUser";
import {
  normalizeTenantConfig,
  resolveTicketProviderFromTenantConfig,
  TENANT_CONFIG_SELECT,
  type TenantWhiteLabelConfig,
  type TicketProvider,
} from "@/lib/tenantConfig";

type TenantConfigRequester = Pick<AtlasRequester, "tenantId">;

export async function getTenantConfigForRequester(
  serviceClient: SupabaseClient,
  requester: TenantConfigRequester,
): Promise<TenantWhiteLabelConfig> {
  const { data, error } = await serviceClient
    .from("tenants")
    .select(TENANT_CONFIG_SELECT)
    .eq("id", requester.tenantId)
    .maybeSingle();

  if (error) {
    console.error("getTenantConfigForRequester failed", {
      tenantId: requester.tenantId,
      message: error.message,
    });
  }

  return normalizeTenantConfig(data);
}

export async function resolveTicketProviderForTenant(
  serviceClient: SupabaseClient,
  requester: TenantConfigRequester,
): Promise<TicketProvider> {
  const config = await getTenantConfigForRequester(serviceClient, requester);
  return resolveTicketProviderFromTenantConfig(config);
}

export async function isGlpiEnabledForTenant(
  serviceClient: SupabaseClient,
  requester: TenantConfigRequester,
): Promise<boolean> {
  const provider = await resolveTicketProviderForTenant(serviceClient, requester);
  return provider === "glpi";
}
