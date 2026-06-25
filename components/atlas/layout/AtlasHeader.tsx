"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, LoaderCircle, MapPin, Menu, Navigation, Search, X } from "lucide-react";
import TenantSwitcher from "@/components/atlas/TenantSwitcher";
import UserSessionBadge from "@/components/atlas/UserSessionBadge";
import OperatorAvatar from "./OperatorAvatar";
import ThemeToggle from "./ThemeToggle";
import VariableProximity from "./VariableProximity";


function getDisplayName(user: any | null) {
  const raw =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.display_name ||
    user?.email ||
    "Operatore";

  return String(raw).split("@")[0].replace(/[._-]+/g, " ").trim() || "Operatore";
}

function getFirstName(user: any | null) {
  const displayName = getDisplayName(user);
  return displayName.split(/\s+/).filter(Boolean)[0] || displayName || "Operatore";
}

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 14) return "Buongiorno";
  if (hour >= 14 && hour < 17) return "Buon pomeriggio";
  return "Buonasera";
}

type LocalWeather = {
  city: string;
  region: string | null;
  temperature: number;
  apparentTemperature: number;
  description: string;
  weatherCode: number;
  isDay: boolean;
  updatedAt: string;
};

type CachedLocalWeather = {
  data: LocalWeather;
  expiresAt: number;
};

const LOCAL_WEATHER_ENABLED_KEY = "atlas-local-weather-enabled-v1";
const LOCAL_WEATHER_CACHE_KEY = "atlas-local-weather-cache-v1";
const LOCAL_WEATHER_CACHE_MS = 30 * 60 * 1000;

type AtlasHeaderProps = {
  isDesktopShell: boolean;
  theme: string;
  isExecutiveMode: boolean;
  tenants: any[];
  activeTenant: any | null;
  currentUser: any | null;
  notificationCount: number;
  siteSearch: string;
  tabs: any[];
  activeTab: string;
  onTenantChange: (tenant: any) => void;
  onLogout: () => void;
  onOpenNotifications: (anchor: NotificationPanelAnchor) => void;
  onOpenMobileMenu: () => void;
  onSwitchUiMode: (mode: "classic" | "executive") => void;
  onThemeChange: (theme: string) => void;
  onSiteSearchChange: (value: string) => void;
  onTabChange: (key: string) => void;
  canAccessTab: (key: string) => boolean;
  operatorAvatar?: string;
  onOperatorAvatarUpload?: (file?: File | null) => void | Promise<void>;
};

type NotificationPanelAnchor = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

