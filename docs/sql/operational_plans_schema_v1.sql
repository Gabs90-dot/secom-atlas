-- ATLAS - Operational Plans / Piani Operativi V1
-- Purpose: generic contractual/operational planning layer for annual, semester, counter, site-list and mixed plans.
-- Examples: Ordinarie Carabinieri, Straordinarie Carabinieri, Aule SEPA RFI, Polizia Locale, Polizia di Stato.
-- NOTE: designed to avoid hardcoding customers/contracts into code.

begin;

-- 1) Main plan header
create table if not exists public.operational_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  title text not null,
  description text,
  year integer not null,

  -- Optional anchoring. A plan may target one main customer/contract, but can also have multiple linked customers in operational_plan_customers.
  customer_id uuid references public.customers(id) on delete set null,
  contract_id uuid references public.contract_profiles(id) on delete set null,
  entity_label text,

  -- Generic behavior configuration.
  plan_type text not null default 'counter'
    check (plan_type in ('counter', 'site_list', 'mixed')),
  service_type text not null default 'custom'
    check (service_type in ('ordinaria', 'straordinaria', 'sepa', 'custom')),
  time_rule text not null default 'annual'
    check (time_rule in ('annual', 'semester_50_50', 'semester_custom', 'single_deadline', 'multiple_deadlines', 'none')),
  scale_mode text not null default 'work_order_closed'
    check (scale_mode in ('ticket_created', 'ticket_planned', 'ticket_closed', 'work_order_closed', 'manual_date', 'manual')),

  -- Targets. For site_list plans, total_target can mirror number of required sites/items.
  total_target numeric(10,2),
  first_period_target numeric(10,2),
  second_period_target numeric(10,2),

  start_date date,
  end_date date,
  first_period_deadline date,
  second_period_deadline date,

  allow_over_target boolean not null default true,
  warn_on_over_target boolean not null default true,
  active boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),

  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operational_plans_year_check check (year between 2000 and 2100),
  constraint operational_plans_targets_check check (
    total_target is null or total_target >= 0
  ),
  constraint operational_plans_unique_title_year unique (tenant_id, title, year)
);

-- 2) Optional many-to-many customer scope.
create table if not exists public.operational_plan_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.operational_plans(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  role text not null default 'scope'
    check (role in ('primary', 'scope', 'informational')),
  created_at timestamptz not null default now(),

  constraint operational_plan_customers_customer_required check (customer_id is not null or nullif(trim(customer_name), '') is not null),
  constraint operational_plan_customers_unique unique (plan_id, customer_id, customer_name)
);

-- 3) Plan items: required sites/tasks/rows. Used by site_list and mixed plans.
create table if not exists public.operational_plan_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.operational_plans(id) on delete cascade,

  customer_id uuid references public.customers(id) on delete set null,
  site_id bigint references public.sites(id) on delete set null,

  -- Stored names are intentional: items must survive even if customer/site naming is later cleaned.
  customer_name text,
  site_name text not null,
  entity_path text,
  region text,
  province text,
  city text,

  -- Period targeting. For semester plans: 1 = first semester, 2 = second semester.
  period_target smallint check (period_target in (1, 2)),
  target_date date,
  target_value numeric(10,2) not null default 1,

  status text not null default 'todo'
    check (status in ('todo', 'planned', 'open', 'completed', 'skipped', 'out_of_scope')),
  planned_date date,
  opened_date date,
  completed_date date,
  skipped_reason text,

  ticket_id bigint references public.tickets(id) on delete set null,
  glpi_ticket_id bigint,
  work_order_id uuid references public.work_orders(id) on delete set null,

  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operational_plan_items_target_value_check check (target_value > 0),
  constraint operational_plan_items_unique_site_per_plan unique (plan_id, site_id, site_name)
);

-- 4) Consumptions: event rows that actually consume/commit plan capacity.
-- Do NOT maintain counters by subtracting numbers directly. Counters should be calculated from this table.
create table if not exists public.operational_plan_consumptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.operational_plans(id) on delete cascade,
  plan_item_id uuid references public.operational_plan_items(id) on delete set null,

  customer_id uuid references public.customers(id) on delete set null,
  site_id bigint references public.sites(id) on delete set null,
  ticket_id bigint references public.tickets(id) on delete set null,
  glpi_ticket_id bigint,
  work_order_id uuid references public.work_orders(id) on delete set null,

  service_type text not null default 'custom'
    check (service_type in ('ordinaria', 'straordinaria', 'sepa', 'custom')),
  consumption_status text not null default 'open'
    check (consumption_status in ('planned', 'open', 'completed', 'cancelled', 'manual')),

  count_value numeric(10,2) not null default 1,
  planned_date date,
  opened_date date,
  completed_date date,
  cancelled_date date,
  manual_date date,

  source text not null default 'atlas'
    check (source in ('atlas', 'glpi', 'manual', 'import')),
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operational_plan_consumptions_count_value_check check (count_value > 0),
  constraint operational_plan_consumptions_unique_ticket_plan unique (plan_id, ticket_id)
);

