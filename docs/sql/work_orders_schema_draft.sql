-- Work Orders / Bolle schema draft.
-- Draft only: do not run as a production migration without review.
-- Verified existing id types from Supabase:
-- - tickets.id bigint
-- - sites.id bigint
-- - ticket_events.id uuid
-- - tenants/customers/customer_entities/contract_profiles/customer_contract_links/tenant_users ids uuid
-- - tenant_id uuid
-- TODO RLS: enable tenant-scoped RLS on every table and write policies after role matrix approval.

create table if not exists public.work_order_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  template_key text not null,
  name text not null,
  description text,
  default_intervention_object text not null,
  default_description text,
  default_checklist jsonb not null default '[]'::jsonb,
  pdf_layout_key text not null default 'secom_default',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_templates_key_chk check (length(trim(template_key)) > 0),
  constraint work_order_templates_name_chk check (length(trim(name)) > 0),
  constraint work_order_templates_object_chk check (length(trim(default_intervention_object)) > 0)
);

create unique index if not exists work_order_templates_tenant_key_idx
  on public.work_order_templates (tenant_id, template_key);

create index if not exists work_order_templates_tenant_active_idx
  on public.work_order_templates (tenant_id, is_active, sort_order);

create index if not exists work_order_templates_tenant_layout_idx
  on public.work_order_templates (tenant_id, pdf_layout_key);

create table if not exists public.work_order_number_sequences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  sequence_key text not null,
  year integer not null,
  last_number bigint not null default 0,
  prefix text,
  suffix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_number_sequences_key_chk check (length(trim(sequence_key)) > 0),
  constraint work_order_number_sequences_year_chk check (year >= 2000),
  constraint work_order_number_sequences_last_number_chk check (last_number >= 0)
);

create unique index if not exists work_order_number_sequences_unique_idx
  on public.work_order_number_sequences (tenant_id, sequence_key, year);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  ticket_id bigint not null references public.tickets(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  site_id bigint references public.sites(id) on delete set null,
  customer_entity_id uuid references public.customer_entities(id) on delete set null,
  glpi_entity_id bigint,
  contract_profile_id uuid references public.contract_profiles(id) on delete set null,
  customer_contract_link_id uuid references public.customer_contract_links(id) on delete set null,
  status text not null default 'draft',
  template_key text not null,
  report_number text,
  report_number_sequence bigint,
  title text not null,
  intervention_object text not null,
  description text,
  system_code text,
  system_label text,
  technician_user_id uuid,
  technician_name text,
  customer_name_snapshot text not null,
  customer_address_snapshot text,
  site_name_snapshot text,
  site_address_snapshot text,
  contract_summary_snapshot text,
  contract_terms_snapshot jsonb not null default '{}'::jsonb,
  checklist_snapshot jsonb not null default '[]'::jsonb,
  opened_at timestamptz not null default now(),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  closed_by uuid references public.tenant_users(id) on delete set null,
  close_reason text,
  customer_signature_waiver_reason text,
  frozen_at timestamptz,
  voided_at timestamptz,
  voided_by uuid references public.tenant_users(id) on delete set null,
  void_reason text,
  last_pdf_version_id uuid,
  current_version integer not null default 0,
  is_customer_visible boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.tenant_users(id) on delete set null,
  updated_by uuid references public.tenant_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_orders_status_chk check (
    status in ('draft', 'ready_for_signature', 'signed', 'closed', 'void')
  ),
  constraint work_orders_template_key_chk check (length(trim(template_key)) > 0),
  constraint work_orders_title_chk check (length(trim(title)) > 0),
  constraint work_orders_intervention_object_chk check (length(trim(intervention_object)) > 0),
  constraint work_orders_current_version_chk check (current_version >= 0),
  constraint work_orders_report_number_closed_chk check (
    report_number is null or status in ('closed', 'void')
  ),
  constraint work_orders_void_reason_chk check (
    status <> 'void' or void_reason is not null
  ),
  constraint work_orders_started_after_opened_chk check (
    started_at is null or started_at >= opened_at
  ),
  constraint work_orders_completed_after_started_chk check (
    completed_at is null or started_at is null or completed_at >= started_at
  ),
  constraint work_orders_closed_after_opened_chk check (
    closed_at is null or closed_at >= opened_at
  )
);

create index if not exists work_orders_tenant_ticket_idx
  on public.work_orders (tenant_id, ticket_id);

create index if not exists work_orders_tenant_status_opened_idx
  on public.work_orders (tenant_id, status, opened_at desc);

create index if not exists work_orders_tenant_status_closed_idx
  on public.work_orders (tenant_id, status, closed_at desc);

create index if not exists work_orders_tenant_customer_opened_idx
  on public.work_orders (tenant_id, customer_id, opened_at desc);

