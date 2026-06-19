import type { AtlasRole } from "@/lib/auth";

export const DOWNLOAD_BUCKET = "atlas-downloads";

export const DOWNLOAD_CATEGORIES = [
  "Firmware",
  "Driver",
  "Software e utility",
  "Configurazioni",
  "Pacchetti di aggiornamento",
  "Certificati",
  "Moduli e template",
  "Strumenti tecnici",
  "Altro",
] as const;

export const DOWNLOAD_STATUSES = ["active", "beta", "obsolete", "archived"] as const;

export const DOWNLOAD_VISIBILITIES = ["internal", "customer", "restricted"] as const;

export type DownloadCategory = (typeof DOWNLOAD_CATEGORIES)[number];
export type DownloadStatus = (typeof DOWNLOAD_STATUSES)[number];
export type DownloadVisibility = (typeof DOWNLOAD_VISIBILITIES)[number];

export type DownloadLibraryRow = {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  category: DownloadCategory;
  product_model: string | null;
  version: string | null;
  release_date: string | null;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  notes: string | null;
  tags: string[];
  status: DownloadStatus;
  visibility: DownloadVisibility;
  download_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const DOWNLOAD_UPLOAD_ROLES: readonly AtlasRole[] = ["super_admin", "admin", "manager"];
export const DOWNLOAD_DELETE_ROLES: readonly AtlasRole[] = ["super_admin", "admin"];
export const DOWNLOAD_INTERNAL_VIEW_ROLES: readonly AtlasRole[] = [
  "super_admin",
  "admin",
  "manager",
  "dispatcher",
  "tecnico",
  "commerciale",
];
export const DOWNLOAD_VIEW_ROLES: readonly AtlasRole[] = [
  ...DOWNLOAD_INTERNAL_VIEW_ROLES,
  "cliente_admin",
  "cliente_user",
];

export function isDownloadCategory(value: unknown): value is DownloadCategory {
  return DOWNLOAD_CATEGORIES.includes(value as DownloadCategory);
}

export function isDownloadStatus(value: unknown): value is DownloadStatus {
  return DOWNLOAD_STATUSES.includes(value as DownloadStatus);
}

export function isDownloadVisibility(value: unknown): value is DownloadVisibility {
  return DOWNLOAD_VISIBILITIES.includes(value as DownloadVisibility);
}

export function isInternalDownloadRole(role: AtlasRole) {
  return DOWNLOAD_INTERNAL_VIEW_ROLES.includes(role);
}

export function sanitizeDownloadFileName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 160);

  return normalized || "download-file";
}
