-- ATLAS security hardening based on the Supabase linter exports in
-- docs/security-audit/security-errors.csv
-- docs/security-audit/security-info.csv
-- docs/security-audit/security-warnings.csv
-- docs/security-audit/current-policies.csv.csv
-- docs/security-audit/current-rls-status.csv.csv
-- docs/security-audit/current-object-grants.csv
-- docs/security-audit/current-default-privileges.csv
--
-- This migration is intentionally fail-closed:
-- - it only changes objects named by those exports;
-- - it validates relation kinds, required columns, risky policy definitions,
--   exposed SECURITY DEFINER functions and the ticket-attachments bucket;
-- - it aborts on additional unexported risky policies or objects;
-- - service_role privileges are never revoked.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

create temp table atlas_security_expected_tables (
  table_name text primary key,
  access_model text not null
) on commit drop;

insert into atlas_security_expected_tables (table_name, access_model)
values
  ('atlas_events', 'internal'),
  ('atlas_glpi_entities', 'service_role_only'),
  ('budget', 'service_role_only'),
  ('contract_profiles', 'internal'),
  ('customer_aliases', 'internal'),
  ('customer_assets', 'customer_asset'),
  ('customer_contract_links', 'internal'),
  ('customer_entities', 'customer_entity'),
  ('customer_entity_aliases', 'internal'),
  ('customer_entity_contracts', 'internal'),
  ('customer_registration_codes', 'registration'),
  ('download_resources', 'internal'),
  ('glpi_import_errors', 'internal'),
  ('glpi_import_runs', 'internal'),
  ('glpi_sync_state', 'internal'),
  ('glpi_ticket_mappings', 'internal'),
  ('help_queries', 'service_role_only'),
  ('manuals', 'manual'),
  ('materials', 'service_role_only'),
  ('operational_plan_consumptions', 'internal'),
  ('operational_plan_customers', 'internal'),
  ('operational_plan_events', 'internal'),
  ('operational_plan_items', 'internal'),
  ('operational_plans', 'internal'),
  ('permissions', 'permissions'),
  ('role_permissions', 'role_permissions'),
  ('roles', 'roles'),
  ('tenant_user_scopes', 'tenant_user_scopes'),
  ('tenant_users', 'tenant_users'),
  ('tenants', 'tenants'),
  ('ticket_attachments', 'ticket_child'),
  ('ticket_communications', 'ticket_child'),
  ('ticket_entity_links', 'internal'),
  ('ticket_events', 'ticket_child'),
  ('todo_tasks', 'service_role_only'),
  ('user_permission_overrides', 'user_permission_overrides'),
  ('work_order_activities', 'work_order_visible_child'),
  ('work_order_checklist_items', 'work_order_child'),
  ('work_order_internal_notes', 'work_order_internal_child'),
  ('work_order_materials', 'work_order_visible_child'),
  ('work_order_number_sequences', 'internal'),
  ('work_order_report_templates', 'internal'),
  ('work_order_signatures', 'work_order_internal_child'),
  ('work_order_templates', 'internal'),
  ('work_order_versions', 'work_order_internal_child'),
  ('work_orders', 'work_order');

create temp table atlas_security_expected_views (
  view_name text primary key
) on commit drop;

insert into atlas_security_expected_views (view_name)
values
  ('atlas_user_permissions_view'),
  ('ticket_entity_links_debug'),
  ('v_customer_entities_active'),
  ('v_future_tickets'),
  ('v_operational_plan_progress'),
  ('v_operational_tickets');

create temp table atlas_security_bad_policies (
  table_name text not null,
  policy_name text not null,
  command_name text not null,
  expected_role text not null,
  expected_using_true boolean not null,
  expected_check_true boolean not null,
  primary key (table_name, policy_name)
) on commit drop;

insert into atlas_security_bad_policies (
  table_name,
  policy_name,
  command_name,
  expected_role,
  expected_using_true,
  expected_check_true
)
values
  ('customer_aliases', 'authenticated delete customer aliases', 'DELETE', 'authenticated', true, false),
  ('customer_aliases', 'authenticated insert customer aliases', 'INSERT', 'authenticated', false, true),
  ('customer_aliases', 'authenticated update customer aliases', 'UPDATE', 'authenticated', true, true),
  ('download_resources', 'download_resources_delete', 'DELETE', 'public', true, false),
  ('download_resources', 'download_resources_insert', 'INSERT', 'public', false, true),
  ('download_resources', 'download_resources_update', 'UPDATE', 'public', true, true),
  ('manuals', 'manuals_insert_authenticated', 'INSERT', 'authenticated', false, true),
  ('manuals', 'manuals_update_authenticated', 'UPDATE', 'authenticated', true, true),
  ('permissions', 'rbac_permissions_write', 'ALL', 'public', true, true),
  ('role_permissions', 'rbac_role_permissions_write', 'ALL', 'public', true, true),
  ('roles', 'rbac_roles_write', 'ALL', 'public', true, true),
  ('tenant_user_scopes', 'rbac_user_scopes_write', 'ALL', 'public', true, true),
  ('tenant_users', 'Allow public insert tenant users', 'INSERT', 'public', false, true),
  ('ticket_attachments', 'ticket attachments table delete authenticated', 'DELETE', 'authenticated', true, false),
  ('ticket_attachments', 'ticket attachments table insert authenticated', 'INSERT', 'authenticated', false, true),
  ('ticket_events', 'Allow public insert ticket events', 'INSERT', 'public', false, true),
  ('todo_tasks', 'todo_tasks_authenticated_insert', 'INSERT', 'authenticated', false, true),
  ('todo_tasks', 'todo_tasks_authenticated_update', 'UPDATE', 'authenticated', true, true),
  ('user_permission_overrides', 'rbac_user_overrides_write', 'ALL', 'public', true, true),
  ('customer_aliases', 'authenticated read customer aliases', 'SELECT', 'authenticated', true, false),
  ('download_resources', 'download_resources_select', 'SELECT', 'public', true, false),
  ('glpi_import_errors', 'authenticated read glpi import errors', 'SELECT', 'authenticated', true, false),
  ('glpi_import_runs', 'authenticated read glpi import runs', 'SELECT', 'authenticated', true, false),
  ('glpi_ticket_mappings', 'authenticated read glpi ticket mappings', 'SELECT', 'authenticated', true, false),
  ('manuals', 'manuals_select_authenticated', 'SELECT', 'authenticated', true, false),
  ('role_permissions', 'rbac_role_permissions_read', 'SELECT', 'public', true, false),
  ('roles', 'rbac_roles_read', 'SELECT', 'public', true, false),
  ('tenant_user_scopes', 'rbac_user_scopes_read', 'SELECT', 'public', true, false),
  ('tenant_users', 'Allow public read tenant users', 'SELECT', 'public', true, false),
  ('tenants', 'Allow public read tenants', 'SELECT', 'public', true, false),
  ('ticket_attachments', 'ticket attachments table read authenticated', 'SELECT', 'authenticated', true, false),
  ('ticket_events', 'Allow public read ticket events', 'SELECT', 'public', true, false),
  ('todo_tasks', 'todo_tasks_authenticated_select', 'SELECT', 'authenticated', true, false),
  ('user_permission_overrides', 'rbac_user_overrides_read', 'SELECT', 'public', true, false);

-- SELECT USING (true) classification from current-policies.csv.csv:
-- - intentionally public: public.permissions / rbac_permissions_read (static permission catalog; anon table grants are revoked below).
-- - compatible after hardening only because a replacement policy exists: customer_aliases, download_resources,
--   glpi_import_errors, glpi_import_runs, glpi_ticket_mappings, manuals, role_permissions, roles,
--   tenant_user_scopes, tenant_users, tenants, ticket_attachments, ticket_events, user_permission_overrides.
-- - closed to anon/authenticated by service_role_only: atlas_glpi_entities, budget, help_queries, materials, todo_tasks.
-- - residual risk left uncorrected in this migration: none in public policy inventory; storage.objects is handled separately
--   by removing the ticket-attachments listing policy while preserving object access required by the legacy flow.

create temp table atlas_security_expected_rls (
  schema_name text not null,
  table_name text not null,
  rls_enabled boolean not null,
  rls_forced boolean not null,
  primary key (schema_name, table_name)
) on commit drop;

