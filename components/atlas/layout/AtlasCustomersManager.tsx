"use client";

import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

const CustomerInviteCodeCenter = dynamic(() => import("@/components/atlas/CustomerInviteCodeCenter"), { ssr: false });

type AtlasCustomersManagerProps = {
  mode: "mobile" | "desktop";
  sites: any[];
  clientCategories: Record<string, any[]>;
  clientSearch: string;
  setClientSearch: Dispatch<SetStateAction<string>>;
  openCategory: string | null;
  setOpenCategory: Dispatch<SetStateAction<string | null>>;
  input: string;
  theme: "dark" | "light" | string;
  uiMode?: string;
  card?: string;
  customerInvitePanelOpen: boolean;
  setCustomerInvitePanelOpen: Dispatch<SetStateAction<boolean>>;
  onAddClient?: () => void;
  onSelectSite?: (site: any) => void;
};

function filterSites(categorySites: any[], clientSearch: string) {
  const q = clientSearch.toLowerCase();
  return categorySites.filter((site) => {
    return (
      site?.name?.toLowerCase().includes(q) ||
      site?.city?.toLowerCase().includes(q) ||
      site?.entity?.toLowerCase().includes(q) ||
      site?.region?.toLowerCase().includes(q)
    );
  });
}

function InviteCompactPanel({
  uiMode,
  theme,
  customerInvitePanelOpen,
  setCustomerInvitePanelOpen,
}: Pick<
  AtlasCustomersManagerProps,
  "uiMode" | "theme" | "customerInvitePanelOpen" | "setCustomerInvitePanelOpen"
>) {
  return (
    <div
      className={`mb-5 overflow-hidden rounded-[26px] border ${
        uiMode === "executive"
          ? "border-cyan-300/15 bg-slate-950/30 shadow-[0_0_35px_rgba(34,211,238,0.06)]"
          : theme === "dark"
            ? "border-white/10 bg-white/[0.035]"
            : "border-slate-300 bg-slate-50"
      }`}
    >
      <button
        type="button"
        onClick={() => setCustomerInvitePanelOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.035]"
      >
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${uiMode === "executive" ? "text-cyan-200/70" : "text-blue-400"}`}>
            Accessi cliente
          </p>
          <h3 className={`${theme === "dark" || uiMode === "executive" ? "text-white" : "text-slate-950"} mt-1 text-lg font-black`}>
            Codici invito portale
          </h3>
          <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">
            Genera o consulta codici sede/comando solo quando serve, senza occupare l'elenco clienti.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 sm:inline-flex">
            {customerInvitePanelOpen ? "Aperto" : "Compatto"}
          </span>
          <span
            className={`rounded-2xl px-4 py-2 text-sm font-black ${
              customerInvitePanelOpen
                ? "border border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
            }`}
          >
            {customerInvitePanelOpen ? "Chiudi" : "Gestisci codici"}
          </span>
        </div>
      </button>

      {customerInvitePanelOpen && (
        <div className="border-t border-white/10 p-4">
          <CustomerInviteCodeCenter />
        </div>
      )}
    </div>
  );
}

export default function AtlasCustomersManager({
  mode,
  sites,
  clientCategories,
  clientSearch,
  setClientSearch,
  openCategory,
  setOpenCategory,
  input,
  theme,
  uiMode,
  card,
  customerInvitePanelOpen,
  setCustomerInvitePanelOpen,
  onAddClient,
  onSelectSite,
}: AtlasCustomersManagerProps) {
  if (mode === "mobile") {
    return (
      <div className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-white">Clienti / Enti</h2>
            <p className="text-base text-slate-400">{sites.length} sedi totali</p>
          </div>
          {onAddClient && (
            <button onClick={onAddClient} className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">
              + Nuovo cliente
            </button>
          )}
        </div>

        <input
          className={input}
          placeholder="Cerca cliente, città, sede..."
          value={clientSearch}
          onChange={(event) => setClientSearch(event.target.value)}
        />

        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 text-center text-sm font-black">
          <button className="border-b-2 border-blue-500 py-3 text-blue-400">Categorie</button>
          <button className="py-3 text-slate-400">Elenco clienti</button>
        </div>

        <div className="grid gap-3">
          {Object.entries(clientCategories).map(([category, categorySites]) => {
            const filtered = filterSites(categorySites, clientSearch);
            if (filtered.length === 0) return null;

            return (
              <div key={category} className="rounded-3xl border border-white/10 bg-white/[0.06]">
                <button
                  onClick={() => setOpenCategory(openCategory === category ? null : category)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/30 text-lg font-black text-white">
                      {category.slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      <span className="block text-lg font-black text-white">{category}</span>
                      <span className="text-sm text-slate-400">{filtered.length} sedi</span>
                    </span>
                  </span>
                  <ChevronRight className={`text-slate-400 transition ${openCategory === category ? "rotate-90" : ""}`} />
                </button>

                {openCategory === category && (
                  <div className="grid gap-2 border-t border-white/10 p-4">
                    {filtered.slice(0, 30).map((site) => (
                      <button
                        key={site.id}
                        onClick={() => onSelectSite?.(site)}
                        className="rounded-2xl bg-slate-950/40 p-3 text-left"
                      >
                        <p className="font-black text-white">{site.name}</p>
                        <p className="text-sm text-slate-400">
                          {site.city || "Città n/d"} · {site.entity || "Ente n/d"}
                        </p>
                        <p className="text-xs text-slate-500">{site.region || "Regione n/d"}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center">
          <div>
            <p className="text-2xl font-black text-white">{sites.length}</p>
            <p className="text-xs text-slate-400">Sedi totali</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{Object.keys(clientCategories).length}</p>
            <p className="text-xs text-slate-400">Categorie</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{sites.length}</p>
            <p className="text-xs text-slate-400">Clienti</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={card}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Clienti / Enti</h2>
          <p className="text-sm text-slate-400">{sites.length} sedi totali</p>
        </div>

        <input
          className={input}
          placeholder="Cerca cliente, città, sede..."
          value={clientSearch}
          onChange={(event) => setClientSearch(event.target.value)}
        />
      </div>

      <InviteCompactPanel
        uiMode={uiMode}
        theme={theme}
        customerInvitePanelOpen={customerInvitePanelOpen}
        setCustomerInvitePanelOpen={setCustomerInvitePanelOpen}
      />

      <div className="space-y-4">
        {Object.entries(clientCategories).map(([category, categorySites]) => {
          const filtered = filterSites(categorySites, clientSearch);
          if (filtered.length === 0) return null;

          return (
            <div
              key={category}
              className={`rounded-3xl border ${theme === "dark" ? "border-white/10 bg-white/[0.04]" : "border-slate-400 bg-white"}`}
            >
              <button
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="text-lg font-black">{category}</p>
                  <p className="text-sm text-slate-400">{filtered.length} sedi</p>
                </div>
                <div className="text-2xl">{openCategory === category ? "−" : "+"}</div>
              </button>

              {openCategory === category && (
                <div className={`grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3 ${theme === "dark" ? "border-white/10" : "border-slate-300"}`}>
                  {filtered.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => onSelectSite?.(site)}
                      className={`rounded-2xl p-4 text-left transition hover:scale-[1.01] ${
                        theme === "dark"
                          ? "bg-slate-950/40 hover:bg-slate-900/80"
                          : "border border-slate-300 bg-slate-100 hover:bg-blue-50"
                      }`}
                    >
                      <p className="font-bold">{site.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{site.entity || "Ente n/d"}</p>
                      <p className="mt-2 text-sm">
                        {site.city || "Città n/d"} · {site.region || "Regione n/d"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{site.address || "Indirizzo n/d"}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
