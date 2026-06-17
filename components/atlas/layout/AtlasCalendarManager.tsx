"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type AtlasCalendarManagerProps = {
  mode: "mobile" | "desktop";
  card?: string;
  strongText?: string;
  mutedText?: string;
  input?: string;
  lightInput?: string;
  theme?: string;
  changeMonth: (direction: number) => void;
  monthLabel: string;
  calendarFilterTechnician: string;
  setCalendarFilterTechnician: (value: string) => void;
  technicians: any[];
  mobileCalendarCells: Date[];
  calendarDays: Date[];
  formatLocalDate: (day: Date) => string;
  calendarMonth: Date;
  calendarVisibleTickets: any[];
  mobileSelectedDate: string;
  mobileSelectedTickets: any[];
  selectedCalendarDay: string | null;
  setSelectedCalendarDay: (value: string | null) => void;
  startCalendarCreate: (iso: string) => void;
  startCalendarEdit: (ticket: any) => void;
  mobileCalendarFormOpen: boolean;
  setMobileCalendarFormOpen: (value: boolean) => void;
  editingCalendarTicketId: string | null;
  setEditingCalendarTicketId: (value: string | null) => void;
  expandedCalendarTicketId: string | null;
  setExpandedCalendarTicketId: (value: string | null) => void;
  renderDateInput: (value: string, onChange: (value: string) => void) => any;
  calendarTechnician: string;
  setCalendarTechnician: (value: string) => void;
  calendarSiteSearch: string;
  setCalendarSiteSearch: (value: string) => void;
  calendarSite: any;
  setCalendarSite: (value: any) => void;
  calendarSiteResults: any[];
  calendarTime: string;
  setCalendarTime: (value: string) => void;
  ticketType: any;
  setTicketType: (value: any) => void;
  ticketCategoryOptions: any[];
  ticketStatus: any;
  setTicketStatus: (value: any) => void;
  ticketStatusOptions: any[];
  saveMobileCalendarTicket: () => void;
  updateCalendarTicket: () => void;
};

export default function AtlasCalendarManager(props: AtlasCalendarManagerProps) {
  const {
    mode,
    card,
    strongText,
    mutedText,
    input,
    lightInput,
    theme,
    changeMonth,
    monthLabel,
    calendarFilterTechnician,
    setCalendarFilterTechnician,
    technicians,
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
    renderDateInput,
    calendarTechnician,
    setCalendarTechnician,
    calendarSiteSearch,
    setCalendarSiteSearch,
    calendarSite,
    setCalendarSite,
    calendarSiteResults,
    calendarTime,
    setCalendarTime,
    ticketType,
    setTicketType,
    ticketCategoryOptions,
    ticketStatus,
    setTicketStatus,
    ticketStatusOptions,
    saveMobileCalendarTicket,
    updateCalendarTicket,
  } = props;

  if (mode === "mobile") {
    return (
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

        <select
          className={input}
          value={calendarFilterTechnician}
          onChange={(event) =>
            setCalendarFilterTechnician(event.target.value)
          }
        >
          <option value="">Tutti i tecnici</option>
          {technicians.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </select>

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
            const hasTickets = calendarVisibleTickets.some((t) => t.date === iso);
            const selected = mobileSelectedDate === iso;

            return (
              <button
                key={iso}
                onClick={() => startCalendarCreate(iso)}
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
                      e.target.value as any,
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
                      e.target.value as any,
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
    );
  }

  return (
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

        <div className="flex flex-wrap items-center gap-3">
          <select
            className={lightInput}
            value={calendarFilterTechnician}
            onChange={(event) =>
              setCalendarFilterTechnician(event.target.value)
            }
          >
            <option value="">Tutti i tecnici</option>
            {technicians.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>

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

          const dayTickets = calendarVisibleTickets.filter((t) => t.date === iso);

          return (
            <div
              key={iso}
              role="button"
              tabIndex={0}
              onClick={() => startCalendarCreate(iso)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  startCalendarCreate(iso);
                }
              }}
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
                {dayTickets.length === 0 &&
                  !(selectedCalendarDay === iso &&
                    mobileCalendarFormOpen &&
                    !editingCalendarTicketId) && (
                    <p className="text-xs opacity-60">
                      Clicca per inserire uno slot
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
                {selectedCalendarDay === iso &&
                  mobileCalendarFormOpen &&
                  !editingCalendarTicketId && (
                    <div
                      className={`mt-3 grid gap-2 rounded-xl p-3 text-xs ${
                        theme === "dark"
                          ? "bg-slate-950/70 ring-2 ring-blue-400/40"
                          : "border border-blue-300 bg-white ring-2 ring-blue-300"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="font-black uppercase tracking-[0.18em] text-blue-300">
                        Nuovo slot
                      </p>

                      <select
                        className={lightInput}
                        value={calendarTechnician}
                        onChange={(e) =>
                          setCalendarTechnician(e.target.value)
                        }
                      >
                        <option value="">Seleziona tecnico</option>
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
                                  {s.city || "Città n/d"} · {s.region || "Regione n/d"}
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
                        onChange={(e) => setCalendarTime(e.target.value)}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveMobileCalendarTicket}
                          className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500"
                        >
                          Inserisci
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileCalendarFormOpen(false);
                            setSelectedCalendarDay(null);
                            setCalendarTechnician("");
                            setCalendarSiteSearch("");
                            setCalendarSite(null);
                            setCalendarTime("");
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
                {dayTickets.length > 3 && (
                  <p className="text-xs font-bold">
                    +{dayTickets.length - 3} altri
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
