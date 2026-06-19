"use client";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  History,
  ListChecks,
  Map,
  Monitor,
  Package,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import AtlasBudgetManager from "@/components/atlas/layout/AtlasBudgetManager";
import AtlasCalendarManager from "@/components/atlas/layout/AtlasCalendarManager";
import AtlasContactsManager from "@/components/atlas/layout/AtlasContactsManager";
import AtlasCustomersManager from "@/components/atlas/layout/AtlasCustomersManager";
import AtlasInventoryManager from "@/components/atlas/layout/AtlasInventoryManager";
import AtlasMapManager from "@/components/atlas/layout/AtlasMapManager";
import AtlasModuleRenderer from "@/components/atlas/layout/AtlasModuleRenderer";
import AtlasOperationsManager from "@/components/atlas/layout/AtlasOperationsManager";
import AtlasSystemsManager from "@/components/atlas/layout/AtlasSystemsManager";
import CloseTicketModal from "@/components/atlas/layout/CloseTicketModal";

const TicketRegistry = dynamic(() => import("@/components/atlas/TicketRegistry"), { ssr: false });
const CustomerCommandCenter = dynamic(() => import("@/components/atlas/CustomerCommandCenter"), { ssr: false });
const CustomerPortal = dynamic(() => import("@/components/atlas/CustomerPortal"), { ssr: false });
const DispatchCenter = dynamic(() => import("@/components/atlas/DispatchCenter"), { ssr: false });
const GlobalActivityFeed = dynamic(() => import("@/components/atlas/GlobalActivityFeed"), { ssr: false });
const WebvimeBoard = dynamic(() => import("@/components/atlas/WebvimeBoard"), { ssr: false });
const TodoListPanel = dynamic(() => import("@/components/atlas/TodoListPanel"), { ssr: false });
const ManualsCenter = dynamic(() => import("@/components/atlas/ManualsCenter"), { ssr: false });
const KPIDashboard = dynamic(() => import("@/components/atlas/KPIDashboard"), { ssr: false });
const AIInsightsPanel = dynamic(() => import("@/components/atlas/AIInsightsPanel"), { ssr: false });
const ExecutiveThemeLab = dynamic(() => import("@/components/atlas-executive/ExecutiveThemeLab"), { ssr: false });
const ExecutiveDashboard = dynamic(() => import("@/components/atlas-executive/ExecutiveDashboard"), { ssr: false });
const ExecutiveAnalytics = dynamic(() => import("@/components/atlas-executive/ExecutiveAnalytics"), { ssr: false });
const ExecutiveWebvime = dynamic(() => import("@/components/atlas-executive/ExecutiveWebvime"), { ssr: false });

type AtlasWorkspaceContentProps = {
  ctx: any;
};