insert into atlas_security_expected_rls (
  schema_name,
  table_name,
  rls_enabled,
  rls_forced
)
values
  ('public', 'atlas_asset_systems', true, false),
  ('public', 'atlas_contract_budgets', true, false),
  ('public', 'atlas_contract_catalog', true, false),
  ('public', 'atlas_contract_sla_profiles', true, false),
  ('public', 'atlas_events', false, false),
  ('public', 'atlas_glpi_entities', false, false),
  ('public', 'atlas_inventory_items', true, false),
  ('public', 'atlas_material_catalog', true, false),
  ('public', 'atlas_operator_sectors', true, false),
  ('public', 'atlas_operators', true, false),
  ('public', 'budget', true, false),
  ('public', 'contract_profiles', false, false),
  ('public', 'customer_aliases', true, false),
  ('public', 'customer_assets', false, false),
  ('public', 'customer_contract_links', false, false),
  ('public', 'customer_entities', false, false),
  ('public', 'customer_entity_aliases', false, false),
  ('public', 'customer_entity_contracts', false, false),
  ('public', 'customer_registration_codes', false, false),
  ('public', 'customers', true, false),
  ('public', 'download_library', true, false),
  ('public', 'download_resources', true, false),
  ('public', 'glpi_import_errors', true, false),
  ('public', 'glpi_import_runs', true, false),
  ('public', 'glpi_sync_state', false, false),
  ('public', 'glpi_ticket_mappings', true, false),
  ('public', 'help_queries', false, false),
  ('public', 'manuals', true, false),
  ('public', 'materials', true, false),
  ('public', 'operational_plan_consumptions', false, false),
  ('public', 'operational_plan_customers', false, false),
  ('public', 'operational_plan_events', false, false),
  ('public', 'operational_plan_items', false, false),
  ('public', 'operational_plans', false, false),
  ('public', 'permissions', true, false),
  ('public', 'role_permissions', true, false),
  ('public', 'roles', true, false),
  ('public', 'sites', true, false),
  ('public', 'tenant_user_scopes', true, false),
  ('public', 'tenant_users', true, false),
  ('public', 'tenants', true, false),
  ('public', 'ticket_attachments', true, false),
  ('public', 'ticket_communications', false, false),
  ('public', 'ticket_entity_links', false, false),
  ('public', 'ticket_events', true, false),
  ('public', 'tickets', true, false),
  ('public', 'todo_tasks', true, false),
  ('public', 'user_permission_overrides', true, false),
  ('public', 'work_order_activities', false, false),
  ('public', 'work_order_checklist_items', false, false),
  ('public', 'work_order_internal_notes', false, false),
  ('public', 'work_order_materials', false, false),
  ('public', 'work_order_number_sequences', false, false),
  ('public', 'work_order_report_templates', false, false),
  ('public', 'work_order_signatures', false, false),
  ('public', 'work_order_templates', false, false),
  ('public', 'work_order_versions', false, false),
  ('public', 'work_orders', false, false),
  ('storage', 'buckets', true, false),
  ('storage', 'buckets_analytics', true, false),
  ('storage', 'buckets_vectors', true, false),
  ('storage', 'migrations', true, false),
  ('storage', 'objects', true, false),
  ('storage', 's3_multipart_uploads', true, false),
  ('storage', 's3_multipart_uploads_parts', true, false),
  ('storage', 'vector_indexes', true, false);

create temp table atlas_security_expected_policy_names (
  schema_name text not null,
  table_name text not null,
  policy_name text not null,
  primary key (schema_name, table_name, policy_name)
) on commit drop;

insert into atlas_security_expected_policy_names (
  schema_name,
  table_name,
  policy_name
)
values
  ('public', 'atlas_asset_systems', 'atlas_asset_systems_delete'),
  ('public', 'atlas_asset_systems', 'atlas_asset_systems_insert'),
  ('public', 'atlas_asset_systems', 'atlas_asset_systems_select'),
  ('public', 'atlas_asset_systems', 'atlas_asset_systems_update'),
  ('public', 'atlas_contract_budgets', 'atlas_contract_budgets_delete'),
  ('public', 'atlas_contract_budgets', 'atlas_contract_budgets_insert'),
  ('public', 'atlas_contract_budgets', 'atlas_contract_budgets_select'),
  ('public', 'atlas_contract_budgets', 'atlas_contract_budgets_update'),
  ('public', 'atlas_contract_catalog', 'atlas_contract_catalog_delete'),
  ('public', 'atlas_contract_catalog', 'atlas_contract_catalog_insert'),
  ('public', 'atlas_contract_catalog', 'atlas_contract_catalog_select'),
  ('public', 'atlas_contract_catalog', 'atlas_contract_catalog_update'),
  ('public', 'atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_delete'),
  ('public', 'atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_insert'),
  ('public', 'atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_select'),
  ('public', 'atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_update'),
  ('public', 'atlas_inventory_items', 'atlas_inventory_items_delete'),
  ('public', 'atlas_inventory_items', 'atlas_inventory_items_insert'),
  ('public', 'atlas_inventory_items', 'atlas_inventory_items_select'),
  ('public', 'atlas_inventory_items', 'atlas_inventory_items_update'),
  ('public', 'atlas_material_catalog', 'atlas_material_catalog_delete'),
  ('public', 'atlas_material_catalog', 'atlas_material_catalog_insert'),
  ('public', 'atlas_material_catalog', 'atlas_material_catalog_select'),
  ('public', 'atlas_material_catalog', 'atlas_material_catalog_update'),
  ('public', 'atlas_operator_sectors', 'atlas_operator_sectors_delete'),
  ('public', 'atlas_operator_sectors', 'atlas_operator_sectors_insert'),
  ('public', 'atlas_operator_sectors', 'atlas_operator_sectors_select'),
  ('public', 'atlas_operator_sectors', 'atlas_operator_sectors_update'),
  ('public', 'atlas_operators', 'atlas_operators_delete'),
  ('public', 'atlas_operators', 'atlas_operators_insert'),
  ('public', 'atlas_operators', 'atlas_operators_select'),
  ('public', 'atlas_operators', 'atlas_operators_update'),
  ('public', 'customer_aliases', 'authenticated delete customer aliases'),
  ('public', 'customer_aliases', 'authenticated insert customer aliases'),
  ('public', 'customer_aliases', 'authenticated read customer aliases'),
  ('public', 'customer_aliases', 'authenticated update customer aliases'),
  ('public', 'customers', 'tenant_customers_delete'),
  ('public', 'customers', 'tenant_customers_insert'),
  ('public', 'customers', 'tenant_customers_select'),
  ('public', 'customers', 'tenant_customers_update'),
  ('public', 'download_library', 'download_library_customer_select'),
  ('public', 'download_library', 'download_library_delete'),
  ('public', 'download_library', 'download_library_insert'),
  ('public', 'download_library', 'download_library_internal_select'),
  ('public', 'download_library', 'download_library_update'),
  ('public', 'download_resources', 'download_resources_delete'),
  ('public', 'download_resources', 'download_resources_insert'),
  ('public', 'download_resources', 'download_resources_select'),
  ('public', 'download_resources', 'download_resources_update'),
  ('public', 'glpi_import_errors', 'authenticated read glpi import errors'),
  ('public', 'glpi_import_runs', 'authenticated read glpi import runs'),
  ('public', 'glpi_ticket_mappings', 'authenticated read glpi ticket mappings'),
  ('public', 'manuals', 'manuals_insert_authenticated'),
  ('public', 'manuals', 'manuals_select_authenticated'),
  ('public', 'manuals', 'manuals_update_authenticated'),
  ('public', 'permissions', 'rbac_permissions_read'),
  ('public', 'permissions', 'rbac_permissions_write'),
  ('public', 'role_permissions', 'rbac_role_permissions_read'),
  ('public', 'role_permissions', 'rbac_role_permissions_write'),
  ('public', 'roles', 'rbac_roles_read'),
  ('public', 'roles', 'rbac_roles_write'),
  ('public', 'sites', 'tenant_sites_delete'),
  ('public', 'sites', 'tenant_sites_insert'),
  ('public', 'sites', 'tenant_sites_select'),
  ('public', 'sites', 'tenant_sites_update'),
  ('public', 'tenant_user_scopes', 'rbac_user_scopes_read'),
  ('public', 'tenant_user_scopes', 'rbac_user_scopes_write'),
  ('public', 'tenant_users', 'Allow public insert tenant users'),
  ('public', 'tenant_users', 'Allow public read tenant users'),
  ('public', 'tenants', 'Allow public read tenants'),
  ('public', 'ticket_attachments', 'ticket attachments table delete authenticated'),
  ('public', 'ticket_attachments', 'ticket attachments table insert authenticated'),
  ('public', 'ticket_attachments', 'ticket attachments table read authenticated'),
  ('public', 'ticket_events', 'Allow public insert ticket events'),
  ('public', 'ticket_events', 'Allow public read ticket events'),
  ('public', 'ticket_events', 'tenant_events_delete'),
  ('public', 'ticket_events', 'tenant_events_insert'),
  ('public', 'ticket_events', 'tenant_events_select'),
  ('public', 'ticket_events', 'tenant_events_update'),
  ('public', 'tickets', 'tenant_tickets_delete'),
  ('public', 'tickets', 'tenant_tickets_insert'),
  ('public', 'tickets', 'tenant_tickets_select'),
  ('public', 'tickets', 'tenant_tickets_update'),
  ('public', 'todo_tasks', 'todo_tasks_authenticated_insert'),
  ('public', 'todo_tasks', 'todo_tasks_authenticated_select'),
  ('public', 'todo_tasks', 'todo_tasks_authenticated_update'),
  ('public', 'user_permission_overrides', 'rbac_user_overrides_read'),
  ('public', 'user_permission_overrides', 'rbac_user_overrides_write'),
  ('storage', 'objects', 'atlas_downloads_delete'),
  ('storage', 'objects', 'atlas_downloads_insert'),
  ('storage', 'objects', 'atlas_downloads_select'),
  ('storage', 'objects', 'atlas_downloads_update'),
  ('storage', 'objects', 'atlas_manuals_read_authenticated'),
  ('storage', 'objects', 'atlas_manuals_update_authenticated'),
  ('storage', 'objects', 'atlas_manuals_upload_authenticated'),
  ('storage', 'objects', 'ticket attachments delete authenticated'),
  ('storage', 'objects', 'ticket attachments read authenticated'),
  ('storage', 'objects', 'ticket attachments update authenticated'),
  ('storage', 'objects', 'ticket attachments upload authenticated');

