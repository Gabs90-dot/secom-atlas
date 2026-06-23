import type { AtlasContract } from "@/lib/atlasTypes";
import type { AtlasSlaContractProfile } from "@/lib/atlasSlaContracts";

export type AtlasBudgetItem = {
  id: string;
  contractName: string;
  entity: string;
  value: number;
  notes: string;
  updatedAt: string;
};

type TenantContractRow = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean);
}

export function normalizeTenantContractRows(rows: unknown[]): AtlasContract[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const item = (row || {}) as TenantContractRow;

    return {
      name: text(item.name),
      match: stringArray(item.match_terms),
      clientType: text(item.client_type),
      status: text(item.status, "Attivo"),
      period: text(item.period),
      startDate: text(item.start_date),
      endDate: text(item.end_date),
      renewalAlertDays: numberValue(item.renewal_alert_days, 90),
      pdf: text(item.pdf),
      warranty: text(item.warranty),
      shipping: text(item.shipping),
      spareParts: text(item.spare_parts),
      sla: text(item.sla),
      notes: text(item.notes),
    };
  });
}

export function tenantContractToDbPayload(
  tenantId: string,
  contract: AtlasContract,
) {
  return {
    tenant_id: tenantId,
    name: contract.name,
    match_terms: contract.match,
    client_type: contract.clientType,
    status: contract.status,
    period: contract.period,
    start_date: contract.startDate,
    end_date: contract.endDate,
    renewal_alert_days: contract.renewalAlertDays,
    pdf: contract.pdf,
    warranty: contract.warranty,
    shipping: contract.shipping,
    spare_parts: contract.spareParts,
    sla: contract.sla,
    notes: contract.notes,
    updated_at: new Date().toISOString(),
  };
}

export function normalizeTenantSlaContractRows(
  rows: unknown[],
): AtlasSlaContractProfile[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const item = (row || {}) as TenantContractRow;

    return {
      key: text(item.profile_key),
      category: text(item.category),
      customerType: text(item.customer_type),
      durationMonths: text(item.duration_months),
      warrantyMonths: text(item.warranty_months),
      phoneSupport: text(item.phone_support),
      preventiveOnsite: text(item.preventive_onsite),
      extraordinaryOnsite: text(item.extraordinary_onsite),
      sparePartsIncluded: text(item.spare_parts_included),
      blockingResponse: text(item.blocking_response),
      nonblockingResponse: text(item.nonblocking_response),
      pickupShipping: text(item.pickup_shipping),
      serviceHours: text(item.service_hours),
      serviceDays: text(item.service_days),
      driveLink: text(item.drive_link),
      commercialNotes: text(item.commercial_notes),
      summary: text(item.summary),
      aliases: text(item.aliases),
      keywords: text(item.keywords),
      matchPriority: numberValue(item.match_priority, 0),
      parentCustomer: text(item.parent_customer),
      childCustomers: text(item.child_customers),
      isActive: item.is_active !== false,
    };
  });
}

export function tenantSlaContractToDbPayload(
  tenantId: string,
  profile: AtlasSlaContractProfile,
) {
  return {
    tenant_id: tenantId,
    profile_key: profile.key,
    category: profile.category,
    customer_type: profile.customerType,
    duration_months: profile.durationMonths,
    warranty_months: profile.warrantyMonths,
    phone_support: profile.phoneSupport,
    preventive_onsite: profile.preventiveOnsite,
    extraordinary_onsite: profile.extraordinaryOnsite,
    spare_parts_included: profile.sparePartsIncluded,
    blocking_response: profile.blockingResponse,
    nonblocking_response: profile.nonblockingResponse,
    pickup_shipping: profile.pickupShipping,
    service_hours: profile.serviceHours,
    service_days: profile.serviceDays,
    drive_link: profile.driveLink,
    commercial_notes: profile.commercialNotes,
    summary: profile.summary,
    aliases: profile.aliases,
    keywords: profile.keywords,
    match_priority: profile.matchPriority,
    parent_customer: profile.parentCustomer,
    child_customers: profile.childCustomers,
    is_active: profile.isActive,
    updated_at: new Date().toISOString(),
  };
}

export function normalizeTenantBudgetRows(rows: unknown[]): AtlasBudgetItem[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const item = (row || {}) as TenantContractRow;

    return {
      id: text(item.id),
      contractName: text(item.contract_name),
      entity: text(item.entity),
      value: numberValue(item.value, 0),
      notes: text(item.notes),
      updatedAt: text(item.updated_at),
    };
  });
}

export function tenantBudgetToDbPayload(args: {
  tenantId: string;
  contractName: string;
  entity: string;
  value: number;
  notes: string;
}) {
  return {
    tenant_id: args.tenantId,
    contract_name: args.contractName,
    entity: args.entity,
    value: args.value,
    notes: args.notes,
    updated_at: new Date().toISOString(),
  };
}
