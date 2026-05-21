"use client";

import { supabase } from "@/lib/supabase";
import { systemsCatalog } from "@/lib/systemsCatalog";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import TicketForm from "@/components/atlas/TicketForm";
import MobileBottomNav from "@/components/atlas/MobileBottomNav";
import MobileMoreMenu from "@/components/atlas/MobileMoreMenu";
import TicketRegistry from "@/components/atlas/TicketRegistry";
import CustomerCommandCenter from "@/components/atlas/CustomerCommandCenter";
import CustomerPortal from "@/components/atlas/CustomerPortal";
import UserManagementCenter from "@/components/atlas/UserManagementCenter";
import GlpiImportCenter from "@/components/atlas/GlpiImportCenter";
import DispatchCenter from "@/components/atlas/DispatchCenter";
import GlobalActivityFeed from "@/components/atlas/GlobalActivityFeed";
import KPIDashboard from "@/components/atlas/KPIDashboard";
import AIInsightsPanel from "@/components/atlas/AIInsightsPanel";
import UserSessionBadge from "@/components/atlas/UserSessionBadge";
import TenantSwitcher from "@/components/atlas/TenantSwitcher";
import LoginScreen from "@/components/atlas/LoginScreen";
import { useAtlasAuth } from "@/components/atlas/AuthProvider";
import { canViewModule } from "@/lib/auth";
import type { AtlasTenant } from "@/lib/tenant";
import { getStoredTenantSlug, storeTenantSlug } from "@/lib/tenant";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Box,
  FileText,
  ListChecks,
  Map,
  Monitor,
  Package,
  Search,
  Users,
  Phone,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Bell,
  Menu,
  X,
  Download,
  MoreHorizontal,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
} from "lucide-react";

const AtlasMap = dynamic(() => import("@/components/AtlasMap"), {
  ssr: false,
});

import type { AtlasTicketCategory, AtlasTicketStatus } from "@/lib/atlasTypes";
import {
  INITIAL_BUDGET,
  atlasStatusToDbStatus,
  contracts,
  initialInventory,
  materials,
  technicians,
  ticketCategoryOptions,
  ticketStatusOptions,
} from "@/lib/atlasConstants";
import {
  euro,
  getContractStatus,
  getInventoryStatus,
  materialCost,
  normalizeSiteRegion,
} from "@/lib/atlasUtils";
import { syncTicketToGlpi as syncTicketToGlpiService } from "@/services/glpi";
import {
  getBudgetRemaining as calculateBudgetRemaining,
  getBudgetSpent as calculateBudgetSpent,
  getBudgetTotal as calculateBudgetTotal,
  getTicketContract as getTicketContractFromService,
  getTicketTypeFromMap,
} from "@/services/budget";
import {
  buildEditableContracts,
  getSelectedContract,
} from "@/services/contracts";

