export type TicketProvider = "atlas" | "glpi";

export type TenantThemePreset = "classic" | "executive";

export type TenantWhiteLabelConfig = {
  productName: string;
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  address: string | null;
  legalInformation: string | null;
  privacyText: string | null;
  privacyUrl: string | null;
  primaryColor: string;
  accentColor: string;
  themePreset: TenantThemePreset;
  ticketProvider: TicketProvider;
  glpiEnabled: boolean;
};

export type TenantConfigSource = {
  name?: unknown;
  product_name?: unknown;
  productName?: unknown;
  company_name?: unknown;
  companyName?: unknown;
  logo_url?: unknown;
  logoUrl?: unknown;
  favicon_url?: unknown;
  faviconUrl?: unknown;
  support_email?: unknown;
  supportEmail?: unknown;
  support_phone?: unknown;
  supportPhone?: unknown;
  website?: unknown;
  address?: unknown;
  legal_information?: unknown;
  legalInformation?: unknown;
  privacy_text?: unknown;
  privacyText?: unknown;
  privacy_url?: unknown;
  privacyUrl?: unknown;
  primary_color?: unknown;
  primaryColor?: unknown;
  accent_color?: unknown;
  accentColor?: unknown;
  theme_preset?: unknown;
  themePreset?: unknown;
  ticket_provider?: unknown;
  ticketProvider?: unknown;
  glpi_enabled?: unknown;
  glpiEnabled?: unknown;
};

export const DEFAULT_TENANT_CONFIG: TenantWhiteLabelConfig = {
  productName: "ATLAS",
  companyName: "ATLAS",
  logoUrl: null,
  faviconUrl: null,
  supportEmail: null,
  supportPhone: null,
  website: null,
  address: null,
  legalInformation: null,
  privacyText: null,
  privacyUrl: null,
  primaryColor: "#2563eb",
  accentColor: "#06b6d4",
  themePreset: "classic",
  ticketProvider: "glpi",
  glpiEnabled: true,
};

export const TENANT_CONFIG_SELECT =
  "id, name, product_name, company_name, logo_url, favicon_url, support_email, support_phone, website, address, legal_information, privacy_text, privacy_url, primary_color, accent_color, theme_preset, ticket_provider, glpi_enabled";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function normalizeThemePreset(value: unknown): TenantThemePreset {
  const preset = cleanString(value);
  return preset === "executive" ? "executive" : "classic";
}

function normalizeTicketProvider(value: unknown, glpiEnabled: boolean): TicketProvider {
  const provider = cleanString(value);
  if (!glpiEnabled) return "atlas";
  if (provider === "atlas") return "atlas";
  if (provider === "glpi") return "glpi";
  return "glpi";
}

export function normalizeTenantConfig(source: TenantConfigSource | null | undefined): TenantWhiteLabelConfig {
  const displayName = cleanString(source?.company_name ?? source?.companyName ?? source?.name);
  const productName = cleanString(source?.product_name ?? source?.productName) ?? DEFAULT_TENANT_CONFIG.productName;
  const explicitGlpiEnabled = cleanBoolean(source?.glpi_enabled ?? source?.glpiEnabled);
  const glpiEnabled = explicitGlpiEnabled ?? DEFAULT_TENANT_CONFIG.glpiEnabled;
  const ticketProvider = normalizeTicketProvider(source?.ticket_provider ?? source?.ticketProvider, glpiEnabled);

  return {
    productName,
    companyName: displayName ?? productName,
    logoUrl: cleanString(source?.logo_url ?? source?.logoUrl),
    faviconUrl: cleanString(source?.favicon_url ?? source?.faviconUrl),
    supportEmail: cleanString(source?.support_email ?? source?.supportEmail),
    supportPhone: cleanString(source?.support_phone ?? source?.supportPhone),
    website: cleanString(source?.website),
    address: cleanString(source?.address),
    legalInformation: cleanString(source?.legal_information ?? source?.legalInformation),
    privacyText: cleanString(source?.privacy_text ?? source?.privacyText),
    privacyUrl: cleanString(source?.privacy_url ?? source?.privacyUrl),
    primaryColor: cleanString(source?.primary_color ?? source?.primaryColor) ?? DEFAULT_TENANT_CONFIG.primaryColor,
    accentColor: cleanString(source?.accent_color ?? source?.accentColor) ?? DEFAULT_TENANT_CONFIG.accentColor,
    themePreset: normalizeThemePreset(source?.theme_preset ?? source?.themePreset),
    ticketProvider,
    glpiEnabled: ticketProvider === "glpi" && glpiEnabled,
  };
}

export function resolveTicketProviderFromTenantConfig(config: TenantWhiteLabelConfig): TicketProvider {
  return config.glpiEnabled && config.ticketProvider === "glpi" ? "glpi" : "atlas";
}

export function isGlpiEnabledForTenantConfig(config: TenantWhiteLabelConfig): boolean {
  return resolveTicketProviderFromTenantConfig(config) === "glpi";
}
