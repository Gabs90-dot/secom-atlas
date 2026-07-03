-- Tenantize public.todo_tasks without guessing ownership.
--
-- This migration intentionally runs after
-- 20260622165000_enforce_core_tenant_rls.sql. The general RLS migration leaves
-- the legacy To Do policies in place to avoid a production outage; this
-- migration performs the deterministic backfill and replaces those policies.
--
-- Diagnostic query for rows that cannot be backfilled safely:
--
-- with task_users as (
--   select id as task_id, created_by as user_id from public.todo_tasks where created_by is not null
--   union
--   select id as task_id, assigned_to as user_id from public.todo_tasks where assigned_to is not null
-- ),
-- candidates as (
--   select task_users.task_id, tenant_users.tenant_id
--   from task_users
--   join public.tenant_users
--     on tenant_users.user_id = task_users.user_id
--    and tenant_users.status = 'active'
-- )
-- select todo_tasks.id, todo_tasks.title, todo_tasks.created_by, todo_tasks.assigned_to,
--        count(distinct candidates.tenant_id) as candidate_tenants
-- from public.todo_tasks
-- left join candidates on candidates.task_id = todo_tasks.id
-- where todo_tasks.tenant_id is null
-- group by todo_tasks.id, todo_tasks.title, todo_tasks.created_by, todo_tasks.assigned_to
-- having count(distinct candidates.tenant_id) <> 1;

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$
declare
  missing_columns text;
begin
  if to_regclass('public.todo_tasks') is null then
    raise exception 'ATLAS todo tenantization: public.todo_tasks does not exist';
  end if;

  if to_regclass('public.tenant_users') is null then
    raise exception 'ATLAS todo tenantization: public.tenant_users does not exist';
  end if;

  if to_regclass('public.tenants') is null then
    raise exception 'ATLAS todo tenantization: public.tenants does not exist';
  end if;

  if to_regprocedure('atlas_security.is_internal(uuid)') is null
    or to_regprocedure('atlas_security.can_manage(uuid)') is null
  then
    raise exception 'ATLAS todo tenantization: atlas_security helpers are missing; run the core RLS migration first';
  end if;

  select string_agg(required.column_name, ', ' order by required.column_name)
    into missing_columns
  from (
    values
      ('id'),
      ('title'),
      ('created_by'),
      ('assigned_to'),
      ('created_at'),
      ('updated_at')
  ) as required(column_name)
  where not exists (
    select 1
    from information_schema.columns columns
    where columns.table_schema = 'public'
      and columns.table_name = 'todo_tasks'
      and columns.column_name = required.column_name
  );

  if missing_columns is not null then
    raise exception 'ATLAS todo tenantization: required columns are missing on public.todo_tasks: %', missing_columns;
  end if;
end
$$;

alter table public.todo_tasks
  add column if not exists tenant_id uuid;

do $$
declare
  wrong_type text;
  invalid_existing_count bigint;
  unmapped_count bigint;
  ambiguous_count bigint;
  conflicting_count bigint;
  sample_ids text;
