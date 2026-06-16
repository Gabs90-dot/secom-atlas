# SECOM ATLAS - CTO SaaS Audit Report

Date: 2026-06-11
Scope: full codebase review, read-only analysis plus documentation update.
Stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, GLPI.

## Executive Summary

SECOM ATLAS has the base of a strong technical CRM: tenant model, GLPI sync, tickets,
customer workspace, manuals, users, contracts, dashboard, map, Webvime, and to-do flows.
The main risk is not missing ambition: it is concentration of too much product and business
logic in a few very large client files, plus admin API routes that use privileged server
capabilities without a consistent authorization layer.

Highest impact order:

1. Secure all admin/API routes before expanding features.
2. Stabilize runtime crash vectors and localStorage parsing.
3. Split `app/page.tsx` into feature modules without changing behavior.
4. Normalize shared UI and domain types to remove duplication and `any`.
5. Optimize Supabase and GLPI sync queries.
6. Improve mobile workflows for field technicians and customer users.
7. Add SaaS-grade features: SLA cockpit, dispatch board, assets, customer portal, automation.

## 1. Feature Incomplete

### Impact P0 - Security and Operations

- Admin route authorization is incomplete. Some routes validate bearer token and roles; many do not.
- Audit log is missing for privileged actions: user invite/delete, GLPI sync, contract edits, followups.
- Permission model exists but is not enforced consistently at API boundary.
- Tenant isolation is mostly present in queries, but must be enforced centrally.

### Impact P1 - Technical CRM Differentiators

- SLA engine is present as contract data, but not yet a real SLA clock with breach prediction.
- Dispatch planning is present, but not a full board with technician capacity, route planning, and reassignment.
- Asset lifecycle is partial: customer assets exist, but no full maintenance history, warranty state, parts consumption, or recurring interventions.
- Customer portal exists, but should be expanded with ticket creation, asset visibility, manuals, and SLA status.
- Manual/document center exists, but needs versioning, expiry, access rules, and entity-level visibility.
- AI insights are local rule-based. Useful, but not yet a workflow engine with assignments and explanations.
- To-do list exists, but should become operational task management tied to tickets/customers/assets.

### Impact P2 - SaaS Product Maturity

- No onboarding checklist for new tenants/customers.
- No billing/subscription model in code.
- No feature flags per tenant.
- No product analytics/events.
- README is still the default Next.js template.
- App metadata still says "Create Next App".

## 2. Codice Tecnico A Rischio

### P0 - Security-sensitive route patterns

Routes using service role or privileged operations without consistent auth/role gate:

- `app/api/admin/contract-profiles/route.ts`
- `app/api/admin/customer-contract-links/route.ts`
- `app/api/admin/help-queries/route.ts`
- `app/api/admin/rebuild-ticket-entity-links/route.ts`
- `app/api/admin/glpi-sync-db/route.ts`
- `app/api/admin/glpi-sync-entities/route.ts`
- `app/api/admin/glpi-auto-sync/route.ts`
- `app/api/admin/glpi-import/batch/route.ts`
- `app/api/admin/glpi-add-followup/route.ts`

Routes with better pattern to reuse:

- `app/api/admin/invite-user/route.ts`
- `app/api/admin/delete-user/route.ts`
- `app/api/admin/customer-registration-codes/route.ts`

Recommended action:

- Create a shared server helper like `requireAdminUser(request, allowedRoles)`.
- Never create a service-role client before the request user is authenticated and authorized.
- Log privileged mutations to an `audit_events` table, after schema approval.

### P0 - Runtime crash vectors

Potential white page / crash sources:

- `app/page.tsx` uses multiple `JSON.parse(localStorage.getItem(...))` calls without try/catch around several keys:
  - `atlas-contract-overrides`
  - `atlas-inventory`
  - `atlas-contacts`
  - `atlas-ticket-types`
- `app/page.tsx` parses `atlas-ticket-types` inside ticket mapping. Corrupt localStorage can crash load.
- `components/atlas/GlpiImportCenter.tsx` parses saved import state. It has try/catch on initial load but storage size/corruption still deserves central helper.
- `lib/supabase.ts` uses non-null env assertions. Missing public env can crash client initialization.
- `useAtlasAuth()` falls back to creating local auth state if no provider exists. This can create duplicate auth listeners if components use it outside provider.

Recommended action:

- Add safe storage helpers: `readJsonStorage`, `writeJsonStorage`.
- Validate env at boot with clear error UI.
- Ensure `AtlasAuthProvider` wraps all app entry points and remove fallback auth state where possible.