-- 5) Audit trail for manual corrections and future automations.
create table if not exists public.operational_plan_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid references public.operational_plans(id) on delete cascade,
  plan_item_id uuid references public.operational_plan_items(id) on delete set null,
  consumption_id uuid references public.operational_plan_consumptions(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_operational_plans_tenant_year_status
  on public.operational_plans (tenant_id, year, status, active);
create index if not exists idx_operational_plans_customer
  on public.operational_plans (tenant_id, customer_id, year);
create index if not exists idx_operational_plans_type_service
  on public.operational_plans (tenant_id, plan_type, service_type, time_rule);

create index if not exists idx_operational_plan_customers_plan
  on public.operational_plan_customers (tenant_id, plan_id);
create index if not exists idx_operational_plan_customers_customer
  on public.operational_plan_customers (tenant_id, customer_id);

create index if not exists idx_operational_plan_items_plan_status
  on public.operational_plan_items (tenant_id, plan_id, status);
create index if not exists idx_operational_plan_items_region_status
  on public.operational_plan_items (tenant_id, region, status);
create index if not exists idx_operational_plan_items_period_status
  on public.operational_plan_items (tenant_id, plan_id, period_target, status);
create index if not exists idx_operational_plan_items_site
  on public.operational_plan_items (tenant_id, site_id);
create index if not exists idx_operational_plan_items_ticket
  on public.operational_plan_items (tenant_id, ticket_id);

create index if not exists idx_operational_plan_consumptions_plan_status
  on public.operational_plan_consumptions (tenant_id, plan_id, consumption_status);
create index if not exists idx_operational_plan_consumptions_ticket
  on public.operational_plan_consumptions (tenant_id, ticket_id);
create index if not exists idx_operational_plan_consumptions_dates
  on public.operational_plan_consumptions (tenant_id, plan_id, planned_date, completed_date);

create index if not exists idx_operational_plan_events_plan
  on public.operational_plan_events (tenant_id, plan_id, created_at desc);

-- Updated_at trigger helper.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_operational_plans_updated_at') then
    create trigger trg_operational_plans_updated_at
    before update on public.operational_plans
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_operational_plan_items_updated_at') then
    create trigger trg_operational_plan_items_updated_at
    before update on public.operational_plan_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_operational_plan_consumptions_updated_at') then
    create trigger trg_operational_plan_consumptions_updated_at
    before update on public.operational_plan_consumptions
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Read model: calculated counters.
create or replace view public.v_operational_plan_progress as
select
  p.id as plan_id,
  p.tenant_id,
  p.title,
  p.year,
  p.customer_id,
  p.plan_type,
  p.service_type,
  p.time_rule,
  p.scale_mode,
  p.total_target,
  p.first_period_target,
  p.second_period_target,
  p.status,
  p.active,
  coalesce(sum(c.count_value) filter (where c.consumption_status in ('planned', 'open')), 0) as committed_count,
  coalesce(sum(c.count_value) filter (where c.consumption_status = 'completed'), 0) as completed_count,
  coalesce(sum(c.count_value) filter (where c.consumption_status = 'cancelled'), 0) as cancelled_count,
  coalesce(count(i.id), 0) as item_count,
  coalesce(count(i.id) filter (where i.status = 'todo'), 0) as items_todo,
  coalesce(count(i.id) filter (where i.status = 'planned'), 0) as items_planned,
  coalesce(count(i.id) filter (where i.status = 'open'), 0) as items_open,
  coalesce(count(i.id) filter (where i.status = 'completed'), 0) as items_completed,
  case
    when p.total_target is null then null
    else greatest(p.total_target - coalesce(sum(c.count_value) filter (where c.consumption_status = 'completed'), 0), 0)
  end as remaining_completed_based
from public.operational_plans p
left join public.operational_plan_consumptions c on c.plan_id = p.id and c.tenant_id = p.tenant_id
left join public.operational_plan_items i on i.plan_id = p.id and i.tenant_id = p.tenant_id
group by p.id;

-- RLS intentionally NOT enabled in this draft because ATLAS currently mixes client and server Supabase access.
-- When API layer is ready, enable RLS or route all reads/writes through authenticated server routes.

commit;