begin
  select format('%s.%s', columns.data_type, columns.udt_name)
    into wrong_type
  from information_schema.columns columns
  where columns.table_schema = 'public'
    and columns.table_name = 'todo_tasks'
    and columns.column_name = 'tenant_id'
    and columns.udt_name <> 'uuid';

  if wrong_type is not null then
    raise exception 'ATLAS todo tenantization: public.todo_tasks.tenant_id must be uuid, found %', wrong_type;
  end if;

  select count(*)
    into invalid_existing_count
  from public.todo_tasks tasks
  where tasks.tenant_id is not null
    and not exists (
      select 1
      from public.tenants tenants
      where tenants.id = tasks.tenant_id
    );

  if invalid_existing_count > 0 then
    select string_agg(tasks.id::text, ', ' order by tasks.created_at desc, tasks.id)
      into sample_ids
    from (
      select tasks.id, tasks.created_at
      from public.todo_tasks tasks
      where tasks.tenant_id is not null
        and not exists (
          select 1
          from public.tenants tenants
          where tenants.id = tasks.tenant_id
        )
      order by tasks.created_at desc, tasks.id
      limit 10
    ) tasks;

    raise exception 'ATLAS todo tenantization: % rows already have invalid tenant_id. Sample ids: %', invalid_existing_count, sample_ids;
  end if;

  create temp table atlas_todo_tenant_candidates on commit drop as
  with task_users as (
    select id as task_id, created_by as user_id
    from public.todo_tasks
    where created_by is not null
    union
    select id as task_id, assigned_to as user_id
    from public.todo_tasks
    where assigned_to is not null
  ),
  candidates as (
    select distinct
      task_users.task_id,
      tenant_users.tenant_id
    from task_users
    join public.tenant_users
      on tenant_users.user_id = task_users.user_id
     and tenant_users.status = 'active'
  )
  select
    candidates.task_id,
    count(distinct candidates.tenant_id) as tenant_count,
    (array_agg(distinct candidates.tenant_id order by candidates.tenant_id))[1] as tenant_id
  from candidates
  group by candidates.task_id;

  select count(*)
    into unmapped_count
  from public.todo_tasks tasks
  left join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
  where tasks.tenant_id is null
    and candidates.task_id is null;

  if unmapped_count > 0 then
    select string_agg(tasks.id::text, ', ' order by tasks.created_at desc, tasks.id)
      into sample_ids
    from (
      select tasks.id, tasks.created_at
      from public.todo_tasks tasks
      left join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
      where tasks.tenant_id is null
        and candidates.task_id is null
      order by tasks.created_at desc, tasks.id
      limit 10
    ) tasks;

    raise exception 'ATLAS todo tenantization: % legacy rows have no deterministic tenant mapping. Sample ids: %. Run the diagnostic query in this migration header.', unmapped_count, sample_ids;
  end if;

  select count(*)
    into ambiguous_count
  from public.todo_tasks tasks
  join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
  where tasks.tenant_id is null
    and candidates.tenant_count <> 1;

  if ambiguous_count > 0 then
    select string_agg(tasks.id::text, ', ' order by tasks.created_at desc, tasks.id)
      into sample_ids
    from (
      select tasks.id, tasks.created_at
      from public.todo_tasks tasks
      join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
      where tasks.tenant_id is null
        and candidates.tenant_count <> 1
      order by tasks.created_at desc, tasks.id
      limit 10
    ) tasks;

    raise exception 'ATLAS todo tenantization: % legacy rows have ambiguous tenant mapping. Sample ids: %. Run the diagnostic query in this migration header.', ambiguous_count, sample_ids;
  end if;

  select count(*)
    into conflicting_count
  from public.todo_tasks tasks
  join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
  where tasks.tenant_id is not null
    and (
      candidates.tenant_count <> 1
      or candidates.tenant_id <> tasks.tenant_id
    );

  if conflicting_count > 0 then
    select string_agg(tasks.id::text, ', ' order by tasks.created_at desc, tasks.id)
      into sample_ids
    from (
      select tasks.id, tasks.created_at
      from public.todo_tasks tasks
      join atlas_todo_tenant_candidates candidates on candidates.task_id = tasks.id
      where tasks.tenant_id is not null
        and (
          candidates.tenant_count <> 1
          or candidates.tenant_id <> tasks.tenant_id
        )
      order by tasks.created_at desc, tasks.id
      limit 10
    ) tasks;

    raise exception 'ATLAS todo tenantization: % rows have tenant_id conflicting with creator/assignee memberships. Sample ids: %', conflicting_count, sample_ids;
  end if;

  update public.todo_tasks tasks
     set tenant_id = candidates.tenant_id
  from atlas_todo_tenant_candidates candidates
  where tasks.id = candidates.task_id
    and tasks.tenant_id is null
    and candidates.tenant_count = 1;

  if exists (select 1 from public.todo_tasks where tenant_id is null) then
    raise exception 'ATLAS todo tenantization: tenant_id backfill left null rows';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'todo_tasks_tenant_id_fkey'
      and conrelid = 'public.todo_tasks'::regclass
  ) then
    alter table public.todo_tasks
      add constraint todo_tasks_tenant_id_fkey
      foreign key (tenant_id)
      references public.tenants(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists todo_tasks_tenant_id_idx
  on public.todo_tasks (tenant_id);

create index if not exists todo_tasks_tenant_status_created_at_idx
  on public.todo_tasks (tenant_id, status, created_at desc);

alter table public.todo_tasks
  alter column tenant_id set not null;

create or replace function public.todo_tasks_prevent_tenant_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE' and old.tenant_id is distinct from new.tenant_id then
    raise exception 'ATLAS todo_tasks: tenant_id cannot be changed';
  end if;

  return new;
end
$$;

revoke all on function public.todo_tasks_prevent_tenant_change() from public;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'todo_tasks_prevent_tenant_change_trigger'
      and tgrelid = 'public.todo_tasks'::regclass
  ) then
    create trigger todo_tasks_prevent_tenant_change_trigger
      before update on public.todo_tasks
      for each row
      execute function public.todo_tasks_prevent_tenant_change();
  end if;
end
$$;

alter table public.todo_tasks enable row level security;

drop policy if exists todo_tasks_authenticated_insert on public.todo_tasks;
drop policy if exists todo_tasks_authenticated_select on public.todo_tasks;
drop policy if exists todo_tasks_authenticated_update on public.todo_tasks;
drop policy if exists todo_tasks_select on public.todo_tasks;
drop policy if exists todo_tasks_insert on public.todo_tasks;
drop policy if exists todo_tasks_update on public.todo_tasks;
drop policy if exists todo_tasks_delete on public.todo_tasks;

create policy todo_tasks_select
  on public.todo_tasks
  for select
  to authenticated
  using (atlas_security.is_internal(tenant_id));

create policy todo_tasks_insert
  on public.todo_tasks
  for insert
  to authenticated
  with check (
    atlas_security.is_internal(tenant_id)
    and created_by = auth.uid()
  );

create policy todo_tasks_update
  on public.todo_tasks
  for update
  to authenticated
  using (atlas_security.is_internal(tenant_id))
  with check (atlas_security.is_internal(tenant_id));

create policy todo_tasks_delete
  on public.todo_tasks
  for delete
  to authenticated
  using (atlas_security.can_manage(tenant_id));

revoke all on public.todo_tasks from anon;
revoke truncate, references, trigger, maintain on public.todo_tasks from authenticated;
grant select, insert, update, delete on public.todo_tasks to authenticated;
grant all on public.todo_tasks to service_role;

commit;