create temp table atlas_security_preserved_policy_definitions (
  table_name text not null,
  policy_name text not null,
  command_name text not null,
  roles_text text not null,
  using_expression text,
  check_expression text,
  primary key (table_name, policy_name)
) on commit drop;

insert into atlas_security_preserved_policy_definitions (
  table_name,
  policy_name,
  command_name,
  roles_text,
  using_expression,
  check_expression
)
values
  ('atlas_asset_systems', 'atlas_asset_systems_delete', 'DELETE', '{authenticated}', 'atlas_asset_inventory_can_manage(tenant_id)', null),
  ('atlas_asset_systems', 'atlas_asset_systems_insert', 'INSERT', '{authenticated}', null, 'atlas_asset_inventory_can_manage(tenant_id)'),
  ('atlas_asset_systems', 'atlas_asset_systems_select', 'SELECT', '{authenticated}', 'atlas_asset_inventory_can_read(tenant_id)', null),
  ('atlas_asset_systems', 'atlas_asset_systems_update', 'UPDATE', '{authenticated}', 'atlas_asset_inventory_can_manage(tenant_id)', 'atlas_asset_inventory_can_manage(tenant_id)'),
  ('atlas_contract_budgets', 'atlas_contract_budgets_delete', 'DELETE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', null),
  ('atlas_contract_budgets', 'atlas_contract_budgets_insert', 'INSERT', '{authenticated}', null, 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_contract_budgets', 'atlas_contract_budgets_select', 'SELECT', '{authenticated}', 'atlas_contract_catalog_can_read(tenant_id)', null),
  ('atlas_contract_budgets', 'atlas_contract_budgets_update', 'UPDATE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_contract_catalog', 'atlas_contract_catalog_delete', 'DELETE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', null),
  ('atlas_contract_catalog', 'atlas_contract_catalog_insert', 'INSERT', '{authenticated}', null, 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_contract_catalog', 'atlas_contract_catalog_select', 'SELECT', '{authenticated}', 'atlas_contract_catalog_can_read(tenant_id)', null),
  ('atlas_contract_catalog', 'atlas_contract_catalog_update', 'UPDATE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_delete', 'DELETE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', null),
  ('atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_insert', 'INSERT', '{authenticated}', null, 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_select', 'SELECT', '{authenticated}', 'atlas_contract_catalog_can_read(tenant_id)', null),
  ('atlas_contract_sla_profiles', 'atlas_contract_sla_profiles_update', 'UPDATE', '{authenticated}', 'atlas_contract_catalog_can_manage(tenant_id)', 'atlas_contract_catalog_can_manage(tenant_id)'),
  ('atlas_inventory_items', 'atlas_inventory_items_delete', 'DELETE', '{authenticated}', 'atlas_asset_inventory_can_manage(tenant_id)', null),
  ('atlas_inventory_items', 'atlas_inventory_items_insert', 'INSERT', '{authenticated}', null, 'atlas_asset_inventory_can_manage(tenant_id)'),
  ('atlas_inventory_items', 'atlas_inventory_items_select', 'SELECT', '{authenticated}', 'atlas_asset_inventory_can_read(tenant_id)', null),
  ('atlas_inventory_items', 'atlas_inventory_items_update', 'UPDATE', '{authenticated}', 'atlas_asset_inventory_can_manage(tenant_id)', 'atlas_asset_inventory_can_manage(tenant_id)'),
  ('atlas_material_catalog', 'atlas_material_catalog_delete', 'DELETE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', null),
  ('atlas_material_catalog', 'atlas_material_catalog_insert', 'INSERT', '{authenticated}', null, 'atlas_operational_catalog_can_manage(tenant_id)'),
  ('atlas_material_catalog', 'atlas_material_catalog_select', 'SELECT', '{authenticated}', 'atlas_operational_catalog_can_read(tenant_id)', null),
  ('atlas_material_catalog', 'atlas_material_catalog_update', 'UPDATE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', 'atlas_operational_catalog_can_manage(tenant_id)'),
  ('atlas_operator_sectors', 'atlas_operator_sectors_delete', 'DELETE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', null),
  ('atlas_operator_sectors', 'atlas_operator_sectors_insert', 'INSERT', '{authenticated}', null, 'atlas_operational_catalog_can_manage(tenant_id)'),
  ('atlas_operator_sectors', 'atlas_operator_sectors_select', 'SELECT', '{authenticated}', 'atlas_operational_catalog_can_read(tenant_id)', null),
  ('atlas_operator_sectors', 'atlas_operator_sectors_update', 'UPDATE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', 'atlas_operational_catalog_can_manage(tenant_id)'),
  ('atlas_operators', 'atlas_operators_delete', 'DELETE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', null),
  ('atlas_operators', 'atlas_operators_insert', 'INSERT', '{authenticated}', null, 'atlas_operational_catalog_can_manage(tenant_id)'),
  ('atlas_operators', 'atlas_operators_select', 'SELECT', '{authenticated}', 'atlas_operational_catalog_can_read(tenant_id)', null),
  ('atlas_operators', 'atlas_operators_update', 'UPDATE', '{authenticated}', 'atlas_operational_catalog_can_manage(tenant_id)', 'atlas_operational_catalog_can_manage(tenant_id)');

-- Preflight: exact exported relations, columns and risky objects.
do $$
declare
  item record;
  actual_kind "char";
  missing_columns text;
  unexpected text;
  policy_row record;
  actual_roles text[];
  actual_using text;
  actual_check text;
  expected_command "char";
  hardening_present boolean;
begin
  select pg_catalog.string_agg(
    format('%I.%I', actual.schema_name, actual.table_name),
    ', '
    order by actual.schema_name, actual.table_name
  )
    into unexpected
  from (
    select n.nspname as schema_name, c.relname as table_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage')
      and c.relkind in ('r', 'p')
  ) actual
  where not exists (
    select 1
    from atlas_security_expected_rls expected
    where expected.schema_name = actual.schema_name
      and expected.table_name = actual.table_name
  );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: tables absent from current-rls-status.csv found: %', unexpected;
  end if;

  select pg_catalog.string_agg(
    format(
      '%I.%I expected enabled=%s forced=%s, actual enabled=%s forced=%s',
      expected.schema_name,
      expected.table_name,
      expected.rls_enabled,
      expected.rls_forced,
      c.relrowsecurity,
      c.relforcerowsecurity
    ),
    '; '
    order by expected.schema_name, expected.table_name
  )
    into unexpected
  from atlas_security_expected_rls expected
  left join pg_catalog.pg_namespace n
    on n.nspname = expected.schema_name
  left join pg_catalog.pg_class c
    on c.relnamespace = n.oid
   and c.relname = expected.table_name
   and c.relkind in ('r', 'p')
  where c.oid is null
    or c.relforcerowsecurity <> expected.rls_forced
    or (
      expected.rls_enabled
      and not c.relrowsecurity
    )
    or (
      not expected.rls_enabled
      and c.relrowsecurity
      and not (
        expected.schema_name = 'public'
        and exists (
          select 1
          from atlas_security_expected_tables managed
          where managed.table_name = expected.table_name
        )
      )
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: current-rls-status.csv mismatch: %', unexpected;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and p.polname like 'atlas_rls_%'
  ) then
    select pg_catalog.md5(
      pg_catalog.string_agg(
        pg_catalog.concat_ws(
          pg_catalog.chr(31),
          policies.schemaname,
          policies.tablename,
          policies.policyname,
          policies.permissive,
          policies.roles::text,
          policies.cmd,
          coalesce(replace(policies.qual, pg_catalog.chr(13), ''), '<NULL>'),
          coalesce(replace(policies.with_check, pg_catalog.chr(13), ''), '<NULL>')
        ),
        pg_catalog.chr(30)
        order by policies.schemaname, policies.tablename, policies.policyname
      )
    )
      into unexpected
    from pg_catalog.pg_policies policies
    where policies.schemaname in ('public', 'storage');

    if unexpected is distinct from '62481f1f902622eb4d902d2ed3a02ecf' then
      raise exception 'ATLAS security preflight: current-policies.csv exact fingerprint mismatch (actual %)', unexpected;
    end if;
  else
    select pg_catalog.md5(
      pg_catalog.string_agg(
        pg_catalog.concat_ws(
          pg_catalog.chr(31),
          policies.schemaname,
          policies.tablename,
          policies.policyname,
          policies.permissive,
          policies.roles::text,
          policies.cmd,
          coalesce(replace(policies.qual, pg_catalog.chr(13), ''), '<NULL>'),
          coalesce(replace(policies.with_check, pg_catalog.chr(13), ''), '<NULL>')
        ),
        pg_catalog.chr(30)
        order by policies.schemaname, policies.tablename, policies.policyname
      )
    )
      into unexpected
    from pg_catalog.pg_policies policies
    join atlas_security_expected_policy_names documented
      on documented.schema_name = policies.schemaname
     and documented.table_name = policies.tablename
     and documented.policy_name = policies.policyname
    where not exists (
      select 1
      from atlas_security_bad_policies removable
      where policies.schemaname = 'public'
        and removable.table_name = policies.tablename
        and removable.policy_name = policies.policyname
    )
      and not (
        policies.schemaname = 'storage'
        and policies.tablename = 'objects'
        and policies.policyname = 'ticket attachments read authenticated'
      );

    if unexpected is distinct from '2917374b257bd8008cb5473362fc0a4f' then
      raise exception 'ATLAS security preflight: retained current-policies.csv fingerprint mismatch (actual %)', unexpected;
    end if;
  end if;

  for item in select * from atlas_security_expected_tables order by table_name
  loop
    select c.relkind
      into actual_kind
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = item.table_name;

    if actual_kind is null then
      raise exception 'ATLAS security preflight: expected table public.% is missing', item.table_name;
    end if;

    if actual_kind not in ('r', 'p') then
      raise exception 'ATLAS security preflight: public.% has unexpected relkind %', item.table_name, actual_kind;
    end if;
  end loop;

  for item in select * from atlas_security_expected_views order by view_name
  loop
    select c.relkind
      into actual_kind
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = item.view_name;

    if actual_kind is null then
      raise exception 'ATLAS security preflight: expected view public.% is missing', item.view_name;
    end if;

    if actual_kind <> 'v' then
      raise exception 'ATLAS security preflight: public.% has unexpected relkind %', item.view_name, actual_kind;
    end if;
  end loop;

  select pg_catalog.string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by c.relname)
    into unexpected
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
    and not ('security_invoker=true' = any(coalesce(c.reloptions, array[]::text[])))
    and not exists (
      select 1
      from pg_catalog.pg_depend d
      where d.classid = 'pg_class'::regclass
        and d.objid = c.oid
        and d.deptype = 'e'
    )
    and not exists (
      select 1
      from atlas_security_expected_views expected
      where expected.view_name = c.relname
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: unexported SECURITY DEFINER views found: %', unexpected;
  end if;

  select pg_catalog.string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by c.relname)
    into unexpected
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity
    and not exists (
      select 1
      from pg_catalog.pg_depend d
      where d.classid = 'pg_class'::regclass
        and d.objid = c.oid
        and d.deptype = 'e'
    )
    and not exists (
      select 1
      from atlas_security_expected_tables expected
      where expected.table_name = c.relname
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: unexported public tables without RLS found: %', unexpected;
  end if;

  select pg_catalog.string_agg(format('%I.%I', t.table_name, required.column_name), ', ' order by t.table_name, required.column_name)
    into missing_columns
  from atlas_security_expected_tables t
  cross join lateral (
    select 'tenant_id'::text as column_name
    where t.access_model not in (
      'permissions',
      'role_permissions',
      'tenant_user_scopes',
      'user_permission_overrides',
      'tenants',
      'ticket_child',
      'service_role_only'
    )
  ) required
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = t.table_name
      and c.column_name = required.column_name
  );

  if missing_columns is not null then
    raise exception 'ATLAS security preflight: required tenant columns are missing: %', missing_columns;
  end if;

  for item in
    select *
    from (
      values
        ('customer_entities', 'id'),
        ('customer_assets', 'customer_id'),
        ('customer_assets', 'site_id'),
        ('manuals', 'customer_id'),
        ('manuals', 'customer_entity_id'),
        ('roles', 'id'),
        ('roles', 'tenant_id'),
        ('role_permissions', 'role_id'),
        ('tenant_users', 'id'),
        ('tenant_users', 'user_id'),
        ('tenant_users', 'status'),
        ('tenant_users', 'role_id'),
        ('tenant_users', 'role'),
        ('tenant_users', 'customer_id'),
        ('tenant_users', 'customer_entity_id'),
        ('tenant_users', 'site_id'),
        ('tenant_user_scopes', 'tenant_user_id'),
        ('user_permission_overrides', 'tenant_user_id'),
        ('ticket_attachments', 'ticket_id'),
        ('ticket_communications', 'ticket_id'),
        ('ticket_events', 'ticket_id'),
        ('work_orders', 'id'),
        ('work_orders', 'customer_id'),
        ('work_orders', 'site_id'),
        ('work_orders', 'customer_entity_id'),
        ('work_orders', 'is_customer_visible'),
        ('work_order_activities', 'work_order_id'),
        ('work_order_activities', 'is_customer_visible'),
        ('work_order_checklist_items', 'work_order_id'),
        ('work_order_internal_notes', 'work_order_id'),
        ('work_order_materials', 'work_order_id'),
        ('work_order_materials', 'is_customer_visible'),
        ('work_order_signatures', 'work_order_id'),
        ('work_order_versions', 'work_order_id')
    ) as required(table_name, column_name)
  loop
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = item.table_name
        and c.column_name = item.column_name
    ) then
      raise exception 'ATLAS security preflight: required column public.%.% is missing', item.table_name, item.column_name;
    end if;
  end loop;

  if to_regclass('public.tickets') is null then
    raise exception 'ATLAS security preflight: required dependency public.tickets is missing';
  end if;

  for item in
    select *
    from (
      values
        ('tickets', 'id'),
        ('tickets', 'tenant_id'),
        ('tickets', 'customer_id'),
        ('tickets', 'site_id')
    ) as required(table_name, column_name)
  loop
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = item.table_name
        and c.column_name = item.column_name
    ) then
      raise exception 'ATLAS security preflight: required dependency column public.%.% is missing', item.table_name, item.column_name;
    end if;
  end loop;

  select pg_catalog.string_agg(format('%I.%I:%I', n.nspname, c.relname, p.polname), ', ' order by c.relname, p.polname)
    into unexpected
  from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and p.polcmd in ('*', 'a', 'w', 'd')
    and (
      pg_catalog.btrim(coalesce(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '')) = 'true'
      or pg_catalog.btrim(coalesce(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '')) = 'true'
    )
    and not exists (
      select 1
      from atlas_security_bad_policies expected
      where expected.table_name = c.relname
        and expected.policy_name = p.polname
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: unexported permissive mutation policies found: %', unexpected;
  end if;

  select pg_catalog.string_agg(
    format('%I.%I:%I', n.nspname, c.relname, p.polname),
    ', '
    order by n.nspname, c.relname, p.polname
  )
    into unexpected
  from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
    and not exists (
      select 1
      from atlas_security_expected_policy_names expected
      where expected.schema_name = n.nspname
        and expected.table_name = c.relname
        and expected.policy_name = p.polname
    )
    and not (
      n.nspname = 'public'
      and exists (
        select 1
        from atlas_security_expected_tables managed
        where managed.table_name = c.relname
      )
      and p.polname in (
        'atlas_rls_' || c.relname || '_sel',
        'atlas_rls_' || c.relname || '_ins',
        'atlas_rls_' || c.relname || '_upd',
        'atlas_rls_' || c.relname || '_del'
      )
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: policies absent from current-policies.csv found: %', unexpected;
  end if;

  select pg_catalog.string_agg(
    format('%I.%I:%I', expected.schema_name, expected.table_name, expected.policy_name),
    ', '
    order by expected.schema_name, expected.table_name, expected.policy_name
  )
    into unexpected
  from atlas_security_expected_policy_names expected
  where not exists (
    select 1
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = expected.schema_name
      and c.relname = expected.table_name
      and p.polname = expected.policy_name
  )
    and not (
      expected.schema_name = 'public'
      and exists (
        select 1
        from atlas_security_bad_policies removable
        where removable.table_name = expected.table_name
          and removable.policy_name = expected.policy_name
      )
      and (
        exists (
          select 1
          from atlas_security_expected_tables managed
          where managed.table_name = expected.table_name
            and managed.access_model = 'service_role_only'
        )
        or exists (
          select 1
          from pg_catalog.pg_policy replacement
          join pg_catalog.pg_class replacement_table on replacement_table.oid = replacement.polrelid
          join pg_catalog.pg_namespace replacement_schema on replacement_schema.oid = replacement_table.relnamespace
          where replacement_schema.nspname = 'public'
            and replacement_table.relname = expected.table_name
            and replacement.polname = 'atlas_rls_' || expected.table_name || '_sel'
        )
      )
    )
    and not (
      expected.schema_name = 'storage'
      and expected.table_name = 'objects'
      and expected.policy_name = 'ticket attachments read authenticated'
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: documented policies are missing: %', unexpected;
  end if;

  select pg_catalog.string_agg(
    format('%I.%I', expected.table_name, expected.policy_name),
    ', '
    order by expected.table_name, expected.policy_name
  )
    into unexpected
  from atlas_security_preserved_policy_definitions expected
  left join pg_catalog.pg_policies actual
    on actual.schemaname = 'public'
   and actual.tablename = expected.table_name
   and actual.policyname = expected.policy_name
  where actual.policyname is null
    or actual.permissive <> 'PERMISSIVE'
    or actual.cmd <> expected.command_name
    or actual.roles::text <> expected.roles_text
    or actual.qual is distinct from expected.using_expression
    or actual.with_check is distinct from expected.check_expression;

  if unexpected is not null then
    raise exception 'ATLAS security preflight: protected catalog policies differ from current-policies.csv: %', unexpected;
  end if;

  select pg_catalog.string_agg(format('%I.%I:%I', n.nspname, c.relname, p.polname), ', ' order by c.relname, p.polname)
    into unexpected
  from pg_catalog.pg_policy p
  join pg_catalog.pg_class c on c.oid = p.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and exists (
      select 1
      from atlas_security_expected_tables expected
      where expected.table_name = c.relname
    )
    and not exists (
      select 1
      from atlas_security_bad_policies expected
      where expected.table_name = c.relname
        and expected.policy_name = p.polname
    )
    and not exists (
      select 1
      from atlas_security_expected_policy_names documented
      where documented.schema_name = 'public'
        and documented.table_name = c.relname
        and documented.policy_name = p.polname
    )
    and p.polname not in (
      'atlas_rls_' || c.relname || '_sel',
      'atlas_rls_' || c.relname || '_ins',
      'atlas_rls_' || c.relname || '_upd',
      'atlas_rls_' || c.relname || '_del'
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: managed-table policy is neither documented nor migration-owned: %', unexpected;
  end if;

  for item in select * from atlas_security_bad_policies order by table_name, policy_name
  loop
    select p.*,
      pg_catalog.pg_get_expr(p.polqual, p.polrelid) as using_expression,
      pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) as check_expression
      into policy_row
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = item.table_name
      and p.polname = item.policy_name;

    select exists (
      select 1
      from pg_catalog.pg_policy p
      join pg_catalog.pg_class c on c.oid = p.polrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = item.table_name
        and p.polname = 'atlas_rls_' || item.table_name || '_sel'
    ) into hardening_present;

    if policy_row.polname is null then
      if not hardening_present then
        raise exception 'ATLAS security preflight: exported policy public.%/% is missing and no hardened replacement exists',
          item.table_name,
          item.policy_name;
      end if;
      continue;
    end if;

    expected_command := case item.command_name
      when 'ALL' then '*'
      when 'SELECT' then 'r'
      when 'INSERT' then 'a'
      when 'UPDATE' then 'w'
      when 'DELETE' then 'd'
      else null
    end;

    select pg_catalog.array_agg(
      case when role_oid = 0 then 'public' else pg_catalog.pg_get_userbyid(role_oid) end
      order by role_oid
    )
      into actual_roles
    from pg_catalog.unnest(policy_row.polroles) role_oid;

    actual_using := pg_catalog.btrim(coalesce(policy_row.using_expression, ''));
    actual_check := pg_catalog.btrim(coalesce(policy_row.check_expression, ''));

    if policy_row.polcmd <> expected_command
      or not (item.expected_role = any(actual_roles))
      or (item.expected_using_true and actual_using <> 'true')
      or (not item.expected_using_true and actual_using = 'true')
      or (item.expected_check_true and actual_check <> 'true')
      or (not item.expected_check_true and actual_check = 'true')
    then
      raise exception 'ATLAS security preflight: exported policy public.%/% no longer matches the CSV snapshot',
        item.table_name,
        item.policy_name;
    end if;
  end loop;

  select pg_catalog.string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
    into unexpected
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and (
      pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
    and not (
      p.oid in (
        to_regprocedure('public.rebuild_ticket_entity_links(uuid)'),
        to_regprocedure('public.atlas_contract_budget_validate_contract()'),
        to_regprocedure('public.atlas_contract_catalog_can_manage(uuid)'),
        to_regprocedure('public.atlas_contract_catalog_can_read(uuid)'),
        to_regprocedure('public.atlas_contract_catalog_current_role(uuid)'),
        to_regprocedure('public.atlas_operational_catalog_can_manage(uuid)'),
        to_regprocedure('public.atlas_operational_catalog_can_read(uuid)'),
        to_regprocedure('public.atlas_operational_catalog_current_role(uuid)'),
        to_regprocedure('public.atlas_operational_catalog_validate_operator_user()'),
        to_regprocedure('public.atlas_asset_inventory_can_manage(uuid)'),
        to_regprocedure('public.atlas_asset_inventory_can_read(uuid)'),
        to_regprocedure('public.atlas_asset_inventory_current_role(uuid)'),
        to_regprocedure('public.atlas_asset_systems_validate_tenant_refs()')
      )
    )
    and not exists (
      select 1
      from pg_catalog.pg_depend d
      where d.classid = 'pg_proc'::regclass
        and d.objid = p.oid
        and d.deptype = 'e'
    );

  if unexpected is not null then
    raise exception 'ATLAS security preflight: unexported executable SECURITY DEFINER functions found: %', unexpected;
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'ticket-attachments'
      and name = 'ticket-attachments'
      and public = true
  ) then
    raise exception 'ATLAS security preflight: exported public bucket ticket-attachments is missing or changed';
  end if;

  select pg_catalog.string_agg(p.polname, ', ' order by p.polname)
    into unexpected
  from pg_catalog.pg_policy p
  where p.polrelid = 'storage.objects'::regclass
    and p.polcmd = 'r'
    and (
      coalesce(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '') ilike '%ticket-attachments%'
      or p.polname = 'ticket attachments read authenticated'
    )
    and p.polname <> 'ticket attachments read authenticated';

  if unexpected is not null then
    raise exception 'ATLAS storage preflight: unexported ticket-attachments SELECT policies found: %', unexpected;
  end if;

  with risky_object_grants as (
    select
      n.nspname as schema_name,
      case when c.relkind = 'v' then 'view' else 'table' end as object_type,
      c.relname as object_name,
      role_name as grantee,
      privilege_name as privilege_type
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) as roles(role_name)
    cross join (
      values
        ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
        ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')
    ) as privileges(privilege_name)
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v')
      and pg_catalog.has_table_privilege(role_name, c.oid, privilege_name)
      and (
        role_name = 'anon'
        or (
          role_name = 'authenticated'
          and privilege_name in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
        )
        or (
          c.relkind = 'v'
          and role_name = 'authenticated'
          and privilege_name in ('INSERT', 'UPDATE', 'DELETE')
        )
      )
    union all
    select
      n.nspname as schema_name,
      'sequence' as object_type,
      c.relname as object_name,
      'anon' as grantee,
      privilege_name as privilege_type
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('USAGE'), ('SELECT'), ('UPDATE')) as privileges(privilege_name)
    where n.nspname = 'public'
      and c.relkind = 'S'
      and pg_catalog.has_sequence_privilege('anon', c.oid, privilege_name)
  )
  select pg_catalog.md5(
    pg_catalog.string_agg(
      pg_catalog.concat_ws(
        pg_catalog.chr(31),
        schema_name,
        object_type,
        object_name,
        grantee,
        privilege_type
      ),
      pg_catalog.chr(30)
      order by schema_name, object_type, object_name, grantee, privilege_type
    )
  )
    into unexpected
  from risky_object_grants;

  if unexpected is not null
    and unexpected not in (
      '65c8fb0c7e84b06c57a755923017d52b',
      -- The local production baseline SQL contains 32 extra anon
      -- MAINTAIN/REFERENCES/TRIGGER/TRUNCATE grants on the eight
      -- tenant-scoped catalog/inventory tables. They are accepted as
      -- a second exact preflight state and revoked below.
      '2ed123a5564ed4919135acc78b42af40'
    )
  then
    raise exception 'ATLAS grant preflight: current-object-grants.csv risky fingerprint mismatch (actual %)', unexpected;
  end if;

  with risky_default_privileges as (
    select
      owner_role.rolname as owner_role,
      n.nspname as schema_name,
      d.defaclobjtype::text as object_type_code,
      case when acl.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(acl.grantee) end as grantee,
      acl.privilege_type::text as privilege_type
    from pg_catalog.pg_default_acl d
    join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
    join pg_catalog.pg_roles owner_role on owner_role.oid = d.defaclrole
    cross join lateral pg_catalog.aclexplode(d.defaclacl) acl
    where n.nspname = 'public'
      and (
        case when acl.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(acl.grantee) end = 'anon'
        or (
          case when acl.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(acl.grantee) end = 'authenticated'
          and d.defaclobjtype = 'r'
          and acl.privilege_type::text in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
        )
        or (
          case when acl.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(acl.grantee) end = 'authenticated'
          and d.defaclobjtype = 'f'
          and acl.privilege_type::text = 'EXECUTE'
        )
      )
  )
  select pg_catalog.md5(
    pg_catalog.string_agg(
      pg_catalog.concat_ws(
        pg_catalog.chr(31),
        owner_role,
        schema_name,
        object_type_code,
        grantee,
        privilege_type
      ),
      pg_catalog.chr(30)
      order by owner_role, schema_name, object_type_code, grantee, privilege_type
    )
  )
    into unexpected
  from risky_default_privileges;

  if unexpected is not null
    and unexpected not in (
      '0803e44c19f997034bd08d92cc8180c7',
      -- The local production baseline SQL also contains the same risky
      -- public defaults owned by supabase_admin. They are accepted as a
      -- second exact preflight state; the migration role cannot alter
      -- another role's default privileges, so this remains separately
      -- audited instead of being silently ignored.
      '4495f7ff70d8272c3e1f0043a5555b7a'
    )
  then
    raise exception 'ATLAS grant preflight: current-default-privileges.csv risky fingerprint mismatch (actual %)', unexpected;
  end if;
end
$$;

-- Private, non-PostgREST helper schema. SECURITY DEFINER is required here to
-- inspect tenant_users without recursive RLS evaluation.
create schema if not exists atlas_security;
revoke all on schema atlas_security from public, anon;
grant usage on schema atlas_security to authenticated;

create or replace function atlas_security.active_role(target_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.lower(coalesce(r.key, tu.role, ''))
  from public.tenant_users tu
  left join public.roles r on r.id = tu.role_id
  where tu.tenant_id = target_tenant_id
    and tu.user_id = auth.uid()
    and tu.status = 'active'
  order by
    case pg_catalog.lower(coalesce(r.key, tu.role, ''))
      when 'super_admin' then 1
      when 'admin' then 2
      when 'manager' then 3
      when 'dispatcher' then 4
      when 'tecnico' then 5
      when 'commerciale' then 6
      when 'cliente_admin' then 7
      when 'cliente_user' then 8
      else 99
    end
  limit 1;
$$;

create or replace function atlas_security.is_active_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = target_tenant_id
      and tu.user_id = auth.uid()
      and tu.status = 'active'
  );
$$;

create or replace function atlas_security.is_internal(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select atlas_security.active_role(target_tenant_id) = any(
    array['super_admin', 'admin', 'manager', 'dispatcher', 'tecnico', 'commerciale']
  );
$$;

create or replace function atlas_security.can_manage(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select atlas_security.active_role(target_tenant_id) = any(
    array['super_admin', 'admin', 'manager']
  );
$$;

create or replace function atlas_security.is_admin(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select atlas_security.active_role(target_tenant_id) = any(
    array['super_admin', 'admin']
  );
$$;

create or replace function atlas_security.current_customer_id(target_tenant_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select tu.customer_id
  from public.tenant_users tu
  where tu.tenant_id = target_tenant_id
    and tu.user_id = auth.uid()
    and tu.status = 'active'
  order by tu.updated_at desc nulls last, tu.created_at desc nulls last
  limit 1;
$$;

create or replace function atlas_security.current_site_id(target_tenant_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select tu.site_id
  from public.tenant_users tu
  where tu.tenant_id = target_tenant_id
    and tu.user_id = auth.uid()
    and tu.status = 'active'
  order by tu.updated_at desc nulls last, tu.created_at desc nulls last
  limit 1;
$$;

create or replace function atlas_security.current_customer_entity_id(target_tenant_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select tu.customer_entity_id
  from public.tenant_users tu
  where tu.tenant_id = target_tenant_id
    and tu.user_id = auth.uid()
    and tu.status = 'active'
  order by tu.updated_at desc nulls last, tu.created_at desc nulls last
  limit 1;
$$;

create or replace function atlas_security.can_read_ticket(target_ticket_id bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.tickets t
    where t.id = target_ticket_id
      and (
        atlas_security.is_internal(t.tenant_id)
        or t.customer_id = atlas_security.current_customer_id(t.tenant_id)
      )
  );
$$;

create or replace function atlas_security.can_write_ticket(target_ticket_id bigint)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.tickets t
    where t.id = target_ticket_id
      and atlas_security.is_internal(t.tenant_id)
  );
$$;

create or replace function atlas_security.can_read_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.work_orders wo
    where wo.id = target_work_order_id
      and (
        atlas_security.is_internal(wo.tenant_id)
        or (
          wo.is_customer_visible
          and (
            wo.customer_id = atlas_security.current_customer_id(wo.tenant_id)
            or wo.customer_entity_id = atlas_security.current_customer_entity_id(wo.tenant_id)
          )
        )
      )
  );
$$;

create or replace function atlas_security.can_write_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.work_orders wo
    where wo.id = target_work_order_id
      and atlas_security.is_internal(wo.tenant_id)
  );
$$;

revoke all on all functions in schema atlas_security from public, anon;
grant execute on all functions in schema atlas_security to authenticated;

-- Lock the mutable search_path functions reported by the export.
do $$
declare
  function_name text;
  function_count integer;
  function_oid oid;
begin
  foreach function_name in array array[
    'current_tenant_id',
    'normalize_customer_alias',
    'rebuild_ticket_entity_links',
    'set_updated_at'
  ]
  loop
    select count(*), min(p.oid::bigint)::oid
      into function_count, function_oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = function_name;

    if function_count <> 1 then
      raise exception 'ATLAS function preflight: expected one public.% overload, found %', function_name, function_count;
    end if;

    execute format(
      'alter function %s set search_path = pg_catalog, public',
      function_oid::regprocedure
    );
  end loop;
end
$$;

-- RPC hardening from the executable SECURITY DEFINER findings.
do $$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.rebuild_ticket_entity_links(uuid)',
    'public.atlas_contract_budget_validate_contract()',
    'public.atlas_operational_catalog_validate_operator_user()',
    'public.atlas_asset_systems_validate_tenant_refs()'
  ]
  loop
    if to_regprocedure(function_signature) is null then
      raise exception 'ATLAS function preflight: expected function % is missing', function_signature;
    end if;

    execute format(
      'revoke all on function %s from public, anon, authenticated',
      to_regprocedure(function_signature)::regprocedure
    );
    execute format(
      'grant execute on function %s to service_role',
      to_regprocedure(function_signature)::regprocedure
    );
  end loop;

  foreach function_signature in array array[
    'public.atlas_contract_catalog_can_manage(uuid)',
    'public.atlas_contract_catalog_can_read(uuid)',
    'public.atlas_contract_catalog_current_role(uuid)',
    'public.atlas_operational_catalog_can_manage(uuid)',
    'public.atlas_operational_catalog_can_read(uuid)',
    'public.atlas_operational_catalog_current_role(uuid)',
    'public.atlas_asset_inventory_can_manage(uuid)',
    'public.atlas_asset_inventory_can_read(uuid)',
    'public.atlas_asset_inventory_current_role(uuid)'
  ]
  loop
    if to_regprocedure(function_signature) is null then
      raise exception 'ATLAS function preflight: expected function % is missing', function_signature;
    end if;

    execute format(
      'alter function %s security invoker',
      to_regprocedure(function_signature)::regprocedure
    );
    execute format(
      'revoke all on function %s from public, anon',
      to_regprocedure(function_signature)::regprocedure
    );
    execute format(
      'grant execute on function %s to authenticated',
      to_regprocedure(function_signature)::regprocedure
    );
    execute format(
      'grant execute on function %s to service_role',
      to_regprocedure(function_signature)::regprocedure
    );
  end loop;
end
$$;

-- Grant hardening reconciled with current-object-grants.csv and
-- current-default-privileges.csv. service_role/postgres grants are preserved.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;

do $$
declare
  item record;
begin
  for item in select * from atlas_security_expected_views order by view_name
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger, maintain on table public.%I from authenticated',
      item.view_name
    );
  end loop;
end
$$;

alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke truncate, references, trigger, maintain on tables from authenticated;

-- Only the exact permissive policies named by the CSV are removed.
do $$
declare
  item record;
begin
  for item in select * from atlas_security_bad_policies order by table_name, policy_name
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      item.policy_name,
      item.table_name
    );
  end loop;
end
$$;

-- RLS is enabled only on the exact table inventory exported by the linter.
do $$
declare
  item record;
  policy_prefix text;
begin
  for item in select * from atlas_security_expected_tables order by table_name
  loop
    execute format('alter table public.%I enable row level security', item.table_name);

    policy_prefix := 'atlas_rls_' || item.table_name;
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_sel', item.table_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_ins', item.table_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_upd', item.table_name);
    execute format('drop policy if exists %I on public.%I', policy_prefix || '_del', item.table_name);

    case item.access_model
      when 'internal' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_internal(tenant_id)) with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'admin' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_admin(tenant_id)) with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'customer_entity' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_internal(tenant_id) or id = atlas_security.current_customer_entity_id(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_internal(tenant_id)) with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'customer_asset' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_internal(tenant_id) or customer_id = atlas_security.current_customer_id(tenant_id) or site_id = atlas_security.current_site_id(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_internal(tenant_id)) with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'manual' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_internal(tenant_id) or customer_id = atlas_security.current_customer_id(tenant_id) or customer_entity_id = atlas_security.current_customer_entity_id(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_internal(tenant_id)) with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'registration' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_admin(tenant_id)) with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'permissions' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (auth.uid() is not null)',
          policy_prefix || '_sel',
          item.table_name
        );

      when 'tenants' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_active_member(id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_admin(id)) with check (atlas_security.is_admin(id))',
          policy_prefix || '_upd',
          item.table_name
        );

      when 'roles' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_active_member(tenant_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_admin(tenant_id)) with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'role_permissions' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.roles r where r.id = role_permissions.role_id and atlas_security.is_active_member(r.tenant_id)))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.roles r where r.id = role_permissions.role_id and atlas_security.is_admin(r.tenant_id)))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (exists (select 1 from public.roles r where r.id = role_permissions.role_id and atlas_security.is_admin(r.tenant_id))) with check (exists (select 1 from public.roles r where r.id = role_permissions.role_id and atlas_security.is_admin(r.tenant_id)))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.roles r where r.id = role_permissions.role_id and atlas_security.is_admin(r.tenant_id)))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'tenant_users' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (user_id = auth.uid() or atlas_security.can_manage(tenant_id) or (atlas_security.active_role(tenant_id) = ''cliente_admin'' and customer_id = atlas_security.current_customer_id(tenant_id)))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_admin(tenant_id)) with check (atlas_security.is_admin(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );

      when 'tenant_user_scopes' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = tenant_user_scopes.tenant_user_id and (tu.user_id = auth.uid() or atlas_security.can_manage(tu.tenant_id))))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.tenant_users tu where tu.id = tenant_user_scopes.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = tenant_user_scopes.tenant_user_id and atlas_security.is_admin(tu.tenant_id))) with check (exists (select 1 from public.tenant_users tu where tu.id = tenant_user_scopes.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = tenant_user_scopes.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'user_permission_overrides' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = user_permission_overrides.tenant_user_id and (tu.user_id = auth.uid() or atlas_security.can_manage(tu.tenant_id))))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.tenant_users tu where tu.id = user_permission_overrides.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = user_permission_overrides.tenant_user_id and atlas_security.is_admin(tu.tenant_id))) with check (exists (select 1 from public.tenant_users tu where tu.id = user_permission_overrides.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.tenant_users tu where tu.id = user_permission_overrides.tenant_user_id and atlas_security.is_admin(tu.tenant_id)))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'ticket_child' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.can_read_ticket(ticket_id::bigint))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.can_write_ticket(ticket_id::bigint))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.can_write_ticket(ticket_id::bigint)) with check (atlas_security.can_write_ticket(ticket_id::bigint))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_write_ticket(ticket_id::bigint))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'work_order' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.is_internal(tenant_id) or (is_customer_visible and (customer_id = atlas_security.current_customer_id(tenant_id) or customer_entity_id = atlas_security.current_customer_entity_id(tenant_id))))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.is_internal(tenant_id)) with check (atlas_security.is_internal(tenant_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_manage(tenant_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'work_order_child' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.can_read_work_order(work_order_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.can_write_work_order(work_order_id)) with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'work_order_internal_child' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.can_write_work_order(work_order_id)) with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'work_order_visible_child' then
        execute format(
          'create policy %I on public.%I for select to authenticated using (atlas_security.can_write_work_order(work_order_id) or (is_customer_visible and atlas_security.can_read_work_order(work_order_id)))',
          policy_prefix || '_sel',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for insert to authenticated with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_ins',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for update to authenticated using (atlas_security.can_write_work_order(work_order_id)) with check (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_upd',
          item.table_name
        );
        execute format(
          'create policy %I on public.%I for delete to authenticated using (atlas_security.can_write_work_order(work_order_id))',
          policy_prefix || '_del',
          item.table_name
        );

      when 'service_role_only' then
        null;

      else
        raise exception 'ATLAS security migration: unsupported access model % for public.%', item.access_model, item.table_name;
    end case;
  end loop;
end
$$;

-- Views keep their definitions and grants, but execute with the caller's RLS.
do $$
declare
  item record;
begin
  for item in select * from atlas_security_expected_views order by view_name
  loop
    execute format('alter view public.%I set (security_invoker = true)', item.view_name);
  end loop;
end
$$;

-- Storage is audited separately. The bucket remains public in this migration
-- to preserve the existing file_url/getPublicUrl flow, but broad listing is
-- removed. A later application change should move it to signed URLs.
do $$
declare
  policy_row record;
  policy_roles text[];
begin
  select p.*
    into policy_row
  from pg_catalog.pg_policy p
  where p.polrelid = 'storage.objects'::regclass
    and p.polname = 'ticket attachments read authenticated';

  if policy_row.polname is not null then
    select pg_catalog.array_agg(
      case when role_oid = 0 then 'public' else pg_catalog.pg_get_userbyid(role_oid) end
      order by role_oid
    )
      into policy_roles
    from pg_catalog.unnest(policy_row.polroles) role_oid;

    if policy_row.polcmd <> 'r'
      or not ('authenticated' = any(policy_roles))
    then
      raise exception 'ATLAS storage preflight: ticket attachments read authenticated no longer matches the CSV snapshot';
    end if;

    drop policy "ticket attachments read authenticated" on storage.objects;
  end if;
end
$$;

commit;

/*
Manual rollback
===============

This rollback restores the exact insecure states named by the three CSV
exports. Run only during an emergency and only after taking a fresh schema
backup. It intentionally does not change service_role.

begin;

-- Restore view owner execution behavior reported by the linter.
alter view public.atlas_user_permissions_view set (security_invoker = false);
alter view public.ticket_entity_links_debug set (security_invoker = false);
alter view public.v_customer_entities_active set (security_invoker = false);
alter view public.v_future_tickets set (security_invoker = false);
alter view public.v_operational_plan_progress set (security_invoker = false);
alter view public.v_operational_tickets set (security_invoker = false);

-- Remove hardened policies.
do $$
declare
  table_name text;
  suffix text;
begin
  foreach table_name in array array[
    'atlas_events','atlas_glpi_entities','budget','contract_profiles',
    'customer_aliases','customer_assets','customer_contract_links',
    'customer_entities','customer_entity_aliases','customer_entity_contracts',
    'customer_registration_codes','download_resources','glpi_import_errors',
    'glpi_import_runs','glpi_sync_state','glpi_ticket_mappings',
    'help_queries','manuals','materials','operational_plan_consumptions',
    'operational_plan_customers','operational_plan_events',
    'operational_plan_items','operational_plans','permissions',
    'role_permissions','roles','tenant_user_scopes','tenant_users','tenants',
    'ticket_attachments','ticket_communications','ticket_entity_links',
    'ticket_events','todo_tasks','user_permission_overrides',
    'work_order_activities','work_order_checklist_items',
    'work_order_internal_notes','work_order_materials',
    'work_order_number_sequences','work_order_report_templates',
    'work_order_signatures','work_order_templates','work_order_versions',
    'work_orders'
  ]
  loop
    foreach suffix in array array['sel', 'ins', 'upd', 'del']
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        'atlas_rls_' || table_name || '_' || suffix,
        table_name
      );
    end loop;
  end loop;
end
$$;

-- Restore the 19 permissive policies exactly as exported.
create policy "authenticated delete customer aliases" on public.customer_aliases for delete to authenticated using (true);
create policy "authenticated insert customer aliases" on public.customer_aliases for insert to authenticated with check (true);
create policy "authenticated update customer aliases" on public.customer_aliases for update to authenticated using (true) with check (true);
create policy download_resources_delete on public.download_resources for delete to public using (true);
create policy download_resources_insert on public.download_resources for insert to public with check (true);
create policy download_resources_update on public.download_resources for update to public using (true) with check (true);
create policy manuals_insert_authenticated on public.manuals for insert to authenticated with check (true);
create policy manuals_update_authenticated on public.manuals for update to authenticated using (true) with check (true);
create policy rbac_permissions_write on public.permissions for all to public using (true) with check (true);
create policy rbac_role_permissions_write on public.role_permissions for all to public using (true) with check (true);
create policy rbac_roles_write on public.roles for all to public using (true) with check (true);
create policy rbac_user_scopes_write on public.tenant_user_scopes for all to public using (true) with check (true);
create policy "Allow public insert tenant users" on public.tenant_users for insert to public with check (true);
create policy "ticket attachments table delete authenticated" on public.ticket_attachments for delete to authenticated using (true);
create policy "ticket attachments table insert authenticated" on public.ticket_attachments for insert to authenticated with check (true);
create policy "Allow public insert ticket events" on public.ticket_events for insert to public with check (true);
create policy todo_tasks_authenticated_insert on public.todo_tasks for insert to authenticated with check (true);
create policy todo_tasks_authenticated_update on public.todo_tasks for update to authenticated using (true) with check (true);
create policy rbac_user_overrides_write on public.user_permission_overrides for all to public using (true) with check (true);
create policy "authenticated read customer aliases" on public.customer_aliases for select to authenticated using (true);
create policy download_resources_select on public.download_resources for select to public using (true);
create policy "authenticated read glpi import errors" on public.glpi_import_errors for select to authenticated using (true);
create policy "authenticated read glpi import runs" on public.glpi_import_runs for select to authenticated using (true);
create policy "authenticated read glpi ticket mappings" on public.glpi_ticket_mappings for select to authenticated using (true);
create policy manuals_select_authenticated on public.manuals for select to authenticated using (true);
create policy rbac_role_permissions_read on public.role_permissions for select to public using (true);
create policy rbac_roles_read on public.roles for select to public using (true);
create policy rbac_user_scopes_read on public.tenant_user_scopes for select to public using (true);
create policy "Allow public read tenant users" on public.tenant_users for select to public using (true);
create policy "Allow public read tenants" on public.tenants for select to public using (true);
create policy "ticket attachments table read authenticated" on public.ticket_attachments for select to authenticated using (true);
create policy "Allow public read ticket events" on public.ticket_events for select to public using (true);
create policy todo_tasks_authenticated_select on public.todo_tasks for select to authenticated using (true);
create policy rbac_user_overrides_read on public.user_permission_overrides for select to public using (true);

-- Restore broad object/default grants exported by current-object-grants.csv and current-default-privileges.csv.
grant select, insert, update, delete, truncate, references, trigger, maintain on all tables in schema public to anon, authenticated;
grant usage, select, update on all sequences in schema public to anon, authenticated;
alter default privileges for role postgres in schema public grant select, insert, update, delete, truncate, references, trigger, maintain on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant usage, select, update on sequences to anon, authenticated;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated;

-- Restore the RLS-disabled state reported by security-errors.csv.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'atlas_glpi_entities','glpi_sync_state','customer_entities',
    'contract_profiles','ticket_entity_links','customer_entity_contracts',
    'customer_contract_links','atlas_events','help_queries',
    'work_order_checklist_items','work_orders','work_order_activities',
    'customer_registration_codes','customer_assets','ticket_communications',
    'work_order_templates','work_order_number_sequences',
    'work_order_internal_notes','work_order_materials',
    'work_order_signatures','work_order_versions','customer_entity_aliases',
    'operational_plans','operational_plan_customers',
    'operational_plan_items','operational_plan_consumptions',
    'operational_plan_events','work_order_report_templates'
  ]
  loop
    execute format('alter table public.%I disable row level security', table_name);
  end loop;
end
$$;

-- budget and materials had RLS enabled before this migration.

do $$
declare
  function_name text;
  function_oid oid;
begin
  foreach function_name in array array[
    'current_tenant_id',
    'normalize_customer_alias',
    'rebuild_ticket_entity_links',
    'set_updated_at'
  ]
  loop
    select p.oid
      into function_oid
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = function_name;

    execute format(
      'alter function %s reset search_path',
      function_oid::regprocedure
    );
  end loop;
end
$$;

alter function public.atlas_contract_catalog_can_manage(uuid) security definer;
alter function public.atlas_contract_catalog_can_read(uuid) security definer;
alter function public.atlas_contract_catalog_current_role(uuid) security definer;
alter function public.atlas_operational_catalog_can_manage(uuid) security definer;
alter function public.atlas_operational_catalog_can_read(uuid) security definer;
alter function public.atlas_operational_catalog_current_role(uuid) security definer;
alter function public.atlas_asset_inventory_can_manage(uuid) security definer;
alter function public.atlas_asset_inventory_can_read(uuid) security definer;
alter function public.atlas_asset_inventory_current_role(uuid) security definer;

grant execute on function public.rebuild_ticket_entity_links(uuid) to public;
grant execute on function public.atlas_contract_budget_validate_contract() to authenticated;
grant execute on function public.atlas_contract_catalog_can_manage(uuid) to authenticated;
grant execute on function public.atlas_contract_catalog_can_read(uuid) to authenticated;
grant execute on function public.atlas_contract_catalog_current_role(uuid) to authenticated;
grant execute on function public.atlas_operational_catalog_can_manage(uuid) to authenticated;
grant execute on function public.atlas_operational_catalog_can_read(uuid) to authenticated;
grant execute on function public.atlas_operational_catalog_current_role(uuid) to authenticated;
grant execute on function public.atlas_operational_catalog_validate_operator_user() to authenticated;
grant execute on function public.atlas_asset_inventory_can_manage(uuid) to authenticated;
grant execute on function public.atlas_asset_inventory_can_read(uuid) to authenticated;
grant execute on function public.atlas_asset_inventory_current_role(uuid) to authenticated;
grant execute on function public.atlas_asset_systems_validate_tenant_refs() to authenticated;

create policy "ticket attachments read authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'ticket-attachments');

drop function if exists atlas_security.can_write_work_order(uuid);
drop function if exists atlas_security.can_read_work_order(uuid);
drop function if exists atlas_security.can_write_ticket(bigint);
drop function if exists atlas_security.can_read_ticket(bigint);
drop function if exists atlas_security.current_customer_entity_id(uuid);
drop function if exists atlas_security.current_site_id(uuid);
drop function if exists atlas_security.current_customer_id(uuid);
drop function if exists atlas_security.is_admin(uuid);
drop function if exists atlas_security.can_manage(uuid);
drop function if exists atlas_security.is_internal(uuid);
drop function if exists atlas_security.is_active_member(uuid);
drop function if exists atlas_security.active_role(uuid);
drop schema if exists atlas_security;

commit;
*/
