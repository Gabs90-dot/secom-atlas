begin;

create table if not exists public.atlas_contract_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  match_terms text[] not null default '{}',
  client_type text not null default '',
  status text not null default 'Attivo',
  period text not null default '',
  start_date text not null default '',
  end_date text not null default '',
  renewal_alert_days integer not null default 90 check (renewal_alert_days >= 0),
  pdf text not null default '',
  warranty text not null default '',
  shipping text not null default '',
  spare_parts text not null default '',
  sla text not null default '',
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.atlas_contract_sla_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_key text not null,
  category text not null default '',
  customer_type text not null default '',
  duration_months text not null default '',
  warranty_months text not null default '',
  phone_support text not null default '',
  preventive_onsite text not null default '',
  extraordinary_onsite text not null default '',
  spare_parts_included text not null default '',
  blocking_response text not null default '',
  nonblocking_response text not null default '',
  pickup_shipping text not null default '',
  service_hours text not null default '',
  service_days text not null default '',
  drive_link text not null default '',
  commercial_notes text not null default '',
  summary text not null default '',
  aliases text not null default '',
  keywords text not null default '',
  match_priority integer not null default 0,
  parent_customer text not null default '',
  child_customers text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, profile_key)
);

create table if not exists public.atlas_contract_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_name text not null,
  entity text not null default '',
  value numeric(14,2) not null default 0 check (value >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, contract_name)
);

create index if not exists atlas_contract_catalog_tenant_status_idx
  on public.atlas_contract_catalog (tenant_id, status, name);

create index if not exists atlas_contract_sla_profiles_tenant_active_idx
  on public.atlas_contract_sla_profiles (tenant_id, is_active, category, match_priority desc);

create index if not exists atlas_contract_budgets_tenant_contract_idx
  on public.atlas_contract_budgets (tenant_id, contract_name);

create or replace function public.atlas_contract_catalog_current_role(p_tenant_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select lower(coalesce(r.key, tu.role, ''))
  from public.tenant_users tu
  left join public.roles r on r.id = tu.role_id
  where tu.tenant_id = p_tenant_id
    and tu.user_id = auth.uid()
    and coalesce(tu.status, 'active') = 'active'
  order by
    case lower(coalesce(r.key, tu.role, ''))
      when 'super_admin' then 1
      when 'admin' then 2
      when 'manager' then 3
      when 'commerciale' then 4
      when 'dispatcher' then 5
      when 'tecnico' then 6
      else 99
    end
  limit 1;
$$;

create or replace function public.atlas_contract_catalog_can_read(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.atlas_contract_catalog_current_role(p_tenant_id) in (
    'super_admin', 'admin', 'manager', 'commerciale', 'dispatcher', 'tecnico'
  );
$$;

create or replace function public.atlas_contract_catalog_can_manage(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.atlas_contract_catalog_current_role(p_tenant_id) in (
    'super_admin', 'admin', 'manager', 'commerciale'
  );
$$;

create or replace function public.atlas_contract_catalog_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.atlas_contract_budget_validate_contract()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.atlas_contract_catalog contract
    where contract.tenant_id = new.tenant_id
      and contract.name = new.contract_name
  ) then
    raise exception 'atlas_contract_budgets.contract_name must exist in atlas_contract_catalog for the same tenant_id';
  end if;

  return new;
end;
$$;

drop trigger if exists atlas_contract_catalog_touch_updated_at on public.atlas_contract_catalog;
create trigger atlas_contract_catalog_touch_updated_at
  before update on public.atlas_contract_catalog
  for each row
  execute function public.atlas_contract_catalog_touch_updated_at();

drop trigger if exists atlas_contract_sla_profiles_touch_updated_at on public.atlas_contract_sla_profiles;
create trigger atlas_contract_sla_profiles_touch_updated_at
  before update on public.atlas_contract_sla_profiles
  for each row
  execute function public.atlas_contract_catalog_touch_updated_at();

drop trigger if exists atlas_contract_budgets_touch_updated_at on public.atlas_contract_budgets;
create trigger atlas_contract_budgets_touch_updated_at
  before update on public.atlas_contract_budgets
  for each row
  execute function public.atlas_contract_catalog_touch_updated_at();

drop trigger if exists atlas_contract_budgets_validate_contract on public.atlas_contract_budgets;
create trigger atlas_contract_budgets_validate_contract
  before insert or update of tenant_id, contract_name
  on public.atlas_contract_budgets
  for each row
  execute function public.atlas_contract_budget_validate_contract();

revoke all on function public.atlas_contract_catalog_current_role(uuid) from public, anon;
revoke all on function public.atlas_contract_catalog_can_read(uuid) from public, anon;
revoke all on function public.atlas_contract_catalog_can_manage(uuid) from public, anon;
revoke all on function public.atlas_contract_catalog_touch_updated_at() from public, anon;
revoke all on function public.atlas_contract_budget_validate_contract() from public, anon;

grant execute on function public.atlas_contract_catalog_current_role(uuid) to authenticated;
grant execute on function public.atlas_contract_catalog_can_read(uuid) to authenticated;
grant execute on function public.atlas_contract_catalog_can_manage(uuid) to authenticated;

alter table public.atlas_contract_catalog enable row level security;
alter table public.atlas_contract_sla_profiles enable row level security;
alter table public.atlas_contract_budgets enable row level security;

drop policy if exists atlas_contract_catalog_select on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_insert on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_update on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_delete on public.atlas_contract_catalog;

create policy atlas_contract_catalog_select
  on public.atlas_contract_catalog
  for select
  to authenticated
  using (public.atlas_contract_catalog_can_read(tenant_id));

create policy atlas_contract_catalog_insert
  on public.atlas_contract_catalog
  for insert
  to authenticated
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_catalog_update
  on public.atlas_contract_catalog
  for update
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id))
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_catalog_delete
  on public.atlas_contract_catalog
  for delete
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id));