### P1 - Build/lint instability

`npm run lint` currently fails:

- 522 total problems.
- `OLD_glpiSyncEngine.ts` appears binary to ESLint.
- Heavy use of `any`.
- React hook warnings and set-state-in-effect errors.
- Unused imports/state in `app/page.tsx`.

Recommended action:

- Exclude archive/broken files from lint or move them outside source.
- Fix P0 runtime/security first, then progressively remove `any`.

### P1 - GLPI sync fragility

Files:

- `services/glpiSyncEngine.ts`
- `services/glpiHistoricalImport.ts`
- `services/glpiEntitySyncEngine.ts`
- `services/glpi.ts`
- `services/glpiSyncEngine_CURRENT_BROKEN.ts`
- `OLD_glpiSyncEngine.ts`

Risks:

- Multiple sync engines and old/broken files create ambiguity.
- Sync does sequential per-ticket queries and event imports.
- Historical import resolves customers/sites inside the loop, causing repeated queries.
- Some GLPI operations use REST; `glpi-add-followup` writes directly to MySQL.

Recommended action:

- Declare one canonical sync path.
- Move legacy/broken files to a documented archive excluded from build/lint.
- Cache tenant/customer/site lookup data per import batch.
- Add idempotency and audit logs for GLPI writes.

## 3. Componenti Troppo Grandi

Largest files by line count:

| File | Lines | Risk |
| --- | ---: | --- |
| `app/page.tsx` | 7017 | App shell, routing, storage, forms, tickets, contracts, calendar, mobile views all together |
| `components/atlas/WebvimeBoard.tsx` | 1633 | Ticket list, analytics, help editor, export, modals in one component |
| `components/atlas/CustomerWorkspace.tsx` | 1481 | Customer overview, assets, users, manuals, timeline, modals |
| `components/atlas/TicketWorkspace.tsx` | 982 | Ticket details, events, GLPI conversation, status workflow |
| `lib/systemsCatalog.ts` | 977 | Large static catalog in TS bundle |
| `components/atlas/UserManagementCenter.tsx` | 712 | Users, roles, permissions, invite/delete flows |
| `components/atlas/TicketRegistry.tsx` | 675 | Filtering, mobile/desktop ticket cards, pagination |
| `components/atlas/KPIDashboard.tsx` | 617 | Metrics and chart-like UI from client arrays |
| `components/atlas/CustomerCommandCenter.tsx` | 611 | Customer entity command logic |
| `components/atlas/ContractsBoard.tsx` | 579 | Contract board, export/print, profile loading |

Recommended split order:

1. `app/page.tsx`: extract auth screens, app shell/navigation, ticket form state, calendar state, contract state.
2. `WebvimeBoard`: split list, analytics, help center, editor modal.
3. `CustomerWorkspace`: split assets, manuals, users, timeline.
4. `TicketWorkspace`: split GLPI conversation, lifecycle, attachments/events.

## 4. Tabelle Supabase Da Ottimizzare

Observed tables in code:

- `tickets`
- `ticket_events`
- `sites`
- `customers`
- `customer_entities`
- `tenant_users`
- `tenants`
- `roles`
- `permissions`
- `role_permissions`
- `user_permission_overrides`
- `customer_registration_codes`
- `customer_contract_links`
- `contract_profiles`
- `customer_assets`
- `manuals`
- `todo_tasks`
- `help_queries`
- `glpi_ticket_mappings`
- `glpi_import_runs`
- `glpi_import_errors`
- `glpi_sync_state`
- `customer_aliases`

Likely index candidates, pending schema review and authorization:

- `tickets(tenant_id, opened_at desc)`
- `tickets(tenant_id, glpi_ticket_id)`
- `tickets(tenant_id, source, imported_at desc)`
- `tickets(tenant_id, customer_id)`
- `tickets(tenant_id, site_id)`
- `tickets(tenant_id, status)`
- `ticket_events(ticket_id, created_at desc)`
- `ticket_events(tenant_id, customer_id, created_at desc)`
- `sites(tenant_id, customer_id)`
- `sites(tenant_id, name)`
- `customer_entities(tenant_id, is_active, complete_name)`
- `tenant_users(tenant_id, user_id)`
- `tenant_users(tenant_id, email)`
- `customer_registration_codes(tenant_id, customer_id, code)`
- `glpi_ticket_mappings(tenant_id, glpi_ticket_id)`
- `customer_contract_links(tenant_id, glpi_entity_id)`
- `todo_tasks(status, created_at desc)` or tenant-scoped equivalent if multi-tenant is added.

