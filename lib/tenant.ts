export type AtlasTenant = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  logo_url?: string | null;
  primary_color?: string | null;
};

export const DEFAULT_TENANT_SLUG = "secom";
export const ATLAS_TENANT_STORAGE_KEY = "atlas-active-tenant";

export function getStoredTenantSlug() {
  if (typeof window === "undefined") return DEFAULT_TENANT_SLUG;
  return localStorage.getItem(ATLAS_TENANT_STORAGE_KEY) || DEFAULT_TENANT_SLUG;
}

export function storeTenantSlug(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ATLAS_TENANT_STORAGE_KEY, slug || DEFAULT_TENANT_SLUG);
}

export function getTenantId(tenant: AtlasTenant | null | undefined) {
  return tenant?.id || null;
}

export function tenantFilter<T extends { tenant_id?: string | null }>(items: T[], tenant: AtlasTenant | null) {
  if (!tenant?.id) return items;
  return items.filter((item) => !item.tenant_id || item.tenant_id === tenant.id);
}
