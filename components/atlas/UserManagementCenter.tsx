"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  Trash2,
  X,
} from "lucide-react";

type UserManagementCenterProps = {
  tenant: any | null;
  currentUser: any | null;
  executiveMode?: boolean;
};

type TenantUser = {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  email: string;
  display_name?: string | null;
  role: string;
  role_id?: string | null;
  status: string;
  last_login_at?: string | null;
  notes?: string | null;
};

type Role = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
};

type Permission = {
  id: string;
  key: string;
  name: string;
  module: string;
  description?: string | null;
};

const roleTone: Record<string, string> = {
  super_admin: "border-red-500/30 bg-red-500/15 text-red-200",
  admin: "border-blue-500/30 bg-blue-500/15 text-blue-200",
  manager: "border-violet-500/30 bg-violet-500/15 text-violet-200",
  dispatcher: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  tecnico: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  commerciale: "border-cyan-500/30 bg-cyan-500/15 text-cyan-200",
  cliente_admin: "border-pink-500/30 bg-pink-500/15 text-pink-200",
  cliente_user: "border-slate-500/30 bg-slate-500/15 text-slate-200",
};

const SAFE_DEFAULT_ROLE = "cliente_user";

function normalizeRoleKey(value?: string | null) {
  const role = String(value || "").trim();
  return role || SAFE_DEFAULT_ROLE;
}

function isFallbackRole(role?: Role | null) {
  return Boolean(role?.id?.startsWith("fallback-"));
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Mai";
  try {
    return new Date(value).toLocaleString("it-IT");
  } catch {
    return String(value);
  }
}

function moduleLabel(module: string) {
  const labels: Record<string, string> = {
    home: "Home",
    dispatch: "Dispatch",
    activity: "Activity",
    analytics: "Analytics",
    ai: "AI",
    operativo: "Operativo",
    tickets: "Ticket",
    calendar: "Calendario",
    map: "Mappa",
    registry: "Registro",
    customers: "Clienti",
    contracts: "Contratti",
    budget: "Budget",
    assets: "Asset/Sistemi",
    inventory: "Magazzino",
    contacts: "Contatti",
    customer_portal: "Customer Portal",
    users: "Utenti",
  };

  return labels[module] || module;
}