No schema change should be made before confirming current Supabase DDL and production data volume.

## 5. Query Lente

High-risk query patterns:

- `app/page.tsx`: loads sites, customers, customer_entities and up to 500 tickets on tenant switch.
- `components/atlas/WebvimeBoard.tsx`: loads 1000 GLPI/Webvime tickets plus multiple count queries.
- `components/atlas/TodoListPanel.tsx`: loads 1000 tasks and filters client-side.
- `components/atlas/UserManagementCenter.tsx`: loads all role permissions and overrides without tenant scoping in some calls.
- `components/atlas/CustomerWorkspace.tsx`: multiple effects load assets, manuals, access codes, users, events separately.
- `services/glpiSyncEngine.ts`: per-ticket select/update/insert/upsert plus followups and solutions.
- `services/glpiHistoricalImport.ts`: repeated alias/customer/site lookups inside import flow.
- `components/AtlasMap.tsx`: for every site, scans all tickets to find matches.

Recommended action:

- Add server/query service layer per domain.
- Use pagination and server-side filters for large lists.
- Cache lookup tables during sync/import.
- Build maps once in memory where client arrays are unavoidable.
- Add React Query/SWR-like caching pattern or a small internal hook layer.

## 6. Possibili Problemi Mobile

Risks:

- Large desktop-first pages are manually mirrored with mobile sections in `app/page.tsx`, causing duplicated logic.
- Wide forms and tables risk horizontal overflow.
- Calendar, map, contract board, systems catalog, and user management are dense for mobile.
- Modals use large rounded panels and fixed-ish max widths; some flows may exceed small screens.
- Leaflet map area has fixed height around 680px and may dominate mobile viewport.
- Many buttons use long Italian labels; small screens may wrap unpredictably.
- `window.open`, print views, CSV download flows are less useful on mobile.

Recommended mobile-first improvements:

- Field technician home: "My next jobs", "Urgent", "Take/close ticket", "Call customer", "Open map".
- Customer portal home: "Open ticket", "My assets", "Manuals", "SLA status".
- Replace large tables with searchable cards and bottom sheets.
- Add sticky action bars for ticket workflows.
- Make map optional behind a tab/list toggle on mobile.

## 7. Possibili Problemi Sicurezza

P0:

- Admin APIs without authentication/authorization.
- Service-role usage without a shared guard.
- GLPI followup route can write directly to GLPI DB with only `ticketId` and `content`.
- Tenant ID is accepted from body/query/env in several privileged routes; must be checked against requester membership.
- Help queries API stores and returns SQL/procedure text without visible auth guard.

P1:

- Registration endpoint exposes customer list publicly. It is partially controlled, but should be reviewed for tenant/customer information leakage.
- Client-side role/module visibility is not enough; API must enforce permissions.
- Logs include emails and request metadata in invite route.
- No rate limiting for auth/register/invite/admin sync endpoints.
- No audit event trail for privileged mutations.

Recommended action:

- Implement centralized server auth guard.
- Enforce permission keys server-side, not only UI.
- Add rate limits to public and admin endpoints.
- Add audit logging for admin and GLPI mutations.
- Redact sensitive logs.

## Crash / White Page / Undefined / Null Bug List

### P0 - Can crash UI

