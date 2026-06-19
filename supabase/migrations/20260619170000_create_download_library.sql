begin;

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit)
values ('atlas-downloads', 'atlas-downloads', false, 524288000)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create table if not exists public.download_library (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'Altro'
    check (category in (
      'Firmware',
      'Driver',
      'Software e utility',
      'Configurazioni',
      'Pacchetti di aggiornamento',
      'Certificati',
      'Moduli e template',
      'Strumenti tecnici',
      'Altro'
    )),
  product_model text,
  version text,
  release_date date,
  file_name text not null,
  storage_path text not null,
  file_size bigint,
  mime_type text,
  notes text,
  tags text[] not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'beta', 'obsolete', 'archived')),
  visibility text not null default 'internal'
    check (visibility in ('internal', 'customer', 'restricted')),
  download_count bigint not null default 0 check (download_count >= 0),
  created_by uuid references public.tenant_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint download_library_title_chk check (length(trim(title)) > 0),
  constraint download_library_file_name_chk check (length(trim(file_name)) > 0),
  constraint download_library_storage_path_chk check (length(trim(storage_path)) > 0),
  constraint download_library_storage_path_tenant_chk check (storage_path like tenant_id::text || '/%')
);

create index if not exists download_library_tenant_updated_idx
  on public.download_library (tenant_id, updated_at desc);

create index if not exists download_library_tenant_category_status_idx
  on public.download_library (tenant_id, category, status);

create index if not exists download_library_tenant_visibility_idx
  on public.download_library (tenant_id, visibility);

create index if not exists download_library_tenant_customer_visibility_idx
  on public.download_library (tenant_id, customer_id, visibility);

create index if not exists download_library_tags_gin_idx
  on public.download_library using gin (tags);

create unique index if not exists download_library_tenant_storage_path_idx
  on public.download_library (tenant_id, storage_path);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_download_library_updated_at') then
    create trigger trg_download_library_updated_at
    before update on public.download_library
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.download_library enable row level security;

drop policy if exists "download_library_internal_select" on public.download_library;
create policy "download_library_internal_select"
on public.download_library
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('super_admin', 'admin', 'manager', 'dispatcher', 'tecnico', 'commerciale')
  )
);

drop policy if exists "download_library_customer_select" on public.download_library;
create policy "download_library_customer_select"
on public.download_library
for select
to authenticated
using (
  visibility = 'customer'
  and exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('cliente_admin', 'cliente_user', 'cliente')
      and tu.customer_id = download_library.customer_id
  )
);

drop policy if exists "download_library_insert" on public.download_library;
create policy "download_library_insert"
on public.download_library
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('super_admin', 'admin', 'manager')
  )
);

drop policy if exists "download_library_update" on public.download_library;
create policy "download_library_update"
on public.download_library
for update
to authenticated
using (
  exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('super_admin', 'admin', 'manager')
  )
)
with check (
  exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('super_admin', 'admin', 'manager')
  )
);

drop policy if exists "download_library_delete" on public.download_library;
create policy "download_library_delete"
on public.download_library
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = download_library.tenant_id
      and tu.status = 'active'
      and tu.role in ('super_admin', 'admin')
  )
);

drop policy if exists "atlas_downloads_no_public_select" on storage.objects;
drop policy if exists "atlas_downloads_client_select" on storage.objects;
drop policy if exists "atlas_downloads_client_insert" on storage.objects;
drop policy if exists "atlas_downloads_client_update" on storage.objects;
drop policy if exists "atlas_downloads_client_delete" on storage.objects;

commit;