export default function Home() {
  const {
    user: currentUser,
    loading: authLoading,
    refreshUser,
    signOut,
  } = useAtlasAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<AtlasTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<AtlasTenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  const [site, setSite] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [region, setRegion] = useState("");
  const [entity, setEntity] = useState("");
  const [city, setCity] = useState("");
  const [siteId, setSiteId] = useState<number | null>(null);

  const [ticketTitle, setTicketTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [technician, setTechnician] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [ticketType, setTicketType] =
    useState<AtlasTicketCategory>("ordinaria");
  const [ticketStatus, setTicketStatus] = useState<AtlasTicketStatus>("nuova");
  const [ticketTypesById, setTicketTypesById] = useState<
    Record<string, AtlasTicketCategory>
  >({});

  const [closingNotes, setClosingNotes] = useState("");
  const [futureNeeds, setFutureNeeds] = useState("");
  const [resolved, setResolved] = useState(true);
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  const [filterTechnician, setFilterTechnician] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const [activeTab, setActiveTab] = useState<
    | "home"
    | "dispatch"
    | "activity"
    | "analytics"
    | "ai"
    | "customerPortal"
    | "operativo"
    | "budget"
    | "mappa"
    | "registro"
    | "clienti"
    | "contratti"
    | "sistemi"
    | "magazzino"
    | "calendario"
    | "contatti"
    | "utenti"
    | "glpiImport"
  >("home");

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systemSearch, setSystemSearch] = useState("");

  const [budgetVisible, setBudgetVisible] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas-theme") || "dark";
    }

    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("atlas-theme", theme);
  }, [theme]);
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budget");
      return saved ? Number(saved) : INITIAL_BUDGET;
    }

    return INITIAL_BUDGET;
  });

  const [budgets, setBudgets] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-budgets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback sotto
        }
      }
    }

    return [
      {
        id: "BUD-CARABINIERI-2024-2026",
        contractName: "CARABINIERI ASSISTENZA 2024-2026",
        entity: "Carabinieri",
        value: INITIAL_BUDGET,
        notes:
          "Budget iniziale collegato al contratto Carabinieri Assistenza 2024-2026",
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [clientSearch, setClientSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [contractOverrides, setContractOverrides] = useState<any>({});
  const [inventory, setInventory] = useState<any[]>(initialInventory);
  const [inventorySearch, setInventorySearch] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactClientSearch, setContactClientSearch] = useState("");
  const [contactClient, setContactClient] = useState<any | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    tag: "Personale",
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(
    null,
  );
  const [calendarTechnician, setCalendarTechnician] = useState("");
  const [calendarSiteSearch, setCalendarSiteSearch] = useState("");
  const [calendarSite, setCalendarSite] = useState<any | null>(null);
  const [calendarTime, setCalendarTime] = useState("");
  const [editingCalendarTicketId, setEditingCalendarTicketId] = useState<
    string | null
  >(null);
  const [expandedCalendarTicketId, setExpandedCalendarTicketId] = useState<
    string | null
  >(null);
  const [mobileView, setMobileView] = useState<
    | "home"
    | "dispatch"
    | "activity"
    | "analytics"
    | "ai"
    | "customerPortal"
    | "operativo"
    | "calendario"
    | "budget"
    | "mappa"
    | "registro"
    | "clienti"
    | "contratti"
    | "sistemi"
    | "contatti"
    | "magazzino"
    | "utenti"
  >("home");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [manualReminders, setManualReminders] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas-reminders");

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }

    return [];
  });
  const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(false);
  const [calendarReminderNote, setCalendarReminderNote] = useState("");
  const [mobileInventoryFormOpen, setMobileInventoryFormOpen] = useState(false);
  const [editingInventoryIndex, setEditingInventoryIndex] = useState<
    number | null
  >(null);
  const [inventoryForm, setInventoryForm] = useState({
    id: "",
    name: "",
    value: "0",
    quantity: "0",
  });
  const [mobileBudgetFormOpen, setMobileBudgetFormOpen] = useState(false);
  const [budgetClientSearch, setBudgetClientSearch] = useState("");
  const [budgetClient, setBudgetClient] = useState<any | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    contractName: "CARABINIERI ASSISTENZA 2024-2026",
    value: String(budget),
    notes: "",
  });
  const [mobileCalendarFormOpen, setMobileCalendarFormOpen] = useState(false);
  const [mobileContactFormOpen, setMobileContactFormOpen] = useState(false);
  const [mobileContactFilter, setMobileContactFilter] = useState<
    "Tutti" | "Personale" | "Fornitore" | "Istituzione" | "Preferiti"
  >("Tutti");

  useEffect(() => {
    async function loadTenants() {
      setTenantLoading(true);

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.log(error);
        setTenantLoading(false);
        return;
      }

      const list = (data || []) as AtlasTenant[];
      const storedSlug = getStoredTenantSlug();
      const selected =
        list.find((tenant) => tenant.slug === storedSlug) ||
        list.find((tenant) => tenant.slug === "secom") ||
        list[0] ||
        null;

      setTenants(list);
      setActiveTenant(selected);

      if (selected?.slug) {
        storeTenantSlug(selected.slug);
      }

      setTenantLoading(false);
    }

    loadTenants();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "cliente") {
      setActiveTab("customerPortal");
      setMobileView("customerPortal");
    }
  }, [currentUser?.role]);

  useEffect(() => {
    const savedContracts = localStorage.getItem("atlas-contract-overrides");
    if (savedContracts) setContractOverrides(JSON.parse(savedContracts));

    const savedInventory = localStorage.getItem("atlas-inventory");
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    const savedContacts = localStorage.getItem("atlas-contacts");
    if (savedContacts) setContacts(JSON.parse(savedContacts));
    const savedTicketTypes = localStorage.getItem("atlas-ticket-types");
    if (savedTicketTypes) setTicketTypesById(JSON.parse(savedTicketTypes));
  }, []);

  useEffect(() => {
    if (!activeTenant?.id) return;

    async function loadSites() {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .order("name");

      if (error) {
        console.log(error);
        return;
      }

      setSites((data || []).map(normalizeSiteRegion));
    }

    async function loadCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", activeTenant?.id)
        .order("name", { ascending: true });

      if (error) {
        console.log(error);
        return;
      }

      setCustomers(data || []);
    }

    async function loadTickets() {
      const { data, error } = await supabase
        .from("tickets")
.select("*")
.eq("tenant_id", activeTenant?.id)
.order("created_at", { ascending: false })
.range(0, 19999);

      if (error) {
        console.log(error);
        return;
      }

      const formatted =
        data?.map((t) => ({
          id: t.id,
          site: t.site,
          region: t.region,
          entity: t.entity || "",
          city: t.city || "",
          problem: t.problem,
          materialIds: t.materials || [],
          technician: t.technician,
          status: t.status,
          date: t.intervention_date || "",
          resolved: t.resolved,
          futureNeeds: t.future_needs || "",
          closingNotes: t.closing_notes || "",
          slot: t.slot || "",
          openedAt: t.opened_at || t.created_at || "",
          expectedCloseDate: t.expected_close_date || "",
          closedAt: t.closed_at || "",
          urgent: Boolean(t.urgent),
          siteId: t.site_id || null,
site_id: t.site_id || null,
          customerId: t.customer_id || null,
          tenantId: t.tenant_id || null,
          tenant_id: t.tenant_id || null,
          ticketType:
            (typeof window !== "undefined"
              ? JSON.parse(
                  localStorage.getItem("atlas-ticket-types") || "{}",
                )?.[String(t.id)]
              : undefined) ||
            t.ticket_type ||
            "ordinaria",
        })) || [];

      setTickets(formatted);
    }

    loadTickets();
    loadSites();
    loadCustomers();
  }, [activeTenant?.id]);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function syncTicketToGlpi(ticket: any) {
    return syncTicketToGlpiService({
      ticket,
      editableContracts,
      supabaseClient: supabase,
      showMessage,
    });
  }

  const editableContracts = buildEditableContracts(
    contracts,
    contractOverrides,
  );

  const selectedContract = getSelectedContract({
    site,
    entity,
    editableContracts,
    contractOverrides,
  });

  const totalBudget =
    budgets.reduce(
      (sum, item) => sum + Number(item.value || item.total || 0),
      0,
    ) || budget;

  function getTicketType(ticket: any): AtlasTicketCategory {
    return getTicketTypeFromMap(ticket, ticketTypesById);
  }

  function getTicketContract(ticket: any) {
    return getTicketContractFromService(ticket, editableContracts);
  }

  function getBudgetSpent(contractName?: string) {
    return calculateBudgetSpent({
      tickets,
      ticketTypesById,
      editableContracts,
      contractName,
    });
  }

  function getBudgetTotal(contractName?: string) {
    return calculateBudgetTotal({
      budgets,
      totalBudget,
      contractName,
    });
  }

  function getBudgetRemaining(contractName?: string) {
    return calculateBudgetRemaining({
      tickets,
      ticketTypesById,
      editableContracts,
      budgets,
      totalBudget,
      contractName,
    });
  }

  function updateContractField(
    contractName: string,
    field: string,
    value: string,
  ) {
    const updated = {
      ...contractOverrides,
      [contractName]: {
        ...(contractOverrides[contractName] || {}),
        [field]: value,
      },
    };

    setContractOverrides(updated);
    localStorage.setItem("atlas-contract-overrides", JSON.stringify(updated));
    showMessage("Contratto aggiornato");
  }

  function updateInventoryItem(index: number, field: string, value: string) {
    const updated = inventory.map((item, i) => {
      if (i !== index) return item;

      return {
        ...item,
        [field]:
          field === "value" || field === "quantity"
            ? Number(value || 0)
            : value,
      };
    });

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  function addInventoryItem() {
    const updated = [
      ...inventory,
      {
        id: `ART-${Date.now()}`,
        name: "Nuovo articolo",
        value: 0,
        quantity: 0,
      },
    ];

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
  }

  const filteredSites = sites
    .filter((s) => {
      const text = `${s.name} ${s.city} ${s.entity}`.toLowerCase();
      return text.includes(siteSearch.toLowerCase());
    })
    .slice(0, 10);

  const totalForecast = useMemo(
    () =>
      tickets
        .filter((t) => getTicketType(t) === "straordinaria")
        .reduce((sum, t) => sum + materialCost(t.materialIds || []), 0),
    [tickets, ticketTypesById],
  );

  const remainingBudget = totalBudget - totalForecast;

  const filteredTickets = tickets.filter((t) => {
    const matchTechnician =
      !filterTechnician || t.technician === filterTechnician;
    const matchRegion = !filterRegion || t.region === filterRegion;
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchSite =
      !filterSite ||
      `${t.site || ""} ${t.city || ""} ${t.entity || ""}`
        .toLowerCase()
        .includes(filterSite.toLowerCase());
    const matchUrgent = !urgentOnly || Boolean(t.urgent);

    return (
      matchTechnician && matchRegion && matchStatus && matchSite && matchUrgent
    );
  });

  const urgentTickets = tickets.filter(
    (t) => Boolean(t.urgent) && t.status !== "Chiuso",
  );

  const availableRegions = Array.from(
    new Set(tickets.map((t) => t.region).filter(Boolean)),
  );

  const expiringContracts = editableContracts.filter(
    (contract) => getContractStatus(contract).warning,
  );

  const inventoryValue = inventory.reduce(
    (sum, item) => sum + Number(item.value || 0) * Number(item.quantity || 0),
    0,
  );

  const inventoryCritical = inventory.filter(
    (item) => Number(item.quantity) < 10,
  );

  const clientCategories = {
    "Ministero Interni": sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("minister"),
    ),
    Carabinieri: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("carabin"),
    ),
    "Polizia Locale": sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();
      return (
        text.includes("polizia locale") ||
        text.includes("polizia municipale") ||
        text.includes("polizia provinciale")
      );
    }),
    Questure: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("questura"),
    ),
    Prefetture: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("prefettura"),
    ),
    Tribunali: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("tribunale"),
    ),
    Comuni: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("comune"),
    ),
    RFI: sites.filter((s) =>
      `${s.name} ${s.entity}`.toLowerCase().includes("rfi"),
    ),
    Altro: sites.filter((s) => {
      const text = `${s.name} ${s.entity}`.toLowerCase();

      return ![
        "minister",
        "carabin",
        "polizia locale",
        "polizia municipale",
        "polizia provinciale",
        "questura",
        "prefettura",
        "tribunale",
        "comune",
        "rfi",
      ].some((k) => text.includes(k));
    }),
  };

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function addTicket(customerId?: string) {
    if (!activeTenant?.id) {
      showMessage("Organizzazione non configurata", "error");
      return;
    }

    if (!site || !ticketTitle || !problem) {
      showMessage(
        "Sede, titolo e descrizione intervento sono obbligatori",
        "error",
      );
      return;
    }

    const cost = materialCost(selectedMaterials);
    const dbStatus = atlasStatusToDbStatus[ticketStatus] || "Aperto";

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          site,
          region: region || "Da definire",
          entity,
          city,
          site_id: siteId,
          problem,
          materials: selectedMaterials,
          technician,
          status: dbStatus,
          cost,
          slot: selectedSlot,
          intervention_date: selectedDate || null,
          opened_at: new Date().toISOString(),
          expected_close_date: expectedCloseDate || null,
          urgent: false,
          customer_id: customerId || null,
          tenant_id: activeTenant?.id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore salvataggio ticket", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      title: ticketTitle,
      site,
      region,
      entity,
      city,
      problem,
      materialIds: selectedMaterials,
      technician,
      status: dbStatus,
      date: selectedDate || "",
      slot: selectedSlot || "",
      openedAt: data.opened_at || new Date().toISOString(),
      expectedCloseDate: data.expected_close_date || expectedCloseDate || "",
      closedAt: data.closed_at || "",
      urgent: Boolean(data.urgent),
      customerId: data.customer_id || customerId || null,
      tenantId: data.tenant_id || activeTenant?.id || null,
      tenant_id: data.tenant_id || activeTenant?.id || null,
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
      ticketType,
      ticketCategory: ticketType,
      ticketStatus,
    };

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(data.id)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem(
      "atlas-ticket-types",
      JSON.stringify(updatedTicketTypes),
    );

    setTickets([newTicket, ...tickets]);

    setSite("");
    setSiteSearch("");
    setRegion("");
    setEntity("");
    setCity("");
    setSiteId(null);
    setTicketTitle("");
    setProblem("");
    setTechnician("");
    setSelectedDate("");
    setSelectedSlot("");
    setExpectedCloseDate("");
    const glpiResult = await syncTicketToGlpi(newTicket);

    await supabase.from("ticket_events").insert([
      {
        ticket_id: data.id,
        customer_id: customerId || null,
        site_id: siteId || null,
        event_type: "ticket_created",
        title: "Ticket creato",
        description: `${site} - ${ticketTitle}`,
        created_by: "Operatore",
        tenant_id: activeTenant?.id || null,
        metadata: {
          status: dbStatus,
          urgent: false,
          ticket_type: ticketType,
        },
      },
    ]);

    setSelectedMaterials([]);
    setTicketType("ordinaria");
    setTicketStatus("nuova");

    showMessage(
      glpiResult?.glpiTicketId
        ? `Ticket salvato e inviato a GLPI #${glpiResult.glpiTicketId}`
        : "Ticket salvato su ATLAS",
    );
  }

  async function planTicket(id: string) {
    if (!selectedDate || !selectedSlot || !technician) {
      showMessage(
        "Seleziona tecnico, data e slot prima di pianificare",
        "error",
      );
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        technician,
        intervention_date: selectedDate,
        slot: selectedSlot,
        status: "Pianificato",
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              technician,
              date: selectedDate,
              slot: selectedSlot,
              status: "Pianificato",
            }
          : t,
      ),
    );

    showMessage("Ticket pianificato");
  }

  async function closeTicket(id: string) {
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closed_at: new Date().toISOString(),
        urgent: false,
        closing_notes: closingNotes || "",
        future_needs: futureNeeds || "",
        resolved,
      })
      .eq("id", Number(id));

    if (error) {
      console.log("ERRORE CHIUSURA:", error);
      showMessage("Errore chiusura ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              status: "Chiuso",
              date: today,
              closedAt: new Date().toISOString(),
              urgent: false,
              closingNotes: closingNotes || "",
              futureNeeds: futureNeeds || "",
              resolved,
            }
          : t,
      ),
    );

    setClosingNotes("");
    setFutureNeeds("");
    setResolved(true);
    setClosingTicketId(null);

    showMessage("Ticket chiuso e salvato");
  }

  async function toggleTicketUrgent(ticket: any) {
    const nextUrgent = !Boolean(ticket.urgent);

    const { error } = await supabase
      .from("tickets")
      .update({ urgent: nextUrgent })
      .eq("id", Number(ticket.id));

    if (error) {
      console.log(error);
      showMessage("Errore aggiornamento urgenza", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((item) =>
        String(item.id) === String(ticket.id)
          ? { ...item, urgent: nextUrgent }
          : item,
      ),
    );

    showMessage(
      nextUrgent ? "Intervento marcato urgente" : "Intervento non più urgente",
    );
  }

  function exportCsv() {
    const header = [
      "ID",
      "Sede",
      "Ente",
      "Città",
      "Regione",
      "Problema",
      "Materiali",
      "Costo",
      "Tecnico",
      "Tipo chiamata",
      "Stato",
      "Risolto",
      "Data apertura",
      "Data chiusura prevista",
      "Data chiusura",
      "Urgente",
      "Data intervento",
      "Slot",
      "Note chiusura",
      "Necessità future",
    ];

    const rows = tickets.map((t) => [
      t.id,
      t.site,
      t.entity || "",
      t.city || "",
      t.region || "",
      t.problem,
      (t.materialIds || [])
        .map((id: string) => materials.find((m) => m.id === id)?.name)
        .join(" + "),
      materialCost(t.materialIds || []),
      t.technician || "",
      getTicketType(t),
      t.status,
      t.resolved === false ? "No" : "Sì",
      t.openedAt || "",
      t.expectedCloseDate || "",
      t.closedAt || "",
      t.urgent ? "Sì" : "No",
      t.date || "",
      t.slot || "",
      t.closingNotes || "",
      t.futureNeeds || "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `secom-atlas-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }
  const monthStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  );

  const monthEnd = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  );

  const calendarDays = Array.from(
    { length: monthEnd.getDate() },
    (_, i) =>
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i + 1),
  );

  const mobileCalendarStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1 - ((monthStart.getDay() + 6) % 7),
  );

  const mobileCalendarCells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(mobileCalendarStart);
    date.setDate(mobileCalendarStart.getDate() + i);
    return date;
  });

  const mobileSelectedDate = selectedCalendarDay || formatLocalDate(new Date());

  const mobileSelectedTickets = tickets.filter(
    (t) => t.date === mobileSelectedDate,
  );

  const monthLabel = calendarMonth.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(amount: number) {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + amount,
        1,
      ),
    );
  }

  const calendarSiteResults = sites
    .filter((s) => {
      const q = calendarSiteSearch.toLowerCase();
      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);
  async function updateCalendarTicket() {
    if (
      !editingCalendarTicketId ||
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa tecnico, cliente e orario", "error");
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        site: calendarSite.name,
        region: calendarSite.region || "Da definire",
        entity: calendarSite.entity || "",
        city: calendarSite.city || "",
        site_id: calendarSite.id || null,
        technician: calendarTechnician,
        slot: calendarTime,
        intervention_date: selectedCalendarDay,
        status: "Pianificato",
      })
      .eq("id", Number(editingCalendarTicketId));

    if (error) {
      console.log(error);
      showMessage("Errore modifica intervento", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(editingCalendarTicketId)
          ? {
              ...t,
              site: calendarSite.name,
              region: calendarSite.region || "",
              entity: calendarSite.entity || "",
              city: calendarSite.city || "",
              technician: calendarTechnician,
              slot: calendarTime,
              date: selectedCalendarDay,
              status: "Pianificato",
              ticketType,
            }
          : t,
      ),
    );

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(editingCalendarTicketId)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem(
      "atlas-ticket-types",
      JSON.stringify(updatedTicketTypes),
    );

    setEditingCalendarTicketId(null);
    setExpandedCalendarTicketId(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");

    showMessage("Intervento aggiornato");
  }
  async function addCalendarTicket() {
    if (!activeTenant?.id) {
      showMessage("Organizzazione non configurata", "error");
      return;
    }

    if (
      !selectedCalendarDay ||
      !calendarTechnician ||
      !calendarSite ||
      !calendarTime
    ) {
      showMessage("Completa giorno, tecnico, cliente e orario", "error");
      return;
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          site: calendarSite.name,
          region: calendarSite.region || "Da definire",
          entity: calendarSite.entity || "",
          city: calendarSite.city || "",
          site_id: calendarSite.id || null,
          problem: "Intervento pianificato da calendario",
          materials: [],
          technician: calendarTechnician,
          status: "Pianificato",
          cost: 0,
          slot: calendarTime,
          intervention_date: selectedCalendarDay,
          opened_at: new Date().toISOString(),
          expected_close_date: selectedCalendarDay,
          urgent: false,
          tenant_id: activeTenant?.id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore creazione intervento calendario", "error");
      return;
    }

    const newTicket = {
      id: data.id,
      site: calendarSite.name,
      region: calendarSite.region || "",
      entity: calendarSite.entity || "",
      city: calendarSite.city || "",
      problem: "Intervento pianificato da calendario",
      materialIds: [],
      technician: calendarTechnician,
      status: "Pianificato",
      date: selectedCalendarDay,
      slot: calendarTime,
      openedAt: data.opened_at || new Date().toISOString(),
      expectedCloseDate: data.expected_close_date || selectedCalendarDay || "",
      closedAt: data.closed_at || "",
      urgent: Boolean(data.urgent),
      tenantId: data.tenant_id || activeTenant?.id || null,
      tenant_id: data.tenant_id || activeTenant?.id || null,
      resolved: true,
      closingNotes: "",
      futureNeeds: "",
      ticketType,
      ticketCategory: ticketType,
      ticketStatus: "pianificata",
    };

    const updatedTicketTypes = {
      ...ticketTypesById,
      [String(data.id)]: ticketType,
    };
    setTicketTypesById(updatedTicketTypes);
    localStorage.setItem(
      "atlas-ticket-types",
      JSON.stringify(updatedTicketTypes),
    );

    setTickets([newTicket, ...tickets]);

    const glpiResult = await syncTicketToGlpi(newTicket);

    setSelectedCalendarDay(null);
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");

    showMessage(
      glpiResult?.glpiTicketId
        ? `Intervento aggiunto e inviato a GLPI #${glpiResult.glpiTicketId}`
        : "Intervento aggiunto al calendario",
    );
  }
  const contactClientResults = sites
    .filter((s) => {
      const q = contactClientSearch.toLowerCase();

      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  const budgetClientResults = sites
    .filter((s) => {
      const q = budgetClientSearch.toLowerCase();

      return `${s.name} ${s.city} ${s.entity} ${s.region}`
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 8);

  const filteredContacts = contacts.filter((contact) => {
    const q = contactSearch.toLowerCase();
    const tag = contact.tag || "Personale";

    const matchesSearch =
      `${contact.name} ${contact.phone} ${contact.address} ${contact.notes} ${contact.clientName} ${contact.clientCity} ${contact.clientRegion} ${tag}`
        .toLowerCase()
        .includes(q);

    const matchesTag =
      mobileContactFilter === "Tutti" ||
      (mobileContactFilter === "Preferiti" && contact.favorite) ||
      tag === mobileContactFilter;

    return matchesSearch && matchesTag;
  });

  function resetContactForm() {
    setEditingContactId(null);
    setContactClientSearch("");
    setContactClient(null);
    setContactForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
      tag: "Personale",
    });
  }

  function saveContact() {
    if (!contactForm.name || !contactForm.phone) {
      showMessage("Nome e telefono sono obbligatori", "error");
      return;
    }

    const payload = {
      id: editingContactId || `CNT-${Date.now()}`,
      name: contactForm.name,
      phone: contactForm.phone,
      address: contactForm.address,
      notes: contactForm.notes,
      tag: contactForm.tag || "Personale",
      clientId: contactClient?.id || null,
      clientName: contactClient?.name || contactClientSearch || "",
      clientCity: contactClient?.city || "",
      clientRegion: contactClient?.region || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = editingContactId
      ? contacts.map((contact) =>
          contact.id === editingContactId ? payload : contact,
        )
      : [payload, ...contacts];

    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();

    showMessage(editingContactId ? "Contatto aggiornato" : "Contatto aggiunto");
  }

  function editContact(contact: any) {
    setEditingContactId(contact.id);
    setContactClientSearch(contact.clientName || "");
    setContactClient({
      id: contact.clientId || null,
      name: contact.clientName || "",
      city: contact.clientCity || "",
      region: contact.clientRegion || "",
    });

    setContactForm({
      name: contact.name || "",
      phone: contact.phone || "",
      address: contact.address || "",
      notes: contact.notes || "",
      tag: contact.tag || "Personale",
    });
  }

  function deleteContact(id: string) {
    const updated = contacts.filter((contact) => contact.id !== id);
    setContacts(updated);
    localStorage.setItem("atlas-contacts", JSON.stringify(updated));
    resetContactForm();
    showMessage("Contatto eliminato");
  }

  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function openBudgetForm(contractName?: string) {
    const selectedContractName =
      contractName ||
      budgetForm.contractName ||
      budgets[0]?.contractName ||
      editableContracts[0]?.name ||
      "";
    const existing = budgets.find(
      (item) => item.contractName === selectedContractName,
    );

    setBudgetForm({
      contractName: selectedContractName,
      value: String(existing?.value || budget || INITIAL_BUDGET),
      notes: existing?.notes || "",
    });
    setMobileBudgetFormOpen(true);
  }

  function saveMobileBudget() {
    const parsed = Number(String(budgetForm.value || "0").replace(",", "."));
    const contract = editableContracts.find(
      (item) => item.name === budgetForm.contractName,
    );

    if (!contract) {
      showMessage("Seleziona un contratto / entità", "error");
      return;
    }

    if (Number.isNaN(parsed)) {
      showMessage("Valore budget non valido", "error");
      return;
    }

    const payload = {
      id: `BUD-${contract.name.replace(/[^A-Z0-9]+/gi, "-").toUpperCase()}`,
      contractName: contract.name,
      entity: contract.clientType || contract.name,
      value: parsed,
      notes: budgetForm.notes || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = budgets.some((item) => item.contractName === contract.name)
      ? budgets.map((item) =>
          item.contractName === contract.name ? payload : item,
        )
      : [payload, ...budgets];

    setBudgets(updated);
    localStorage.setItem("atlas-budgets", JSON.stringify(updated));
    setBudget(updated.reduce((sum, item) => sum + Number(item.value || 0), 0));
    localStorage.setItem(
      "atlas-budget",
      String(updated.reduce((sum, item) => sum + Number(item.value || 0), 0)),
    );

    setMobileBudgetFormOpen(false);
    showMessage("Budget contratto aggiornato");
  }

  async function promptPlanTicket(id: string) {
    const current = tickets.find((t) => String(t.id) === String(id));
    const date = prompt(
      "Data intervento (AAAA-MM-GG):",
      current?.date || selectedDate || formatLocalDate(new Date()),
    );
    if (!date) return;

    const slot = prompt(
      "Slot (Mattina/Pomeriggio):",
      current?.slot || selectedSlot || "Mattina",
    );
    if (!slot) return;

    const tech = prompt(
      "Tecnico:",
      current?.technician || technician || technicians[0],
    );
    if (!tech) return;

    const { error } = await supabase
      .from("tickets")
      .update({
        technician: tech,
        intervention_date: date,
        slot,
        status: "Pianificato",
      })
      .eq("id", Number(id));

    if (error) {
      console.log(error);
      showMessage("Errore pianificazione ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? { ...t, technician: tech, date, slot, status: "Pianificato" }
          : t,
      ),
    );

    showMessage("Ticket pianificato");
  }

  async function promptCloseTicket(id: string) {
    const notes = prompt("Note chiusura:", closingNotes || "");
    if (notes === null) return;

    const future = prompt("Necessità future:", futureNeeds || "");
    if (future === null) return;

    const today = formatLocalDate(new Date());

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "Chiuso",
        intervention_date: today,
        closed_at: new Date().toISOString(),
        closing_notes: notes,
        future_needs: future,
        resolved: true,
      })
      .eq("id", Number(id));

    if (error) {
      console.log(error);
      showMessage("Errore chiusura ticket", "error");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              status: "Chiuso",
              date: today,
              closedAt: new Date().toISOString(),
              urgent: false,
              closingNotes: notes,
              futureNeeds: future,
              resolved: true,
            }
          : t,
      ),
    );

    showMessage("Ticket chiuso");
  }

  function startCalendarCreate(day?: string) {
    setEditingCalendarTicketId(null);
    setExpandedCalendarTicketId(null);
    setSelectedCalendarDay(
      day || mobileSelectedDate || formatLocalDate(new Date()),
    );
    setCalendarTechnician("");
    setCalendarSiteSearch("");
    setCalendarSite(null);
    setCalendarTime("");
    setTicketType("ordinaria");
    setTicketStatus("pianificata");
    setMobileCalendarFormOpen(true);
  }

  function startCalendarEdit(ticket: any) {
    setEditingCalendarTicketId(String(ticket.id));
    setExpandedCalendarTicketId(String(ticket.id));
    setSelectedCalendarDay(
      ticket.date || mobileSelectedDate || formatLocalDate(new Date()),
    );
    setCalendarTechnician(ticket.technician || "");
    setCalendarSiteSearch(ticket.site || "");
    setCalendarSite({
      id: ticket.site_id || null,
      name: ticket.site || "",
      region: ticket.region || "",
      entity: ticket.entity || "",
      city: ticket.city || "",
    });
    setCalendarTime(ticket.slot || "");
    setTicketType(getTicketType(ticket));
    setTicketStatus(
      (ticket.ticketStatus as AtlasTicketStatus) || "pianificata",
    );
    setMobileCalendarFormOpen(true);
  }

  async function saveMobileCalendarTicket() {
    const reminderDate =
      selectedCalendarDay || mobileSelectedDate || formatLocalDate(new Date());
    const reminderTitle = calendarSite?.name
      ? `Intervento ${calendarSite.name}`
      : calendarSiteSearch
        ? `Intervento ${calendarSiteSearch}`
        : "Intervento calendario";

    if (editingCalendarTicketId) {
      await updateCalendarTicket();
    } else {
      await addCalendarTicket();
    }

    if (calendarReminderEnabled) {
      addManualReminder(
        reminderTitle,
        reminderDate,
        calendarReminderNote || calendarTime || "Reminder calendario",
      );
      setCalendarReminderEnabled(false);
      setCalendarReminderNote("");
    }

    setMobileCalendarFormOpen(false);
  }

  async function promptAddClient() {
    const name = prompt("Nome sede/cliente:");
    if (!name) return;

    const cityValue = prompt("Città:", "") || "";
    const entityValue = prompt("Ente:", "") || "";
    const regionValue = prompt("Regione:", "Da definire") || "Da definire";

    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          name,
          city: cityValue,
          entity: entityValue,
          region: regionValue,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      showMessage("Errore creazione cliente", "error");
      return;
    }

    setSites((prev) => [normalizeSiteRegion(data), ...prev]);
    showMessage("Cliente/sede aggiunto");
  }

  function editMobileContract(contract: any) {
    const startDate = prompt(
      "Data inizio contratto (AAAA-MM-GG):",
      contract.startDate !== "Da verificare" ? contract.startDate : "",
    );
    if (startDate !== null)
      updateContractField(
        contract.name,
        "startDate",
        startDate || "Da verificare",
      );

    const endDate = prompt(
      "Scadenza contratto (AAAA-MM-GG):",
      contract.endDate !== "Da verificare" ? contract.endDate : "",
    );
    if (endDate !== null)
      updateContractField(contract.name, "endDate", endDate || "Da verificare");

    const pdf = prompt("Link PDF contratto:", contract.pdf || "");
    if (pdf !== null) updateContractField(contract.name, "pdf", pdf);

    const notes = prompt("Note contratto:", contract.notes || "");
    if (notes !== null) updateContractField(contract.name, "notes", notes);
  }

  function startContactCreate() {
    setEditingContactId(null);
    setContactClientSearch("");
    setContactClient(null);
    setContactForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
      tag: "Personale",
    });
    setMobileContactFormOpen(true);
  }

  function startContactEdit(contact: any) {
    editContact(contact);
    setMobileContactFormOpen(true);
  }

  function saveMobileContact() {
    saveContact();
    setMobileContactFormOpen(false);
  }

  function startInventoryCreate() {
    setEditingInventoryIndex(null);
    setInventoryForm({
      id: "",
      name: "",
      value: "0",
      quantity: "0",
    });
    setMobileInventoryFormOpen(true);
  }

  function startInventoryEdit(index: number) {
    const item = inventory[index];
    if (!item) return;

    setEditingInventoryIndex(index);
    setInventoryForm({
      id: item.id || "",
      name: item.name || "",
      value: String(item.value || 0),
      quantity: String(item.quantity || 0),
    });
    setMobileInventoryFormOpen(true);
  }

  function saveInventoryItemMobile() {
    const name = inventoryForm.name.trim();
    const id =
      inventoryForm.id.trim() || name.toUpperCase().replace(/\s+/g, "-");

    if (!name || !id) {
      showMessage("Nome e ID articolo sono obbligatori", "error");
      return;
    }

    const payload = {
      id,
      name,
      value: Number(String(inventoryForm.value || "0").replace(",", ".")),
      quantity: Number(String(inventoryForm.quantity || "0").replace(",", ".")),
    };

    const updated =
      editingInventoryIndex === null
        ? [payload, ...inventory]
        : inventory.map((item, index) =>
            index === editingInventoryIndex ? { ...item, ...payload } : item,
          );

    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
    setMobileInventoryFormOpen(false);
    setEditingInventoryIndex(null);
    showMessage(
      editingInventoryIndex === null
        ? "Articolo aggiunto"
        : "Articolo aggiornato",
    );
  }

  function deleteInventoryItemMobile() {
    if (editingInventoryIndex === null) return;

    const updated = inventory.filter(
      (_, index) => index !== editingInventoryIndex,
    );
    setInventory(updated);
    localStorage.setItem("atlas-inventory", JSON.stringify(updated));
    setMobileInventoryFormOpen(false);
    setEditingInventoryIndex(null);
    showMessage("Articolo eliminato");
  }

  function openSystemMobile(systemName: string) {
    setSelectedSystem(selectedSystem === systemName ? null : systemName);
  }

  function renderDateInput(
    value: string,
    onChange: (value: string) => void,
    className = input,
  ) {
    return (
      <div className="relative w-full">
        <input
          type="date"
          className={`${className} w-full appearance-none pr-12`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <CalendarDays
          size={20}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    );
  }

  function addManualReminder(title: string, date: string, note = "") {
    if (!title || !date) return;

    const reminder = {
      id: `REM-${Date.now()}`,
      title,
      date,
      note,
      done: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [reminder, ...manualReminders];
    setManualReminders(updated);
    localStorage.setItem("atlas-reminders", JSON.stringify(updated));
  }

  function toggleReminderDone(id: string) {
    const updated = manualReminders.map((reminder) =>
      reminder.id === id ? { ...reminder, done: !reminder.done } : reminder,
    );
    setManualReminders(updated);
    localStorage.setItem("atlas-reminders", JSON.stringify(updated));
  }

  const todayIso = formatLocalDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowIso = formatLocalDate(tomorrowDate);

  const budgetAlerts = budgets
    .map((item) => {
      const remaining = getBudgetRemaining(item.contractName);
      const total = Number(item.value || 0);
      const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
      return { ...item, remaining, percentage };
    })
    .filter((item) => item.value > 0 && item.percentage <= 20);

  const todayTickets = tickets.filter((ticket) => ticket.date === todayIso);
  const tomorrowTickets = tickets.filter(
    (ticket) => ticket.date === tomorrowIso,
  );

  const notificationItems = [
    ...manualReminders
      .filter((reminder) => !reminder.done)
      .map((reminder) => ({
        id: reminder.id,
        type: "Reminder",
        title: reminder.title,
        detail: `${reminder.date}${reminder.note ? ` · ${reminder.note}` : ""}`,
        tone: "blue",
        action: () => toggleReminderDone(reminder.id),
      })),
    ...todayTickets.map((ticket) => ({
      id: `today-${ticket.id}`,
      type: "Oggi",
      title: ticket.site || "Intervento",
      detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
      tone: "emerald",
    })),
    ...tomorrowTickets.map((ticket) => ({
      id: `tomorrow-${ticket.id}`,
      type: "Domani",
      title: ticket.site || "Intervento",
      detail: `${ticket.slot || "Slot n/d"} · ${ticket.technician || "Tecnico n/d"}`,
      tone: "blue",
    })),
    ...expiringContracts.map((contract) => ({
      id: `contract-${contract.name}`,
      type: "Contratto",
      title: contract.name,
      detail: getContractStatus(contract).label,
      tone: "amber",
    })),
    ...budgetAlerts.map((budgetItem) => ({
      id: `budget-${budgetItem.id}`,
      type: "Budget",
      title: budgetItem.contractName,
      detail: `Residuo ${euro(budgetItem.remaining)} (${budgetItem.percentage}%)`,
      tone: "red",
    })),
    ...inventoryCritical.slice(0, 6).map((item) => ({
      id: `inventory-${item.id}`,
      type: "Magazzino",
      title: item.name,
      detail: `Quantità ${item.quantity}`,
      tone: Number(item.quantity) <= 0 ? "red" : "amber",
    })),
  ];

  function openTicketFromCustomer(customer: any, selectedSite?: any) {
    setSiteSearch(selectedSite?.name || "");
    setSite(selectedSite?.name || "");
    setRegion(selectedSite?.region || "");
    setEntity(selectedSite?.entity || customer?.name || "");
    setCity(selectedSite?.city || "");
    setSiteId(selectedSite?.id || null);
    setTicketTitle(
      customer?.name
        ? `Nuova chiamata - ${customer.name}`
        : selectedSite?.name
          ? `Nuova chiamata - ${selectedSite.name}`
          : "",
    );
    setProblem("");
    setMobileView("operativo");
    setActiveTab("operativo");
  }

  function handleTenantChange(tenant: AtlasTenant) {
    setActiveTenant(tenant);
    storeTenantSlug(tenant.slug);
    setSite("");
    setSiteSearch("");
    setRegion("");
    setEntity("");
    setCity("");
    setSiteId(null);
    setTicketTitle("");
    setProblem("");
    setSelectedDate("");
    setSelectedSlot("");
    setExpectedCloseDate("");
    setTickets([]);
    setSites([]);
    setCustomers([]);
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.log("Errore logout AuthProvider:", error);
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Errore logout Supabase:", error);
    }

    setTickets([]);
    setSites([]);
    setCustomers([]);
    setActiveTenant(null);

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  function renderNotificationsDrawer() {
    if (!notificationsOpen) return null;

    return (
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm">
        <div
          className={`ml-auto flex h-full w-full max-w-md flex-col border-l p-5 shadow-2xl ${
            theme === "dark"
              ? "border-white/10 bg-[#07111f] text-white"
              : "border-slate-200 bg-[#f4f7fb] text-slate-950"
          }`}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
                ATLAS
              </p>
              <h2 className="text-2xl font-black">Notifiche</h2>
            </div>

            <button
              onClick={() => setNotificationsOpen(false)}
              className={`rounded-2xl p-3 ${
                theme === "dark"
                  ? "bg-white/10 text-white"
                  : "bg-white text-slate-900 shadow-sm"
              }`}
            >
              <X size={22} />
            </button>
          </div>

          <div
            className={`mb-4 rounded-3xl border p-4 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.05]"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="mb-3 text-sm font-black">Nuovo reminder manuale</p>
            <div className="grid gap-3">
              <input
                className={input}
                placeholder="Titolo reminder"
                id="atlas-reminder-title"
              />
              {renderDateInput("", (value) => {
                const field = document.getElementById(
                  "atlas-reminder-date",
                ) as HTMLInputElement | null;
                if (field) field.value = value;
              })}
              <input id="atlas-reminder-date" type="hidden" />
              <button
                onClick={() => {
                  const title =
                    (
                      document.getElementById(
                        "atlas-reminder-title",
                      ) as HTMLInputElement | null
                    )?.value || "";
                  const date =
                    (
                      document.getElementById(
                        "atlas-reminder-date",
                      ) as HTMLInputElement | null
                    )?.value || todayIso;
                  addManualReminder(title, date);
                  showMessage("Reminder aggiunto");
                }}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
              >
                + Aggiungi reminder
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {notificationItems.length === 0 ? (
              <div
                className={`rounded-3xl border p-5 text-sm ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.05] text-slate-300"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Nessuna notifica attiva.
              </div>
            ) : (
              notificationItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-4 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.06]"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.tone === "red"
                            ? "bg-red-500/15 text-red-300"
                            : item.tone === "amber"
                              ? "bg-amber-500/15 text-amber-300"
                              : item.tone === "emerald"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-blue-500/15 text-blue-300"
                        }`}
                      >
                        {item.type}
                      </span>
                      <p className="mt-3 font-black">{item.title}</p>
                      <p
                        className={
                          theme === "dark"
                            ? "text-sm text-slate-400"
                            : "text-sm text-slate-600"
                        }
                      >
                        {item.detail}
                      </p>
                    </div>

                    {"action" in item && (
                      <button
                        onClick={() => (item as any).action?.()}
                        className="rounded-2xl bg-emerald-600 p-3 text-white"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
  const tabGroups = [
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
        { key: "dispatch", label: "Centrale Operativa", icon: AlertTriangle },
        { key: "operativo", label: "Apri Chiamata", icon: AlertTriangle },
        { key: "calendario", label: "Calendario", icon: CalendarDays },
        { key: "registro", label: "Registro Ticket", icon: ListChecks },
        { key: "customerPortal", label: "Portale Clienti", icon: Users },
      ],
    },
    {
      title: "Analisi",
      items: [
        { key: "analytics", label: "Analisi", icon: BarChart3 },
        { key: "ai", label: "Insight AI", icon: Activity },
        { key: "activity", label: "Timeline Operativa", icon: Activity },
      ],
    },
    {
      title: "Gestione",
      items: [
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
      ],
    },
  ];

  const tabs = tabGroups.flatMap((group) => group.items);

  const card =
    theme === "dark"
      ? "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur"
      : "rounded-3xl border border-slate-300 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.12)]";

  const input =
    theme === "dark"
      ? "rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
      : "rounded-xl border-2 border-slate-300 bg-white p-3 text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-600";

  const lightInput =
    theme === "dark"
      ? "rounded-xl border border-white/10 bg-slate-950/50 p-2 text-white outline-none focus:border-blue-400"
      : "rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-950 outline-none focus:border-blue-600";

  const panel =
    theme === "dark"
      ? "border-white/10 bg-white/[0.04]"
      : "border-slate-300 bg-slate-50 shadow-sm";

  const innerPanel =
    theme === "dark"
      ? "bg-slate-950/40"
      : "bg-white border border-slate-300 shadow-sm";

  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-600";

  const strongText = theme === "dark" ? "text-white" : "text-slate-950";

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            ATLAS
          </p>
          <p className="mt-3 text-xl font-black">Ripristino sessione...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return <LoginScreen onDone={refreshUser} />;
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden transition-all duration-300 ${
        theme === "dark"
          ? "bg-[#07111f] text-slate-100"
          : "bg-[#eef3f8] text-slate-900"
      }`}
    >
      {renderNotificationsDrawer()}
      <div className="flex min-h-screen">
        <aside
          className={`hidden w-72 shrink-0 border-r p-6 lg:block ${
            theme === "dark"
              ? "border-white/10 bg-[#081523]"
              : "border-slate-300 bg-white shadow-xl shadow-slate-300/30"
          }`}
        >
          <div className="mb-8 flex flex-col items-center gap-3 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
            <img
              src="/secom-logo.png.png"
              alt="Secom"
              className="h-24 w-auto object-contain"
            />

            <div className="text-center">
              <div className="text-3xl font-black tracking-[0.35em]">ATLAS</div>
              <div className="text-sm font-bold text-blue-500">
                Centrale operativa
              </div>
            </div>
          </div>

          <nav className="space-y-5">
            {tabGroups.map((group) => {
              const visibleItems = group.items.filter((tab) =>
                tab.key === "utenti"
                  ? currentUser?.role === "admin"
                  : canViewModule(currentUser, tab.key),
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-2">
                  <p className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    {group.title}
                  </p>

                  {visibleItems.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all hover:translate-x-1 ${
                        activeTab === key
                          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                          : theme === "dark"
                            ? "border-white/10 text-slate-300 hover:bg-white/10"
                            : "border-slate-300 bg-slate-50 text-slate-800 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06111f]/95 px-5 pb-4 pt-5 backdrop-blur md:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMobileMoreOpen(true)}
                className="rounded-2xl p-2 text-white"
                aria-label="Apri menu mobile"
              >
                <Menu size={26} />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/secom-logo.png.png"
                  alt="Secom"
                  className="h-9 w-auto object-contain"
                />
                <h1 className="truncate text-base font-black text-white">
                  Centrale Operativa ATLAS
                </h1>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <TenantSwitcher
                  tenants={tenants}
                  activeTenant={activeTenant}
                  onTenantChange={handleTenantChange}
                />
                <UserSessionBadge
                  user={currentUser}
                  compact
                  onLogout={handleLogout}
                />
              </div>

              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative rounded-2xl p-2 text-white"
                aria-label="Notifiche"
              >
                <Bell size={24} />
                {notificationItems.length > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {notificationItems.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <header
            className={`hidden md:block sticky top-0 z-30 border-b backdrop-blur ${
              theme === "dark"
                ? "border-white/10 bg-[#07111f]/90"
                : "border-slate-300 bg-white/95 shadow-sm"
            }`}
          >
            <div className="px-4 py-3 md:px-8 md:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src="/secom-logo.png.png"
                    alt="Secom"
                    className="h-10 w-auto object-contain lg:hidden"
                  />

                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-black md:text-2xl">
                      Centrale Operativa ATLAS
                    </h1>
                    <p
                      className={`hidden text-sm md:block ${
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Clienti, ticket, calendario e operatività.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TenantSwitcher
                    tenants={tenants}
                    activeTenant={activeTenant}
                    onTenantChange={handleTenantChange}
                  />
                  <UserSessionBadge
                    user={currentUser}
                    onLogout={handleLogout}
                  />

                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className={`relative shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                      theme === "dark"
                        ? "border-white/10 bg-white/[0.06] text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                    aria-label="Notifiche"
                  >
                    <Bell size={18} />
                    {notificationItems.length > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                        {notificationItems.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                      theme === "dark"
                        ? "border-white/10 bg-white text-slate-900"
                        : "border-slate-300 bg-slate-950 text-white"
                    }`}
                  >
                    {theme === "dark" ? "☀️" : "🌙"}
                    <span className="ml-2 hidden md:inline">
                      {theme === "dark" ? "Light" : "Dark"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <div className="relative w-full md:w-96">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none ${
                      theme === "dark"
                        ? "border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-blue-400"
                        : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-blue-600"
                    }`}
                    placeholder="Cerca sito, cliente, contratto..."
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div
              className={`border-t px-3 py-2 lg:hidden ${
                theme === "dark" ? "border-white/10" : "border-slate-200"
              }`}
            >
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs
                  .filter((tab) =>
                    tab.key === "utenti"
                      ? currentUser?.role === "admin"
                      : canViewModule(currentUser, tab.key),
                  )
                  .map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${
                        activeTab === key
                          ? "border-blue-500 bg-blue-600 text-white"
                          : theme === "dark"
                            ? "border-white/10 bg-white/10 text-slate-300"
                            : "border-slate-300 bg-white text-slate-800"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
              </div>
            </div>
          </header>

          <MobileMoreMenu
            mobileMoreOpen={mobileMoreOpen}
            setMobileMoreOpen={setMobileMoreOpen}
            mobileView={mobileView}
            setMobileView={setMobileView}
          />

          <main className="w-full max-w-full overflow-x-hidden space-y-6 p-5 pb-24 md:p-8">
            {tenantLoading && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-black text-blue-200">
                Caricamento organizzazione in corso...
              </div>
            )}
            {!tenantLoading && !activeTenant && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-black text-red-200">
                Nessuna organizzazione attiva configurata. Controlla la
                configurazione su Supabase.
              </div>
            )}
            {message && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
                <div
                  className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl ${
                    messageType === "success"
                      ? "border-emerald-400/30 bg-emerald-950 text-emerald-100"
                      : "border-red-400/30 bg-red-950 text-red-100"
                  }`}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
                    {messageType === "success" ? "✓" : "!"}
                  </div>

                  <p className="text-lg font-black">
                    {messageType === "success"
                      ? "Operazione completata"
                      : "Attenzione"}
                  </p>

                  <p className="mt-2 text-sm font-bold opacity-90">{message}</p>

                  <button
                    onClick={() => setMessage("")}
                    className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
            <section className="w-full max-w-full overflow-x-hidden md:hidden">
              {mobileView !== "home" && (
                <>
                  <button
                    onClick={() => setMobileView("home")}
                    className="mb-5 flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-blue-400"
                  >
                    <ChevronLeft size={18} />
                    Torna alla home mobile
                  </button>
                  <div className="mb-5 flex w-full max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-white/10 pb-4 [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[
                      {
                        key: "dispatch",
                        label: "Dispatch",
                        icon: AlertTriangle,
                      },
                      { key: "activity", label: "Activity", icon: Activity },
                      { key: "analytics", label: "Analytics", icon: BarChart3 },
                      { key: "ai", label: "AI", icon: Activity },
                      {
                        key: "customerPortal",
                        label: "Customer Portal",
                        icon: Users,
                      },
                      {
                        key: "operativo",
                        label: "Operativo",
                        icon: AlertTriangle,
                      },
                      {
                        key: "calendario",
                        label: "Calendario",
                        icon: CalendarDays,
                      },
                      { key: "budget", label: "Budget", icon: BarChart3 },
                      { key: "mappa", label: "Mappa", icon: Map },
                      { key: "registro", label: "Registro", icon: ListChecks },
                      { key: "clienti", label: "Clienti", icon: Users },
                      { key: "contratti", label: "Contratti", icon: FileText },
                      { key: "sistemi", label: "Sistemi", icon: Monitor },
                      { key: "magazzino", label: "Magazzino", icon: Package },
                      { key: "contatti", label: "Contatti", icon: Phone },
                      { key: "utenti", label: "Utenti", icon: Users },
                      {
                        key: "glpiImport",
                        label: "Import GLPI",
                        icon: Download,
                      },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setMobileView(key as any)}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${mobileView === key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mobileView === "home" && (
                <div className="grid gap-5">
                  <CustomerCommandCenter
                    customers={customers}
                    sites={sites}
                    tickets={tickets}
                    onOpenTicket={openTicketFromCustomer}
                  />
                </div>
              )}

              {mobileView === "dispatch" && (
                <DispatchCenter tickets={tickets} technicians={technicians} />
              )}

              {mobileView === "activity" && <GlobalActivityFeed />}

              {mobileView === "analytics" && (
                <KPIDashboard tickets={tickets} technicians={technicians} />
              )}

              {mobileView === "ai" && (
                <AIInsightsPanel
                  tickets={tickets}
                  customers={customers}
                  sites={sites}
                  technicians={technicians}
                />
              )}

              {mobileView === "operativo" && (
                <TicketForm
                  input={input}
                  siteSearch={siteSearch}
                  setSiteSearch={setSiteSearch}
                  site={site}
                  setSite={setSite}
                  setRegion={setRegion}
                  setEntity={setEntity}
                  setCity={setCity}
                  setSiteId={setSiteId}
                  filteredSites={filteredSites}
                  ticketTitle={ticketTitle}
                  setTicketTitle={setTicketTitle}
                  problem={problem}
                  setProblem={setProblem}
                  ticketType={ticketType}
                  setTicketType={setTicketType}
                  ticketStatus={ticketStatus}
                  setTicketStatus={setTicketStatus}
                  expectedCloseDate={expectedCloseDate}
                  setExpectedCloseDate={setExpectedCloseDate}
                  ticketCategoryOptions={ticketCategoryOptions}
                  ticketStatusOptions={ticketStatusOptions}
                  addTicket={addTicket}
                />
              )}

              {mobileView === "calendario" && (
                <div className="grid gap-5">
                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Calendario interventi
                    </h2>
                    <p className="mt-2 break-words text-base text-slate-400">
                      Vista mensile con interventi pianificati e inserimento
                      rapido.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="rounded-2xl bg-blue-600 p-4 text-white"
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <div className="text-2xl font-black capitalize text-white">
                      {monthLabel}
                    </div>
                    <button
                      onClick={() => changeMonth(1)}
                      className="rounded-2xl bg-blue-600 p-4 text-white"
                    >
                      <ChevronRight size={28} />
                    </button>
                  </div>

                  <div className="grid w-full grid-cols-7 gap-1 text-center text-xs font-bold text-slate-300">
                    {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
                      (d) => (
                        <div key={d}>{d}</div>
                      ),
                    )}
                  </div>

                  <div className="grid w-full grid-cols-7 gap-1">
                    {mobileCalendarCells.map((day) => {
                      const iso = formatLocalDate(day);
                      const inMonth =
                        day.getMonth() === calendarMonth.getMonth();
                      const hasTickets = tickets.some((t) => t.date === iso);
                      const selected = mobileSelectedDate === iso;

                      return (
                        <button
                          key={iso}
                          onClick={() => setSelectedCalendarDay(iso)}
                          className={`aspect-square min-h-0 rounded-xl border p-1 text-center ${
                            selected
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-white/10 bg-white/[0.06] text-white"
                          } ${!inMonth ? "opacity-30" : ""}`}
                        >
                          <div className="text-base font-black">
                            {day.getDate()}
                          </div>
                          {hasTickets && (
                            <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-blue-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="text-slate-300" />
                      <h3 className="text-xl font-black text-white">
                        Interventi del{" "}
                        {new Date(
                          `${mobileSelectedDate}T12:00:00`,
                        ).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {mobileSelectedTickets.length === 0 ? (
                        <p className="text-slate-400">
                          Nessun intervento pianificato.
                        </p>
                      ) : (
                        mobileSelectedTickets.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-2xl bg-slate-950/40 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-white">
                                  {t.slot || "Orario n/d"} · {t.site}
                                </p>
                                <p className="text-sm text-slate-400">
                                  {t.technician || "Tecnico n/d"}
                                </p>
                              </div>
                              <button
                                onClick={() => startCalendarEdit(t)}
                                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                              >
                                Modifica
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {mobileCalendarFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white">
                          {editingCalendarTicketId
                            ? "Modifica intervento"
                            : "Nuovo intervento"}
                        </h3>
                        <button
                          onClick={() => setMobileCalendarFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        {renderDateInput(selectedCalendarDay || "", (value) =>
                          setSelectedCalendarDay(value),
                        )}

                        <select
                          className={input}
                          value={calendarTechnician}
                          onChange={(e) =>
                            setCalendarTechnician(e.target.value)
                          }
                        >
                          <option value="">Seleziona tecnico</option>
                          {technicians.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>

                        <div className="relative">
                          <input
                            className={`w-full ${input}`}
                            placeholder="Cerca cliente/sede..."
                            value={calendarSiteSearch}
                            onChange={(e) => {
                              setCalendarSiteSearch(e.target.value);
                              setCalendarSite(null);
                            }}
                          />

                          {calendarSiteSearch && !calendarSite && (
                            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                              {calendarSiteResults.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="block w-full border-b border-white/10 p-4 text-left"
                                  onClick={() => {
                                    setCalendarSite(s);
                                    setCalendarSiteSearch(s.name);
                                  }}
                                >
                                  <div className="font-black text-white">
                                    {s.name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {s.city || "Città n/d"} ·{" "}
                                    {s.entity || "Ente n/d"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <select
                          className={input}
                          value={calendarTime}
                          onChange={(e) => setCalendarTime(e.target.value)}
                        >
                          <option value="">Seleziona orario/slot</option>
                          <option value="Mattina">Mattina</option>
                          <option value="Pomeriggio">Pomeriggio</option>
                        </select>

                        <div className="grid grid-cols-2 gap-3">
                          <select
                            className={input}
                            value={ticketType}
                            onChange={(e) =>
                              setTicketType(
                                e.target.value as AtlasTicketCategory,
                              )
                            }
                          >
                            {ticketCategoryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            className={input}
                            value={ticketStatus}
                            onChange={(e) =>
                              setTicketStatus(
                                e.target.value as AtlasTicketStatus,
                              )
                            }
                          >
                            {ticketStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={saveMobileCalendarTicket}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          {editingCalendarTicketId
                            ? "Salva modifica"
                            : "Aggiungi intervento"}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => startCalendarCreate(mobileSelectedDate)}
                    className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Nuovo intervento
                  </button>
                </div>
              )}

              {mobileView === "registro" && (
                <TicketRegistry
                  variant="mobile"
                  tickets={filteredTickets}
                  exportCsv={exportCsv}
                  promptCloseTicket={promptCloseTicket}
                  setMobileView={setMobileView}
                  filterTechnician={filterTechnician}
                  setFilterTechnician={setFilterTechnician}
                  filterRegion={filterRegion}
                  setFilterRegion={setFilterRegion}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterSite={filterSite}
                  setFilterSite={setFilterSite}
                  urgentOnly={urgentOnly}
                  setUrgentOnly={setUrgentOnly}
                  availableRegions={availableRegions}
                  onToggleUrgent={toggleTicketUrgent}
                />
              )}

              {mobileView === "budget" && (
                <div className="grid gap-4">
                  <h2 className="text-3xl font-black text-white">
                    Budget per contratto
                  </h2>

                  <div className="grid gap-3">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-300">
                            Budget totale contratti
                          </p>
                          <p className="mt-3 text-3xl font-black text-white">
                            {budgetVisible ? euro(totalBudget) : "••••••"}
                          </p>
                        </div>
                        <button
                          onClick={() => openBudgetForm()}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-lg font-black text-white"
                          aria-label="Modifica budget"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-amber-500">
                      <p className="text-base font-black text-slate-300">
                        Consumo straordinari
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">
                        {euro(totalForecast)}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        Solo le chiamate straordinarie scalano il budget.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 border-l-4 border-l-emerald-500">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-slate-300">
                            Residuo totale
                          </p>
                          <p className="mt-3 text-3xl font-black text-white">
                            {budgetVisible ? euro(remainingBudget) : "••••••"}
                          </p>
                        </div>
                        <button
                          onClick={() => setBudgetVisible(!budgetVisible)}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-lg font-black text-white"
                          aria-label="Mostra o nascondi budget"
                        >
                          {budgetVisible ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {budgets.map((item) => {
                      const spent = getBudgetSpent(item.contractName);
                      const total = Number(item.value || 0);
                      const percent =
                        total > 0
                          ? Math.min(100, Math.round((spent / total) * 100))
                          : 0;
                      return (
                        <div
                          key={item.id || item.contractName}
                          className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-white">
                                {item.contractName}
                              </p>
                              <p className="text-sm text-slate-400">
                                {item.entity || "Entità non definita"}
                              </p>
                            </div>
                            <button
                              onClick={() => openBudgetForm(item.contractName)}
                              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                            >
                              ✏️
                            </button>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-slate-400">Budget</p>
                              <p className="font-black text-white">
                                {budgetVisible ? euro(total) : "••••••"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Scalato</p>
                              <p className="font-black text-amber-300">
                                {euro(spent)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Residuo</p>
                              <p className="font-black text-emerald-300">
                                {budgetVisible ? euro(total - spent) : "••••••"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <h3 className="mb-4 text-xl font-black text-white">
                      Straordinari per contratto
                    </h3>
                    {budgets.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Nessun budget configurato.
                      </p>
                    ) : (
                      budgets.map((item) => (
                        <button
                          key={`detail-${item.contractName}`}
                          onClick={() => setMobileView("registro")}
                          className="flex w-full items-center justify-between border-t border-white/10 py-4 text-left text-slate-300"
                        >
                          <span className="font-bold">
                            {item.entity || item.contractName}
                          </span>
                          <span className="flex items-center gap-2">
                            <b className="text-white">
                              {euro(getBudgetSpent(item.contractName))}
                            </b>
                            <ChevronRight size={18} />
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {mobileBudgetFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-white">
                          Budget contratto / entità
                        </h3>
                        <button
                          onClick={() => setMobileBudgetFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <select
                          className={input}
                          value={budgetForm.contractName}
                          onChange={(e) => {
                            const existing = budgets.find(
                              (item) => item.contractName === e.target.value,
                            );
                            setBudgetForm({
                              ...budgetForm,
                              contractName: e.target.value,
                              value: String(
                                existing?.value ||
                                  budgetForm.value ||
                                  INITIAL_BUDGET,
                              ),
                              notes: existing?.notes || "",
                            });
                          }}
                        >
                          {editableContracts.map((contract) => (
                            <option key={contract.name} value={contract.name}>
                              {contract.name}
                            </option>
                          ))}
                        </select>

                        <input
                          className={input}
                          type="number"
                          placeholder="Budget contratto"
                          value={budgetForm.value}
                          onChange={(e) =>
                            setBudgetForm({
                              ...budgetForm,
                              value: e.target.value,
                            })
                          }
                        />

                        <textarea
                          className={input}
                          placeholder="Note budget / riferimento contratto"
                          value={budgetForm.notes}
                          onChange={(e) =>
                            setBudgetForm({
                              ...budgetForm,
                              notes: e.target.value,
                            })
                          }
                        />

                        <button
                          onClick={saveMobileBudget}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva budget
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => openBudgetForm()}
                    className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Aggiorna budget contratto
                  </button>
                </div>
              )}

              {mobileView === "mappa" && (
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <h2 className="text-3xl font-black text-white">
                    Mappa operativa
                  </h2>
                  <select
                    className={input}
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                  >
                    <option value="">Tutti i tecnici</option>
                    {technicians.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input}
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                  >
                    <option value="">Tutte le regioni</option>
                    {availableRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tutti gli stati</option>
                    <option value="Aperto">Aperto</option>
                    <option value="Pianificato">Pianificato</option>
                    <option value="Chiuso">Chiuso</option>
                  </select>
                  <div className="h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
                    <AtlasMap sites={sites} tickets={filteredTickets} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                    <span>
                      <b className="text-blue-400">●</b> Tecnico
                    </span>
                    <span>
                      <b className="text-emerald-400">●</b> Sede operativa
                    </span>
                    <span>
                      <b className="text-yellow-400">●</b> Cliente
                    </span>
                    <span>
                      <b className="text-red-400">●</b> Intervento
                    </span>
                  </div>
                </div>
              )}

              {mobileView === "clienti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">
                        Clienti / Enti
                      </h2>
                      <p className="text-base text-slate-400">
                        {sites.length} sedi totali
                      </p>
                    </div>
                    <button
                      onClick={promptAddClient}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo cliente
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca cliente, città, sede..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />

                  <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 text-center text-sm font-black">
                    <button className="border-b-2 border-blue-500 py-3 text-blue-400">
                      Categorie
                    </button>
                    <button className="py-3 text-slate-400">
                      Elenco clienti
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {Object.entries(clientCategories).map(
                      ([category, categorySites]) => {
                        const filtered = categorySites.filter((s) => {
                          const q = clientSearch.toLowerCase();
                          return (
                            s.name?.toLowerCase().includes(q) ||
                            s.city?.toLowerCase().includes(q) ||
                            s.entity?.toLowerCase().includes(q) ||
                            s.region?.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) return null;

                        return (
                          <div
                            key={category}
                            className="rounded-3xl border border-white/10 bg-white/[0.06]"
                          >
                            <button
                              onClick={() =>
                                setOpenCategory(
                                  openCategory === category ? null : category,
                                )
                              }
                              className="flex w-full items-center justify-between p-4 text-left"
                            >
                              <span className="flex items-center gap-4">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/30 text-lg font-black text-white">
                                  {category.slice(0, 2).toUpperCase()}
                                </span>
                                <span>
                                  <span className="block text-lg font-black text-white">
                                    {category}
                                  </span>
                                  <span className="text-sm text-slate-400">
                                    {filtered.length} sedi
                                  </span>
                                </span>
                              </span>
                              <ChevronRight
                                className={`text-slate-400 transition ${openCategory === category ? "rotate-90" : ""}`}
                              />
                            </button>

                            {openCategory === category && (
                              <div className="grid gap-2 border-t border-white/10 p-4">
                                {filtered.slice(0, 30).map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      setSite(s.name);
                                      setSiteSearch(s.name);
                                      setRegion(s.region || "");
                                      setEntity(s.entity || "");
                                      setCity(s.city || "");
                                      setSiteId(s.id || null);
                                      setMobileView("operativo");
                                    }}
                                    className="rounded-2xl bg-slate-950/40 p-3 text-left"
                                  >
                                    <p className="font-black text-white">
                                      {s.name}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      {s.city || "Città n/d"} ·{" "}
                                      {s.entity || "Ente n/d"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {s.region || "Regione n/d"}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="grid grid-cols-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-white">
                        {sites.length}
                      </p>
                      <p className="text-xs text-slate-400">Sedi totali</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">
                        {Object.keys(clientCategories).length}
                      </p>
                      <p className="text-xs text-slate-400">Categorie</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">
                        {sites.length}
                      </p>
                      <p className="text-xs text-slate-400">Clienti</p>
                    </div>
                  </div>
                </div>
              )}

              {mobileView === "contratti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">
                        Contratti / Accordi commerciali
                      </h2>
                      <p className="text-base text-slate-400">
                        {editableContracts.length} contratti totali
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        showMessage(
                          "Aggiunta nuovo contratto non ancora collegata a database",
                          "error",
                        )
                      }
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 text-center text-xs font-black">
                    <button className="border-b-2 border-blue-500 py-3 text-blue-400">
                      Tutti
                    </button>
                    <button className="py-3 text-slate-400">Attivi</button>
                    <button className="py-3 text-slate-400">In scadenza</button>
                    <button className="py-3 text-slate-400">Scaduti</button>
                  </div>

                  {editableContracts.map((contract) => {
                    const st = getContractStatus(contract);
                    return (
                      <div
                        key={contract.name}
                        className="rounded-3xl border border-white/10 bg-white/[0.06] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-white">
                              {contract.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {contract.clientType}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black text-white ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-300">
                          <b>Periodo:</b> {contract.period}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                          <div>
                            <p>Garanzia</p>
                            <b className="text-white">{contract.warranty}</b>
                          </div>
                          <div>
                            <p>Spedizione</p>
                            <b className="text-white">{contract.shipping}</b>
                          </div>
                          <div>
                            <p>SLA</p>
                            <b className="text-white">{contract.sla}</b>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => editMobileContract(contract)}
                            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                          >
                            Modifica
                          </button>

                          {contract.pdf && (
                            <a
                              href={contract.pdf}
                              target="_blank"
                              className="rounded-2xl bg-white/10 px-4 py-3 font-black text-white"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {mobileView === "sistemi" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">
                        Sistemi / Componenti
                      </h2>
                      <p className="text-base text-slate-400">
                        Catalogo tecnico consultabile dai tecnici
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        showMessage(
                          "Catalogo sistemi collegato da systemsCatalog",
                          "error",
                        )
                      }
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca sistema, componente, produttore..."
                    value={systemSearch}
                    onChange={(e) => setSystemSearch(e.target.value)}
                  />

                  <div className="grid grid-cols-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center text-xs text-slate-400">
                    <div>
                      <p className="text-xl font-black text-white">
                        {systemsCatalog.length}
                      </p>
                      <p>Sistemi</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">
                        {systemsCatalog.reduce(
                          (sum, s: any) => sum + (s.components?.length || 0),
                          0,
                        )}
                      </p>
                      <p>Componenti</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xl font-black text-white">
                        {euro(
                          systemsCatalog.reduce(
                            (sum, s: any) => sum + Number(s.totalCost || 0),
                            0,
                          ),
                        )}
                      </p>
                      <p>Valore totale</p>
                    </div>
                  </div>

                  {systemsCatalog
                    .filter((system: any) => {
                      const q = systemSearch.toLowerCase();
                      return `${system.name} ${system.productName} ${system.components?.map((c: any) => c.name).join(" ")}`
                        .toLowerCase()
                        .includes(q);
                    })
                    .map((system: any) => (
                      <div
                        key={system.name}
                        className="rounded-3xl border border-white/10 bg-white/[0.06]"
                      >
                        <button
                          onClick={() => openSystemMobile(system.name)}
                          className="flex w-full items-center justify-between p-4 text-left"
                        >
                          <span className="flex items-center gap-4">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/30 text-sm font-black text-white">
                              {system.name.slice(0, 5)}
                            </span>
                            <span>
                              <span className="block text-xl font-black text-white">
                                {system.name}
                              </span>
                              <span className="text-sm text-slate-400">
                                {system.productName || "Sistema"}
                              </span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {system.components.length} componenti
                              </span>
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-black text-white">
                              {euro(system.totalCost)}
                            </span>
                            <ChevronRight
                              className={`ml-auto mt-2 text-slate-400 transition ${selectedSystem === system.name ? "rotate-90" : ""}`}
                            />
                          </span>
                        </button>

                        {selectedSystem === system.name && (
                          <div className="grid gap-2 border-t border-white/10 p-4">
                            {(system.components || [])
                              .slice(0, 20)
                              .map((component: any, index: number) => (
                                <div
                                  key={`${component.name}-${index}`}
                                  className="rounded-2xl bg-slate-950/40 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-black text-white">
                                        {component.name || "Componente"}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {component.category ||
                                          component.type ||
                                          "Categoria n/d"}
                                      </p>
                                    </div>
                                    <p className="shrink-0 text-sm font-black text-white">
                                      {euro(
                                        Number(
                                          component.cost ||
                                            component.price ||
                                            0,
                                        ),
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {mobileView === "contatti" && (
                <div className="grid gap-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-3xl font-black text-white">
                        Contatti
                      </h2>
                      <p className="text-base text-slate-400">
                        Rubrica tecnica, personale e fornitori.
                      </p>
                    </div>
                    <button
                      onClick={startContactCreate}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo
                    </button>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca contatto, telefono, email, azienda..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />

                  <div className="flex max-w-full gap-5 overflow-x-auto border-b border-white/10 text-sm font-black">
                    {[
                      { key: "Tutti", label: "Tutti" },
                      { key: "Personale", label: "Personale" },
                      { key: "Fornitore", label: "Fornitori" },
                      { key: "Istituzione", label: "Istituzioni" },
                      { key: "Preferiti", label: "Preferiti" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setMobileContactFilter(tab.key as any);
                          setMobileContactFormOpen(false);
                          setEditingContactId(null);
                        }}
                        className={`shrink-0 px-2 py-3 ${
                          mobileContactFilter === tab.key
                            ? "border-b-2 border-blue-500 text-blue-400"
                            : "text-slate-400"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {mobileContactFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white">
                          {editingContactId
                            ? "Modifica contatto"
                            : "Nuovo contatto"}
                        </h3>
                        <button
                          onClick={() => setMobileContactFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input
                          className={input}
                          placeholder="Nome"
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            })
                          }
                        />

                        <input
                          className={input}
                          placeholder="Telefono"
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              phone: e.target.value,
                            })
                          }
                        />

                        <input
                          className={input}
                          placeholder="Indirizzo"
                          value={contactForm.address}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              address: e.target.value,
                            })
                          }
                        />

                        <textarea
                          className={input}
                          placeholder="Note"
                          value={contactForm.notes}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              notes: e.target.value,
                            })
                          }
                        />

                        <div className="relative">
                          <input
                            className={`w-full ${input}`}
                            placeholder="Collega cliente/sede"
                            value={contactClientSearch}
                            onChange={(e) => {
                              setContactClientSearch(e.target.value);
                              setContactClient(null);
                            }}
                          />

                          {contactClientSearch && !contactClient && (
                            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                              {contactClientResults.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="block w-full border-b border-white/10 p-4 text-left"
                                  onClick={() => {
                                    setContactClient(s);
                                    setContactClientSearch(s.name);
                                  }}
                                >
                                  <div className="font-black text-white">
                                    {s.name}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {s.city || "Città n/d"} ·{" "}
                                    {s.entity || "Ente n/d"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <select
                          className={input}
                          value={contactForm.tag}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              tag: e.target.value,
                            })
                          }
                        >
                          <option value="Personale">Personale</option>
                          <option value="Fornitore">Fornitore</option>
                          <option value="Istituzione">Istituzione</option>
                        </select>

                        <button
                          onClick={saveMobileContact}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva contatto
                        </button>

                        {editingContactId && (
                          <button
                            onClick={() => {
                              deleteContact(editingContactId);
                              setMobileContactFormOpen(false);
                            }}
                            className="rounded-3xl bg-red-600 p-4 text-lg font-black text-white"
                          >
                            Elimina contatto
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!mobileContactFormOpen && (
                    <>
                      <p className="text-sm text-slate-400">
                        {filteredContacts.length} contatti trovati
                      </p>

                      {filteredContacts.map((contact: any) => (
                        <button
                          key={contact.id}
                          onClick={() => startContactEdit(contact)}
                          className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/40 text-lg font-black text-white">
                              {String(contact.name || "?")
                                .split(" ")
                                .map((x: string) => x[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-lg font-black text-white">
                                {contact.name}
                              </span>
                              <span className="block truncate text-sm text-slate-400">
                                {contact.notes ||
                                  contact.clientName ||
                                  "Contatto"}
                              </span>
                              <span className="mt-2 block text-xs text-slate-400">
                                ☎ {contact.phone || "Telefono n/d"}
                              </span>
                              <span className="mt-2 inline-block rounded-full bg-blue-600/20 px-2 py-1 text-[11px] font-black text-blue-300">
                                {contact.tag || "Personale"}
                              </span>
                            </span>
                          </div>
                          <ChevronRight className="shrink-0 text-slate-400" />
                        </button>
                      ))}

                      {filteredContacts.length === 0 && (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-slate-400">
                          La lista è vuota.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {mobileView === "magazzino" && (
                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Magazzino
                    </h2>
                    <p className="text-base text-slate-400">
                      Articoli, valori, quantità e stato scorte.
                    </p>
                  </div>

                  <button
                    onClick={startInventoryCreate}
                    className="w-full rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                  >
                    + Nuovo articolo
                  </button>

                  {mobileInventoryFormOpen && (
                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-white">
                          {editingInventoryIndex === null
                            ? "Nuovo articolo"
                            : "Modifica articolo"}
                        </h3>
                        <button
                          onClick={() => setMobileInventoryFormOpen(false)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
                        >
                          Chiudi
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input
                          className={input}
                          placeholder="Nome articolo"
                          value={inventoryForm.name}
                          onChange={(e) =>
                            setInventoryForm({
                              ...inventoryForm,
                              name: e.target.value,
                            })
                          }
                        />

                        <input
                          className={input}
                          placeholder="ID articolo"
                          value={inventoryForm.id}
                          onChange={(e) =>
                            setInventoryForm({
                              ...inventoryForm,
                              id: e.target.value,
                            })
                          }
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className={input}
                            type="number"
                            placeholder="Valore"
                            value={inventoryForm.value}
                            onChange={(e) =>
                              setInventoryForm({
                                ...inventoryForm,
                                value: e.target.value,
                              })
                            }
                          />

                          <input
                            className={input}
                            type="number"
                            placeholder="Quantità"
                            value={inventoryForm.quantity}
                            onChange={(e) =>
                              setInventoryForm({
                                ...inventoryForm,
                                quantity: e.target.value,
                              })
                            }
                          />
                        </div>

                        <button
                          onClick={saveInventoryItemMobile}
                          className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
                        >
                          Salva articolo
                        </button>

                        {editingInventoryIndex !== null && (
                          <button
                            onClick={deleteInventoryItemMobile}
                            className="rounded-3xl bg-red-600 p-4 text-lg font-black text-white"
                          >
                            Elimina articolo
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    className={`w-full ${input}`}
                    placeholder="Cerca articolo o ID..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />

                  <div className="grid gap-3">
                    {inventory
                      .filter((item) => {
                        const q = inventorySearch.toLowerCase();
                        return (
                          item.id.toLowerCase().includes(q) ||
                          item.name.toLowerCase().includes(q)
                        );
                      })
                      .map((item, index) => {
                        const status = getInventoryStatus(
                          Number(item.quantity),
                        );

                        return (
                          <button
                            key={`${item.id}-${index}`}
                            onClick={() => startInventoryEdit(index)}
                            className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-lg font-black uppercase leading-tight text-white">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  ID: {item.id}
                                </p>
                              </div>

                              <ChevronRight
                                className="mt-1 shrink-0 text-slate-500"
                                size={20}
                              />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-slate-400">
                                  Quantità
                                </p>
                                <p className="text-xl font-black text-white">
                                  {item.quantity}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">Valore</p>
                                <p className="text-xl font-black text-white">
                                  {euro(Number(item.value || 0))}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">Stato</p>
                                <span
                                  className={
                                    status.className +
                                    " mt-1 inline-block rounded-xl px-2 py-1 text-[11px] font-black"
                                  }
                                >
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-400">
                    <span>
                      ⓘ Ultimo aggiornamento:{" "}
                      {new Date().toLocaleDateString("it-IT")}{" "}
                      {new Date().toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>↻</span>
                  </div>
                </div>
              )}
            </section>

            {activeTab === "budget" && (
              <section className="hidden space-y-4 md:block">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className={card}>
                    <p className="text-sm text-slate-400">Budget contratti</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-2xl font-black">
                        {budgetVisible ? euro(totalBudget) : "••••••"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openBudgetForm()}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setBudgetVisible(!budgetVisible)}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold"
                        >
                          {budgetVisible ? "👁️" : "🙈"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Somma dei budget associati a contratti/entità.
                    </p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">
                      Consumo straordinario
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {euro(totalForecast)}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Solo ticket straordinari.
                    </p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">Budget residuo</p>
                    <p className="mt-2 text-2xl font-black">
                      {euro(remainingBudget)}
                    </p>
                  </div>
                  <div className={card}>
                    <p className="text-sm text-slate-400">
                      Ticket straordinari
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {
                        tickets.filter(
                          (t) => getTicketType(t) === "straordinaria",
                        ).length
                      }
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      su {tickets.length} ticket totali
                    </p>
                  </div>
                </div>

                {mobileBudgetFormOpen && (
                  <div className={card}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          Aggiorna budget contratto
                        </h3>
                        <p className="text-sm text-slate-400">
                          Il budget viene collegato al contratto/entità, non al
                          singolo cliente.
                        </p>
                      </div>
                      <button
                        onClick={() => setMobileBudgetFormOpen(false)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black"
                      >
                        Chiudi
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <select
                        className={input}
                        value={budgetForm.contractName}
                        onChange={(e) => {
                          const existing = budgets.find(
                            (item) => item.contractName === e.target.value,
                          );
                          const contract = editableContracts.find(
                            (item) => item.name === e.target.value,
                          );
                          setBudgetForm({
                            contractName: e.target.value,
                            value: String(existing?.value || ""),
                            notes: existing?.notes || "",
                          });
                          setBudgetClientSearch(contract?.clientType || "");
                        }}
                      >
                        {editableContracts.map((contract) => (
                          <option key={contract.name} value={contract.name}>
                            {contract.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className={input}
                        type="number"
                        value={budgetForm.value}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            value: e.target.value,
                          })
                        }
                        placeholder="Importo budget"
                      />
                      <input
                        className={input}
                        value={budgetForm.notes}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Note budget"
                      />
                    </div>
                    <button
                      onClick={saveMobileBudget}
                      className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                    >
                      Salva budget contratto
                    </button>
                  </div>
                )}

                <div className={card}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">
                        Budget per contratto/entità
                      </h3>
                      <p className="text-sm text-slate-400">
                        Il consumo viene scalato solo dalle chiamate
                        straordinarie collegate automaticamente al contratto.
                      </p>
                    </div>
                    <button
                      onClick={() => openBudgetForm()}
                      className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                    >
                      + Nuovo / modifica budget
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {budgets.map((item) => {
                      const spent = getBudgetSpent(item.contractName);
                      const total = Number(item.value || 0);
                      const remaining = total - spent;
                      const percent =
                        total > 0
                          ? Math.min(100, Math.round((spent / total) * 100))
                          : 0;

                      return (
                        <div
                          key={item.id || item.contractName}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black">{item.contractName}</p>
                              <p className="text-sm text-slate-400">
                                {item.entity || "Entità da verificare"}
                              </p>
                            </div>
                            <span className="rounded-xl bg-blue-600/20 px-3 py-1 text-sm font-black text-blue-300">
                              {percent}%
                            </span>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                            <div>
                              <p className="text-slate-400">Totale</p>
                              <p className="font-black">
                                {budgetVisible ? euro(total) : "••••••"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Scalato</p>
                              <p className="font-black text-amber-300">
                                {euro(spent)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">Residuo</p>
                              <p className="font-black text-emerald-300">
                                {euro(remaining)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "home" && (
              <section className="hidden min-h-[calc(100vh-160px)] items-center justify-center md:flex">
                <div className="w-full max-w-5xl">
                  <CustomerCommandCenter
                    customers={customers}
                    sites={sites}
                    tickets={tickets}
                    onOpenTicket={openTicketFromCustomer}
                  />
                </div>
              </section>
            )}

            {activeTab === "dispatch" && (
              <DispatchCenter tickets={tickets} technicians={technicians} />
            )}

            {activeTab === "activity" && <GlobalActivityFeed />}

            {activeTab === "analytics" && (
              <KPIDashboard tickets={tickets} technicians={technicians} />
            )}

            {activeTab === "ai" && (
              <AIInsightsPanel
                tickets={tickets}
                customers={customers}
                sites={sites}
                technicians={technicians}
              />
            )}

            {activeTab === "customerPortal" && (
              <CustomerPortal
                user={currentUser}
                tenant={activeTenant}
                tickets={tickets}
                sites={sites}
                onOpenTicket={openTicketFromCustomer}
              />
            )}

            {activeTab === "operativo" && (
              <section className={`${card} hidden md:block`}>
                <h2 className="mb-5 text-2xl font-black">
                  Apri nuova chiamata manuale
                </h2>

                {site && (
                  <div className="mb-5 rounded-3xl border border-blue-400/30 bg-blue-500/10 p-5">
                    {selectedContract ? (
                      <>
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="text-xl font-black text-blue-200">
                            {selectedContract.name}
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white ${
                              getContractStatus(selectedContract).color
                            }`}
                          >
                            {getContractStatus(selectedContract).label}
                          </span>
                        </div>

                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <p>
                            <b>Cliente:</b> {selectedContract.clientType}
                          </p>
                          <p>
                            <b>Periodo:</b> {selectedContract.period}
                          </p>
                          <p>
                            <b>Garanzia:</b> {selectedContract.warranty}
                          </p>
                          <p>
                            <b>Spedizione:</b> {selectedContract.shipping}
                          </p>
                          <p>
                            <b>Ricambi:</b> {selectedContract.spareParts}
                          </p>
                          <p>
                            <b>SLA:</b> {selectedContract.sla}
                          </p>
                        </div>
                        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-slate-200">
                          {selectedContract.notes}
                        </p>
                        <div className="mt-3 grid gap-3 rounded-2xl bg-slate-950/40 p-3 text-sm md:grid-cols-3">
                          <div>
                            <p className="text-slate-400">Budget contratto</p>
                            <p className="font-black">
                              {euro(getBudgetTotal(selectedContract.name))}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">
                              Straordinario scalato
                            </p>
                            <p className="font-black text-amber-300">
                              {euro(getBudgetSpent(selectedContract.name))}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Residuo contratto</p>
                            <p className="font-black text-emerald-300">
                              {euro(getBudgetRemaining(selectedContract.name))}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-300">
                        Nessun contratto specifico riconosciuto per questa sede.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <input
                      className={`w-full ${input}`}
                      placeholder="Cerca sede: es. Alatri, Bari, Ferrara..."
                      value={siteSearch}
                      onChange={(e) => {
                        setSiteSearch(e.target.value);
                        setSite("");
                        setRegion("");
                        setEntity("");
                        setCity("");
                        setSiteId(null);
                      }}
                    />

                    {siteSearch && !site && (
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                        {filteredSites.length === 0 && (
                          <div className="p-3 text-sm text-slate-400">
                            Nessuna sede trovata
                          </div>
                        )}

                        {filteredSites.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="block w-full border-b border-white/10 p-3 text-left hover:bg-white/10"
                            onClick={() => {
                              setSite(s.name);
                              setSiteSearch(s.name);
                              setRegion(s.region || "");
                              setEntity(s.entity || "");
                              setCity(s.city || "");
                              setSiteId(s.id || null);
                            }}
                          >
                            <div className="font-bold">{s.name}</div>
                            <div className="text-xs text-slate-400">
                              {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    className={input}
                    placeholder="Regione automatica"
                    value={region}
                    readOnly
                  />

                  <input
                    className={input}
                    placeholder="Titolo chiamata"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                  />

                  <select
                    className={input}
                    value={ticketType}
                    onChange={(e) =>
                      setTicketType(e.target.value as AtlasTicketCategory)
                    }
                  >
                    {ticketCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    className={`md:col-span-2 ${input}`}
                    placeholder="Descrizione intervento"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                  />

                  <select
                    className={input}
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                  >
                    <option value="">Tecnico non assegnato</option>
                    {technicians.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>

                  <select
                    className={input}
                    value={ticketStatus}
                    onChange={(e) =>
                      setTicketStatus(e.target.value as AtlasTicketStatus)
                    }
                  >
                    {ticketStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {renderDateInput(selectedDate, setSelectedDate)}

                  <select
                    className={input}
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                  >
                    <option value="">Seleziona slot</option>
                    <option value="Mattina">Mattina</option>
                    <option value="Pomeriggio">Pomeriggio</option>
                  </select>
                </div>

                <h3 className="mt-6 mb-3 font-black">Materiali necessari</h3>

                <div className="grid gap-3 md:grid-cols-4">
                  {materials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleMaterial(m.id)}
                      className={`cursor-pointer rounded-2xl border p-3 text-left transition hover:scale-[1.02] ${
                        selectedMaterials.includes(m.id)
                          ? "border-blue-400 bg-blue-600 text-white"
                          : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <p className="font-bold">{m.name}</p>
                      <p className="text-sm opacity-70">{euro(m.cost)}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-3xl bg-white/[0.06] p-5">
                  <div>
                    <p className="text-sm text-slate-400">
                      Costo nuova chiamata
                    </p>
                    <p className="text-2xl font-black">
                      {euro(materialCost(selectedMaterials))}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {ticketType === "straordinaria"
                        ? "Scala il budget del contratto rilevato."
                        : "Ordinaria: non scala il budget."}
                    </p>
                  </div>

                  <button
                    onClick={() => addTicket()}
                    className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                  >
                    Apri chiamata
                  </button>
                </div>
              </section>
            )}

            {activeTab === "mappa" && (
              <section className={card}>
                <h2 className="mb-5 text-2xl font-black">Mappa operativa</h2>

                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  <select
                    className={input}
                    value={filterTechnician}
                    onChange={(e) => setFilterTechnician(e.target.value)}
                  >
                    <option value="">Tutti i tecnici</option>
                    {technicians.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    className={input}
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                  >
                    <option value="">Tutte le regioni</option>
                    {availableRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    className={input}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Tutti gli stati</option>
                    <option value="Aperto">Aperto</option>
                    <option value="Pianificato">Pianificato</option>
                    <option value="Chiuso">Chiuso</option>
                  </select>
                </div>

                <div className="h-[500px] overflow-hidden rounded-3xl border border-white/10">
                  <AtlasMap sites={sites} tickets={filteredTickets} />
                </div>
              </section>
            )}

            {activeTab === "magazzino" && (
              <section className={`${card} hidden md:block`}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className={`text-2xl font-black ${strongText}`}>
                      Magazzino
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Articoli, valore, quantità e stato automatico.
                    </p>
                  </div>

                  <button
                    onClick={addInventoryItem}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                  >
                    + Nuovo articolo
                  </button>
                </div>

                <input
                  className={`mb-5 w-full ${input}`}
                  placeholder="Cerca articolo o ID..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />

                <div
                  className={`mb-3 hidden rounded-2xl border px-4 py-3 text-sm font-black md:grid md:grid-cols-5 ${
                    theme === "dark"
                      ? "border-white/10 bg-slate-950/40 text-slate-300"
                      : "border-slate-400 bg-slate-200 text-slate-800"
                  }`}
                >
                  <div>ID articolo</div>
                  <div>Nome articolo</div>
                  <div>Valore</div>
                  <div>Quantità</div>
                  <div className="text-center">Stato</div>
                </div>

                <div className="grid gap-3">
                  {inventory
                    .filter((item) => {
                      const q = inventorySearch.toLowerCase();
                      return (
                        item.id.toLowerCase().includes(q) ||
                        item.name.toLowerCase().includes(q)
                      );
                    })
                    .map((item, index) => {
                      const status = getInventoryStatus(Number(item.quantity));

                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className={`grid gap-3 rounded-2xl border p-4 transition-all md:grid-cols-5 md:items-center ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                              : "border-slate-400 bg-white shadow-sm hover:bg-blue-50"
                          }`}
                        >
                          <input
                            className={lightInput}
                            value={item.id}
                            onChange={(e) =>
                              updateInventoryItem(index, "id", e.target.value)
                            }
                            placeholder="ID articolo"
                          />

                          <input
                            className={lightInput}
                            value={item.name}
                            onChange={(e) =>
                              updateInventoryItem(index, "name", e.target.value)
                            }
                            placeholder="Nome articolo"
                          />

                          <input
                            className={lightInput}
                            type="number"
                            value={item.value}
                            onChange={(e) =>
                              updateInventoryItem(
                                index,
                                "value",
                                e.target.value,
                              )
                            }
                            placeholder="Valore"
                          />

                          <input
                            className={lightInput}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateInventoryItem(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            placeholder="Quantità"
                          />

                          <div
                            className={`rounded-full px-4 py-2 text-center text-sm font-black ${
                              Number(item.quantity) <= 0
                                ? theme === "dark"
                                  ? "border border-red-500/30 bg-red-500/15 text-red-300"
                                  : "border border-red-500 bg-red-100 text-red-700"
                                : Number(item.quantity) < 10
                                  ? theme === "dark"
                                    ? "border border-amber-500/30 bg-amber-500/15 text-amber-300"
                                    : "border border-amber-500 bg-amber-100 text-amber-800"
                                  : theme === "dark"
                                    ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                                    : "border border-emerald-500 bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {status.label}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {activeTab === "contratti" && (
              <section className={card}>
                <h2 className="mb-6 text-2xl font-black">
                  Contratti / Accordi commerciali
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {editableContracts.map((contract) => {
                    const status = getContractStatus(contract);

                    return (
                      <div
                        key={contract.name}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black">
                              {contract.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {contract.clientType}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold text-white ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="grid gap-3 text-sm">
                          <p>
                            <b>Stato:</b> {contract.status}
                          </p>
                          <p>
                            <b>Periodo:</b> {contract.period}
                          </p>

                          <div className="grid gap-3 md:grid-cols-2">
                            <label>
                              <b>Inizio contratto</b>
                              {renderDateInput(
                                contract.startDate !== "Da verificare"
                                  ? contract.startDate
                                  : "",
                                (value) =>
                                  updateContractField(
                                    contract.name,
                                    "startDate",
                                    value,
                                  ),
                                `mt-1 w-full ${lightInput}`,
                              )}
                            </label>

                            <label>
                              <b>Scadenza contratto</b>
                              {renderDateInput(
                                contract.endDate !== "Da verificare"
                                  ? contract.endDate
                                  : "",
                                (value) =>
                                  updateContractField(
                                    contract.name,
                                    "endDate",
                                    value,
                                  ),
                                `mt-1 w-full ${lightInput}`,
                              )}
                            </label>
                          </div>

                          <p>
                            <b>Garanzia:</b> {contract.warranty}
                          </p>
                          <p>
                            <b>Spedizione:</b> {contract.shipping}
                          </p>
                          <p>
                            <b>Ricambi:</b> {contract.spareParts}
                          </p>
                          <p>
                            <b>SLA:</b> {contract.sla}
                          </p>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-950/50 p-3 text-sm">
                          {contract.notes}
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-950/40 p-4">
                          <label className="text-sm font-bold">
                            Link PDF contratto
                            <input
                              className={`mt-2 w-full ${lightInput}`}
                              placeholder="/contracts/nome-file.pdf"
                              value={contract.pdf || ""}
                              onChange={(e) =>
                                updateContractField(
                                  contract.name,
                                  "pdf",
                                  e.target.value,
                                )
                              }
                            />
                          </label>

                          <div className="mt-3">
                            {contract.pdf ? (
                              <a
                                href={contract.pdf}
                                target="_blank"
                                className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                              >
                                Apri / scarica PDF
                              </a>
                            ) : (
                              <div className="rounded-xl bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-300">
                                PDF contratto non ancora collegato
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "clienti" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Clienti / Enti</h2>
                    <p className="text-sm text-slate-400">
                      {sites.length} sedi totali
                    </p>
                  </div>

                  <input
                    className={input}
                    placeholder="Cerca cliente, città, sede..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  {Object.entries(clientCategories).map(
                    ([category, categorySites]) => {
                      const filtered = categorySites.filter((s) => {
                        const q = clientSearch.toLowerCase();

                        return (
                          s.name?.toLowerCase().includes(q) ||
                          s.city?.toLowerCase().includes(q) ||
                          s.entity?.toLowerCase().includes(q) ||
                          s.region?.toLowerCase().includes(q)
                        );
                      });

                      if (filtered.length === 0) return null;

                      return (
                        <div
                          key={category}
                          className={`rounded-3xl border ${
                            theme === "dark"
                              ? "border-white/10 bg-white/[0.04]"
                              : "border-slate-400 bg-white"
                          }`}
                        >
                          <button
                            onClick={() =>
                              setOpenCategory(
                                openCategory === category ? null : category,
                              )
                            }
                            className="flex w-full items-center justify-between p-5 text-left"
                          >
                            <div>
                              <p className="text-lg font-black">{category}</p>
                              <p className="text-sm text-slate-400">
                                {filtered.length} sedi
                              </p>
                            </div>
                            <div className="text-2xl">
                              {openCategory === category ? "−" : "+"}
                            </div>
                          </button>

                          {openCategory === category && (
                            <div
                              className={`grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3 ${
                                theme === "dark"
                                  ? "border-white/10"
                                  : "border-slate-300"
                              }`}
                            >
                              {filtered.map((s) => (
                                <div
                                  key={s.id}
                                  className={`rounded-2xl p-4 ${
                                    theme === "dark"
                                      ? "bg-slate-950/40"
                                      : "bg-slate-100 border border-slate-300"
                                  }`}
                                >
                                  <p className="font-bold">{s.name}</p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    {s.entity || "Ente n/d"}
                                  </p>
                                  <p className="mt-2 text-sm">
                                    {s.city || "Città n/d"} ·{" "}
                                    {s.region || "Regione n/d"}
                                  </p>
                                  <p className="mt-2 text-xs text-slate-500">
                                    {s.address || "Indirizzo n/d"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {activeTab === "sistemi" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      Sistemi / Componenti
                    </h2>
                    <p className="text-sm text-slate-400">
                      Catalogo tecnico consultabile dai tecnici
                    </p>
                  </div>

                  {selectedSystem && (
                    <button
                      onClick={() => {
                        setSelectedSystem(null);
                        setSystemSearch("");
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                    >
                      ← Torna ai sistemi
                    </button>
                  )}
                </div>

                {!selectedSystem && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {systemsCatalog.map((system) => (
                      <button
                        key={system.name}
                        onClick={() => setSelectedSystem(system.name)}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left hover:bg-white/10"
                      >
                        <h3 className="text-xl font-black">{system.name}</h3>
                        <p className="mt-2 text-sm text-slate-400">
                          {system.components.length} componenti
                        </p>
                        <p className="mt-3 text-lg font-black">
                          {euro(system.totalCost)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedSystem &&
                  (() => {
                    const system = systemsCatalog.find(
                      (s) => s.name === selectedSystem,
                    );

                    if (!system) return null;

                    const filteredComponents = system.components.filter(
                      (component: any) => {
                        const q = systemSearch.toLowerCase();

                        return (
                          component.name?.toLowerCase().includes(q) ||
                          component.code?.toLowerCase().includes(q) ||
                          component.category?.toLowerCase().includes(q)
                        );
                      },
                    );

                    return (
                      <div>
                        <div className="mb-5 rounded-3xl bg-slate-950/40 p-5">
                          <h3 className="text-2xl font-black">{system.name}</h3>

                          <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                            <p>
                              <b>Componenti:</b> {system.components.length}
                            </p>
                            <p>
                              <b>Valore totale:</b> {euro(system.totalCost)}
                            </p>
                            <p>
                              <b>Prodotto:</b> {system.productName}
                            </p>
                          </div>

                          <input
                            className={`mt-4 w-full ${input}`}
                            placeholder="Cerca componente, codice, categoria..."
                            value={systemSearch}
                            onChange={(e) => setSystemSearch(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {filteredComponents.map((component: any) => (
                            <div
                              key={component.id}
                              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="font-bold">{component.name}</p>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                                  {component.category || "Altro"}
                                </span>
                              </div>

                              <div className="space-y-1 text-sm text-slate-300">
                                <p>
                                  <b>Codice:</b> {component.code || "N/D"}
                                </p>
                                <p>
                                  <b>Quantità:</b> {component.quantity || "N/D"}
                                </p>
                                <p>
                                  <b>Prezzo:</b>{" "}
                                  {euro(Number(component.cost || 0))}
                                </p>
                                {component.parent && (
                                  <p>
                                    <b>Gruppo:</b> {component.parent}
                                  </p>
                                )}
                              </div>

                              {component.imageSearchUrl && (
                                <a
                                  href={component.imageSearchUrl}
                                  target="_blank"
                                  className="mt-3 inline-block text-sm font-bold text-blue-300"
                                >
                                  Cerca immagine componente
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </section>
            )}
            {activeTab === "calendario" && (
              <section className={`${card} hidden md:block`}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className={`text-2xl font-black ${strongText}`}>
                      Calendario interventi
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Vista mensile con interventi pianificati e inserimento
                      rapido.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="rounded-xl bg-blue-600 p-3 text-white"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="min-w-48 text-center text-lg font-black capitalize">
                      {monthLabel}
                    </div>

                    <button
                      onClick={() => changeMonth(1)}
                      className="rounded-xl bg-blue-600 p-3 text-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-7">
                  {calendarDays.map((day) => {
                    const iso = formatLocalDate(day);

                    const dayTickets = tickets.filter((t) => t.date === iso);

                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedCalendarDay(iso)}
                        className={`min-h-36 rounded-2xl border p-3 text-left transition hover:scale-[1.02] ${
                          selectedCalendarDay === iso
                            ? "border-blue-500 bg-blue-600 text-white"
                            : theme === "dark"
                              ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                              : "border-slate-400 bg-white hover:bg-blue-50"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-lg font-black">
                            {day.getDate()}
                          </span>
                          <span className="text-xs font-bold">
                            {day.toLocaleDateString("it-IT", {
                              weekday: "short",
                            })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dayTickets.length === 0 && (
                            <p className="text-xs opacity-60">
                              Nessun intervento
                            </p>
                          )}

                          {dayTickets.slice(0, 3).map((t) => {
                            const isExpanded =
                              expandedCalendarTicketId === String(t.id);

                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  const nextExpanded =
                                    expandedCalendarTicketId === String(t.id)
                                      ? null
                                      : String(t.id);

                                  setExpandedCalendarTicketId(nextExpanded);
                                  setEditingCalendarTicketId(String(t.id));
                                  setSelectedCalendarDay(iso);

                                  setCalendarTechnician(t.technician || "");
                                  setCalendarSiteSearch(t.site || "");
                                  setCalendarSite({
                                    id: t.siteId || null,
                                    name: t.site,
                                    region: t.region,
                                    entity: t.entity,
                                    city: t.city,
                                  });
                                  setCalendarTime(t.slot || "");
                                }}
                                className={`cursor-pointer overflow-hidden rounded-xl p-2 text-xs transition-all duration-300 ${
                                  isExpanded
                                    ? theme === "dark"
                                      ? "bg-blue-600/30 ring-2 ring-blue-400"
                                      : "bg-blue-100 ring-2 ring-blue-500"
                                    : selectedCalendarDay === iso
                                      ? "bg-white/20"
                                      : theme === "dark"
                                        ? "bg-slate-950/50 hover:bg-slate-900"
                                        : "border border-slate-300 bg-slate-100 hover:bg-blue-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-black">
                                      {t.slot || "Orario n/d"}
                                    </p>
                                    <p>{t.site}</p>
                                    <p className="opacity-70">
                                      {t.technician || "Tecnico n/d"}
                                    </p>
                                  </div>

                                  <span className="text-[10px] font-black opacity-70">
                                    {isExpanded ? "CHIUDI" : "MODIFICA"}
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div
                                    className={`mt-3 grid gap-2 rounded-xl p-3 transition-all duration-300 ${
                                      theme === "dark"
                                        ? "bg-slate-950/60"
                                        : "border border-slate-300 bg-white"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <select
                                      className={lightInput}
                                      value={calendarTechnician}
                                      onChange={(e) =>
                                        setCalendarTechnician(e.target.value)
                                      }
                                    >
                                      <option value="">
                                        Seleziona tecnico
                                      </option>
                                      {technicians.map((tech) => (
                                        <option key={tech}>{tech}</option>
                                      ))}
                                    </select>

                                    <div className="relative">
                                      <input
                                        className={`w-full ${lightInput}`}
                                        placeholder="Cerca cliente / sede..."
                                        value={calendarSiteSearch}
                                        onChange={(e) => {
                                          setCalendarSiteSearch(e.target.value);
                                          setCalendarSite(null);
                                        }}
                                      />

                                      {calendarSiteSearch && !calendarSite && (
                                        <div
                                          className={`absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border shadow-xl ${
                                            theme === "dark"
                                              ? "border-white/10 bg-slate-950 text-white"
                                              : "border-slate-300 bg-white text-slate-900"
                                          }`}
                                        >
                                          {calendarSiteResults.map((s) => (
                                            <button
                                              key={s.id}
                                              type="button"
                                              className={`block w-full border-b p-3 text-left text-xs ${
                                                theme === "dark"
                                                  ? "border-white/10 hover:bg-white/10"
                                                  : "border-slate-200 hover:bg-blue-50"
                                              }`}
                                              onClick={() => {
                                                setCalendarSite(s);
                                                setCalendarSiteSearch(s.name);
                                              }}
                                            >
                                              <div className="font-black">
                                                {s.name}
                                              </div>
                                              <div className="opacity-70">
                                                {s.city || "Città n/d"} ·{" "}
                                                {s.region || "Regione n/d"}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <input
                                      type="time"
                                      className={lightInput}
                                      value={calendarTime}
                                      onChange={(e) =>
                                        setCalendarTime(e.target.value)
                                      }
                                    />

                                    <div className="flex gap-2">
                                      <button
                                        onClick={updateCalendarTicket}
                                        className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500"
                                      >
                                        Salva
                                      </button>

                                      <button
                                        onClick={() => {
                                          setExpandedCalendarTicketId(null);
                                          setEditingCalendarTicketId(null);
                                        }}
                                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-black ${
                                          theme === "dark"
                                            ? "bg-white/10 text-white"
                                            : "bg-slate-200 text-slate-900"
                                        }`}
                                      >
                                        Annulla
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {dayTickets.length > 3 && (
                            <p className="text-xs font-bold">
                              +{dayTickets.length - 3} altri
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {activeTab === "contatti" && (
              <section className={card}>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className={`text-2xl font-black ${strongText}`}>
                      Contatti
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Rubrica tecnica associata ai clienti, modificabile dai
                      tecnici.
                    </p>
                  </div>

                  <input
                    className={`md:w-96 ${input}`}
                    placeholder="Cerca nome, telefono, cliente, note..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>

                <div
                  className={`mb-6 rounded-3xl border p-5 ${
                    theme === "dark"
                      ? "border-white/10 bg-slate-950/40"
                      : "border-slate-400 bg-slate-50"
                  }`}
                >
                  <h3 className="mb-4 text-xl font-black">
                    {editingContactId ? "Modifica contatto" : "Nuovo contatto"}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className={input}
                      placeholder="Nome e cognome / referente"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                    />

                    <input
                      className={input}
                      placeholder="Numero di telefono"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          phone: e.target.value,
                        })
                      }
                    />

                    <div className="relative md:col-span-2">
                      <input
                        className={`w-full ${input}`}
                        placeholder="Associa cliente / sede..."
                        value={contactClientSearch}
                        onChange={(e) => {
                          setContactClientSearch(e.target.value);
                          setContactClient(null);
                        }}
                      />

                      {contactClientSearch && !contactClient && (
                        <div
                          className={`absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-xl ${
                            theme === "dark"
                              ? "border-white/10 bg-slate-950 text-white"
                              : "border-slate-300 bg-white text-slate-900"
                          }`}
                        >
                          {contactClientResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`block w-full border-b p-3 text-left text-sm ${
                                theme === "dark"
                                  ? "border-white/10 hover:bg-white/10"
                                  : "border-slate-200 hover:bg-blue-50"
                              }`}
                              onClick={() => {
                                setContactClient(s);
                                setContactClientSearch(s.name);
                              }}
                            >
                              <div className="font-black">{s.name}</div>
                              <div className="text-xs opacity-70">
                                {s.city || "Città n/d"} ·{" "}
                                {s.region || "Regione n/d"}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      className="md:col-span-2 rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500"
                      placeholder="Indirizzo"
                      value={contactForm.address}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          address: e.target.value,
                        })
                      }
                    />

                    <textarea
                      className={`md:col-span-2 min-h-28 ${input}`}
                      placeholder="Note operative"
                      value={contactForm.notes}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={saveContact}
                      className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                    >
                      {editingContactId
                        ? "Salva modifica"
                        : "Aggiungi contatto"}
                    </button>

                    {editingContactId && (
                      <button
                        onClick={resetContactForm}
                        className={`rounded-2xl px-5 py-3 font-black ${
                          theme === "dark"
                            ? "bg-white/10 text-white"
                            : "bg-slate-200 text-slate-900"
                        }`}
                      >
                        Annulla modifica
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`rounded-3xl border p-5 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04]"
                          : "border-slate-400 bg-white shadow-sm"
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">{contact.name}</p>
                          <p className={`text-sm ${mutedText}`}>
                            {contact.clientName || "Cliente non associato"}
                          </p>
                        </div>

                        <button
                          onClick={() => editContact(contact)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                        >
                          Modifica
                        </button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <a
                          href={`tel:${contact.phone}`}
                          className="block rounded-xl bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-500"
                        >
                          📞 {contact.phone}
                        </a>

                        {contact.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              contact.address,
                            )}`}
                            target="_blank"
                            className={`block rounded-xl px-3 py-2 font-bold ${
                              theme === "dark"
                                ? "bg-white/10 text-blue-300"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            📍 {contact.address}
                          </a>
                        )}

                        {(contact.clientCity || contact.clientRegion) && (
                          <p className={mutedText}>
                            {contact.clientCity || "Città n/d"} ·{" "}
                            {contact.clientRegion || "Regione n/d"}
                          </p>
                        )}

                        {contact.notes && (
                          <div
                            className={`rounded-2xl p-3 ${
                              theme === "dark"
                                ? "bg-slate-950/40"
                                : "bg-slate-100 border border-slate-300"
                            }`}
                          >
                            {contact.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="mt-4 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-500"
                      >
                        Elimina
                      </button>
                    </div>
                  ))}

                  {filteredContacts.length === 0 && (
                    <div
                      className={`rounded-3xl border p-8 text-center md:col-span-2 xl:col-span-3 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/[0.04] text-slate-400"
                          : "border-slate-300 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Nessun contatto trovato.
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "utenti" && currentUser?.role === "admin" && (
              <div className="p-4 md:p-8">
                <UserManagementCenter
                  currentUser={currentUser}
                  tenant={activeTenant}
                />
              </div>
            )}

            {activeTab === "glpiImport" && currentUser?.role === "admin" && (
              <div className="p-4 md:p-8">
                <GlpiImportCenter tenant={activeTenant} />
              </div>
            )}

            {activeTab === "registro" && (
              <TicketRegistry
                variant="desktop"
                tickets={filteredTickets}
                exportCsv={exportCsv}
                setClosingTicketId={setClosingTicketId}
                card={card}
                filterTechnician={filterTechnician}
                setFilterTechnician={setFilterTechnician}
                filterRegion={filterRegion}
                setFilterRegion={setFilterRegion}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterSite={filterSite}
                setFilterSite={setFilterSite}
                urgentOnly={urgentOnly}
                setUrgentOnly={setUrgentOnly}
                availableRegions={availableRegions}
                onToggleUrgent={toggleTicketUrgent}
              />
            )}

            {closingTicketId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1728] p-6 shadow-xl">
                  <h2 className="mb-4 text-xl font-black">Chiudi intervento</h2>

                  <textarea
                    className={`mb-3 w-full ${input}`}
                    placeholder="Note chiusura intervento"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />

                  <textarea
                    className={`mb-3 w-full ${input}`}
                    placeholder="Necessità future / materiale da ordinare"
                    value={futureNeeds}
                    onChange={(e) => setFutureNeeds(e.target.value)}
                  />

                  <label className="mb-5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={resolved}
                      onChange={(e) => setResolved(e.target.checked)}
                    />
                    Intervento risolto
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setClosingTicketId(null);
                        setClosingNotes("");
                        setFutureNeeds("");
                        setResolved(true);
                      }}
                      className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-bold"
                    >
                      Annulla
                    </button>

                    <button
                      onClick={() => closeTicket(closingTicketId)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                    >
                      Conferma chiusura
                    </button>
                  </div>
                </div>
              </div>
            )}

            <MobileBottomNav
              mobileView={mobileView}
              setMobileView={setMobileView}
              setMobileMoreOpen={setMobileMoreOpen}
            />
          </main>
        </div>
      </div>
    </main>
  );
}
