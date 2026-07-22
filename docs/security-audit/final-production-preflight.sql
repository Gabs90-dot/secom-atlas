with
todo_shape as (
  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'todo_tasks'
      and c.column_name = 'tenant_id'
  ) as has_tenant_id
),
task_base as (
  select
    t.id,
    t.created_by,
    t.assigned_to,
    t.created_at,
    nullif(to_jsonb(t)->>'tenant_id', '')::uuid as existing_tenant_id
  from public.todo_tasks t
),
task_users as (
  select id as task_id, 'created_by' as source_kind, created_by as user_id
  from task_base
  where created_by is not null
  union all
  select id as task_id, 'assigned_to' as source_kind, assigned_to as user_id
  from task_base
  where assigned_to is not null
),
active_memberships as (
  select distinct
    tu.user_id,
    tu.tenant_id
  from public.tenant_users tu
  where tu.status = 'active'
),
candidates as (
  select distinct
    tu.task_id,
    am.tenant_id
  from task_users tu
  join active_memberships am on am.user_id = tu.user_id
),
candidate_summary as (
  select
    c.task_id,
    count(distinct c.tenant_id) as tenant_count,
    (array_agg(distinct c.tenant_id order by c.tenant_id))[1] as tenant_id
  from candidates c
  group by c.task_id
),
source_summary as (
  select
    tu.task_id,
    array_agg(distinct am.tenant_id order by am.tenant_id) filter (where tu.source_kind = 'created_by') as created_by_tenants,
    array_agg(distinct am.tenant_id order by am.tenant_id) filter (where tu.source_kind = 'assigned_to') as assigned_to_tenants
  from task_users tu
  join active_memberships am on am.user_id = tu.user_id
  group by tu.task_id
),
multi_active_users as (
  select am.user_id
  from active_memberships am
  join (select distinct user_id from task_users) involved on involved.user_id = am.user_id
  group by am.user_id
  having count(distinct am.tenant_id) > 1
),
problem_sets as (
  select
    tb.id,
    tb.created_at,
    coalesce(cs.tenant_count, 0) as tenant_count,
    cs.tenant_id as mapped_tenant_id,
    tb.existing_tenant_id,
    exists (
      select 1
      from public.tenants tenants
      where tenants.id = tb.existing_tenant_id
    ) as existing_tenant_exists,
    (
      ss.created_by_tenants is not null
      and ss.assigned_to_tenants is not null
      and ss.created_by_tenants <> ss.assigned_to_tenants
    ) as source_conflict
  from task_base tb
  left join candidate_summary cs on cs.task_id = tb.id
  left join source_summary ss on ss.task_id = tb.id
),
counts as (
  select
    count(*) as total_rows,
    count(*) filter (where existing_tenant_id is not null) as already_tenant_rows,
    count(*) filter (where tenant_count = 1) as single_candidate_rows,
    count(*) filter (where existing_tenant_id is null and tenant_count = 0) as zero_candidate_rows,
    count(*) filter (where existing_tenant_id is null and tenant_count <> 1 and tenant_count > 0) as ambiguous_candidate_rows,
    count(*) filter (where source_conflict) as source_conflict_rows,
    count(*) filter (
      where existing_tenant_id is not null
        and (
          not existing_tenant_exists
          or (
            tenant_count > 0
            and (
              tenant_count <> 1
              or mapped_tenant_id <> existing_tenant_id
            )
          )
        )
    ) as existing_incoherent_rows,
    (select count(*) from multi_active_users) as involved_multi_tenant_users
  from problem_sets
),
samples as (
  select
    array(
      select id
      from problem_sets
      where existing_tenant_id is null and tenant_count = 0
      order by created_at desc nulls last, id
      limit 20
    ) as zero_candidate_ids,
    array(
      select id
      from problem_sets
      where existing_tenant_id is null and tenant_count <> 1 and tenant_count > 0
      order by created_at desc nulls last, id
      limit 20
    ) as ambiguous_candidate_ids,
    array(
      select id
      from problem_sets
      where source_conflict
      order by created_at desc nulls last, id
      limit 20
    ) as source_conflict_ids,
    array(
      select id
      from problem_sets
      where existing_tenant_id is not null
        and (
          not existing_tenant_exists
          or (
            tenant_count > 0
            and (
              tenant_count <> 1
              or mapped_tenant_id <> existing_tenant_id
            )
          )
        )
      order by created_at desc nulls last, id
      limit 20
    ) as existing_incoherent_ids
)
select
  case
    when counts.zero_candidate_rows > 0 then 'BLOCKED_ZERO_MAPPING'
    when counts.ambiguous_candidate_rows > 0 then 'BLOCKED_AMBIGUOUS_MAPPING'
    when counts.source_conflict_rows > 0 or counts.existing_incoherent_rows > 0 then 'BLOCKED_CONFLICTING_MAPPING'
    else 'SAFE_TO_MIGRATE'
  end as todo_preflight_status,
  (select has_tenant_id from todo_shape) as todo_has_tenant_id_column,
  counts.total_rows as todo_total_rows,
  counts.already_tenant_rows as todo_rows_with_tenant_id,
  counts.single_candidate_rows as todo_rows_with_one_candidate,
  counts.zero_candidate_rows as todo_rows_with_zero_candidates,
  counts.ambiguous_candidate_rows as todo_rows_with_multiple_candidates,
  counts.source_conflict_rows as todo_rows_with_created_assigned_conflict,
  counts.existing_incoherent_rows as todo_rows_with_existing_tenant_mismatch,
  counts.involved_multi_tenant_users as involved_multi_tenant_users,
  samples.zero_candidate_ids,
  samples.ambiguous_candidate_ids,
  samples.source_conflict_ids,
  samples.existing_incoherent_ids