export default function UserManagementCenter({ tenant, currentUser, executiveMode = false }: UserManagementCenterProps) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", display_name: "", role: "cliente_user", status: "active", mode: "email_invite", temporaryPassword: "" });
  const [inviteMessage, setInviteMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const fallbackRoles: Role[] = [
    { id: "fallback-super-admin", key: "super_admin", name: "Super Admin" },
    { id: "fallback-admin", key: "admin", name: "Admin" },
    { id: "fallback-manager", key: "manager", name: "Manager" },
    { id: "fallback-dispatcher", key: "dispatcher", name: "Dispatcher" },
    { id: "fallback-tecnico", key: "tecnico", name: "Tecnico" },
    { id: "fallback-commerciale", key: "commerciale", name: "Commerciale" },
    { id: "fallback-cliente-admin", key: "cliente_admin", name: "Cliente Admin" },
    { id: "fallback-cliente-user", key: "cliente_user", name: "Cliente User" },
  ];
  const availableRoles = roles.length > 0 ? roles : fallbackRoles;

  async function loadData() {
    if (!tenant?.id) return;

    setLoading(true);

    const [usersRes, rolesRes, permissionsRes, rolePermissionsRes, overridesRes] = await Promise.all([
      supabase.from("tenant_users").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
      supabase.from("roles").select("*").eq("tenant_id", tenant.id).order("name", { ascending: true }),
      supabase.from("permissions").select("*").order("module", { ascending: true }).order("name", { ascending: true }),
      supabase.from("role_permissions").select("*"),
      supabase.from("user_permission_overrides").select("*"),
    ]);

    if (usersRes.error) console.log(usersRes.error);
    if (rolesRes.error) console.log(rolesRes.error);
    if (permissionsRes.error) console.log(permissionsRes.error);
    if (rolePermissionsRes.error) console.log(rolePermissionsRes.error);
    if (overridesRes.error) console.log(overridesRes.error);

    setUsers(usersRes.data || []);
    setRoles(rolesRes.data || []);
    setPermissions(permissionsRes.data || []);
    setRolePermissions(rolePermissionsRes.data || []);
    setOverrides(overridesRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;

    return users.filter((user) =>
      `${user.email} ${user.display_name || ""} ${user.role} ${user.status}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  const selectedRole = roles.find((role) => role.id === selectedUser?.role_id || role.key === selectedUser?.role);

  const permissionGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      groups[permission.module] ||= [];
      groups[permission.module].push(permission);
    });
    return groups;
  }, [permissions]);

  function userHasPermission(user: TenantUser | null, permission: Permission) {
    if (!user) return false;

    const override = overrides.find(
      (item) => item.tenant_user_id === user.id && item.permission_id === permission.id
    );

    if (override) return Boolean(override.allowed);

    const role = roles.find((item) => item.id === user.role_id || item.key === user.role);
    if (!role) return false;

    return rolePermissions.some((item) => item.role_id === role.id && item.permission_id === permission.id);
  }
  async function saveUserCore(nextUser: TenantUser) {
    if (
      selectedUser?.role === "super_admin" &&
      nextUser.role !== "super_admin"
    ) {
      setActionMessage("Il Super Admin non può essere declassato.");
      setSaving(false);
      return;
    }

    setSaving(true);

    const role = roles.find((item) => item.id === nextUser.role_id || item.key === nextUser.role);

    const { data, error } = await supabase
      .from("tenant_users")
      .update({
        display_name: nextUser.display_name || null,
        role: role?.key || nextUser.role,
        role_id: role?.id || nextUser.role_id || null,
        status: nextUser.status || "active",
        notes: nextUser.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", nextUser.id)
      .select()
      .single();

    if (error) {
      console.log(error);
      setSaving(false);
      return;
    }

    setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    setSelectedUser(data);
    setSaving(false);
  }

  async function toggleOverride(permission: Permission) {
    if (!selectedUser?.id) return;

    const current = userHasPermission(selectedUser, permission);
    const existing = overrides.find(
      (item) => item.tenant_user_id === selectedUser.id && item.permission_id === permission.id
    );

    const nextAllowed = !current;

    if (existing) {
      const { data, error } = await supabase
        .from("user_permission_overrides")
        .update({ allowed: nextAllowed, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setOverrides((prev) => prev.map((item) => (item.id === existing.id ? data : item)));
      return;
    }

    const { data, error } = await supabase
      .from("user_permission_overrides")
      .insert([
        {
          tenant_user_id: selectedUser.id,
          permission_id: permission.id,
          allowed: nextAllowed,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setOverrides((prev) => [data, ...prev]);
  }

  async function createTenantUser() {
    if (!tenant?.id || !newUser.email.trim()) return;

    setSaving(true);
    setInviteMessage("");

    const role =
      availableRoles.find((item) => item.key === normalizeRoleKey(newUser.role)) ||
      availableRoles.find((item) => item.key === SAFE_DEFAULT_ROLE) ||
      null;

    const roleKey = normalizeRoleKey(role?.key || newUser.role);


    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setInviteMessage("Sessione scaduta. Fai logout/login e riprova.");
        setSaving(false);
        return;
      }

      const response = await fetchWithTimeout("/api/admin/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          email: newUser.email.trim().toLowerCase(),
          displayName: newUser.display_name.trim() || newUser.email.split("@")[0],
          roleKey,
          roleId: isFallbackRole(role) ? null : role?.id || null,
          status: newUser.mode === "temporary_password" ? "active" : (newUser.status || "pending"),
          mode: newUser.mode,
          temporaryPassword: newUser.temporaryPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setInviteMessage(result?.error || "Errore durante invito utente.");
        setSaving(false);
        return;
      }

      if (result?.user) {
        setUsers((prev) => {
          const exists = prev.some((item) => item.id === result.user.id);
          return exists
            ? prev.map((item) => (item.id === result.user.id ? result.user : item))
            : [result.user, ...prev];
        });
        setSelectedUser(result.user);
      }

      setInviteMessage(result?.message || (newUser.mode === "temporary_password" ? "Utente creato con password temporanea." : "Invito inviato correttamente."));
      setNewUser({ email: "", display_name: "", role: "cliente_user", status: "active", mode: "email_invite", temporaryPassword: "" });
      setNewUserOpen(false);
      await loadData();
    } catch (error: any) {
      console.log(error);
      const isAbort = error?.name === "AbortError";
      setInviteMessage(
        isAbort
          ? "Timeout invito: la route non ha risposto entro 25 secondi. Controlla terminale Next.js e route invite-user."
          : error?.message || "Errore imprevisto durante invito utente.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function deleteSelectedUser() {
    if (!selectedUser?.id || !tenant?.id) return;

    if (selectedUser.role === "super_admin") {
      setActionMessage("Il Super Admin non può essere eliminato.");
      return;
    }

    if (selectedUser.email === currentUser?.email) {
      setActionMessage("Non puoi eliminare la tua utenza admin mentre sei loggato.");
      return;
    }

    const confirmed = window.confirm(
      `Eliminare definitivamente ${selectedUser.email}?\n\nVerrà rimosso sia il profilo tenant sia l'account Supabase Auth, quindi potrai riusare la stessa email.`
    );

    if (!confirmed) return;

    setSaving(true);
    setActionMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setActionMessage("Sessione scaduta. Fai logout/login e riprova.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          tenantUserId: selectedUser.id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionMessage(result?.error || "Errore durante eliminazione utente.");
        setSaving(false);
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== selectedUser.id));
      setOverrides((prev) => prev.filter((item) => item.tenant_user_id !== selectedUser.id));
      setSelectedUser(null);
      setActionMessage(result?.message || "Utente eliminato definitivamente.");
      await loadData();
    } catch (error) {
      console.log(error);
      setActionMessage("Errore imprevisto durante eliminazione utente.");
    }

    setSaving(false);
  }

  const activeUsers = users.filter((user) => user.status === "active").length;
  const customerUsers = users.filter((user) => String(user.role).includes("cliente")).length;
  const adminUsers = users.filter(
  (user) => user.role === "admin" || user.role === "super_admin"
).length;

  if (!tenant?.id) {
    return (
      <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-lg font-black">Tenant non configurato</p>
        <p className="mt-2 text-sm font-bold text-amber-200/80">
          Seleziona un tenant prima di gestire utenti e permessi.
        </p>
      </section>
    );
  }

  return (
    <section className={executiveMode ? "grid gap-5 rounded-[34px] border border-cyan-300/10 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(251,191,36,0.09),transparent_24%),linear-gradient(135deg,rgba(2,7,19,0.96),rgba(7,19,33,0.92)_48%,rgba(3,7,17,0.98))] p-5 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-7" : "grid gap-5"}>
      <div className={executiveMode ? "rounded-[30px] border border-cyan-300/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-7" : "rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 md:p-7"}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">ATLAS IAM</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">User Management Center</h2>
            <p className="mt-3 max-w-3xl text-sm font-bold text-slate-400 md:text-base">
              Gestione utenti, ruoli, permessi granulari e accessi cliente per {tenant?.name || "tenant"}.
            </p>
          </div>

          <button
            onClick={() => setNewUserOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5"
          >
            <Plus size={18} /> Nuovo utente
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <Users className="mb-3 text-blue-300" size={22} />
            <p className="text-3xl font-black text-white">{users.length}</p>
            <p className="text-sm font-bold text-slate-400">Utenti totali</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <CheckCircle2 className="mb-3 text-emerald-300" size={22} />
            <p className="text-3xl font-black text-white">{activeUsers}</p>
            <p className="text-sm font-bold text-slate-400">Attivi</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <ShieldCheck className="mb-3 text-violet-300" size={22} />
            <p className="text-3xl font-black text-white">{adminUsers}</p>
            <p className="text-sm font-bold text-slate-400">Admin</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <KeyRound className="mb-3 text-pink-300" size={22} />
            <p className="text-3xl font-black text-white">{customerUsers}</p>
            <p className="text-sm font-bold text-slate-400">Clienti</p>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-black text-blue-100">
            {actionMessage}
          </div>
        )}
      </div>

      {newUserOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Nuovo accesso</p>
                <h3 className="mt-2 text-2xl font-black text-white">Invita utente tenant</h3>
              </div>
              <button onClick={() => setNewUserOpen(false)} className="rounded-2xl bg-white/10 p-3 text-white hover:bg-white/15">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                value={newUser.email}
                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="email@azienda.it"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
              />
              <input
                value={newUser.display_name}
                onChange={(event) => setNewUser((prev) => ({ ...prev, display_name: event.target.value }))}
                placeholder="Nome visualizzato"
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
              />
              <select
                value={newUser.role}
                onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
              >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.key} className="bg-slate-900 text-white">
                    {role.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Modalità creazione</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setNewUser((prev) => ({ ...prev, mode: "email_invite", temporaryPassword: "" }))}
                    className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${
                      newUser.mode === "email_invite"
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    Invito email
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser((prev) => ({ ...prev, mode: "temporary_password" }))}
                    className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${
                      newUser.mode === "temporary_password"
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    Password temporanea
                  </button>
                </div>
              </div>

              {newUser.mode === "temporary_password" && (
                <input
                  value={newUser.temporaryPassword}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, temporaryPassword: event.target.value }))}
                  placeholder="Password temporanea minimo 8 caratteri"
                  type="text"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
                />
              )}

              <button
                onClick={createTenantUser}
                disabled={saving || !newUser.email.trim() || (newUser.mode === "temporary_password" && newUser.temporaryPassword.length < 8)}
                className="mt-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
              >
                {saving
                  ? "Operazione in corso..."
                  : newUser.mode === "temporary_password"
                  ? "Crea utente con password"
                  : "Invita utente"}
              </button>

              <p className="text-xs font-bold text-slate-500">
                Invito email: usa il link Supabase. Password temporanea: crea subito l'account confermato e il collega accede da https://secom-atlas.vercel.app con email e password provvisoria.
              </p>
              {inviteMessage && (
                <p className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs font-black text-blue-100">
                  {inviteMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Directory utenti</p>
              <h3 className="mt-1 text-2xl font-black text-white">Identità tenant</h3>
            </div>
            <button onClick={loadData} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-slate-300 hover:bg-white/[0.1]">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca utente, email, ruolo..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-sm font-bold text-white outline-none"
            />
          </div>

          <div className="grid max-h-[680px] gap-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                Caricamento utenti...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-slate-400">
                Nessun utente trovato.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-blue-500/10 ${
                    selectedUser?.id === user.id ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{user.display_name || user.email}</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">{user.email}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${roleTone[user.role] || "border-white/10 bg-white/[0.06] text-slate-300"}`}>
                      {roles.find((role) => role.key === user.role)?.name || user.role}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-slate-400">
                    <span className="rounded-full bg-white/10 px-3 py-1">{user.status}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Login: {formatDate(user.last_login_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5">
          {!selectedUser ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-950/35 p-8 text-center">
              <UserCog className="mb-4 text-blue-300" size={42} />
              <p className="text-xl font-black text-white">Seleziona un utente</p>
              <p className="mt-2 max-w-md text-sm font-bold text-slate-400">
                Da qui potrai modificare ruolo, stato e permessi granulari.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Profilo accesso</p>
                  <h3 className="mt-2 truncate text-2xl font-black text-white">{selectedUser.display_name || selectedUser.email}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">{selectedUser.email}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => saveUserCore(selectedUser)}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
                  >
                    <Save size={18} /> {saving ? "Salvataggio..." : "Salva profilo"}
                  </button>

                  <button
                    onClick={deleteSelectedUser}
                    disabled={saving || selectedUser.email === currentUser?.email}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-black text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title={selectedUser.email === currentUser?.email ? "Non puoi eliminare la tua utenza mentre sei loggato" : "Elimina utente"}
                  >
                    <Trash2 size={18} /> Elimina
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-slate-300">
                  Nome visualizzato
                  <input
                    value={selectedUser.display_name || ""}
                    onChange={(event) => setSelectedUser((prev) => prev ? { ...prev, display_name: event.target.value } : prev)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
                  />
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-300">
                  Stato
                  <select
                    value={selectedUser.status || "active"}
                    onChange={(event) => setSelectedUser((prev) => prev ? { ...prev, status: event.target.value } : prev)}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
                  >
                    <option value="active">Attivo</option>
                    <option value="disabled">Disabilitato</option>
                    <option value="pending">In attesa</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black text-slate-300 md:col-span-2">
                  Ruolo
                  <select
                    value={selectedRole?.id || selectedUser.role_id || ""}
                    onChange={(event) => {
                      const role = roles.find((item) => item.id === event.target.value);
                      setSelectedUser((prev) => prev ? { ...prev, role_id: role?.id || null, role: role?.key || prev.role } : prev);
                    }}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm font-bold text-white outline-none"
                  >
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id} className="bg-slate-900 text-white">
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="text-blue-300" size={20} />
                  <div>
                    <p className="text-sm font-black text-white">Permessi granulari</p>
                    <p className="text-xs font-bold text-slate-500">Click per creare override sul singolo utente.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {Object.entries(permissionGroups).map(([module, list]) => (
                    <div key={module} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-slate-500">{moduleLabel(module)}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {list.map((permission) => {
                          const enabled = userHasPermission(selectedUser, permission);
                          const override = overrides.find(
                            (item) => item.tenant_user_id === selectedUser.id && item.permission_id === permission.id
                          );

                          return (
                            <button
                              key={permission.id}
                              onClick={() => toggleOverride(permission)}
                              className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                                enabled
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                                  : "border-red-500/25 bg-red-500/10 text-red-100"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-black">{permission.name}</p>
                                  <p className="mt-1 text-[11px] font-bold opacity-70">{permission.key}</p>
                                </div>
                                {enabled ? <CheckCircle2 size={17} /> : <Lock size={17} />}
                              </div>
                              {override && (
                                <p className="mt-2 text-[10px] font-black uppercase tracking-wide opacity-70">Override utente</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
