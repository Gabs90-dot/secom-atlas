import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateActivityPayload,
  CreateInternalNotePayload,
  CreateMaterialPayload,
  CreateWorkOrderPayload,
  UpdateWorkOrderPayload,
  WorkOrder,
  WorkOrderActivity,
  WorkOrderInternalNote,
  WorkOrderMaterial,
} from "@/types/work-orders";

export type DeleteWorkOrderResult = {
  deleted: boolean;
};

export type WorkOrderRepository = {
  getWorkOrderById(id: string): Promise<WorkOrder | null>;
  getWorkOrderByTicketId(ticketId: number | string): Promise<WorkOrder | null>;
  createWorkOrder(payload: CreateWorkOrderPayload): Promise<WorkOrder>;
  updateWorkOrder(id: string, payload: UpdateWorkOrderPayload): Promise<WorkOrder | null>;
  deleteWorkOrder(id: string): Promise<DeleteWorkOrderResult>;
  listActivities(workOrderId: string): Promise<WorkOrderActivity[]>;
  createActivity(payload: CreateActivityPayload): Promise<WorkOrderActivity>;
  listMaterials(workOrderId: string): Promise<WorkOrderMaterial[]>;
  createMaterial(payload: CreateMaterialPayload): Promise<WorkOrderMaterial>;
  listInternalNotes(workOrderId: string): Promise<WorkOrderInternalNote[]>;
  createInternalNote(payload: CreateInternalNotePayload): Promise<WorkOrderInternalNote>;
};

function nowIso() {
  return new Date().toISOString();
}

function mockId(prefix: string) {
  return `${prefix}_mock`;
}

function toWorkOrder(value: unknown): WorkOrder {
  return value as WorkOrder;
}

function toWorkOrderActivity(value: unknown): WorkOrderActivity {
  return value as WorkOrderActivity;
}

function toWorkOrderMaterial(value: unknown): WorkOrderMaterial {
  return value as WorkOrderMaterial;
}

function toWorkOrderInternalNote(value: unknown): WorkOrderInternalNote {
  return value as WorkOrderInternalNote;
}

function buildCreateWorkOrderInsert(payload: CreateWorkOrderPayload): Record<string, unknown> {
  return {
    tenant_id: payload.tenant_id,
    ticket_id: payload.ticket_id,
    customer_id: payload.customer_id ?? null,
    site_id: payload.site_id ?? null,
    customer_entity_id: payload.customer_entity_id ?? null,
    glpi_entity_id: payload.glpi_entity_id ?? null,
    contract_profile_id: payload.contract_profile_id ?? null,
    customer_contract_link_id: payload.customer_contract_link_id ?? null,
    template_key: payload.template_key,
    title: payload.title,
    intervention_object: payload.intervention_object,
    description: payload.description ?? null,
    system_code: payload.system_code ?? null,
    system_label: payload.system_label ?? null,
    technician_user_id: payload.technician_user_id ?? null,
    technician_name: payload.technician_name ?? null,
    customer_name_snapshot: payload.customer_name_snapshot,
    customer_address_snapshot: payload.customer_address_snapshot ?? null,
    site_name_snapshot: payload.site_name_snapshot ?? null,
    site_address_snapshot: payload.site_address_snapshot ?? null,
    contract_summary_snapshot: payload.contract_summary_snapshot ?? null,
    contract_terms_snapshot: payload.contract_terms_snapshot ?? {},
    checklist_snapshot: payload.checklist_snapshot ?? [],
    scheduled_at: payload.scheduled_at ?? null,
    metadata: payload.metadata ?? {},
  };
}

function buildActivityInsert(payload: CreateActivityPayload): Record<string, unknown> {
  return {
    work_order_id: payload.work_order_id,
    ticket_id: payload.ticket_id,
    ticket_event_id: payload.ticket_event_id ?? null,
    activity_type: payload.activity_type,
    title: payload.title ?? null,
    description: payload.description,
    started_at: payload.started_at ?? null,
    ended_at: payload.ended_at ?? null,
    duration_seconds: payload.duration_seconds ?? 0,
    author_user_id: payload.author_user_id ?? null,
    author_name: payload.author_name,
    source: payload.source ?? "manual",
    sort_order: payload.sort_order ?? 0,
    is_customer_visible: payload.is_customer_visible ?? true,
    is_printable: payload.is_printable ?? true,
    metadata: payload.metadata ?? {},
  };
}