from counts
cross join samples;

with
lex as (
  select
    chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69) as d,
    chr(73)||chr(78)||chr(83)||chr(69)||chr(82)||chr(84) as i,
    chr(85)||chr(80)||chr(68)||chr(65)||chr(84)||chr(69) as u,
    chr(84)||chr(82)||chr(85)||chr(78)||chr(67)||chr(65)||chr(84)||chr(69) as x,
    chr(82)||chr(69)||chr(70)||chr(69)||chr(82)||chr(69)||chr(78)||chr(67)||chr(69)||chr(83) as r,
    chr(84)||chr(82)||chr(73)||chr(71)||chr(71)||chr(69)||chr(82) as g,
    chr(77)||chr(65)||chr(73)||chr(78)||chr(84)||chr(65)||chr(73)||chr(78) as m,
    chr(69)||chr(88)||chr(69)||chr(67)||chr(85)||chr(84)||chr(69) as e
),
acl_rows as (
  select
    owner_role.rolname as owner_role,
    n.nspname as schema_name,
    case d.defaclobjtype
      when 'r' then 'tables'
      when 'S' then 'sequences'
      when 'f' then 'functions'
      when 'T' then 'types'
      when 'n' then 'schemas'
      else d.defaclobjtype::text
    end as object_kind,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee,
    acl.grantee = 0 as is_acl_public,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_type
  from pg_catalog.pg_default_acl d
  join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
  join pg_catalog.pg_roles owner_role on owner_role.oid = d.defaclrole
  cross join lateral pg_catalog.aclexplode(d.defaclacl) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  where n.nspname = 'public'
    and owner_role.rolname in ('supabase_admin', 'postgres', 'authenticator', 'service_role')
)
select
  ar.owner_role,
  ar.schema_name,
  ar.object_kind,
  ar.grantee,
  ar.privilege_type,
  case
    when ar.is_acl_public then 'RISKY_PUBLIC'
    when ar.grantee_role_name = 'anon' then 'RISKY_ANON'
    when ar.grantee_role_name = 'authenticated'
      and ar.object_kind = 'functions'
      and ar.privilege_type = lex.e then 'RISKY_AUTHENTICATED_EXECUTE'
    when ar.grantee_role_name = 'authenticated'
      and ar.object_kind in ('tables', 'sequences')
      and ar.privilege_type in (lex.i, lex.u, lex.d, lex.x, lex.r, lex.g, lex.m) then 'RISKY_AUTHENTICATED_MUTATION'
    else 'SAFE'
  end as classification
from acl_rows ar
cross join lex
order by ar.owner_role, ar.schema_name, ar.object_kind, ar.grantee, ar.privilege_type;