function getAnchorFromElement(element: HTMLElement): NotificationPanelAnchor {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export default function AtlasHeader({
  isDesktopShell,
  theme,
  isExecutiveMode,
  tenants,
  activeTenant,
  currentUser,
  notificationCount,
  siteSearch,
  tabs,
  activeTab,
  onTenantChange,
  onLogout,
  onOpenNotifications,
  onOpenMobileMenu,
  onSwitchUiMode,
  onThemeChange,
  onSiteSearchChange,
  onTabChange,
  canAccessTab,
  operatorAvatar = "",
  onOperatorAvatarUpload,
}: AtlasHeaderProps) {
  const canSwitchExecutive = ["super_admin", "admin"].includes(currentUser?.role || "");
  const firstName = getFirstName(currentUser);
  const dayGreeting = getDayGreeting();
  const greetingContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [localWeather, setLocalWeather] = useState<LocalWeather | null>(null);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const requestLocalWeather = useCallback(async (rememberChoice = true) => {
    if (!("geolocation" in navigator)) {
      setWeatherError("Geolocalizzazione non disponibile su questo dispositivo.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10_000,
            maximumAge: 15 * 60 * 1000,
          });
        },
      );

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

      const response = await fetch("/api/weather/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));

      const payload = (await response.json()) as
        | LocalWeather
        | { error?: string };

      if (!response.ok || !("city" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Meteo locale non disponibile.",
        );
      }

      setLocalWeather(payload);
      setWeatherEnabled(true);

      try {
        if (rememberChoice) {
          window.localStorage.setItem(LOCAL_WEATHER_ENABLED_KEY, "on");
        }

        const cachedWeather: CachedLocalWeather = {
          data: payload,
          expiresAt: Date.now() + LOCAL_WEATHER_CACHE_MS,
        };

        window.localStorage.setItem(
          LOCAL_WEATHER_CACHE_KEY,
          JSON.stringify(cachedWeather),
        );
      } catch {
        // Il meteo continua a funzionare anche se lo storage non è disponibile.
      }
    } catch (error) {
      const geolocationCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "number"
          ? error.code
          : null;

      if (geolocationCode === 1) {
        setWeatherError("Permesso posizione negato.");
        setWeatherEnabled(false);

        try {
          window.localStorage.removeItem(LOCAL_WEATHER_ENABLED_KEY);
        } catch {
          // Nessuna azione necessaria.
        }
      } else if (error instanceof Error && error.name === "AbortError") {
        setWeatherError("Tempo scaduto durante il caricamento del meteo.");
      } else {
        setWeatherError(
          error instanceof Error
            ? error.message
            : "Impossibile caricare il meteo locale.",
        );
      }
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const disableLocalWeather = useCallback(() => {
    setWeatherEnabled(false);
    setLocalWeather(null);
    setWeatherError("");

    try {
      window.localStorage.removeItem(LOCAL_WEATHER_ENABLED_KEY);
      window.localStorage.removeItem(LOCAL_WEATHER_CACHE_KEY);
    } catch {
      // Preferenza rimossa per la sessione corrente.
    }
  }, []);

  useEffect(() => {
    if (!isDesktopShell || !isExecutiveMode) return;

    let enabled = false;

    try {
      enabled =
        window.localStorage.getItem(LOCAL_WEATHER_ENABLED_KEY) === "on";

      const cachedRaw = window.localStorage.getItem(LOCAL_WEATHER_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as CachedLocalWeather;

        if (
          cached?.data &&
          typeof cached.expiresAt === "number" &&
          cached.expiresAt > Date.now()
        ) {
          setLocalWeather(cached.data);
        }
      }
    } catch {
      // Se lo storage non è disponibile, si parte senza preferenze.
    }

    setWeatherEnabled(enabled);

    if (enabled) {
      void requestLocalWeather(false);
    }
  }, [isDesktopShell, isExecutiveMode, requestLocalWeather]);


  useEffect(() => {
    if (!isDesktopShell || !isExecutiveMode) {
      setCurrentTime(null);
      return;
    }

    const updateClock = () => setCurrentTime(new Date());
    updateClock();

    const intervalId = window.setInterval(updateClock, 1000);
    document.addEventListener("visibilitychange", updateClock);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updateClock);
    };
  }, [isDesktopShell, isExecutiveMode]);

  const executiveHoursMinutes = currentTime
    ? new Intl.DateTimeFormat("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(currentTime)
    : "--:--";

  const executiveSeconds = currentTime
    ? new Intl.DateTimeFormat("it-IT", {
        second: "2-digit",
      }).format(currentTime)
    : "--";

  const executiveDate = currentTime
    ? new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(currentTime)
    : "Caricamento data";

  if (!isDesktopShell) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06111f]/95 px-5 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-2xl p-2 text-white"
            aria-label="Apri menu mobile"
          >
            <Menu size={26} />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <img src="/secom-logo.png.png" alt="Secom" className="h-9 w-auto object-contain" />
            <h1 className="truncate text-base font-black text-white">Centrale Operativa ATLAS</h1>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <TenantSwitcher tenants={tenants} activeTenant={activeTenant} onTenantChange={onTenantChange} />
            <UserSessionBadge user={currentUser} compact onLogout={onLogout} />
          </div>

          <button
            onClick={(event) => onOpenNotifications(getAnchorFromElement(event.currentTarget))}
            className="relative rounded-2xl p-2 text-white"
            aria-label="Notifiche"
          >
            <Bell size={24} />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  return (
      <header
        className={`sticky top-0 z-30 hidden border-b backdrop-blur lg:block ${
          theme === "dark" ? "border-white/10 bg-[#07111f]/90" : "border-slate-300 bg-white/95 shadow-sm"
        }`}
      >
        <div className="relative px-4 py-3 md:px-8 md:py-4">
          <div className="relative z-20 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/secom-logo.png.png" alt="Secom" className="h-10 w-auto object-contain lg:hidden" />

              <div className="min-w-0">
                {isExecutiveMode ? (
                  <div
                    className="flex h-[66px] w-[clamp(360px,38vw,520px)] items-center px-1"
                    aria-label={`Ora locale ${executiveHoursMinutes} e ${executiveSeconds} secondi, ${executiveDate}`}
                  >
                    <div className="shrink-0">
                      <div className="flex items-baseline gap-2">
                        <time
                          className="font-mono text-2xl font-black leading-none tracking-[0.08em] text-white md:text-3xl"
                          dateTime={currentTime?.toISOString()}
                        >
                          {executiveHoursMinutes}
                        </time>
                        <span className="font-mono text-sm font-black tracking-[0.18em] text-cyan-300">
                          {executiveSeconds}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        {executiveDate}
                      </p>
                    </div>

                    <div className="mx-4 h-8 w-px shrink-0 bg-white/[0.09]" />

                    <div className="flex min-w-0 flex-1 items-center">
                      {localWeather ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <MapPin
                            size={14}
                            className="shrink-0 text-cyan-300"
                            aria-hidden="true"
                          />
                          <p
                            className="min-w-0 flex-1 truncate text-xs font-black text-slate-200"
                            title={`${localWeather.city}${
                              localWeather.region
                                ? `, ${localWeather.region}`
                                : ""
                            } · ${localWeather.temperature.toFixed(
                              0,
                            )} °C · ${localWeather.description} · percepita ${localWeather.apparentTemperature.toFixed(
                              0,
                            )} °C`}
                          >
                            {localWeather.city}
                            <span className="mx-1.5 text-slate-600">·</span>
                            <span className="text-cyan-200">
                              {localWeather.temperature.toFixed(0)} °C
                            </span>
                            <span className="mx-1.5 text-slate-600">·</span>
                            <span className="text-slate-400">
                              {localWeather.description}
                            </span>
                          </p>

                          <button
                            type="button"
                            onClick={disableLocalWeather}
                            className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
                            title="Disattiva meteo locale"
                            aria-label="Disattiva meteo locale"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : weatherLoading ? (
                        <div className="flex min-w-0 items-center gap-2 text-xs font-black text-slate-400">
                          <LoaderCircle
                            size={14}
                            className="shrink-0 animate-spin text-cyan-300"
                            aria-hidden="true"
                          />
                          <span className="truncate">Localizzazione...</span>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void requestLocalWeather(true)}
                            className="flex items-center gap-2 rounded-xl px-1 py-1 text-xs font-black text-cyan-200 transition hover:text-white"
                          >
                            <Navigation size={14} aria-hidden="true" />
                            {weatherError
                              ? "Riprova meteo"
                              : "Attiva meteo locale"}
                          </button>

                          {weatherError && (
                            <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-bold text-amber-300/90">
                              {weatherError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <TenantSwitcher tenants={tenants} activeTenant={activeTenant} onTenantChange={onTenantChange} />

              {isExecutiveMode && (
                <OperatorAvatar avatar={operatorAvatar} displayName={getDisplayName(currentUser)} onUpload={onOperatorAvatarUpload} />
              )}

              <UserSessionBadge user={currentUser} onLogout={onLogout} />

              <button
                onClick={(event) => onOpenNotifications(getAnchorFromElement(event.currentTarget))}
                className={`relative shrink-0 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition-all md:px-4 md:py-3 md:text-sm ${
                  theme === "dark" ? "border-white/10 bg-white/[0.06] text-white" : "border-slate-200 bg-white text-slate-900"
                }`}
                aria-label="Notifiche"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {notificationCount}
                  </span>
                )}
              </button>

              {canSwitchExecutive && (
                <ThemeToggle
                  kind="uiMode"
                  theme={theme}
                  isExecutiveMode={isExecutiveMode}
                  onClick={() => onSwitchUiMode(isExecutiveMode ? "classic" : "executive")}
                />
              )}

              <ThemeToggle
                kind="colorTheme"
                theme={theme}
                isExecutiveMode={isExecutiveMode}
                onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              />
            </div>
          </div>

          <div className="relative z-20 mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-blue-400"
                    : "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500 focus:border-blue-600"
                }`}
                placeholder="Cerca sito, cliente, contratto..."
                value={siteSearch}
                onChange={(event) => onSiteSearchChange(event.target.value)}
              />
            </div>
          </div>

          {isExecutiveMode && (
            <div ref={greetingContainerRef} className="pointer-events-none absolute bottom-3 left-8 z-10 hidden lg:block">
              <h2 className="text-[44px] font-black leading-none tracking-tight text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.18)] xl:text-[50px] 2xl:text-[54px]">
                <VariableProximity
                  label={`${dayGreeting}, ${firstName}`}
                  className="inline-block whitespace-nowrap text-white"
                  fromFontVariationSettings="'wght' 650, 'opsz' 12"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={greetingContainerRef}
                  radius={150}
                  falloff="linear"
                />
              </h2>
            </div>
          )}
        </div>

        <div className={`border-t px-3 py-2 lg:hidden ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs
              .filter((tab) => canAccessTab(tab.key))
              .map(({ key, label, icon: Icon, badge }: any) => (
                <button
                  key={key}
                  onClick={() => onTabChange(key)}
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
                  {badge > 0 && (
                    <span className="ml-1 min-w-4 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[9px] font-black text-white">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </header>
  );
}