function buildMaterialInsert(payload: CreateMaterialPayload): Record<string, unknown> {
  return {
    work_order_id: payload.work_order_id,
    ticket_id: payload.ticket_id,
    inventory_item_id: payload.inventory_item_id ?? null,
    asset_id: payload.asset_id ?? null,
    line_type: payload.line_type,
    sku: payload.sku ?? null,
    serial_number: payload.serial_number ?? null,
    description: payload.description,
    quantity: payload.quantity,
    unit: payload.unit ?? "pz",
    unit_cost: payload.unit_cost ?? null,
    unit_price: payload.unit_price ?? null,
    is_billable: payload.is_billable ?? false,
    is_warranty: payload.is_warranty ?? false,
    is_customer_visible: payload.is_customer_visible ?? true,
    is_printable: payload.is_printable ?? true,
    sort_order: payload.sort_order ?? 0,
    metadata: payload.metadata ?? {},
  };
}

function buildInternalNoteInsert(payload: CreateInternalNotePayload): Record<string, unknown> {
  return {
    work_order_id: payload.work_order_id,
    ticket_id: payload.ticket_id,
    note: payload.note,
    author_user_id: payload.author_user_id ?? null,
    author_name: payload.author_name,
    visibility: "internal",
    metadata: payload.metadata ?? {},
  };
}