drop policy if exists atlas_contract_sla_profiles_select on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_insert on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_update on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_delete on public.atlas_contract_sla_profiles;

create policy atlas_contract_sla_profiles_select
  on public.atlas_contract_sla_profiles
  for select
  to authenticated
  using (public.atlas_contract_catalog_can_read(tenant_id));

create policy atlas_contract_sla_profiles_insert
  on public.atlas_contract_sla_profiles
  for insert
  to authenticated
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_sla_profiles_update
  on public.atlas_contract_sla_profiles
  for update
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id))
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_sla_profiles_delete
  on public.atlas_contract_sla_profiles
  for delete
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id));

drop policy if exists atlas_contract_budgets_select on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_insert on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_update on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_delete on public.atlas_contract_budgets;

create policy atlas_contract_budgets_select
  on public.atlas_contract_budgets
  for select
  to authenticated
  using (public.atlas_contract_catalog_can_read(tenant_id));

create policy atlas_contract_budgets_insert
  on public.atlas_contract_budgets
  for insert
  to authenticated
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_budgets_update
  on public.atlas_contract_budgets
  for update
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id))
  with check (public.atlas_contract_catalog_can_manage(tenant_id));

create policy atlas_contract_budgets_delete
  on public.atlas_contract_budgets
  for delete
  to authenticated
  using (public.atlas_contract_catalog_can_manage(tenant_id));

revoke all on public.atlas_contract_catalog from anon;
revoke all on public.atlas_contract_sla_profiles from anon;
revoke all on public.atlas_contract_budgets from anon;

grant select, insert, update, delete on public.atlas_contract_catalog to authenticated;
grant select, insert, update, delete on public.atlas_contract_sla_profiles to authenticated;
grant select, insert, update, delete on public.atlas_contract_budgets to authenticated;