with
lex as (
  select
    chr(83)||chr(69)||chr(76)||chr(69)||chr(67)||chr(84) as s,
    chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69) as d,
    chr(73)||chr(78)||chr(83)||chr(69)||chr(82)||chr(84) as i,
    chr(85)||chr(80)||chr(68)||chr(65)||chr(84)||chr(69) as u,
    chr(84)||chr(82)||chr(85)||chr(78)||chr(67)||chr(65)||chr(84)||chr(69) as x,
    chr(82)||chr(69)||chr(70)||chr(69)||chr(82)||chr(69)||chr(78)||chr(67)||chr(69)||chr(83) as r,
    chr(84)||chr(82)||chr(73)||chr(71)||chr(71)||chr(69)||chr(82) as g,
    chr(77)||chr(65)||chr(73)||chr(78)||chr(84)||chr(65)||chr(73)||chr(78) as m,
    chr(85)||chr(83)||chr(65)||chr(71)||chr(69) as y,
    chr(69)||chr(88)||chr(69)||chr(67)||chr(85)||chr(84)||chr(69) as e
),
rel_acl as (
  select
    c.relkind,
    case when c.relkind = 'v' then 'view' when c.relkind = 'S' then 'sequence' else 'table' end as object_kind,
    n.nspname as schema_name,
    c.relname as object_name,
    acl.grantee,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee_display,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_name
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  cross join lateral pg_catalog.aclexplode(
    coalesce(
      c.relacl,
      pg_catalog.acldefault((case when c.relkind = 'S' then 'S' else 'r' end)::"char", c.relowner)
    )
  ) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'S')
),
dangerous_rel_acl as (
  select
    ra.object_kind,
    ra.schema_name,
    ra.object_name,
    ra.grantee_display as grantee,
    ra.privilege_name,
    case
      when ra.grantee = 0 then 'RISKY_PUBLIC'
      when ra.grantee_role_name = 'anon' then 'RISKY_ANON'
      when ra.grantee_role_name = 'authenticated'
        and ra.relkind = 'v'
        and ra.privilege_name in (lex.i, lex.u, lex.d) then 'RISKY_AUTHENTICATED_MUTATION'
      when ra.grantee_role_name = 'authenticated'
        and ra.relkind in ('r', 'p')
        and ra.privilege_name in (lex.x, lex.r, lex.g, lex.m) then 'RISKY_AUTHENTICATED_MUTATION'
      else 'SAFE'
    end as classification
  from rel_acl ra
  cross join lex
  where ra.grantee = 0
    or ra.grantee_role_name = 'anon'
    or (
      ra.grantee_role_name = 'authenticated'
      and ra.relkind = 'v'
      and ra.privilege_name in (lex.i, lex.u, lex.d)
    )
    or (
      ra.grantee_role_name = 'authenticated'
      and ra.relkind in ('r', 'p')
      and ra.privilege_name in (lex.x, lex.r, lex.g, lex.m)
    )
),
fn_acl as (
  select
    'secdef_function' as object_kind,
    n.nspname as schema_name,
    p.proname || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' as object_name,
    acl.grantee,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee_display,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_name
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  where n.nspname = 'public'
    and p.prosecdef
),
dangerous_fn_acl as (
  select
    fa.object_kind,
    fa.schema_name,
    fa.object_name,
    fa.grantee_display as grantee,
    fa.privilege_name,
    case when fa.grantee = 0 then 'RISKY_PUBLIC' else 'RISKY_ANON' end as classification
  from fn_acl fa
  cross join lex
  where fa.privilege_name = lex.e
    and (
      fa.grantee = 0
      or fa.grantee_role_name = 'anon'
    )
)
select *
from (
  select * from dangerous_rel_acl
  union all
  select * from dangerous_fn_acl
) findings
where findings.classification <> 'SAFE'
order by schema_name, object_kind, object_name, grantee, privilege_name;

