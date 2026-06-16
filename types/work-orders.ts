export type WorkOrderStatus =
  | "draft"
  | "ready_for_signature"
  | "signed"
  | "closed"
  | "void";

export type WorkOrderTemplateType =
  | "extraordinary_maintenance"
  | "material_supplied_replaced"
  | "installation"
  | "repair"
  | "generic";

export type WorkOrderTemplateKey = WorkOrderTemplateType | (string & {});

export type WorkOrderActivitySource =
  | "manual"
  | "ticket_event"
  | "glpi_followup"
  | "system";

export type WorkOrderMaterialLineType =
  | "supplied"
  | "replaced"
  | "installed"
  | "removed"
  | "returned"
  | "consumable";

export type WorkOrderSignatureType =
  | "customer"
  | "technician"
  | "internal_approval";

export type WorkOrderVersionType =
  | "draft_preview"
  | "final"
  | "correction"
  | "void_copy";

export type WorkOrderVersionStatus = "active" | "void";

export type WorkOrderMetadata = Record<string, unknown>;

export type WorkOrderChecklistItem = {
  id: string;
  label: string;
  description?: string | null;
  checked?: boolean;
  sort_order?: number;
  metadata?: WorkOrderMetadata;
};

export type WorkOrderTemplate = {
  id: string;
  tenant_id: string;
  template_key: WorkOrderTemplateKey;
  name: string;
  description: string | null;
  default_intervention_object: string;
  default_description: string | null;
  default_checklist: WorkOrderChecklistItem[];
  pdf_layout_key: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WorkOrderNumberSequence = {
  id: string;
  tenant_id: string;
  sequence_key: string;
  year: number;
  last_number: number;
  prefix: string | null;
  suffix: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrder = {
  id: string;
  tenant_id: string;
  ticket_id: number | string;
  customer_id: string | null;
  site_id: number | null;
  customer_entity_id: string | null;
  glpi_entity_id: number | null;
  contract_profile_id: string | null;
  customer_contract_link_id: string | null;
  status: WorkOrderStatus;
  template_key: WorkOrderTemplateKey;
  report_number: string | null;
  report_number_sequence: number | null;
  title: string;
  intervention_object: string;
  description: string | null;
  system_code: string | null;
  system_label: string | null;
  technician_user_id: string | null;
  technician_name: string | null;
  customer_name_snapshot: string;
  customer_address_snapshot: string | null;
  site_name_snapshot: string | null;
  site_address_snapshot: string | null;
  contract_summary_snapshot: string | null;
  contract_terms_snapshot: WorkOrderMetadata;
  checklist_snapshot: WorkOrderChecklistItem[];
  opened_at: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  close_reason: string | null;
  customer_signature_waiver_reason: string | null;
  frozen_at: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  last_pdf_version_id: string | null;
  current_version: number;
  is_customer_visible: boolean;
  metadata: WorkOrderMetadata;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrderActivity = {
  id: string;
  tenant_id: string;
  work_order_id: string;
  ticket_id: number | string;
  ticket_event_id: string | null;
  activity_type: string;
  title: string | null;
  description: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  author_user_id: string | null;
  author_name: string;
  source: WorkOrderActivitySource;
  sort_order: number;
  is_customer_visible: boolean;
  is_printable: boolean;
  metadata: WorkOrderMetadata;
  created_at: string;
  updated_at: string;
};

export type WorkOrderInternalNote = {
  id: string;
  tenant_id: string;
  work_order_id: string;
  ticket_id: number | string;
  note: string;
  author_user_id: string | null;
  author_name: string;
  visibility: "internal";
  metadata: WorkOrderMetadata;
  created_at: string;
  updated_at: string;
};

export type WorkOrderMaterial = {
  id: string;
  tenant_id: string;
  work_order_id: string;
  ticket_id: number | string;
  inventory_item_id: string | null;
  asset_id: string | null;
  stock_movement_id: string | null;
  line_type: WorkOrderMaterialLineType;
  sku: string | null;
  serial_number: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number | null;
  unit_price: number | null;
  is_billable: boolean;
  is_warranty: boolean;
  is_customer_visible: boolean;
  is_printable: boolean;
  sort_order: number;
  metadata: WorkOrderMetadata;
  created_at: string;
  updated_at: string;
};

export type WorkOrderSignature = {
  id: string;
  tenant_id: string;
  work_order_id: string;
  signature_type: WorkOrderSignatureType;
  signer_name: string;
  signer_role: string | null;
  signer_email: string | null;
  signature_storage_path: string;
  signature_hash: string;
  signature_mime_type: string | null;
  signed_at: string;
  signed_by_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_label: string | null;
  consent_text_snapshot: string;
  is_active: boolean;
  superseded_at: string | null;
  metadata: WorkOrderMetadata;
  created_at: string;
  updated_at: string;
};

export type WorkOrderSnapshotHeader = {
  work_order_id: string;
  ticket_id: number | string;
  status: WorkOrderStatus;
  template_key: WorkOrderTemplateKey;
  report_number: string | null;
  title: string;
  intervention_object: string;
  description: string | null;
  system_code: string | null;
  system_label: string | null;
  opened_at: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
};

export type WorkOrderSnapshotCustomer = {
  customer_id: string | null;
  name: string;
  address: string | null;
};

export type WorkOrderSnapshotSite = {
  site_id: number | null;
  customer_entity_id: string | null;
  glpi_entity_id: number | null;
  name: string | null;
  address: string | null;
};

export type WorkOrderSnapshotTechnician = {
  technician_user_id: string | null;
  name: string | null;
};

export type WorkOrderSnapshotContract = {
  contract_profile_id: string | null;
  customer_contract_link_id: string | null;
  summary: string | null;
  terms: WorkOrderMetadata;
};

export type WorkOrderSnapshot = {
  header: WorkOrderSnapshotHeader;
  customer: WorkOrderSnapshotCustomer;
  site: WorkOrderSnapshotSite;
  technician: WorkOrderSnapshotTechnician;
  contract: WorkOrderSnapshotContract;
  checklist: WorkOrderChecklistItem[];
  activities: WorkOrderActivity[];
  materials: WorkOrderMaterial[];
  signatures: WorkOrderSignature[];
  metadata: WorkOrderMetadata;
};

export type WorkOrderVersion = {
  id: string;
  tenant_id: string;
  work_order_id: string;
  ticket_id: number | string;
  version_number: number;
  version_type: WorkOrderVersionType;
  status: WorkOrderVersionStatus;
  report_number: string | null;
  storage_bucket: string;
  pdf_storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  pdf_hash: string;
  snapshot: WorkOrderSnapshot;
  generated_by: string | null;
  generated_at: string;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  metadata: WorkOrderMetadata;
};

export type CreateWorkOrderPayload = {
  tenant_id: string;
  ticket_id: number | string;
  customer_id?: string | null;
  site_id?: number | null;
  customer_entity_id?: string | null;
  glpi_entity_id?: number | null;
  contract_profile_id?: string | null;
  customer_contract_link_id?: string | null;
  template_key: WorkOrderTemplateKey;
  title: string;
  intervention_object: string;
  description?: string | null;
  system_code?: string | null;
  system_label?: string | null;
  technician_user_id?: string | null;
  technician_name?: string | null;
  customer_name_snapshot: string;
  customer_address_snapshot?: string | null;
  site_name_snapshot?: string | null;
  site_address_snapshot?: string | null;
  contract_summary_snapshot?: string | null;
  contract_terms_snapshot?: WorkOrderMetadata;
  checklist_snapshot?: WorkOrderChecklistItem[];
  scheduled_at?: string | null;
  metadata?: WorkOrderMetadata;
};

export type UpdateWorkOrderPayload = Partial<
  Pick<
    WorkOrder,
    | "template_key"
    | "title"
    | "intervention_object"
    | "description"
    | "system_code"
    | "system_label"
    | "technician_user_id"
    | "technician_name"
    | "contract_summary_snapshot"
    | "contract_terms_snapshot"
    | "checklist_snapshot"
    | "scheduled_at"
    | "started_at"
    | "completed_at"
    | "is_customer_visible"
    | "metadata"
  >
>;

export type CreateActivityPayload = {
  work_order_id: string;
  ticket_id: number | string;
  ticket_event_id?: string | null;
  activity_type: string;
  title?: string | null;
  description: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number;
  author_user_id?: string | null;
  author_name: string;
  source?: WorkOrderActivitySource;
  sort_order?: number;
  is_customer_visible?: boolean;
  is_printable?: boolean;
  metadata?: WorkOrderMetadata;
};

export type CreateMaterialPayload = {
  work_order_id: string;
  ticket_id: number | string;
  inventory_item_id?: string | null;
  asset_id?: string | null;
  line_type: WorkOrderMaterialLineType;
  sku?: string | null;
  serial_number?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  unit_cost?: number | null;
  unit_price?: number | null;
  is_billable?: boolean;
  is_warranty?: boolean;
  is_customer_visible?: boolean;
  is_printable?: boolean;
  sort_order?: number;
  metadata?: WorkOrderMetadata;
};

export type CreateSignaturePayload = {
  work_order_id: string;
  signature_type: WorkOrderSignatureType;
  signer_name: string;
  signer_role?: string | null;
  signer_email?: string | null;
  signature_storage_path: string;
  signature_hash: string;
  signature_mime_type?: string | null;
  signed_at?: string;
  signed_by_user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_label?: string | null;
  consent_text_snapshot: string;
  is_active?: boolean;
  superseded_at?: string | null;
  metadata?: WorkOrderMetadata;
};

export type CreateWorkOrderVersionPayload = {
  work_order_id: string;
  ticket_id: number | string;
  version_type: WorkOrderVersionType;
  status?: WorkOrderVersionStatus;
  report_number?: string | null;
  storage_bucket?: string;
  pdf_storage_path: string;
  mime_type?: string;
  size_bytes?: number | null;
  pdf_hash: string;
  snapshot: WorkOrderSnapshot;
  generated_by?: string | null;
  metadata?: WorkOrderMetadata;
};

export type CloseWorkOrderPayload = {
  work_order_id: string;
  closed_by: string;
  close_reason?: string | null;
  customer_signature_waiver_reason?: string | null;
  completed_at?: string | null;
  metadata?: WorkOrderMetadata;
};

export type CreateInternalNotePayload = {
  work_order_id: string;
  ticket_id: number | string;
  note: string;
  author_user_id?: string | null;
  author_name: string;
  metadata?: WorkOrderMetadata;
};