create index if not exists work_orders_tenant_customer_portal_idx
  on public.work_orders (tenant_id, customer_id, is_customer_visible, status, opened_at desc);

create index if not exists work_orders_tenant_site_opened_idx
  on public.work_orders (tenant_id, site_id, opened_at desc);

create index if not exists work_orders_tenant_entity_opened_idx
  on public.work_orders (tenant_id, customer_entity_id, opened_at desc);

create index if not exists work_orders_tenant_glpi_entity_opened_idx
  on public.work_orders (tenant_id, glpi_entity_id, opened_at desc);

create unique index if not exists work_orders_tenant_report_number_idx
  on public.work_orders (tenant_id, report_number)
  where report_number is not null;

-- One active bolla per ticket.
create unique index if not exists work_orders_one_active_per_ticket_idx
  on public.work_orders (tenant_id, ticket_id)
  where status in ('draft', 'ready_for_signature', 'signed');

create table if not exists public.work_order_checklist_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  label text not null,
  description text,
  checked boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_checklist_items_label_chk check (length(trim(label)) > 0)
);

create index if not exists work_order_checklist_items_work_order_idx
  on public.work_order_checklist_items (tenant_id, work_order_id, sort_order);

create table if not exists public.work_order_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  ticket_id bigint not null references public.tickets(id) on delete restrict,
  ticket_event_id uuid references public.ticket_events(id) on delete set null,
  activity_type text not null,
  title text,
  description text not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  author_user_id uuid references public.tenant_users(id) on delete set null,
  author_name text not null,
  source text not null default 'manual',
  sort_order integer not null default 0,
  is_customer_visible boolean not null default true,
  is_printable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_activities_source_chk check (
    source in ('manual', 'ticket_event', 'glpi_followup', 'system')
  ),
  constraint work_order_activities_type_chk check (length(trim(activity_type)) > 0),
  constraint work_order_activities_description_chk check (length(trim(description)) > 0),
  constraint work_order_activities_author_name_chk check (length(trim(author_name)) > 0),
  constraint work_order_activities_duration_chk check (duration_seconds >= 0),
  constraint work_order_activities_ended_after_started_chk check (
    ended_at is null or started_at is null or ended_at >= started_at
  )
);

create index if not exists work_order_activities_work_order_idx
  on public.work_order_activities (tenant_id, work_order_id, sort_order, created_at);

create index if not exists work_order_activities_ticket_idx
  on public.work_order_activities (tenant_id, ticket_id, created_at desc);

create index if not exists work_order_activities_customer_visible_idx
  on public.work_order_activities (tenant_id, work_order_id, is_customer_visible, is_printable, created_at);

create table if not exists public.work_order_internal_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  ticket_id bigint not null references public.tickets(id) on delete restrict,
  note text not null,
  author_user_id uuid references public.tenant_users(id) on delete set null,
  author_name text not null,
  visibility text not null default 'internal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_internal_notes_visibility_chk check (visibility = 'internal'),
  constraint work_order_internal_notes_note_chk check (length(trim(note)) > 0),
  constraint work_order_internal_notes_author_name_chk check (length(trim(author_name)) > 0)
);

create index if not exists work_order_internal_notes_work_order_idx
  on public.work_order_internal_notes (tenant_id, work_order_id, created_at desc);

create table if not exists public.work_order_materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  ticket_id bigint not null references public.tickets(id) on delete restrict,
  inventory_item_id uuid,
  asset_id uuid,
  stock_movement_id uuid,
  line_type text not null,
  sku text,
  serial_number text,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'pz',
  unit_cost numeric(12,2),
  unit_price numeric(12,2),
  is_billable boolean not null default false,
  is_warranty boolean not null default false,
  is_customer_visible boolean not null default true,
  is_printable boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_materials_line_type_chk check (
    line_type in ('supplied', 'replaced', 'installed', 'removed', 'returned', 'consumable')
  ),
  constraint work_order_materials_quantity_chk check (quantity > 0),
  constraint work_order_materials_unit_chk check (length(trim(unit)) > 0),
  constraint work_order_materials_description_chk check (length(trim(description)) > 0)
);

create index if not exists work_order_materials_work_order_idx
  on public.work_order_materials (tenant_id, work_order_id, sort_order, created_at);

create index if not exists work_order_materials_ticket_idx
  on public.work_order_materials (tenant_id, ticket_id, created_at desc);

create index if not exists work_order_materials_customer_visible_idx
  on public.work_order_materials (tenant_id, work_order_id, is_customer_visible, is_printable, created_at);

create index if not exists work_order_materials_stock_movement_idx
  on public.work_order_materials (tenant_id, stock_movement_id)
  where stock_movement_id is not null;

