"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import { euro, getInventoryStatus } from "@/lib/atlasUtils";

type AtlasInventoryItem = {
  id?: string;
  name?: string;
  value?: number | string;
  quantity?: number | string;
};

type AtlasInventoryForm = {
  id: string;
  name: string;
  value: string;
  quantity: string;
};

type AtlasInventoryManagerProps = {
  mode: "mobile" | "desktop";
  theme: string;
  card: string;
  input: string;
  lightInput: string;
  strongText: string;
  mutedText: string;
  inventory: AtlasInventoryItem[];
  inventorySearch: string;
  setInventorySearch: (value: string) => void;
  mobileInventoryFormOpen: boolean;
  setMobileInventoryFormOpen: (value: boolean) => void;
  editingInventoryIndex: number | null;
  inventoryForm: AtlasInventoryForm;
  setInventoryForm: Dispatch<SetStateAction<AtlasInventoryForm>>;
  startInventoryCreate: () => void;
  startInventoryEdit: (index: number) => void;
  saveInventoryItemMobile: () => void;
  deleteInventoryItemMobile: () => void;
  addInventoryItem: () => void;
  updateInventoryItem: (index: number, field: string, value: string) => void;
};

function inventoryMatchesSearch(item: AtlasInventoryItem, search: string) {
  const q = search.toLowerCase();

  return (
    String(item.id || "").toLowerCase().includes(q) ||
    String(item.name || "").toLowerCase().includes(q)
  );
}

export default function AtlasInventoryManager({
  mode,
  theme,
  card,
  input,
  lightInput,
  strongText,
  mutedText,
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
}: AtlasInventoryManagerProps) {
  if (mode === "mobile") {
    return (
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <h2 className="text-3xl font-black text-white">Magazzino</h2>
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
            .filter((item) => inventoryMatchesSearch(item, inventorySearch))
            .map((item, index) => {
              const status = getInventoryStatus(Number(item.quantity));

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
                      <p className="text-xs text-slate-400">Quantità</p>
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
    );
  }

  return (
    <section className={`${card} hidden md:block`}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-2xl font-black ${strongText}`}>Magazzino</h2>
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
          .filter((item) => inventoryMatchesSearch(item, inventorySearch))
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
                  value={item.id || ""}
                  onChange={(e) => updateInventoryItem(index, "id", e.target.value)}
                  placeholder="ID articolo"
                />

                <input
                  className={lightInput}
                  value={item.name || ""}
                  onChange={(e) => updateInventoryItem(index, "name", e.target.value)}
                  placeholder="Nome articolo"
                />

                <input
                  className={lightInput}
                  type="number"
                  value={item.value || 0}
                  onChange={(e) =>
                    updateInventoryItem(index, "value", e.target.value)
                  }
                  placeholder="Valore"
                />

                <input
                  className={lightInput}
                  type="number"
                  value={item.quantity || 0}
                  onChange={(e) =>
                    updateInventoryItem(index, "quantity", e.target.value)
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
  );
}