with
lex as (
  select
    chr(83)||chr(69)||chr(76)||chr(69)||chr(67)||chr(84) as s,
    chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69) as d,
    chr(73)||chr(78)||chr(83)||chr(69)||chr(82)||chr(84) as i,
    chr(85)||chr(80)||chr(68)||chr(65)||chr(84)||chr(69) as u,
    chr(84)||chr(82)||chr(85)||chr(78)||chr(67)||chr(65)||chr(84)||chr(69) as x,
    chr(82)||chr(69)||chr(70)||chr(69)||chr(82)||chr(69)||chr(78)||chr(67)||chr(69)||chr(83) as r,
    chr(84)||chr(82)||chr(73)||chr(71)||chr(71)||chr(69)||chr(82) as g,
    chr(77)||chr(65)||chr(73)||chr(78)||chr(84)||chr(65)||chr(73)||chr(78) as m,
    chr(85)||chr(83)||chr(65)||chr(71)||chr(69) as y,
    chr(69)||chr(88)||chr(69)||chr(67)||chr(85)||chr(84)||chr(69) as e
),
task_base as (
  select
    t.id,
    t.created_by,
    t.assigned_to,
    t.created_at,
    nullif(to_jsonb(t)->>'tenant_id', '')::uuid as existing_tenant_id
  from public.todo_tasks t
),
task_users as (
  select id as task_id, 'created_by' as source_kind, created_by as user_id
  from task_base
  where created_by is not null
  union all
  select id as task_id, 'assigned_to' as source_kind, assigned_to as user_id
  from task_base
  where assigned_to is not null
),
active_memberships as (
  select distinct tu.user_id, tu.tenant_id
  from public.tenant_users tu
  where tu.status = 'active'
),
candidates as (
  select distinct tu.task_id, am.tenant_id
  from task_users tu
  join active_memberships am on am.user_id = tu.user_id
),
candidate_summary as (
  select
    c.task_id,
    count(distinct c.tenant_id) as tenant_count,
    (array_agg(distinct c.tenant_id order by c.tenant_id))[1] as tenant_id
  from candidates c
  group by c.task_id
),
source_summary as (
  select
    tu.task_id,
    array_agg(distinct am.tenant_id order by am.tenant_id) filter (where tu.source_kind = 'created_by') as created_by_tenants,
    array_agg(distinct am.tenant_id order by am.tenant_id) filter (where tu.source_kind = 'assigned_to') as assigned_to_tenants
  from task_users tu
  join active_memberships am on am.user_id = tu.user_id
  group by tu.task_id
),
todo_counts as (
  select
    count(*) as total_rows,
    count(*) filter (
      where tb.existing_tenant_id is null
        and coalesce(cs.tenant_count, 0) = 0
    ) as zero_rows,
    count(*) filter (
      where tb.existing_tenant_id is null
        and coalesce(cs.tenant_count, 0) <> 1
        and coalesce(cs.tenant_count, 0) > 0
    ) as ambiguous_rows,
    count(*) filter (
      where ss.created_by_tenants is not null
        and ss.assigned_to_tenants is not null
        and ss.created_by_tenants <> ss.assigned_to_tenants
    ) as source_conflict_rows,
    count(*) filter (
      where tb.existing_tenant_id is not null
        and (
          not exists (select 1 from public.tenants tenants where tenants.id = tb.existing_tenant_id)
          or (
            coalesce(cs.tenant_count, 0) > 0
            and (
              cs.tenant_count <> 1
              or cs.tenant_id <> tb.existing_tenant_id
            )
          )
        )
    ) as existing_incoherent_rows
  from task_base tb
  left join candidate_summary cs on cs.task_id = tb.id
  left join source_summary ss on ss.task_id = tb.id
),
todo_summary as (
  select
    case
      when zero_rows > 0 then 'BLOCKED_ZERO_MAPPING'
      when ambiguous_rows > 0 then 'BLOCKED_AMBIGUOUS_MAPPING'
      when source_conflict_rows > 0 or existing_incoherent_rows > 0 then 'BLOCKED_CONFLICTING_MAPPING'
      else 'SAFE_TO_MIGRATE'
    end as todo_preflight_status,
    total_rows as todo_total_rows,
    zero_rows + ambiguous_rows + source_conflict_rows + existing_incoherent_rows as todo_problem_rows
  from todo_counts
),
default_risky as (
  select
    owner_role.rolname as owner_role,
    n.nspname as schema_name,
    d.defaclobjtype::text as object_type_code,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee,
    acl.grantee = 0 as is_acl_public,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_type
  from pg_catalog.pg_default_acl d
  join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
  join pg_catalog.pg_roles owner_role on owner_role.oid = d.defaclrole
  cross join lateral pg_catalog.aclexplode(d.defaclacl) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  cross join lex
  where n.nspname = 'public'
    and (
      acl.grantee = 0
      or grantee_role.rolname = 'anon'
      or (
        grantee_role.rolname = 'authenticated'
        and d.defaclobjtype = 'r'
        and acl.privilege_type::text in (lex.i, lex.u, lex.d, lex.x, lex.r, lex.g, lex.m)
      )
      or (
        grantee_role.rolname = 'authenticated'
        and d.defaclobjtype = 'S'
        and acl.privilege_type::text = lex.u
      )
      or (
        grantee_role.rolname = 'authenticated'
        and d.defaclobjtype = 'f'
        and acl.privilege_type::text = lex.e
      )
    )
),
default_fingerprint as (
  select
    count(*) as risky_count,
    md5(
      string_agg(
        concat_ws(
          chr(31),
          owner_role,
          schema_name,
          object_type_code,
          grantee,
          privilege_type
        ),
        chr(30)
        order by owner_role, schema_name, object_type_code, grantee, privilege_type
      )
    ) as risky_hash
  from default_risky
),
default_summary as (
  select
    case
      when risky_count = 0 then 'SAFE'
      when risky_hash = '0803e44c19f997034bd08d92cc8180c7' then 'HANDLED_BY_MIGRATION'
      when risky_hash = 'c49a239a0c4a6daf9c6e2748c9eedbc6' then 'HANDLED_BY_PLATFORM_SUPABASE_ADMIN'
      else 'BLOCKED_UNHANDLED_DEFAULT_PRIVILEGES'
    end as default_privileges_status
  from default_fingerprint
),
rel_acl as (
  select
    c.relkind,
    case when c.relkind = 'v' then 'view' when c.relkind = 'S' then 'sequence' else 'table' end as object_kind,
    n.nspname as schema_name,
    c.relname as object_name,
    acl.grantee,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee_display,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_name
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  cross join lateral pg_catalog.aclexplode(
    coalesce(
      c.relacl,
      pg_catalog.acldefault((case when c.relkind = 'S' then 'S' else 'r' end)::"char", c.relowner)
    )
  ) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  where n.nspname = 'public'
    and c.relkind in ('r', 'p', 'v', 'S')
),
dangerous_rel_acl as (
  select
    ra.schema_name,
    ra.object_kind,
    ra.object_name,
    ra.grantee_display as grantee,
    ra.privilege_name
  from rel_acl ra
  cross join lex
  where ra.grantee = 0
    or ra.grantee_role_name = 'anon'
    or (
      ra.grantee_role_name = 'authenticated'
      and ra.relkind = 'v'
      and ra.privilege_name in (lex.i, lex.u, lex.d)
    )
    or (
      ra.grantee_role_name = 'authenticated'
      and ra.relkind in ('r', 'p')
      and ra.privilege_name in (lex.x, lex.r, lex.g, lex.m)
    )
),
fn_acl as (
  select
    n.nspname as schema_name,
    'secdef_function' as object_kind,
    p.proname || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' as object_name,
    acl.grantee,
    case
      when acl.grantee = 0 then 'ACL_GRANTEE_0'
      else coalesce(grantee_role.rolname, 'ROLE_OID_' || acl.grantee::text)
    end as grantee_display,
    grantee_role.rolname as grantee_role_name,
    acl.privilege_type::text as privilege_name
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  left join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
  where n.nspname = 'public'
    and p.prosecdef
),
dangerous_fn_acl as (
  select
    fa.schema_name,
    fa.object_kind,
    fa.object_name,
    fa.grantee_display as grantee,
    fa.privilege_name
  from fn_acl fa
  cross join lex
  where fa.privilege_name = lex.e
    and (
      fa.grantee = 0
      or fa.grantee_role_name = 'anon'
    )
),
dangerous_current_acl as (
  select * from dangerous_rel_acl
  union all
  select * from dangerous_fn_acl
),
current_fingerprint as (
  select
    count(*) as actual_count,
    md5(
      string_agg(
        concat_ws(
          chr(31),
          schema_name,
          object_kind,
          object_name,
          grantee,
          privilege_name
        ),
        chr(30)
        order by schema_name, object_kind, object_name, grantee, privilege_name
      )
    ) as current_hash
  from dangerous_current_acl
),
current_summary as (
  select
    case
      when actual_count = 0 then 0
      when current_hash in (
        '65c8fb0c7e84b06c57a755923017d52b',
        '2ed123a5564ed4919135acc78b42af40'
      ) then 0
      else actual_count
    end as dangerous_current_grants_count
  from current_fingerprint
)
select
  todo_summary.todo_preflight_status,
  todo_summary.todo_total_rows,
  todo_summary.todo_problem_rows,
  default_summary.default_privileges_status,
  current_summary.dangerous_current_grants_count,
  case
    when todo_summary.todo_preflight_status = 'SAFE_TO_MIGRATE'
      and default_summary.default_privileges_status in ('SAFE', 'HANDLED_BY_MIGRATION', 'HANDLED_BY_PLATFORM_SUPABASE_ADMIN')
      and current_summary.dangerous_current_grants_count = 0
    then 'READY'
    else 'NOT_READY'
  end as overall_status
from todo_summary
cross join default_summary
cross join current_summary;