create table if not exists public.work_order_signatures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  signature_type text not null,
  signer_name text not null,
  signer_role text,
  signer_email text,
  signature_storage_path text not null,
  signature_hash text not null,
  signature_mime_type text,
  signed_at timestamptz not null default now(),
  signed_by_user_id uuid references public.tenant_users(id) on delete set null,
  ip_address inet,
  user_agent text,
  device_label text,
  consent_text_snapshot text not null,
  is_active boolean not null default true,
  superseded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_order_signatures_type_chk check (
    signature_type in ('customer', 'technician', 'internal_approval')
  ),
  constraint work_order_signatures_signer_name_chk check (length(trim(signer_name)) > 0),
  constraint work_order_signatures_storage_path_chk check (length(trim(signature_storage_path)) > 0),
  constraint work_order_signatures_hash_chk check (length(trim(signature_hash)) > 0),
  constraint work_order_signatures_consent_chk check (length(trim(consent_text_snapshot)) > 0)
);

-- Allows re-signing while preserving signature history.
create unique index if not exists work_order_signatures_active_type_idx
  on public.work_order_signatures (tenant_id, work_order_id, signature_type)
  where is_active = true;

create index if not exists work_order_signatures_work_order_idx
  on public.work_order_signatures (tenant_id, work_order_id, signed_at desc);

create index if not exists work_order_signatures_active_idx
  on public.work_order_signatures (tenant_id, work_order_id, is_active, signature_type);

create table if not exists public.work_order_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  ticket_id bigint not null references public.tickets(id) on delete restrict,
  version_number integer not null,
  version_type text not null,
  status text not null default 'active',
  report_number text,
  storage_bucket text not null default 'work-order-pdfs',
  pdf_storage_path text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint,
  pdf_hash text not null,
  snapshot jsonb not null,
  generated_by uuid references public.tenant_users(id) on delete set null,
  generated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.tenant_users(id) on delete set null,
  void_reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint work_order_versions_number_chk check (version_number > 0),
  constraint work_order_versions_type_chk check (
    version_type in ('draft_preview', 'final', 'correction', 'void_copy')
  ),
  constraint work_order_versions_status_chk check (status in ('active', 'void')),
  constraint work_order_versions_void_reason_chk check (
    status <> 'void' or void_reason is not null
  ),
  constraint work_order_versions_bucket_chk check (length(trim(storage_bucket)) > 0),
  constraint work_order_versions_storage_path_chk check (length(trim(pdf_storage_path)) > 0),
  constraint work_order_versions_mime_type_chk check (length(trim(mime_type)) > 0),
  constraint work_order_versions_hash_chk check (length(trim(pdf_hash)) > 0),
  constraint work_order_versions_size_chk check (size_bytes is null or size_bytes >= 0)
);

create unique index if not exists work_order_versions_unique_number_idx
  on public.work_order_versions (tenant_id, work_order_id, version_number);

create index if not exists work_order_versions_work_order_idx
  on public.work_order_versions (tenant_id, work_order_id, generated_at desc);

create index if not exists work_order_versions_ticket_idx
  on public.work_order_versions (tenant_id, ticket_id, generated_at desc);

create index if not exists work_order_versions_active_customer_idx
  on public.work_order_versions (tenant_id, work_order_id, status, generated_at desc);

create index if not exists work_order_versions_report_number_idx
  on public.work_order_versions (tenant_id, report_number)
  where report_number is not null;

-- Idempotent FK for the latest PDF/version pointer.
do $$
begin
  alter table public.work_orders
    add constraint work_orders_last_pdf_version_fk
    foreign key (last_pdf_version_id)
    references public.work_order_versions(id)
    on delete set null;
exception
  when duplicate_object then null;
end $$;

-- TODO tenant consistency:
-- Single-column FKs validate existence but not same-tenant ownership.
-- Enforce same-tenant relationships in service/API, or add composite tenant FKs
-- after confirming existing unique indexes on (tenant_id, id) for source tables.

-- TODO RLS:
-- alter table public.work_orders enable row level security;
-- alter table public.work_order_activities enable row level security;
-- alter table public.work_order_internal_notes enable row level security;
-- alter table public.work_order_materials enable row level security;
-- alter table public.work_order_signatures enable row level security;
-- alter table public.work_order_versions enable row level security;
-- alter table public.work_order_templates enable row level security;
-- alter table public.work_order_checklist_items enable row level security;
-- alter table public.work_order_number_sequences enable row level security;
-- TODO policies:
-- - internal roles read/write by tenant and role.
-- - technicians read/write only assigned work orders.
-- - customer roles read only closed, customer-visible records in their scope.
-- - internal notes never exposed to customer roles.
