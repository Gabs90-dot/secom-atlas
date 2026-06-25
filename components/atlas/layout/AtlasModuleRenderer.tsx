"use client";

import dynamic from "next/dynamic";
import type { Dispatch, SetStateAction } from "react";

const TicketRegistry = dynamic(() => import("@/components/atlas/TicketRegistry"), { ssr: false });
const CustomerCommandCenter = dynamic(() => import("@/components/atlas/CustomerCommandCenter"), { ssr: false });
const CustomerPortal = dynamic(() => import("@/components/atlas/CustomerPortal"), { ssr: false });
const UserManagementCenter = dynamic(() => import("@/components/atlas/UserManagementCenter"), { ssr: false });
const GlpiImportCenter = dynamic(() => import("@/components/atlas/GlpiImportCenter"), { ssr: false });
const DispatchCenter = dynamic(() => import("@/components/atlas/DispatchCenter"), { ssr: false });
const OperationalPlansCenter = dynamic(() => import("@/components/atlas/OperationalPlansCenter"), { ssr: false });
const GlobalActivityFeed = dynamic(() => import("@/components/atlas/GlobalActivityFeed"), { ssr: false });
const WebvimeBoard = dynamic(() => import("@/components/atlas/WebvimeBoard"), { ssr: false });
const TodoListPanel = dynamic(() => import("@/components/atlas/TodoListPanel"), { ssr: false });
const ManualsCenter = dynamic(() => import("@/components/atlas/ManualsCenter"), { ssr: false });
const DownloadCenter = dynamic(() => import("@/components/atlas/DownloadCenter"), { ssr: false });
const KPIDashboard = dynamic(() => import("@/components/atlas/KPIDashboard"), { ssr: false });
const AIInsightsPanel = dynamic(() => import("@/components/atlas/AIInsightsPanel"), { ssr: false });
const ExecutiveThemeLab = dynamic(() => import("@/components/atlas-executive/ExecutiveThemeLab"), { ssr: false });
const ExecutiveDashboard = dynamic(() => import("@/components/atlas-executive/ExecutiveDashboard"), { ssr: false });
const ExecutiveAnalytics = dynamic(() => import("@/components/atlas-executive/ExecutiveAnalytics"), { ssr: false });
const ExecutiveWebvime = dynamic(() => import("@/components/atlas-executive/ExecutiveWebvime"), { ssr: false });

type AtlasModuleRendererProps = {
  activeTab: string;
  isExecutiveMode: boolean;
  customers: any[];
  sites: any[];
  tickets: any[];
  customerEntities: any[];
  technicians: any[];
  operators?: any[];
  operatorSectors?: string[];
  currentUser: any;
  activeTenant: any;
  filteredTickets: any[];
  card: string;
  uiMode: "classic" | "executive";
  onUiModeChange: (mode: "classic" | "executive") => void;
  onOpenTicketFromCustomer: (customer: any, site?: any) => void;
  onSetActiveTab: Dispatch<SetStateAction<any>>;
  exportCsv: () => void;
  setClosingTicketId: (id: string) => void;
  filterTechnician: string;
  setFilterTechnician: (value: string) => void;
  filterRegion: string;
  setFilterRegion: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterSite: string;
  setFilterSite: (value: string) => void;
  urgentOnly: boolean;
  setUrgentOnly: (value: boolean) => void;
  availableRegions: any[];
  onToggleTicketUrgent: (ticket: any) => void;
  onOpenTicketWorkspace: (ticket: any) => void;
  onRefreshTickets: () => void;
  refreshingTickets: boolean;
  onDeleteTicketFromRegistry: (ticket: any) => void;
  glpiEnabled?: boolean;
  onAddTenantOperator?: (input: { name: string; title: string; sector: string; status: string }) => void;
  onAddTenantOperatorSector?: (name: string) => void;
};

function canAdmin(currentUser: any) {
  return ["super_admin", "admin"].includes(currentUser?.role || "");
}