export function createSupabaseWorkOrderRepository(client: SupabaseClient): WorkOrderRepository {
  return {
    async getWorkOrderById(id) {
      const { data, error } = await client
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? toWorkOrder(data) : null;
    },

    async getWorkOrderByTicketId(ticketId) {
      const { data, error } = await client
        .from("work_orders")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] ? toWorkOrder(data[0]) : null;
    },

    async createWorkOrder(payload) {
      const { data, error } = await client
        .from("work_orders")
        .insert(buildCreateWorkOrderInsert(payload))
        .select("*")
        .single();

      if (error) throw error;
      return toWorkOrder(data);
    },

    async updateWorkOrder(id, payload) {
      const { data, error } = await client
        .from("work_orders")
        .update({
          ...payload,
          updated_at: nowIso(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data ? toWorkOrder(data) : null;
    },

    async deleteWorkOrder(id) {
      const { error, count } = await client
        .from("work_orders")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) throw error;
      return { deleted: Boolean(count && count > 0) };
    },

    async listActivities(workOrderId) {
      const { data, error } = await client
        .from("work_order_activities")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((item) => toWorkOrderActivity(item));
    },

    async createActivity(payload) {
      const { data, error } = await client
        .from("work_order_activities")
        .insert(buildActivityInsert(payload))
        .select("*")
        .single();

      if (error) throw error;
      return toWorkOrderActivity(data);
    },

    async listMaterials(workOrderId) {
      const { data, error } = await client
        .from("work_order_materials")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((item) => toWorkOrderMaterial(item));
    },

    async createMaterial(payload) {
      const { data, error } = await client
        .from("work_order_materials")
        .insert(buildMaterialInsert(payload))
        .select("*")
        .single();

      if (error) throw error;
      return toWorkOrderMaterial(data);
    },

    async listInternalNotes(workOrderId) {
      const { data, error } = await client
        .from("work_order_internal_notes")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((item) => toWorkOrderInternalNote(item));
    },

    async createInternalNote(payload) {
      const { data, error } = await client
        .from("work_order_internal_notes")
        .insert(buildInternalNoteInsert(payload))
        .select("*")
        .single();

      if (error) throw error;
      return toWorkOrderInternalNote(data);
    },
  };
}

export function createMockWorkOrderRepository(): WorkOrderRepository {
  return {
    async getWorkOrderById() {
      return null;
    },

    async getWorkOrderByTicketId() {
      return null;
    },

    async createWorkOrder(payload) {
      const timestamp = nowIso();

      return {
        id: mockId("work_order"),
        tenant_id: payload.tenant_id,
        ticket_id: payload.ticket_id,
        customer_id: payload.customer_id ?? null,
        site_id: payload.site_id ?? null,
        customer_entity_id: payload.customer_entity_id ?? null,
        glpi_entity_id: payload.glpi_entity_id ?? null,
        contract_profile_id: payload.contract_profile_id ?? null,
        customer_contract_link_id: payload.customer_contract_link_id ?? null,
        status: "draft",
        template_key: payload.template_key,
        report_number: null,
        report_number_sequence: null,
        title: payload.title,
        intervention_object: payload.intervention_object,
        description: payload.description ?? null,
        system_code: payload.system_code ?? null,
        system_label: payload.system_label ?? null,
        technician_user_id: payload.technician_user_id ?? null,
        technician_name: payload.technician_name ?? null,
        customer_name_snapshot: payload.customer_name_snapshot,
        customer_address_snapshot: payload.customer_address_snapshot ?? null,
        site_name_snapshot: payload.site_name_snapshot ?? null,
        site_address_snapshot: payload.site_address_snapshot ?? null,
        contract_summary_snapshot: payload.contract_summary_snapshot ?? null,
        contract_terms_snapshot: payload.contract_terms_snapshot ?? {},
        checklist_snapshot: payload.checklist_snapshot ?? [],
        opened_at: timestamp,
        scheduled_at: payload.scheduled_at ?? null,
        started_at: null,
        completed_at: null,
        closed_at: null,
        closed_by: null,
        close_reason: null,
        customer_signature_waiver_reason: null,
        frozen_at: null,
        voided_at: null,
        voided_by: null,
        void_reason: null,
        last_pdf_version_id: null,
        current_version: 0,
        is_customer_visible: false,
        metadata: payload.metadata ?? {},
        created_by: null,
        updated_by: null,
        created_at: timestamp,
        updated_at: timestamp,
      };
    },

    async updateWorkOrder() {
      return null;
    },

    async deleteWorkOrder() {
      return { deleted: false };
    },

    async listActivities() {
      return [];
    },

    async createActivity(payload) {
      const timestamp = nowIso();

      return {
        id: mockId("work_order_activity"),
        tenant_id: "",
        work_order_id: payload.work_order_id,
        ticket_id: payload.ticket_id,
        ticket_event_id: payload.ticket_event_id ?? null,
        activity_type: payload.activity_type,
        title: payload.title ?? null,
        description: payload.description,
        started_at: payload.started_at ?? null,
        ended_at: payload.ended_at ?? null,
        duration_seconds: payload.duration_seconds ?? 0,
        author_user_id: payload.author_user_id ?? null,
        author_name: payload.author_name,
        source: payload.source ?? "manual",
        sort_order: payload.sort_order ?? 0,
        is_customer_visible: payload.is_customer_visible ?? true,
        is_printable: payload.is_printable ?? true,
        metadata: payload.metadata ?? {},
        created_at: timestamp,
        updated_at: timestamp,
      };
    },

    async listMaterials() {
      return [];
    },

    async createMaterial(payload) {
      const timestamp = nowIso();

      return {
        id: mockId("work_order_material"),
        tenant_id: "",
        work_order_id: payload.work_order_id,
        ticket_id: payload.ticket_id,
        inventory_item_id: payload.inventory_item_id ?? null,
        asset_id: payload.asset_id ?? null,
        stock_movement_id: null,
        line_type: payload.line_type,
        sku: payload.sku ?? null,
        serial_number: payload.serial_number ?? null,
        description: payload.description,
        quantity: payload.quantity,
        unit: payload.unit ?? "pz",
        unit_cost: payload.unit_cost ?? null,
        unit_price: payload.unit_price ?? null,
        is_billable: payload.is_billable ?? false,
        is_warranty: payload.is_warranty ?? false,
        is_customer_visible: payload.is_customer_visible ?? true,
        is_printable: payload.is_printable ?? true,
        sort_order: payload.sort_order ?? 0,
        metadata: payload.metadata ?? {},
        created_at: timestamp,
        updated_at: timestamp,
      };
    },

    async listInternalNotes() {
      return [];
    },

    async createInternalNote(payload) {
      const timestamp = nowIso();

      return {
        id: mockId("work_order_internal_note"),
        tenant_id: "",
        work_order_id: payload.work_order_id,
        ticket_id: payload.ticket_id,
        note: payload.note,
        author_user_id: payload.author_user_id ?? null,
        author_name: payload.author_name,
        visibility: "internal",
        metadata: payload.metadata ?? {},
        created_at: timestamp,
        updated_at: timestamp,
      };
    },
  };
}

export const mockWorkOrderRepository = createMockWorkOrderRepository();