with secom_tenant as (
  select id
  from public.tenants
  where slug = 'secom'
  limit 1
), seed as (
  select row_number() over () as sort_order, item.*
  from jsonb_to_recordset($atlas_seed$[
  {
    "name": "POLFER SPIS",
    "match": [
      "POLFER",
      "POLIZIA FERROVIARIA"
    ],
    "clientType": "Polizia Ferroviaria",
    "status": "Attivo",
    "period": "Fornitura SPIS",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 90,
    "pdf": "",
    "warranty": "Sì",
    "shipping": "Sì, se previsto da garanzia",
    "spareParts": "Ricambi gestibili secondo contratto",
    "sla": "7 giorni bloccante / 14 giorni non bloccante",
    "notes": "Assistenza su apparati SPIS Polfer. Verificare sempre se la parte richiesta è coperta da garanzia o ricambio contrattuale."
  },
  {
    "name": "FRONTIERE 26 SPIS",
    "match": [
      "FRONTIERA",
      "POLIZIA DI FRONTIERA"
    ],
    "clientType": "Polizia di Frontiera",
    "status": "Attivo",
    "period": "2024-2026",
    "startDate": "2024-01-01",
    "endDate": "2026-12-31",
    "renewalAlertDays": 120,
    "pdf": "",
    "warranty": "24 mesi",
    "shipping": "Inclusa",
    "spareParts": "Ripristino e sostituzione apparati inclusi",
    "sla": "12 ore bloccante / 24 ore non bloccante",
    "notes": "Trasporto, ritiro e sostituzione apparati inclusi nel contratto."
  },
  {
    "name": "HOTSPOT ALBANIA 2024-2026",
    "match": [
      "ALBANIA",
      "HOTSPOT"
    ],
    "clientType": "Estero",
    "status": "Attivo",
    "period": "2024-2026",
    "startDate": "2024-01-01",
    "endDate": "2026-12-31",
    "renewalAlertDays": 120,
    "pdf": "",
    "warranty": "24 mesi",
    "shipping": "Inclusa",
    "spareParts": "Riparazione o sostituzione inclusa",
    "sla": "5 giorni bloccante / 10 giorni non bloccante",
    "notes": "Ritiro apparati, trasporto e supporto tecnico inclusi."
  },
  {
    "name": "CARABINIERI ASSISTENZA 2024-2026",
    "match": [
      "CARABINIERI",
      "COMANDO PROVINCIALE",
      "GRUPPO CC",
      "REPARTO TERRITORIALE CC",
      "COMANDO GRUPPO"
    ],
    "clientType": "Carabinieri",
    "status": "Attivo",
    "period": "2024-2026",
    "startDate": "2024-01-01",
    "endDate": "2026-12-31",
    "renewalAlertDays": 120,
    "pdf": "",
    "warranty": "Sì",
    "shipping": "Sì previa autorizzazione",
    "spareParts": "Ricambi inclusi entro limiti contrattuali",
    "sla": "7 giorni bloccante / 14 giorni non bloccante",
    "notes": "Interventi e ricambi soggetti ad autorizzazione AES."
  },
  {
    "name": "CC 75 SPIS",
    "match": [
      "CC 75",
      "75 SPIS"
    ],
    "clientType": "Carabinieri",
    "status": "Attivo",
    "period": "Fornitura 75 SPIS",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 90,
    "pdf": "",
    "warranty": "Sì",
    "shipping": "Da verificare",
    "spareParts": "Gestibili secondo garanzia apparato",
    "sla": "Da contratto specifico",
    "notes": "Supporto su apparati SPIS della fornitura 75 postazioni."
  },
  {
    "name": "POLIZIE LOCALI",
    "match": [
      "POLIZIA LOCALE",
      "POLIZIA MUNICIPALE",
      "POLIZIA PROVINCIALE",
      "COMUNE"
    ],
    "clientType": "Polizia Locale / Comuni",
    "status": "Attivo se contratto sottoscritto",
    "period": "12/24/36 mesi",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 60,
    "pdf": "",
    "warranty": "Secondo contratto",
    "shipping": "Se previsto",
    "spareParts": "Secondo formula commerciale",
    "sla": "5 giorni / 10 giorni",
    "notes": "Verificare sempre formula commerciale sottoscritta dal Comune."
  },
  {
    "name": "RFI AULE SEPA",
    "match": [
      "RFI",
      "AULA SEPA",
      "SEPA"
    ],
    "clientType": "RFI",
    "status": "Attivo",
    "period": "48 mesi",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 120,
    "pdf": "",
    "warranty": "Sì",
    "shipping": "Inclusa",
    "spareParts": "Incluse salvo esclusioni",
    "sla": "2 giorni bloccante / 7 giorni non bloccante",
    "notes": "Assistenza su Aule SEPA RFI con SLA prioritari."
  },
  {
    "name": "RFI WEBVIME",
    "match": [
      "WEBVIME"
    ],
    "clientType": "RFI / Webvime",
    "status": "Attivo",
    "period": "12 mesi",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 60,
    "pdf": "",
    "warranty": "Sì",
    "shipping": "Non applicabile",
    "spareParts": "Software",
    "sla": "Secondo allegato contratto",
    "notes": "Assistenza software Webvime."
  },
  {
    "name": "SMARTFAD CARE-PACK",
    "match": [
      "SMARTFAD"
    ],
    "clientType": "SmartFAD",
    "status": "Attivo se Care-Pack sottoscritto",
    "period": "12/24/36 mesi",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 60,
    "pdf": "",
    "warranty": "Copertura danni accidentali",
    "shipping": "Andata cliente / ritorno Secom",
    "spareParts": "Riparazione o sostituzione",
    "sla": "5 giorni lavorativi",
    "notes": "Esclusi furto, manomissioni, danni dolosi e uso improprio."
  },
  {
    "name": "SEEKS / BEESCO PORTI",
    "match": [
      "SEEKS",
      "BEESCO",
      "PORTI",
      "TERMINAL",
      "VESPUCCI"
    ],
    "clientType": "Porti / EES",
    "status": "Attivo",
    "period": "12/24/36 mesi",
    "startDate": "Da verificare",
    "endDate": "Da verificare",
    "renewalAlertDays": 90,
    "pdf": "",
    "warranty": "On-center",
    "shipping": "Inclusa se in garanzia",
    "spareParts": "Riparazione o sostituzione gratuita",
    "sla": "2 giorni bloccante / 4 giorni non bloccante",
    "notes": "Fuori garanzia serve valutazione tecnica e offerta economica."
  }
]$atlas_seed$::jsonb) as item(
    name text,
    match jsonb,
    "clientType" text,
    status text,
    period text,
    "startDate" text,
    "endDate" text,
    "renewalAlertDays" integer,
    pdf text,
    warranty text,
    shipping text,
    "spareParts" text,
    sla text,
    notes text
  )
)
insert into public.atlas_contract_catalog (
  tenant_id,
  name,
  match_terms,
  client_type,
  status,
  period,
  start_date,
  end_date,
  renewal_alert_days,
  pdf,
  warranty,
  shipping,
  spare_parts,
  sla,
  notes,
  sort_order
)
select
  secom_tenant.id,
  seed.name,
  coalesce(array(select jsonb_array_elements_text(coalesce(seed.match, '[]'::jsonb))), '{}'),
  coalesce(seed."clientType", ''),
  coalesce(seed.status, 'Attivo'),
  coalesce(seed.period, ''),
  coalesce(seed."startDate", ''),
  coalesce(seed."endDate", ''),
  coalesce(seed."renewalAlertDays", 90),
  coalesce(seed.pdf, ''),
  coalesce(seed.warranty, ''),
  coalesce(seed.shipping, ''),
  coalesce(seed."spareParts", ''),
  coalesce(seed.sla, ''),
  coalesce(seed.notes, ''),
  seed.sort_order