- Corrupt localStorage JSON in `app/page.tsx` can throw during mount.
- Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` can crash client Supabase setup.
- `OLD_glpiSyncEngine.ts` breaks lint because it appears binary.
- Client arrays typed as `any[]` allow runtime mismatch across ticket/customer/site shapes.

### P1 - Can crash route or produce 500

- API routes call `request.json()` in many places and assume payload shape.
- `contract-profiles` and similar admin routes pass arbitrary body fields to Supabase.
- GLPI API response shape is normalized defensively in some files, but not consistently.
- `glpi-add-followup` assumes GLPI DB credentials and schema are available.
- `create-ticket` builds HTML content without escaping payload values.

### P1 - Can create stale state or React warnings

- Effects call async loaders and set state after awaited calls without abort/mounted checks.
- `WebvimeBoard` has lint errors for state updates called from effects.
- Some `setTimeout` calls are not cleared on unmount.
- `useAtlasAuth` fallback can create additional listeners outside provider.

### P2 - Undefined/null data shape risks

- Ticket shape uses both snake_case and camelCase throughout (`glpi_ticket_id`/`glpiTicketId`, `site_id`/`siteId`).
- Role names include `cliente`, `cliente_user`, `cliente_admin`; some checks use only `cliente`.
- `tenantId` can come from env fallback, body, query, or active tenant; inconsistent source of truth.
- `customer_id`, `site_id`, `customer_entity_id` are often optional and not always guarded before queries.

## New Features Ordered By Impact

### P0 - Core Technical CRM

1. SLA cockpit: live SLA status, breach countdown, customer/contract-based timers.
2. Dispatch board: drag-and-drop assignment, technician capacity, urgent queue, planned calendar.
3. Customer 360: tickets, assets, contracts, manuals, contacts, GLPI history in one normalized view.
4. Field technician mobile workflow: accept job, navigate, add notes/photos, close ticket.
5. Asset registry: serials, warranty, installed site, maintenance history, spare parts.

### P1 - Operational Leverage

6. Preventive maintenance planner with recurring schedules.
7. Smart GLPI reconciliation: duplicate detection, entity matching confidence, import review queue.
8. Notification center: SLA breach, urgent unassigned, customer replies, expiring contracts.
9. Customer portal ticket creation with asset/manual context.
10. Audit timeline for every customer/ticket/admin action.

### P2 - SaaS Scale

11. Tenant feature flags and per-role module licensing.
12. Reporting exports per customer/period/SLA.
13. Knowledge base linked to ticket categories.
14. Technician workload forecasting.
15. Product analytics: activation, time-to-close, dispatch latency.

## UX Improvements Ordered By Impact

1. Create role-specific home dashboards: admin, dispatcher, technician, customer.
2. Convert large global navigation into task-first flows.
3. Add command/search palette for tickets, customers, sites, GLPI IDs.
4. Use consistent empty/loading/error states.
5. Move destructive actions into consistent confirmation modals.
6. Add mobile bottom sheets for ticket actions.
7. Standardize cards, buttons, badges, modals, forms in one design system.
8. Add saved filters and views for dispatch/ticket registry.
9. Add inline validation before API calls.
10. Add skeleton loading for large panels.

## Database Improvements Ordered By Impact

1. Review and add indexes for tenant-scoped ticket/event/customer queries.
2. Add audit events table, after authorization.
3. Normalize ticket status/category enums.
4. Add asset lifecycle tables or columns, after authorization.
5. Add SLA policy tables linked to contracts.
6. Add job/assignment table separate from ticket if dispatch becomes complex.
7. Add tenant feature flags and module settings.
8. Add material/stock movements instead of only local inventory.

## Permission Improvements Ordered By Impact

1. Central server-side route guard.
2. Permission enforcement in every mutation route.
3. Tenant membership validation for every tenant ID received from client.
4. Permission matrix with module/action/resource scope.
5. Customer users scoped to customer/entity/site in API queries.
6. Audit privileged operations.
7. Rate limits for invite/register/sync endpoints.

## Performance Improvements Ordered By Impact

1. Remove base64 image from `app/page.tsx`; use `public` asset import/path.
2. Split `app/page.tsx` and lazy load feature views by active tab.
3. Replace client-side large list filtering with server pagination.
4. Cache lookup data during GLPI sync/import.
5. Index hot Supabase queries after schema review.
6. Build site-ticket maps once for map rendering.
7. Virtualize long ticket/customer/manual lists.
8. Move static catalogs out of the main client bundle where possible.

## AGENTS.md Recommendation

The proposed AGENTS.md rules make sense and should remain in the repo.
They are especially important here because the app uses a newer Next.js version and has
security-sensitive integrations. The file should keep these rules:

- No new `any`.
- Mobile first.
- Do not break existing components.
- Maintain GLPI compatibility.
- Prefer reusable components.
- Do not modify DB schema without authorization.
- Validate auth/role before service-role access.
- Preserve tenant isolation.

## Recommended Execution Plan

### Phase 1 - Safety First

1. Add shared admin auth helper.
2. Protect all admin routes.
3. Add safe JSON storage helpers.
4. Remove or exclude broken/old files from lint.

### Phase 2 - Stabilize Product Core

1. Extract app shell and feature views from `app/page.tsx`.
2. Normalize ticket/customer/site types.
3. Consolidate duplicated UI components.
4. Add consistent loading/error states.

### Phase 3 - Performance and Scale

1. Optimize GLPI sync and historical import.
2. Add pagination/server filters.
3. Prepare index migrations for approval.
4. Add audit logging after schema approval.

### Phase 4 - CRM Differentiation

1. SLA cockpit.
2. Dispatch board.
3. Field technician mobile flow.
4. Asset lifecycle.
5. Customer portal expansion.