export default function AtlasWorkspaceContent({ ctx }: AtlasWorkspaceContentProps) {
  const {
    tenantLoading,
    activeTenant,
    mobileView,
    setMobileView,
    canAccessTab,
    todoNewCount,
    currentUser,
    isExecutiveMode,
    customers,
    sites,
    tickets,
    customerEntities,
    openTicketFromCustomer,
    filteredTickets,
    exportCsv,
    promptCloseTicket,
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
    toggleTicketUrgent,
    openTicketWorkspace,
    refreshTickets,
    refreshingTickets,
    deleteTicketFromRegistry,
    input,
    lightInput,
    theme,
    card,
    strongText,
    mutedText,
    uiMode,
    switchUiMode,
    renderSlaContractsManager,
    activeTab,
    setActiveTab,
    setClosingTicketId,
    siteSearch,
    setSiteSearch,
    site,
    setSite,
    setRegion,
    setEntity,
    setCity,
    setSiteId,
    filteredSites,
    ticketTitle,
    setTicketTitle,
    problem,
    setProblem,
    ticketType,
    setTicketType,
    ticketStatus,
    setTicketStatus,
    expectedCloseDate,
    setExpectedCloseDate,
    ticketCategoryOptions,
    ticketStatusOptions,
    addTicket,
    ticketFormReturnTarget,
    goBackFromTicketForm,
    selectedContract,
    getContractStatus,
    euro,
    getBudgetTotal,
    getBudgetSpent,
    getBudgetRemaining,
    setSelectedGlpiEntityId,
    setSelectedGlpiEntityPath,
    region,
    technician,
    setTechnician,
    technicians,
    renderDateInput,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    materials,
    toggleMaterial,
    selectedMaterials,
    materialCost,
    creatingTicket,
    changeMonth,
    monthLabel,
    calendarFilterTechnician,
    setCalendarFilterTechnician,
    mobileCalendarCells,
    calendarDays,
    formatLocalDate,
    calendarMonth,
    calendarVisibleTickets,
    mobileSelectedDate,
    mobileSelectedTickets,
    selectedCalendarDay,
    setSelectedCalendarDay,
    startCalendarCreate,
    startCalendarEdit,
    mobileCalendarFormOpen,
    setMobileCalendarFormOpen,
    editingCalendarTicketId,
    setEditingCalendarTicketId,
    expandedCalendarTicketId,
    setExpandedCalendarTicketId,
    calendarTechnician,
    setCalendarTechnician,
    calendarSiteSearch,
    setCalendarSiteSearch,
    calendarSite,
    setCalendarSite,
    calendarSiteResults,
    calendarTime,
    setCalendarTime,
    saveMobileCalendarTicket,
    updateCalendarTicket,
    budgetVisible,
    setBudgetVisible,
    totalBudget,
    totalForecast,
    remainingBudget,
    getTicketType,
    openBudgetForm,
    budgets,
    mobileBudgetFormOpen,
    setMobileBudgetFormOpen,
    budgetForm,
    setBudgetForm,
    editableContracts,
    INITIAL_BUDGET,
    saveMobileBudget,
    setBudgetClientSearch,
    clientCategories,
    clientSearch,
    setClientSearch,
    openCategory,
    setOpenCategory,
    customerInvitePanelOpen,
    setCustomerInvitePanelOpen,
    promptAddClient,
    selectedSystem,
    setSelectedSystem,
    systemSearch,
    setSystemSearch,
    showMessage,
    contactSearch,
    setContactSearch,
    filteredContacts,
    contactForm,
    setContactForm,
    editingContactId,
    setEditingContactId,
    contactClientSearch,
    setContactClientSearch,
    contactClient,
    setContactClient,
    contactClientResults,
    mobileContactFilter,
    setMobileContactFilter,
    mobileContactFormOpen,
    setMobileContactFormOpen,
    startContactCreate,
    startContactEdit,
    saveMobileContact,
    saveContact,
    resetContactForm,
    editContact,
    deleteContact,
    inventory,
    inventorySearch,
    setInventorySearch,
    mobileInventoryFormOpen,
    setMobileInventoryFormOpen,
    editingInventoryIndex,
    inventoryForm,
    setInventoryForm,
    startInventoryCreate,
    startInventoryEdit,
    saveInventoryItemMobile,
    deleteInventoryItemMobile,
    addInventoryItem,
    updateInventoryItem,
    closingTicketId,
    closingNotes,
    futureNeeds,
    resolved,
    setClosingNotes,
    setFutureNeeds,
    setResolved,
    closeTicket,
  } = ctx;

  const canAccessMobileView = (key: string) =>
    typeof canAccessTab === "function" && canAccessTab(key);
  const fallbackMobileView = canAccessMobileView("customerPortal")
    ? "customerPortal"
    : canAccessMobileView("home")
      ? "home"
      : "";
  const effectiveMobileView = canAccessMobileView(String(mobileView)) ? String(mobileView) : fallbackMobileView;

  return (
    <>
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
<section className="w-full max-w-full overflow-x-hidden md:hidden">
  {effectiveMobileView !== "home" && (
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
          { key: "webvime", label: "Webvime", icon: Monitor, badge: 0 },
          {
            key: "dispatch",
            label: "Dispatch",
            icon: AlertTriangle,
          },
          { key: "activity", label: "Timeline", icon: History },
          { key: "analytics", label: "Analisi", icon: BarChart3 },
          { key: "ai", label: "Insight AI", icon: Brain },
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
          { key: "todo", label: "To Do", icon: CheckCircle2, badge: todoNewCount },
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
          {
            key: "designLab",
            label: "Design Lab",
            icon: Sparkles,
          },
        ]
          .filter((item) => canAccessMobileView(item.key))
          .map(({ key, label, icon: Icon, badge }: any) => (
          <button
            key={key}
            onClick={() => setMobileView(key as any)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black ${effectiveMobileView === key ? "border-blue-500 bg-blue-600 text-white" : "border-white/10 bg-white/[0.06] text-slate-300"}`}
          >
            <Icon size={15} />
            {label}
            {badge > 0 && (
              <span className="ml-1 min-w-4 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[9px] font-black text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  )}

  {effectiveMobileView === "home" && (
    isExecutiveMode ? (
      <ExecutiveDashboard
        customers={customers}
        sites={sites}
        tickets={tickets}
        customerEntities={customerEntities}
        onOpenTicket={openTicketFromCustomer}
        onNavigate={(view) => setMobileView(view as any)}
      />
    ) : (
      <div className="grid gap-5">
        <CustomerCommandCenter
          customers={customers}
          sites={sites}
          tickets={tickets}
          customerEntities={customerEntities}
          onOpenTicket={openTicketFromCustomer}
        />
      </div>
    )
  )}

  {effectiveMobileView === "customerPortal" && currentUser && (
    <CustomerPortal
      user={currentUser}
      tenant={activeTenant}
      tickets={tickets}
      sites={sites}
      onOpenTicket={openTicketFromCustomer}
    />
  )}

  {effectiveMobileView === "webvime" && (isExecutiveMode ? <ExecutiveWebvime /> : <WebvimeBoard />)}

  {effectiveMobileView === "dispatch" && (
    <DispatchCenter tickets={tickets} technicians={technicians} />
  )}

  {effectiveMobileView === "todo" && <TodoListPanel />}

  {effectiveMobileView === "activity" && <GlobalActivityFeed />}

  {effectiveMobileView === "analytics" && (
    isExecutiveMode ? <ExecutiveAnalytics /> : <KPIDashboard tickets={tickets} technicians={technicians} />
  )}

  {effectiveMobileView === "ai" && (
    <AIInsightsPanel
      tickets={tickets}
      customers={customers}
      sites={sites}
      technicians={technicians}
    />
  )}

  {effectiveMobileView === "operativo" && (
    <AtlasOperationsManager
      mode="mobile"
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
      ticketFormReturnTarget={ticketFormReturnTarget}
      goBackFromTicketForm={goBackFromTicketForm}
    />
  )}
  {effectiveMobileView === "calendario" && (
    <AtlasCalendarManager
      mode="mobile"
      input={input}
      lightInput={lightInput}
      theme={theme}
      changeMonth={changeMonth}
      monthLabel={monthLabel}
      calendarFilterTechnician={calendarFilterTechnician}
      setCalendarFilterTechnician={setCalendarFilterTechnician}
      technicians={technicians}
      mobileCalendarCells={mobileCalendarCells}
      calendarDays={calendarDays}
      formatLocalDate={formatLocalDate}
      calendarMonth={calendarMonth}
      calendarVisibleTickets={calendarVisibleTickets}
      mobileSelectedDate={mobileSelectedDate}
      mobileSelectedTickets={mobileSelectedTickets}
      selectedCalendarDay={selectedCalendarDay}
      setSelectedCalendarDay={setSelectedCalendarDay}
      startCalendarCreate={startCalendarCreate}
      startCalendarEdit={startCalendarEdit}
      mobileCalendarFormOpen={mobileCalendarFormOpen}
      setMobileCalendarFormOpen={setMobileCalendarFormOpen}
      editingCalendarTicketId={editingCalendarTicketId}
      setEditingCalendarTicketId={setEditingCalendarTicketId}
      expandedCalendarTicketId={expandedCalendarTicketId}
      setExpandedCalendarTicketId={setExpandedCalendarTicketId}
      renderDateInput={renderDateInput}
      calendarTechnician={calendarTechnician}
      setCalendarTechnician={setCalendarTechnician}
      calendarSiteSearch={calendarSiteSearch}
      setCalendarSiteSearch={setCalendarSiteSearch}
      calendarSite={calendarSite}
      setCalendarSite={setCalendarSite}
      calendarSiteResults={calendarSiteResults}
      calendarTime={calendarTime}
      setCalendarTime={setCalendarTime}
      ticketType={ticketType}
      setTicketType={setTicketType}
      ticketCategoryOptions={ticketCategoryOptions}
      ticketStatus={ticketStatus}
      setTicketStatus={setTicketStatus}
      ticketStatusOptions={ticketStatusOptions}
      saveMobileCalendarTicket={saveMobileCalendarTicket}
      updateCalendarTicket={updateCalendarTicket}
    />
  )}

  {effectiveMobileView === "manuali" && (
    <ManualsCenter tenant={activeTenant} currentUser={currentUser} customers={customers} customerEntities={customerEntities} />
  )}

  {effectiveMobileView === "designLab" && ["super_admin", "admin"].includes(currentUser?.role || "") && (
    <ExecutiveThemeLab uiMode={uiMode} onUiModeChange={switchUiMode} />
  )}

  {effectiveMobileView === "registro" && (
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
      onOpenTicketDetail={openTicketWorkspace}
      onRefreshTickets={refreshTickets}
      refreshingTickets={refreshingTickets}
      onDeleteTicket={deleteTicketFromRegistry}
    />
  )}

  {effectiveMobileView === "budget" && (
    <AtlasBudgetManager
      mode="mobile"
      input={input}
      budgetVisible={budgetVisible}
      setBudgetVisible={setBudgetVisible}
      euro={euro}
      totalBudget={totalBudget}
      totalForecast={totalForecast}
      remainingBudget={remainingBudget}
      tickets={tickets}
      getTicketType={getTicketType}
      openBudgetForm={openBudgetForm}
      budgets={budgets}
      getBudgetSpent={getBudgetSpent}
      setMobileView={setMobileView}
      mobileBudgetFormOpen={mobileBudgetFormOpen}
      setMobileBudgetFormOpen={setMobileBudgetFormOpen}
      budgetForm={budgetForm}
      setBudgetForm={setBudgetForm}
      editableContracts={editableContracts}
      INITIAL_BUDGET={INITIAL_BUDGET}
      saveMobileBudget={saveMobileBudget}
      setBudgetClientSearch={setBudgetClientSearch}
    />
  )}

  {effectiveMobileView === "mappa" && (
    <AtlasMapManager
      mode="mobile"
      input={input}
      sites={sites}
      filteredTickets={filteredTickets}
      technicians={technicians}
      filterTechnician={filterTechnician}
      setFilterTechnician={setFilterTechnician}
      filterRegion={filterRegion}
      setFilterRegion={setFilterRegion}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      availableRegions={availableRegions}
    />
  )}

  {effectiveMobileView === "clienti" && (
    <AtlasCustomersManager
      mode="mobile"
      sites={sites}
      clientCategories={clientCategories}
      clientSearch={clientSearch}
      setClientSearch={setClientSearch}
      openCategory={openCategory}
      setOpenCategory={setOpenCategory}
      input={input}
      theme={theme}
      uiMode={uiMode}
      customerInvitePanelOpen={customerInvitePanelOpen}
      setCustomerInvitePanelOpen={setCustomerInvitePanelOpen}
      onAddClient={promptAddClient}
      onSelectSite={(selectedSite) => openTicketFromCustomer(null, selectedSite)}
    />
  )}

  {effectiveMobileView === "contratti" && renderSlaContractsManager(true)}

  {effectiveMobileView === "sistemi" && (
    <AtlasSystemsManager
      mode="mobile"
      input={input}
      selectedSystem={selectedSystem}
      setSelectedSystem={setSelectedSystem}
      systemSearch={systemSearch}
      setSystemSearch={setSystemSearch}
      euro={euro}
      showMessage={showMessage}
    />
  )}

  {effectiveMobileView === "contatti" && (

    <AtlasContactsManager
      mode="mobile"
      theme={theme}
      card={card}
      input={input}
      strongText={strongText}
      mutedText={mutedText}
      contactSearch={contactSearch}
      setContactSearch={setContactSearch}
      filteredContacts={filteredContacts}
      contactForm={contactForm}
      setContactForm={setContactForm}
      editingContactId={editingContactId}
      setEditingContactId={setEditingContactId}
      contactClientSearch={contactClientSearch}
      setContactClientSearch={setContactClientSearch}
      contactClient={contactClient}
      setContactClient={setContactClient}
      contactClientResults={contactClientResults}
      mobileContactFilter={mobileContactFilter}
      setMobileContactFilter={setMobileContactFilter}
      mobileContactFormOpen={mobileContactFormOpen}
      setMobileContactFormOpen={setMobileContactFormOpen}
      startContactCreate={startContactCreate}
      startContactEdit={startContactEdit}
      saveMobileContact={saveMobileContact}
      saveContact={saveContact}
      resetContactForm={resetContactForm}
      editContact={editContact}
      deleteContact={deleteContact}
    />
  )}

  {effectiveMobileView === "magazzino" && (
    <AtlasInventoryManager
      mode="mobile"
      theme={theme}
      card={card}
      input={input}
      lightInput={lightInput}
      strongText={strongText}
      mutedText={mutedText}
      inventory={inventory}
      inventorySearch={inventorySearch}
      setInventorySearch={setInventorySearch}
      mobileInventoryFormOpen={mobileInventoryFormOpen}
      setMobileInventoryFormOpen={setMobileInventoryFormOpen}
      editingInventoryIndex={editingInventoryIndex}
      inventoryForm={inventoryForm}
      setInventoryForm={setInventoryForm}
      startInventoryCreate={startInventoryCreate}
      startInventoryEdit={startInventoryEdit}
      saveInventoryItemMobile={saveInventoryItemMobile}
      deleteInventoryItemMobile={deleteInventoryItemMobile}
      addInventoryItem={addInventoryItem}
      updateInventoryItem={updateInventoryItem}
    />
  )}
</section>

{activeTab === "budget" && (
  <AtlasBudgetManager
    mode="desktop"
    card={card}
    input={input}
    budgetVisible={budgetVisible}
    setBudgetVisible={setBudgetVisible}
    euro={euro}
    totalBudget={totalBudget}
    totalForecast={totalForecast}
    remainingBudget={remainingBudget}
    tickets={tickets}
    getTicketType={getTicketType}
    openBudgetForm={openBudgetForm}
    budgets={budgets}
    getBudgetSpent={getBudgetSpent}
    setMobileView={setMobileView}
    mobileBudgetFormOpen={mobileBudgetFormOpen}
    setMobileBudgetFormOpen={setMobileBudgetFormOpen}
    budgetForm={budgetForm}
    setBudgetForm={setBudgetForm}
    editableContracts={editableContracts}
    INITIAL_BUDGET={INITIAL_BUDGET}
    saveMobileBudget={saveMobileBudget}
    setBudgetClientSearch={setBudgetClientSearch}
  />
)}

            <AtlasModuleRenderer
  activeTab={activeTab}
  isExecutiveMode={isExecutiveMode}
  customers={customers}
  sites={sites}
  tickets={tickets}
  customerEntities={customerEntities}
  technicians={technicians}
  currentUser={currentUser}
  activeTenant={activeTenant}
  filteredTickets={filteredTickets}
  card={card}
  uiMode={uiMode}
  onUiModeChange={switchUiMode}
  onOpenTicketFromCustomer={openTicketFromCustomer}
  onSetActiveTab={setActiveTab}
  exportCsv={exportCsv}
  setClosingTicketId={setClosingTicketId}
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
  onToggleTicketUrgent={toggleTicketUrgent}
  onOpenTicketWorkspace={openTicketWorkspace}
  onRefreshTickets={refreshTickets}
  refreshingTickets={refreshingTickets}
  onDeleteTicketFromRegistry={deleteTicketFromRegistry}
/>

{activeTab === "operativo" && (
  <AtlasOperationsManager
    mode="desktop"
    card={card}
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
    ticketFormReturnTarget={ticketFormReturnTarget}
    goBackFromTicketForm={goBackFromTicketForm}
    selectedContract={selectedContract}
    getContractStatus={getContractStatus}
    euro={euro}
    getBudgetTotal={getBudgetTotal}
    getBudgetSpent={getBudgetSpent}
    getBudgetRemaining={getBudgetRemaining}
    setSelectedGlpiEntityId={setSelectedGlpiEntityId}
    setSelectedGlpiEntityPath={setSelectedGlpiEntityPath}
    region={region}
    technician={technician}
    setTechnician={setTechnician}
    technicians={technicians}
    renderDateInput={renderDateInput}
    selectedDate={selectedDate}
    setSelectedDate={setSelectedDate}
    selectedSlot={selectedSlot}
    setSelectedSlot={setSelectedSlot}
    materials={materials}
    toggleMaterial={toggleMaterial}
    selectedMaterials={selectedMaterials}
    materialCost={materialCost}
    creatingTicket={creatingTicket}
  />
)}
{activeTab === "mappa" && (
  <AtlasMapManager
    mode="desktop"
    card={card}
    input={input}
    sites={sites}
    filteredTickets={filteredTickets}
    technicians={technicians}
    filterTechnician={filterTechnician}
    setFilterTechnician={setFilterTechnician}
    filterRegion={filterRegion}
    setFilterRegion={setFilterRegion}
    filterStatus={filterStatus}
    setFilterStatus={setFilterStatus}
    availableRegions={availableRegions}
  />
)}

{activeTab === "magazzino" && (
  <AtlasInventoryManager
    mode="desktop"
    theme={theme}
    card={card}
    input={input}
    lightInput={lightInput}
    strongText={strongText}
    mutedText={mutedText}
    inventory={inventory}
    inventorySearch={inventorySearch}
    setInventorySearch={setInventorySearch}
    mobileInventoryFormOpen={mobileInventoryFormOpen}
    setMobileInventoryFormOpen={setMobileInventoryFormOpen}
    editingInventoryIndex={editingInventoryIndex}
    inventoryForm={inventoryForm}
    setInventoryForm={setInventoryForm}
    startInventoryCreate={startInventoryCreate}
    startInventoryEdit={startInventoryEdit}
    saveInventoryItemMobile={saveInventoryItemMobile}
    deleteInventoryItemMobile={deleteInventoryItemMobile}
    addInventoryItem={addInventoryItem}
    updateInventoryItem={updateInventoryItem}
  />
)}

{activeTab === "contratti" && renderSlaContractsManager(false)}

{activeTab === "clienti" && (
  <AtlasCustomersManager
    mode="desktop"
    sites={sites}
    clientCategories={clientCategories}
    clientSearch={clientSearch}
    setClientSearch={setClientSearch}
    openCategory={openCategory}
    setOpenCategory={setOpenCategory}
    input={input}
    card={card}
    theme={theme}
    uiMode={uiMode}
    customerInvitePanelOpen={customerInvitePanelOpen}
    setCustomerInvitePanelOpen={setCustomerInvitePanelOpen}
    onSelectSite={(selectedSite) => openTicketFromCustomer(null, selectedSite)}
  />
)}

{activeTab === "sistemi" && (
  <AtlasSystemsManager
    mode="desktop"
    card={card}
    input={input}
    selectedSystem={selectedSystem}
    setSelectedSystem={setSelectedSystem}
    systemSearch={systemSearch}
    setSystemSearch={setSystemSearch}
    euro={euro}
  />
)}
{activeTab === "calendario" && (
  <AtlasCalendarManager
    mode="desktop"
    card={card}
    strongText={strongText}
    mutedText={mutedText}
    input={input}
    lightInput={lightInput}
    theme={theme}
    changeMonth={changeMonth}
    monthLabel={monthLabel}
    calendarFilterTechnician={calendarFilterTechnician}
    setCalendarFilterTechnician={setCalendarFilterTechnician}
    technicians={technicians}
    mobileCalendarCells={mobileCalendarCells}
    calendarDays={calendarDays}
    formatLocalDate={formatLocalDate}
    calendarMonth={calendarMonth}
    calendarVisibleTickets={calendarVisibleTickets}
    mobileSelectedDate={mobileSelectedDate}
    mobileSelectedTickets={mobileSelectedTickets}
    selectedCalendarDay={selectedCalendarDay}
    setSelectedCalendarDay={setSelectedCalendarDay}
    startCalendarCreate={startCalendarCreate}
    startCalendarEdit={startCalendarEdit}
    mobileCalendarFormOpen={mobileCalendarFormOpen}
    setMobileCalendarFormOpen={setMobileCalendarFormOpen}
    editingCalendarTicketId={editingCalendarTicketId}
    setEditingCalendarTicketId={setEditingCalendarTicketId}
    expandedCalendarTicketId={expandedCalendarTicketId}
    setExpandedCalendarTicketId={setExpandedCalendarTicketId}
    renderDateInput={renderDateInput}
    calendarTechnician={calendarTechnician}
    setCalendarTechnician={setCalendarTechnician}
    calendarSiteSearch={calendarSiteSearch}
    setCalendarSiteSearch={setCalendarSiteSearch}
    calendarSite={calendarSite}
    setCalendarSite={setCalendarSite}
    calendarSiteResults={calendarSiteResults}
    calendarTime={calendarTime}
    setCalendarTime={setCalendarTime}
    ticketType={ticketType}
    setTicketType={setTicketType}
    ticketCategoryOptions={ticketCategoryOptions}
    ticketStatus={ticketStatus}
    setTicketStatus={setTicketStatus}
    ticketStatusOptions={ticketStatusOptions}
    saveMobileCalendarTicket={saveMobileCalendarTicket}
    updateCalendarTicket={updateCalendarTicket}
  />
)}
{activeTab === "contatti" && (

  <AtlasContactsManager
    mode="desktop"
    theme={theme}
    card={card}
    input={input}
    strongText={strongText}
    mutedText={mutedText}
    contactSearch={contactSearch}
    setContactSearch={setContactSearch}
    filteredContacts={filteredContacts}
    contactForm={contactForm}
    setContactForm={setContactForm}
    editingContactId={editingContactId}
    setEditingContactId={setEditingContactId}
    contactClientSearch={contactClientSearch}
    setContactClientSearch={setContactClientSearch}
    contactClient={contactClient}
    setContactClient={setContactClient}
    contactClientResults={contactClientResults}
    mobileContactFilter={mobileContactFilter}
    setMobileContactFilter={setMobileContactFilter}
    mobileContactFormOpen={mobileContactFormOpen}
    setMobileContactFormOpen={setMobileContactFormOpen}
    startContactCreate={startContactCreate}
    startContactEdit={startContactEdit}
    saveMobileContact={saveMobileContact}
    saveContact={saveContact}
    resetContactForm={resetContactForm}
    editContact={editContact}
    deleteContact={deleteContact}
  />
)}

<CloseTicketModal
  ticketId={closingTicketId}
  inputClass={input}
  closingNotes={closingNotes}
  futureNeeds={futureNeeds}
  resolved={resolved}
  onClosingNotesChange={setClosingNotes}
  onFutureNeedsChange={setFutureNeeds}
  onResolvedChange={setResolved}
  onCancel={() => {
    setClosingTicketId(null);
    setClosingNotes("");
    setFutureNeeds("");
    setResolved(true);
  }}
  onConfirm={closeTicket}
/>

    </>
  );
}
