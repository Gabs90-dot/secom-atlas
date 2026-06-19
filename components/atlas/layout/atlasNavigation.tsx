import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  CirclePlus,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Home as HomeIcon,
  ListChecks,
  Map,
  Monitor,
  Package,
  Phone,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AtlasTabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type AtlasTabGroup = {
  title: string;
  items: AtlasTabItem[];
};

export const MOBILE_PRIMARY_TAB_KEYS = [
  "home",
  "customerPortal",
  "webvime",
  "operativo",
  "todo",
] as const;

export function createAtlasTabGroups(todoNewCount: number): AtlasTabGroup[] {
  return [
    {
      title: "Principale",
      items: [
        { key: "home", label: "Home", icon: HomeIcon },
        { key: "clienti", label: "Clienti", icon: Users },
        { key: "contatti", label: "Contatti", icon: Phone },
      ],
    },
    {
      title: "Operatività",
      items: [
        { key: "webvime", label: "Webvime", icon: Monitor },
        { key: "dispatch", label: "Centrale Operativa", icon: AlertTriangle },
        { key: "piani", label: "Piani", icon: FileSpreadsheet },
        { key: "operativo", label: "Apri Chiamata", icon: CirclePlus },
        { key: "todo", label: "To Do List", icon: CheckCircle2, badge: todoNewCount },
        { key: "calendario", label: "Calendario", icon: CalendarDays },
        { key: "registro", label: "Registro Ticket", icon: ListChecks },
        { key: "manuali", label: "Manuali", icon: BookOpen },
        { key: "customerPortal", label: "Portale Clienti", icon: Users },
      ],
    },
    {
      title: "Analisi",
      items: [
        { key: "analytics", label: "Analisi", icon: BarChart3 },
        { key: "ai", label: "Insight AI", icon: Brain },
        { key: "activity", label: "Timeline", icon: History },
      ],
    },
    {
      title: "Gestione",
      items: [
        { key: "download", label: "Download", icon: Download },
        { key: "contratti", label: "Contratti", icon: FileText },
        { key: "budget", label: "Budget", icon: BarChart3 },
        { key: "magazzino", label: "Magazzino", icon: Package },
        { key: "sistemi", label: "Asset & Sistemi", icon: Monitor },
        { key: "mappa", label: "Mappa", icon: Map },
      ],
    },
    {
      title: "Amministrazione",
      items: [
        { key: "utenti", label: "Utenti", icon: Users },
        { key: "glpiImport", label: "Import GLPI", icon: Download },
        { key: "designLab", label: "Design Lab", icon: Sparkles },
      ],
    },
  ];
}

export function getAuthorizedAtlasTabGroups(
  tabGroups: AtlasTabGroup[],
  canAccessTab: (key: string) => boolean,
): AtlasTabGroup[] {
  return tabGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessTab(item.key)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getMobilePrimaryTabs(
  tabGroups: AtlasTabGroup[],
  canAccessTab: (key: string) => boolean,
): AtlasTabItem[] {
  const authorizedTabs = getAuthorizedAtlasTabGroups(tabGroups, canAccessTab)
    .flatMap((group) => group.items);

  return MOBILE_PRIMARY_TAB_KEYS
    .map((key) => authorizedTabs.find((item) => item.key === key))
    .filter((item): item is AtlasTabItem => Boolean(item));
}

export function getMobileMoreTabGroups(
  tabGroups: AtlasTabGroup[],
  canAccessTab: (key: string) => boolean,
): AtlasTabGroup[] {
  const primaryKeys = new Set<string>(MOBILE_PRIMARY_TAB_KEYS);

  return getAuthorizedAtlasTabGroups(tabGroups, canAccessTab)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !primaryKeys.has(item.key)),
    }))
    .filter((group) => group.items.length > 0);
}