from secom_tenant
cross join seed
on conflict (tenant_id, name) do update set
  match_terms = excluded.match_terms,
  client_type = excluded.client_type,
  status = excluded.status,
  period = excluded.period,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  renewal_alert_days = excluded.renewal_alert_days,
  pdf = excluded.pdf,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  spare_parts = excluded.spare_parts,
  sla = excluded.sla,
  notes = excluded.notes,
  sort_order = excluded.sort_order,
  updated_at = now();

with secom_tenant as (
  select id
  from public.tenants
  where slug = 'secom'
  limit 1
), seed as (
  select row_number() over () as sort_order, item.*
  from jsonb_to_recordset($atlas_seed$[
  {
    "key": "ministero-questure",
    "category": "MINISTERO DELL'INTERNO",
    "customerType": "QUESTURE",
    "parentCustomer": "MINISTERO DELL'INTERNO",
    "childCustomers": "Questure",
    "durationMonths": "N/D",
    "warrantyMonths": "N/D",
    "phoneSupport": "N/D",
    "preventiveOnsite": "N/D",
    "extraordinaryOnsite": "N/D",
    "sparePartsIncluded": "N/D",
    "blockingResponse": "N/D",
    "nonblockingResponse": "N/D",
    "pickupShipping": "N/D",
    "serviceHours": "N/D",
    "serviceDays": "N/D",
    "driveLink": "N/D",
    "commercialNotes": "",
    "summary": "Profilo ministeriale generico. Dati SLA da verificare su contratto specifico.",
    "aliases": "ministero, questure, questura, interno",
    "keywords": "ministero interno questure",
    "matchPriority": 50,
    "isActive": true
  },
  {
    "key": "ministero-ps-lazio-umbria",
    "category": "MINISTERO DELL'INTERNO",
    "customerType": "PS LAZIO/UMBRIA",
    "parentCustomer": "MINISTERO DELL'INTERNO",
    "childCustomers": "PS Lazio; PS Umbria",
    "durationMonths": "N/D",
    "warrantyMonths": "N/D",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI (fino a 100,00 € per lampade, UPS, numeratore, scheda elettronica SPIS)",
    "blockingResponse": "N/D",
    "nonblockingResponse": "N/D",
    "pickupShipping": "N/D",
    "serviceHours": "N/D",
    "serviceDays": "N/D",
    "driveLink": "N/D",
    "commercialNotes": "",
    "summary": "Assistenza telefonica e straordinaria attiva; ricambi coperti fino a soglia indicata.",
    "aliases": "ps lazio, ps umbria, polizia stato lazio, polizia stato umbria",
    "keywords": "ps lazio umbria",
    "matchPriority": 70,
    "isActive": true
  },
  {
    "key": "polizia-frontiera-spis-my",
    "category": "MINISTERO DELL'INTERNO",
    "customerType": "POLIZIA DI FRONTIERA Fornitura 2025 / SPIS MY",
    "parentCustomer": "MINISTERO DELL'INTERNO",
    "childCustomers": "Polizia di Frontiera",
    "durationMonths": "36",
    "warrantyMonths": "24",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI",
    "blockingResponse": "12 ORE",
    "nonblockingResponse": "24 ORE",
    "pickupShipping": "SI",
    "serviceHours": "9:00-18:00 e Sabato 9:00-13:00",
    "serviceDays": "Lun-Sab fino alle 13:00",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Contratto Frontiere SPIS MY con assistenza telefonica, straordinaria, ricambi e ritiro/spedizione inclusi.",
    "aliases": "frontiere, polizia frontiera, spis my frontiere",
    "keywords": "frontiera frontiere spis my",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "polizia-ferroviaria-spis-my",
    "category": "MINISTERO DELL'INTERNO",
    "customerType": "POLIZIA FERROVIARIA Fornitura 2026 / SPIS MY",
    "parentCustomer": "MINISTERO DELL'INTERNO",
    "childCustomers": "Polizia Ferroviaria; POLFER",
    "durationMonths": "24",
    "warrantyMonths": "24",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI",
    "blockingResponse": "7",
    "nonblockingResponse": "14",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Contratto POLFER SPIS MY: ricambi, intervento straordinario e ritiro/spedizione inclusi.",
    "aliases": "polfer, polizia ferroviaria, spis my",
    "keywords": "polfer ferroviaria spis my",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "hotspot-albania-2024-2026",
    "category": "MINISTERO DELL'INTERNO",
    "customerType": "HOTSPOT ALBANIA 2024-2026",
    "parentCustomer": "MINISTERO DELL'INTERNO",
    "childCustomers": "Hotspot Albania",
    "durationMonths": "24",
    "warrantyMonths": "SCADUTA",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI",
    "blockingResponse": "5",
    "nonblockingResponse": "10",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Hotspot Albania: garanzia scaduta, assistenza telefonica e straordinaria attive.",
    "aliases": "albania, hotspot albania",
    "keywords": "hotspot albania",
    "matchPriority": 70,
    "isActive": true
  },
  {
    "key": "carabinieri-provinciali-gruppo-vecchio-spis",
    "category": "CARABINIERI",
    "customerType": "CARABINIERI PROVINCIALI/GRUPPO VECCHIO SPIS contratto triennale 2024-2026",
    "parentCustomer": "CARABINIERI",
    "childCustomers": "Comandi Provinciali; Gruppi Carabinieri",
    "durationMonths": "12",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI, solo Comandi Provinciali e Gruppo",
    "extraordinaryOnsite": "SI, previa autorizzazione dell'uff. AES",
    "sparePartsIncluded": "Decurtabili fino a 80K € annui, per determinati componenti come da nota allegata",
    "blockingResponse": "7?",
    "nonblockingResponse": "14?",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Vecchio SPIS per Provinciali/Gruppi: manutenzione preventiva prevista solo per Comandi Provinciali e Gruppi; straordinaria previa autorizzazione AES.",
    "aliases": "carabinieri provinciali, comando provinciale carabinieri, gruppo carabinieri, com prov cc",
    "keywords": "carabinieri provinciale gruppo vecchio spis",
    "matchPriority": 95,
    "isActive": true
  },
  {
    "key": "carabinieri-compagnie-vecchio-spis",
    "category": "CARABINIERI",
    "customerType": "CARABINIERI COMPAGNIE VECCHIO SPIS contratto triennale 2024-2026",
    "parentCustomer": "CARABINIERI",
    "childCustomers": "Compagnie Carabinieri; Tenenze; Stazioni se agganciate a Compagnia",
    "durationMonths": "12",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI, previa autorizzazione dell'uff. AES",
    "sparePartsIncluded": "Decurtabili fino a 80K € annui, per determinati componenti come da nota allegata",
    "blockingResponse": "7?",
    "nonblockingResponse": "14?",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Vecchio SPIS per Compagnie: nessuna preventiva, straordinaria previa autorizzazione AES, ricambi decurtabili dal plafond.",
    "aliases": "compagnia carabinieri, comp cc, comp. cc, tenenza carabinieri, stazione carabinieri",
    "keywords": "carabinieri compagnie vecchio spis",
    "matchPriority": 100,
    "isActive": true
  },
  {
    "key": "carabinieri-nuovo-spis-my",
    "category": "CARABINIERI",
    "customerType": "CARABINIERI NUOVO SPIS MY - PENISOLA ESCLUSA",
    "parentCustomer": "CARABINIERI",
    "childCustomers": "Nuovo SPIS MY Carabinieri",
    "durationMonths": "24",
    "warrantyMonths": "24",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI",
    "blockingResponse": "7?",
    "nonblockingResponse": "14?",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Nuovo SPIS MY Carabinieri con 24 mesi di garanzia, ricambi e spedizione inclusi.",
    "aliases": "carabinieri nuovo spis my",
    "keywords": "carabinieri nuovo spis my",
    "matchPriority": 90,
    "isActive": true
  },
  {
    "key": "comuni-polizia-locale",
    "category": "COMUNI",
    "customerType": "POLIZIA LOCALE/MUNICIPALE/PROVINCIALE",
    "parentCustomer": "COMUNI",
    "childCustomers": "Polizia Locale; Polizia Municipale; Polizia Provinciale",
    "durationMonths": "12/24/36",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI, nr. 2 annuali, 1 a semestre",
    "extraordinaryOnsite": "SI, nr. 1 annuale",
    "sparePartsIncluded": "SI",
    "blockingResponse": "Non definito < 5gg",
    "nonblockingResponse": "Non definito < 10gg",
    "pickupShipping": "SI",
    "serviceHours": "9:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Comuni/Polizie locali: due preventive annuali, una straordinaria annuale, ricambi e spedizione inclusi.",
    "aliases": "comuni, polizia locale, polizia municipale, polizia provinciale",
    "keywords": "comuni polizia locale municipale provinciale",
    "matchPriority": 90,
    "isActive": true
  },
  {
    "key": "estero-san-marino-gendarmeria",
    "category": "ESTERO",
    "customerType": "SAN MARINO - GENDARMERIA",
    "parentCustomer": "ESTERO",
    "childCustomers": "San Marino; Gendarmeria",
    "durationMonths": "12",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI, nr. 2 annuali, 1 a semestre",
    "extraordinaryOnsite": "SI, nr. 1 annuale",
    "sparePartsIncluded": "SI",
    "blockingResponse": "Non definito < 5gg",
    "nonblockingResponse": "Non definito < 10gg",
    "pickupShipping": "SI",
    "serviceHours": "9:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "Gendarmeria San Marino: preventive semestrali, straordinaria annuale, ricambi inclusi.",
    "aliases": "san marino, gendarmeria",
    "keywords": "san marino gendarmeria",
    "matchPriority": 80,
    "isActive": true
  },
  {
    "key": "rfi-aula-sepa",
    "category": "RFI",
    "customerType": "AULA SEPA",
    "parentCustomer": "RFI",
    "childCustomers": "Aula SEPA",
    "durationMonths": "48",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI, nr. 2 annuali, 1 a semestre",
    "extraordinaryOnsite": "SI",
    "sparePartsIncluded": "SI (ad esclusione di quanto riportato nell'allegato)",
    "blockingResponse": "2",
    "nonblockingResponse": "7",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "RFI Aula SEPA: SLA stretto, preventive semestrali, ricambi secondo allegato.",
    "aliases": "rfi, aula sepa, sepa",
    "keywords": "rfi aula sepa",
    "matchPriority": 90,
    "isActive": true
  },
  {
    "key": "rfi-webvime",
    "category": "RFI",
    "customerType": "WEBVIME",
    "parentCustomer": "RFI",
    "childCustomers": "Webvime",
    "durationMonths": "12",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "SI, come da allegato contratto",
    "sparePartsIncluded": "NO",
    "blockingResponse": "—",
    "nonblockingResponse": "—",
    "pickupShipping": "—",
    "serviceHours": "8:00 - 18:00",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "WEBVIME: assistenza telefonica e straordinaria secondo allegato, ricambi esclusi.",
    "aliases": "webvime, rfi webvime",
    "keywords": "webvime rfi",
    "matchPriority": 95,
    "isActive": true
  },
  {
    "key": "pa-privato-smartfad",
    "category": "PA/PRIVATO",
    "customerType": "SMARTFAD care-pack",
    "parentCustomer": "PA/PRIVATO",
    "childCustomers": "SmartFAD",
    "durationMonths": "12/24/36",
    "warrantyMonths": "—",
    "phoneSupport": "SI",
    "preventiveOnsite": "NO",
    "extraordinaryOnsite": "NO",
    "sparePartsIncluded": "SI",
    "blockingResponse": "7",
    "nonblockingResponse": "14",
    "pickupShipping": "SI",
    "serviceHours": "09:00/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "",
    "summary": "SmartFAD care-pack: ricambi e spedizione inclusi, nessun intervento on-site programmato.",
    "aliases": "smartfad, care pack, pa privato",
    "keywords": "smartfad care-pack",
    "matchPriority": 75,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-genova",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO GENOVA",
    "parentCustomer": "PORTI",
    "childCustomers": "Genova",
    "durationMonths": "12",
    "warrantyMonths": "12",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:27",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Genova: preventiva inclusa, straordinaria non obbligatoria, sostituzione componenti danneggiate.",
    "aliases": "porti, seeks, beesco, genova",
    "keywords": "seeks beesco genova porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-trieste",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO TRIESTE",
    "parentCustomer": "PORTI",
    "childCustomers": "Trieste",
    "durationMonths": "36",
    "warrantyMonths": "36",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:28",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Trieste: garanzia 36 mesi, preventiva inclusa, sostituzione sole componenti danneggiate.",
    "aliases": "porti, seeks, beesco, trieste",
    "keywords": "seeks beesco trieste porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-savona-t2",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO SAVONA T2",
    "parentCustomer": "PORTI",
    "childCustomers": "Savona T2",
    "durationMonths": "24",
    "warrantyMonths": "24",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:29",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Savona T2: garanzia 24 mesi, preventiva inclusa, sostituzione componenti danneggiate.",
    "aliases": "porti, seeks, beesco, savona t2",
    "keywords": "seeks beesco savona t2 porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-savona-t1",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO SAVONA T1",
    "parentCustomer": "PORTI",
    "childCustomers": "Savona T1",
    "durationMonths": "24",
    "warrantyMonths": "24",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:30",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Savona T1: garanzia 24 mesi, preventiva inclusa, sostituzione componenti danneggiate.",
    "aliases": "porti, seeks, beesco, savona t1",
    "keywords": "seeks beesco savona t1 porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-civitavecchia-vespucci-arrivi",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO CIVITAVECCHIA VESPUCCI ARRIVI",
    "parentCustomer": "PORTI",
    "childCustomers": "Civitavecchia Vespucci Arrivi",
    "durationMonths": "12",
    "warrantyMonths": "12",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:31",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Civitavecchia Vespucci Arrivi: garanzia 12 mesi, preventiva inclusa.",
    "aliases": "porti, seeks, beesco, civitavecchia, vespucci arrivi",
    "keywords": "seeks beesco civitavecchia vespucci arrivi porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-civitavecchia-vespucci-partenze",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO CIVITAVECCHIA VESPUCCI PARTENZE",
    "parentCustomer": "PORTI",
    "childCustomers": "Civitavecchia Vespucci Partenze",
    "durationMonths": "12",
    "warrantyMonths": "12",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:32",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Civitavecchia Vespucci Partenze: garanzia 12 mesi, preventiva inclusa.",
    "aliases": "porti, seeks, beesco, civitavecchia, vespucci partenze",
    "keywords": "seeks beesco civitavecchia vespucci partenze porti",
    "matchPriority": 85,
    "isActive": true
  },
  {
    "key": "porti-seeeks-beesco-civitavecchia-bramante",
    "category": "PORTI",
    "customerType": "SEEKS/BEESCO CIVITAVECCHIA BRAMANTE",
    "parentCustomer": "PORTI",
    "childCustomers": "Civitavecchia Bramante",
    "durationMonths": "12",
    "warrantyMonths": "12",
    "phoneSupport": "SI",
    "preventiveOnsite": "SI",
    "extraordinaryOnsite": "NON OBBLIGATORIO",
    "sparePartsIncluded": "Sostituzione delle sole componenti danneggiate",
    "blockingResponse": "2",
    "nonblockingResponse": "4",
    "pickupShipping": "SI",
    "serviceHours": "08:30/17:33",
    "serviceDays": "Lun-Ven (festivi esclusi)",
    "driveLink": "",
    "commercialNotes": "Parti guaste coperte da garanzia non includono l'intervento tecnico se non previsto da contratto. Costi di spedizione a carico del cliente.",
    "summary": "PORTI Civitavecchia Bramante: garanzia 12 mesi, preventiva inclusa.",
    "aliases": "porti, seeks, beesco, civitavecchia, bramante",
    "keywords": "seeks beesco civitavecchia bramante porti",
    "matchPriority": 85,
    "isActive": true
  }
]$atlas_seed$::jsonb) as item(
    key text,
    category text,
    "customerType" text,
    "durationMonths" text,
    "warrantyMonths" text,
    "phoneSupport" text,
    "preventiveOnsite" text,
    "extraordinaryOnsite" text,
    "sparePartsIncluded" text,
    "blockingResponse" text,
    "nonblockingResponse" text,
    "pickupShipping" text,
    "serviceHours" text,
    "serviceDays" text,
    "driveLink" text,
    "commercialNotes" text,
    summary text,
    aliases text,
    keywords text,
    "matchPriority" integer,
    "parentCustomer" text,
    "childCustomers" text,
    "isActive" boolean
  )
)
insert into public.atlas_contract_sla_profiles (
  tenant_id,
  profile_key,
  category,
  customer_type,
  duration_months,
  warranty_months,
  phone_support,
  preventive_onsite,
  extraordinary_onsite,
  spare_parts_included,
  blocking_response,
  nonblocking_response,
  pickup_shipping,
  service_hours,
  service_days,
  drive_link,
  commercial_notes,
  summary,
  aliases,
  keywords,
  match_priority,
  parent_customer,
  child_customers,
  is_active,
  sort_order
)
select
  secom_tenant.id,
  seed.key,
  coalesce(seed.category, ''),
  coalesce(seed."customerType", ''),
  coalesce(seed."durationMonths", ''),
  coalesce(seed."warrantyMonths", ''),
  coalesce(seed."phoneSupport", ''),
  coalesce(seed."preventiveOnsite", ''),
  coalesce(seed."extraordinaryOnsite", ''),
  coalesce(seed."sparePartsIncluded", ''),
  coalesce(seed."blockingResponse", ''),
  coalesce(seed."nonblockingResponse", ''),
  coalesce(seed."pickupShipping", ''),
  coalesce(seed."serviceHours", ''),
  coalesce(seed."serviceDays", ''),
  coalesce(seed."driveLink", ''),
  coalesce(seed."commercialNotes", ''),
  coalesce(seed.summary, ''),
  coalesce(seed.aliases, ''),
  coalesce(seed.keywords, ''),
  coalesce(seed."matchPriority", 0),
  coalesce(seed."parentCustomer", ''),
  coalesce(seed."childCustomers", ''),
  coalesce(seed."isActive", true),
  seed.sort_order