export default function AtlasModuleRenderer({
  activeTab,
  isExecutiveMode,
  customers,
  sites,
  tickets,
  customerEntities,
  technicians,
  operators = [],
  operatorSectors = [],
  currentUser,
  activeTenant,
  filteredTickets,
  card,
  uiMode,
  onUiModeChange,
  onOpenTicketFromCustomer,
  onSetActiveTab,
  exportCsv,
  setClosingTicketId,
  filterTechnician,
  setFilterTechnician,
  filterRegion,
  setFilterRegion,
  filterStatus,
  setFilterStatus,
  filterSite,
  setFilterSite,
  urgentOnly,
  setUrgentOnly,
  availableRegions,
  onToggleTicketUrgent,
  onOpenTicketWorkspace,
  onRefreshTickets,
  refreshingTickets,
  onDeleteTicketFromRegistry,
  glpiEnabled = true,
  onAddTenantOperator,
  onAddTenantOperatorSector,
}: AtlasModuleRendererProps) {
  if (activeTab === "home") {
    return isExecutiveMode ? (
      <ExecutiveDashboard
        customers={customers}
        sites={sites}
          tickets={tickets}
          customerEntities={customerEntities}
          currentUser={currentUser}
          activeTenant={activeTenant}
          glpiEnabled={glpiEnabled}
          onOpenTicket={onOpenTicketFromCustomer}
          onNavigate={(view) => onSetActiveTab(view as any)}
        />
    ) : (
      <section className="hidden min-h-[calc(100vh-160px)] items-center justify-center md:flex">
        <div className="w-full max-w-5xl">
          <CustomerCommandCenter
            customers={customers}
            sites={sites}
            tickets={tickets}
            customerEntities={customerEntities}
            onOpenTicket={onOpenTicketFromCustomer}
            glpiEnabled={glpiEnabled}
          />
        </div>
      </section>
    );
  }

  if (activeTab === "webvime") return isExecutiveMode ? <ExecutiveWebvime glpiEnabled={glpiEnabled} /> : <WebvimeBoard tenant={activeTenant} currentUser={currentUser} glpiEnabled={glpiEnabled} />;

  if (activeTab === "dispatch") {
    return (
      <DispatchCenter
        tickets={tickets}
        technicians={technicians}
        operators={operators}
        operatorSectors={operatorSectors}
        tenant={activeTenant}
        onAddOperator={onAddTenantOperator}
        onAddSector={onAddTenantOperatorSector}
      />
    );
  }

  if (activeTab === "piani") {
    return (
      <div className="p-4 md:p-8">
        <OperationalPlansCenter
          tenant={activeTenant}
          currentUser={currentUser}
          customers={customers}
          sites={sites}
          tickets={tickets}
        />
      </div>
    );
  }

  if (activeTab === "todo") return <TodoListPanel tenant={activeTenant} />;
  if (activeTab === "activity") return <GlobalActivityFeed tenant={activeTenant} glpiEnabled={glpiEnabled} />;
  if (activeTab === "analytics") return isExecutiveMode ? <ExecutiveAnalytics /> : <KPIDashboard tickets={tickets} technicians={technicians} currentUser={currentUser} />;

  if (activeTab === "ai") {
    return (
      <AIInsightsPanel
        tickets={tickets}
        customers={customers}
        sites={sites}
        technicians={technicians}
      />
    );
  }

  if (activeTab === "manuali") {
    return <ManualsCenter tenant={activeTenant} currentUser={currentUser} customers={customers} customerEntities={customerEntities} />;
  }

  if (activeTab === "download") {
    return <DownloadCenter tenant={activeTenant} currentUser={currentUser} customers={customers} executiveMode={isExecutiveMode} />;
  }

  if (activeTab === "customerPortal") {
    return (
      <CustomerPortal
        user={currentUser}
        tenant={activeTenant}
        tickets={tickets}
        sites={sites}
        onOpenTicket={onOpenTicketFromCustomer}
      />
    );
  }

  if (activeTab === "utenti" && canAdmin(currentUser)) {
    return (
      <div className="p-4 md:p-8">
        <UserManagementCenter currentUser={currentUser} tenant={activeTenant} />
      </div>
    );
  }

  if (activeTab === "glpiImport" && canAdmin(currentUser) && glpiEnabled) {
    return (
      <div className="p-4 md:p-8">
        <GlpiImportCenter tenant={activeTenant} />
      </div>
    );
  }

  if (activeTab === "designLab" && canAdmin(currentUser)) {
    return (
      <div className="p-4 md:p-8">
        <ExecutiveThemeLab uiMode={uiMode} onUiModeChange={onUiModeChange} />
      </div>
    );
  }

  if (activeTab === "registro") {
    return (
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
        onToggleUrgent={onToggleTicketUrgent}
        onOpenTicketDetail={onOpenTicketWorkspace}
        onRefreshTickets={onRefreshTickets}
        refreshingTickets={refreshingTickets}
        onDeleteTicket={onDeleteTicketFromRegistry}
        executiveMode={isExecutiveMode}
        glpiEnabled={glpiEnabled}
      />
    );
  }

  return null;
}
