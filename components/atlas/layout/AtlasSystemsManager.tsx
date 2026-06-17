"use client";

import { systemsCatalog } from "@/lib/systemsCatalog";
import { ChevronRight } from "lucide-react";

type AtlasSystemsManagerProps = {
  mode: "mobile" | "desktop";
  card?: string;
  input: string;
  selectedSystem: string | null;
  setSelectedSystem: (value: string | null) => void;
  systemSearch: string;
  setSystemSearch: (value: string) => void;
  euro: (value: number) => string;
  showMessage?: (message: string, type?: "success" | "error") => void;
};

export default function AtlasSystemsManager({
  mode,
  card = "",
  input,
  selectedSystem,
  setSelectedSystem,
  systemSearch,
  setSystemSearch,
  euro,
  showMessage,
}: AtlasSystemsManagerProps) {
  const openSystemMobile = (systemName: string) => {
    setSelectedSystem(selectedSystem === systemName ? null : systemName);
  };

  if (mode === "mobile") {
    const filteredSystems = systemsCatalog.filter((system: any) => {
      const q = systemSearch.toLowerCase();
      return `${system.name} ${system.productName} ${system.components
        ?.map((component: any) => component.name)
        .join(" ")}`.toLowerCase().includes(q);
    });

    return (
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
              showMessage?.(
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
                (sum, system: any) => sum + (system.components?.length || 0),
                0,
              )}
            </p>
            <p>Componenti</p>
          </div>
          <div className="col-span-2">
            <p className="text-xl font-black text-white">
              {euro(
                systemsCatalog.reduce(
                  (sum, system: any) => sum + Number(system.totalCost || 0),
                  0,
                ),
              )}
            </p>
            <p>Valore totale</p>
          </div>
        </div>

        {filteredSystems.map((system: any) => (
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
                  className={`ml-auto mt-2 text-slate-400 transition ${
                    selectedSystem === system.name ? "rotate-90" : ""
                  }`}
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
                            Number(component.cost || component.price || 0),
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
    );
  }

  const selectedSystemData = selectedSystem
    ? systemsCatalog.find((system: any) => system.name === selectedSystem)
    : null;

  const filteredComponents =
    selectedSystemData?.components?.filter((component: any) => {
      const q = systemSearch.toLowerCase();

      return (
        component.name?.toLowerCase().includes(q) ||
        component.code?.toLowerCase().includes(q) ||
        component.category?.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <section className={card}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Sistemi / Componenti</h2>
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
          {systemsCatalog.map((system: any) => (
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

      {selectedSystemData && (
        <div>
          <div className="mb-5 rounded-3xl bg-slate-950/40 p-5">
            <h3 className="text-2xl font-black">{selectedSystemData.name}</h3>

            <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
              <p>
                <b>Componenti:</b> {selectedSystemData.components.length}
              </p>
              <p>
                <b>Valore totale:</b> {euro(selectedSystemData.totalCost)}
              </p>
              <p>
                <b>Prodotto:</b> {selectedSystemData.productName}
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
                    <b>Prezzo:</b> {euro(Number(component.cost || 0))}
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
      )}
    </section>
  );
}