from secom_tenant
cross join seed
on conflict (tenant_id, profile_key) do update set
  category = excluded.category,
  customer_type = excluded.customer_type,
  duration_months = excluded.duration_months,
  warranty_months = excluded.warranty_months,
  phone_support = excluded.phone_support,
  preventive_onsite = excluded.preventive_onsite,
  extraordinary_onsite = excluded.extraordinary_onsite,
  spare_parts_included = excluded.spare_parts_included,
  blocking_response = excluded.blocking_response,
  nonblocking_response = excluded.nonblocking_response,
  pickup_shipping = excluded.pickup_shipping,
  service_hours = excluded.service_hours,
  service_days = excluded.service_days,
  drive_link = excluded.drive_link,
  commercial_notes = excluded.commercial_notes,
  summary = excluded.summary,
  aliases = excluded.aliases,
  keywords = excluded.keywords,
  match_priority = excluded.match_priority,
  parent_customer = excluded.parent_customer,
  child_customers = excluded.child_customers,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

with secom_tenant as (
  select id
  from public.tenants
  where slug = 'secom'
  limit 1
)
insert into public.atlas_contract_budgets (
  tenant_id,
  contract_name,
  entity,
  value,
  notes
)
select
  secom_tenant.id,
  'CARABINIERI ASSISTENZA 2024-2026',
  'Carabinieri',
  49043.00,
  'Budget iniziale collegato al contratto Carabinieri Assistenza 2024-2026'
