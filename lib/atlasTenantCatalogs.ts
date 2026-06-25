import type { AtlasMaterial } from "@/lib/atlasTypes";

export type AtlasOperatorStatus = "active" | "paused" | "inactive";
export type AtlasCatalogStatus = "active" | "inactive";

export type AtlasTenantOperatorSector = {
  id: string;
  tenantId: string;
  name: string;
  status: AtlasCatalogStatus;
};

export type AtlasTenantOperator = {
  id: string;
  tenantId: string;
  tenantUserId: string | null;
  name: string;
  title: string;
  sectorId: string | null;
  sector: string;
  status: AtlasOperatorStatus;
};

export type AtlasTenantMaterial = AtlasMaterial & {
  tenantId: string;
  code: string | null;
  status: AtlasCatalogStatus;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeOperatorStatus(value: unknown): AtlasOperatorStatus {
  const status = cleanText(value).toLowerCase();
  if (status === "paused" || status === "inactive") return status;
  return "active";
}

function normalizeCatalogStatus(value: unknown): AtlasCatalogStatus {
  return cleanText(value).toLowerCase() === "inactive" ? "inactive" : "active";
}

function normalizeCost(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

export function normalizeOperatorSectorRows(rows: unknown[], tenantId: string): AtlasTenantOperatorSector[] {
  const normalizedTenantId = cleanText(tenantId);
  if (!normalizedTenantId) return [];

  return rows
    .map((row) => {
      const record = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!record) return null;
      if (cleanText(record.tenant_id ?? record.tenantId) !== normalizedTenantId) return null;

      const name = cleanText(record.name);
      if (!name) return null;

      return {
        id: cleanText(record.id),
        tenantId: normalizedTenantId,
        name,
        status: normalizeCatalogStatus(record.status),
      };
    })
    .filter((item): item is AtlasTenantOperatorSector => Boolean(item));
}

export function normalizeOperatorRows(rows: unknown[], tenantId: string): AtlasTenantOperator[] {
  const normalizedTenantId = cleanText(tenantId);
  if (!normalizedTenantId) return [];

  return rows
    .map((row) => {
      const record = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!record) return null;
      if (cleanText(record.tenant_id ?? record.tenantId) !== normalizedTenantId) return null;

      const name = cleanText(record.name);
      if (!name) return null;

      return {
        id: cleanText(record.id),
        tenantId: normalizedTenantId,
        tenantUserId: cleanText(record.tenant_user_id ?? record.tenantUserId) || null,
        name,
        title: cleanText(record.title) || "Operatore",
        sectorId: cleanText(record.sector_id ?? record.sectorId) || null,
        sector: cleanText(record.sector) || "Operativita",
        status: normalizeOperatorStatus(record.status),
      };
    })
    .filter((item): item is AtlasTenantOperator => Boolean(item));
}

export function normalizeMaterialRows(rows: unknown[], tenantId: string): AtlasTenantMaterial[] {
  const normalizedTenantId = cleanText(tenantId);
  if (!normalizedTenantId) return [];

  return rows
    .map((row) => {
      const record = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!record) return null;
      if (cleanText(record.tenant_id ?? record.tenantId) !== normalizedTenantId) return null;

      const name = cleanText(record.name);
      if (!name) return null;

      return {
        id: cleanText(record.id),
        tenantId: normalizedTenantId,
        code: cleanText(record.code) || null,
        name,
        cost: normalizeCost(record.cost),
        status: normalizeCatalogStatus(record.status),
      };
    })
    .filter((item): item is AtlasTenantMaterial => Boolean(item));
}

export function materialCostFromCatalog(materials: AtlasMaterial[], ids: string[]) {
  return ids.reduce((sum, id) => {
    const item = materials.find((material) => material.id === id);
    return sum + Number(item?.cost || 0);
  }, 0);
}
