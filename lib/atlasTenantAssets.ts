import type {
  SystemCatalogComponent,
  SystemCatalogItem,
} from "@/lib/systemsCatalog";

export type AtlasTenantInventoryItem = {
  dbId?: string;
  id: string;
  name: string;
  value: number;
  quantity: number;
  threshold: number;
  status: string;
};

export type AtlasTenantSystemItem = SystemCatalogItem & {
  dbId?: string;
  customerId?: string | null;
  siteId?: number | null;
  serialNumber?: string;
  status?: string;
  notes?: string;
};

type TenantAssetRow = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function optionalText(value: unknown) {
  const next = text(value);
  return next || null;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalBigintId(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError("Expected a numeric BIGINT id from Supabase");
  }
  return value;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean);
}

function componentRows(value: unknown): SystemCatalogComponent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: text(item.name),
      code: text(item.code) || undefined,
      category: text(item.category || item.type) || undefined,
      quantity: numberValue(item.quantity, 0),
      unitCost: numberValue(item.unitCost || item.unit_cost || item.cost || item.price, 0),
      totalCost: numberValue(item.totalCost || item.total_cost || item.cost || item.price, 0),
    }))
    .filter((item) => item.name);
}

export function normalizeTenantInventoryRows(
  rows: unknown[],
): AtlasTenantInventoryItem[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const item = (row || {}) as TenantAssetRow;

    return {
      dbId: text(item.id) || undefined,
      id: text(item.code),
      name: text(item.name),
      value: numberValue(item.cost, 0),
      quantity: numberValue(item.quantity, 0),
      threshold: numberValue(item.reorder_threshold, 0),
      status: text(item.status, "active"),
    };
  });
}

export function tenantInventoryToDbPayload(
  tenantId: string,
  item: AtlasTenantInventoryItem,
) {
  return {
    tenant_id: tenantId,
    code: item.id,
    name: item.name,
    quantity: item.quantity,
    reorder_threshold: item.threshold,
    cost: item.value,
    status: item.status || "active",
    updated_at: new Date().toISOString(),
  };
}

export function normalizeTenantSystemRows(rows: unknown[]): AtlasTenantSystemItem[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const item = (row || {}) as TenantAssetRow;

    return {
      dbId: text(item.id) || undefined,
      name: text(item.name),
      productName: text(item.product_name || item.name),
      category: text(item.category),
      totalCost: numberValue(item.total_cost, 0),
      sourceFile: text(item.source_file) || undefined,
      summary: text(item.notes) || undefined,
      tags: stringArray(item.tags),
      components: componentRows(item.components),
      customerId: optionalText(item.customer_id),
      siteId: optionalBigintId(item.site_id),
      serialNumber: text(item.serial_number),
      status: text(item.status, "active"),
      notes: text(item.notes),
    };
  });
}

export function tenantSystemToDbPayload(
  tenantId: string,
  system: AtlasTenantSystemItem,
) {
  return {
    tenant_id: tenantId,
    name: system.name,
    category: system.category || "",
    customer_id: system.customerId || null,
    site_id: system.siteId ?? null,
    serial_number: system.serialNumber || "",
    status: system.status || "active",
    notes: system.notes || system.summary || "",
    product_name: system.productName || system.name,
    total_cost: system.totalCost || 0,
    components: system.components || [],
    source_file: system.sourceFile || "",
    tags: system.tags || [],
    updated_at: new Date().toISOString(),
  };
}