from secom_tenant
on conflict (tenant_id, contract_name) do update set
  entity = excluded.entity,
  value = excluded.value,
  notes = excluded.notes,
  updated_at = now();

commit;

/*
Rollback completo:

begin;

drop trigger if exists atlas_contract_budgets_validate_contract on public.atlas_contract_budgets;
drop trigger if exists atlas_contract_budgets_touch_updated_at on public.atlas_contract_budgets;
drop trigger if exists atlas_contract_sla_profiles_touch_updated_at on public.atlas_contract_sla_profiles;
drop trigger if exists atlas_contract_catalog_touch_updated_at on public.atlas_contract_catalog;

drop policy if exists atlas_contract_budgets_delete on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_update on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_insert on public.atlas_contract_budgets;
drop policy if exists atlas_contract_budgets_select on public.atlas_contract_budgets;

drop policy if exists atlas_contract_sla_profiles_delete on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_update on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_insert on public.atlas_contract_sla_profiles;
drop policy if exists atlas_contract_sla_profiles_select on public.atlas_contract_sla_profiles;

drop policy if exists atlas_contract_catalog_delete on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_update on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_insert on public.atlas_contract_catalog;
drop policy if exists atlas_contract_catalog_select on public.atlas_contract_catalog;

drop table if exists public.atlas_contract_budgets;
drop table if exists public.atlas_contract_sla_profiles;
drop table if exists public.atlas_contract_catalog;

drop function if exists public.atlas_contract_budget_validate_contract();
drop function if exists public.atlas_contract_catalog_touch_updated_at();
drop function if exists public.atlas_contract_catalog_can_manage(uuid);
drop function if exists public.atlas_contract_catalog_can_read(uuid);
drop function if exists public.atlas_contract_catalog_current_role(uuid);

commit;
*/
