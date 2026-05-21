export type AtlasRole =
  | "admin"
  | "manager"
  | "dispatcher"
  | "tecnico"
  | "commerciale"
  | "cliente_admin"
  | "cliente_user"
  | "cliente";

export type AtlasUser = {
  id: string;
  name: string;
  email: string;
  role: AtlasRole;
  tenantId: string;
  tenantName: string;
  tenantUserId?: string;
  permissions?: string[];
    customerId?: string | null;
  siteIds?: Array<string | number>;
};

export function normalizeRole(role: any): AtlasRole {
  const value = String(role || "cliente_user").toLowerCase();

  if (value === "admin") return "admin";
  if (value === "manager") return "manager";
  if (value === "dispatcher") return "dispatcher";
  if (value === "tecnico") return "tecnico";
  if (value === "commerciale") return "commerciale";
  if (value === "cliente_admin") return "cliente_admin";
  if (value === "cliente_user") return "cliente_user";
  if (value === "cliente") return "cliente_user";

  return "cliente_user";
}

const fallbackPermissionsByRole: Record<AtlasRole, string[]> = {
  admin: ["*"],
  manager: ["home", "dispatch", "activity", "analytics", "ai", "operativo", "calendario", "mappa", "registro", "clienti", "contratti", "sistemi", "contatti", "budget", "customerPortal", "utenti"],
  dispatcher: ["home", "dispatch", "operativo", "calendario", "mappa", "registro", "clienti", "sistemi", "contatti"],
  tecnico: ["home", "dispatch", "calendario", "mappa", "registro", "sistemi"],
  commerciale: ["home", "clienti", "contratti", "contatti", "budget", "registro"],
  cliente_admin: ["customerPortal"],
  cliente_user: ["customerPortal"],
  cliente: ["customerPortal"],
};

const modulePermissionMap: Record<string, string> = {
  home: "view_home",
  dispatch: "view_dispatch",
  activity: "view_activity",
  analytics: "view_analytics",
  ai: "view_ai",
  operativo: "view_operations",
  calendario: "view_calendar",
  budget: "view_budget",
  mappa: "view_map",
  registro: "view_registry",
  clienti: "view_customers",
  contratti: "view_contracts",
  sistemi: "view_assets",
  magazzino: "view_inventory",
  contatti: "view_contacts",
  customerPortal: "view_customer_portal",
  utenti: "manage_users",
};

export function canViewModule(user: AtlasUser, moduleKey: string) {
  if (!user) return false;

  const permissions = user.permissions || [];
  const requiredPermission = modulePermissionMap[moduleKey];

  if (permissions.includes("*") || (requiredPermission && permissions.includes(requiredPermission))) {
    return true;
  }

  const allowed = fallbackPermissionsByRole[user.role] || [];
  return allowed.includes("*") || allowed.includes(moduleKey);
}

export function hasPermission(user: AtlasUser | null, permissionKey: string) {
  if (!user) return false;
  const permissions = user.permissions || [];
  return permissions.includes("*") || permissions.includes(permissionKey);
}

export function getRoleLabel(role: AtlasRole) {
  const labels: Record<AtlasRole, string> = {
    admin: "Admin",
    manager: "Manager",
    dispatcher: "Dispatcher",
    tecnico: "Tecnico",
    commerciale: "Commerciale",
    cliente_admin: "Cliente Admin",
    cliente_user: "Cliente User",
    cliente: "Cliente",
  };

  return labels[role] || role;
}
