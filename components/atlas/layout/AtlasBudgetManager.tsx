"use client";

import { ChevronRight } from "lucide-react";

type AtlasBudgetManagerProps = {
  mode: "mobile" | "desktop";
  card?: string;
  input: string;
  budgetVisible: boolean;
  setBudgetVisible: (value: boolean) => void;
  euro: (value: number) => string;
  totalBudget: number;
  totalForecast: number;
  remainingBudget: number;
  tickets: any[];
  getTicketType: (ticket: any) => string;
  openBudgetForm: (contractName?: string) => void;
  budgets: any[];
  getBudgetSpent: (contractName: string) => number;
  setMobileView: (value: any) => void;
  mobileBudgetFormOpen: boolean;
  setMobileBudgetFormOpen: (value: boolean) => void;
  budgetForm: any;
  setBudgetForm: (value: any) => void;
  editableContracts: any[];
  INITIAL_BUDGET: number;
  saveMobileBudget: () => void;
  setBudgetClientSearch: (value: string) => void;
};

export default function AtlasBudgetManager({
  mode,
  card = "",
  input,
  budgetVisible,
  setBudgetVisible,
  euro,
  totalBudget,
  totalForecast,
  remainingBudget,
  tickets,
  getTicketType,
  openBudgetForm,
  budgets,
  getBudgetSpent,
  setMobileView,
  mobileBudgetFormOpen,
  setMobileBudgetFormOpen,
  budgetForm,
  setBudgetForm,
  editableContracts,
  INITIAL_BUDGET,
  saveMobileBudget,
  setBudgetClientSearch,
}: AtlasBudgetManagerProps) {
  if (mode === "mobile") {
    return (
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
    );
  }

  return (
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
  );
}
