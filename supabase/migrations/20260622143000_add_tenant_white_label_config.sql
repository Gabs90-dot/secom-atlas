alter table public.tenants
  add column if not exists product_name text,
  add column if not exists company_name text,
  add column if not exists favicon_url text,
  add column if not exists support_email text,
  add column if not exists support_phone text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists legal_information text,
  add column if not exists privacy_text text,
  add column if not exists privacy_url text,
  add column if not exists accent_color text,
  add column if not exists theme_preset text,
  add column if not exists ticket_provider text,
  add column if not exists glpi_enabled boolean;

update public.tenants
set
  theme_preset = coalesce(theme_preset, 'classic'),
  ticket_provider = coalesce(ticket_provider, 'glpi'),
  glpi_enabled = coalesce(glpi_enabled, true)
where
  theme_preset is null
  or ticket_provider is null
  or glpi_enabled is null;

alter table public.tenants
  alter column theme_preset set default 'classic',
  alter column theme_preset set not null,
  alter column ticket_provider set default 'atlas',
  alter column ticket_provider set not null,
  alter column glpi_enabled set default false,
  alter column glpi_enabled set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_theme_preset_check'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_theme_preset_check
      check (theme_preset in ('classic', 'executive')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_ticket_provider_check'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_ticket_provider_check
      check (ticket_provider in ('atlas', 'glpi')) not valid;
  end if;
end $$;

comment on column public.tenants.product_name is 'White-label product name shown by ATLAS clients.';
comment on column public.tenants.company_name is 'White-label tenant company name.';
comment on column public.tenants.favicon_url is 'Optional tenant favicon URL.';
comment on column public.tenants.support_email is 'Tenant support email for white-label surfaces.';
comment on column public.tenants.support_phone is 'Tenant support phone for white-label surfaces.';
comment on column public.tenants.website is 'Tenant website for white-label surfaces.';
comment on column public.tenants.address is 'Tenant address for white-label surfaces.';
comment on column public.tenants.legal_information is 'Tenant legal information for white-label surfaces and documents.';
comment on column public.tenants.privacy_text is 'Tenant privacy text fallback.';
comment on column public.tenants.privacy_url is 'Tenant privacy URL fallback.';
comment on column public.tenants.accent_color is 'Optional tenant accent color.';
comment on column public.tenants.theme_preset is 'Default tenant theme preset: classic or executive.';
comment on column public.tenants.ticket_provider is 'Tenant ticket backend: atlas for native tickets, glpi for GLPI-backed workflows.';
comment on column public.tenants.glpi_enabled is 'Whether GLPI integration is enabled for this tenant. Existing tenants are backfilled true; new tenants default false.';
