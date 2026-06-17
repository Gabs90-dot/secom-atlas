"use client";

import { Download, Printer, Save } from "lucide-react";

export default function SlaContractsManager(props: any) {

  const {
    isMobile = false,
    card,
    input,
    panel,
    mutedText,
    selectedSlaContractKeys,
    filteredSlaContracts,
    slaContractCategories,
    contractSearchText,
    setContractSearchText,
    contractCategoryFilter,
    setContractCategoryFilter,
    exportSlaContractsXls,
    exportSlaContractsPdf,
    openNewSlaContractForm,
    toggleAllVisibleSlaContracts,
    toggleSlaContractSelection,
    openEditSlaContractForm,
    contractFormOpen,
    setContractFormOpen,
    editingSlaContractKey,
    slaContractForm,
    setSlaContractForm,
    saveSlaContractForm,
    SLA_CONTRACT_FIELDS,
  }: {
    isMobile?: boolean;
    card: string;
    input: string;
    panel: string;
    mutedText: string;
    selectedSlaContractKeys: Record<string, boolean>;
    filteredSlaContracts: any[];
    slaContractCategories: string[];
    contractSearchText: string;
    setContractSearchText: (value: string) => void;
    contractCategoryFilter: string;
    setContractCategoryFilter: (value: string) => void;
    exportSlaContractsXls: () => void;
    exportSlaContractsPdf: () => void;
    openNewSlaContractForm: () => void;
    toggleAllVisibleSlaContracts: () => void;
    toggleSlaContractSelection: (key: string) => void;
    openEditSlaContractForm: (contract: any) => void;
    contractFormOpen: boolean;
    setContractFormOpen: (value: boolean) => void;
    editingSlaContractKey: any;
    slaContractForm: any;
    setSlaContractForm: (value: any) => void;
    saveSlaContractForm: () => void;
    SLA_CONTRACT_FIELDS: any[];
  } = props;
  const selectedCount = Object.values(selectedSlaContractKeys).filter(Boolean).length;
  const exportCount = selectedCount || filteredSlaContracts.length;

  return (
    <section className={card}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
            SLA / ASSISTENZE
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Contratti e accordi commerciali
          </h2>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Vista generale tipo file SLA, esportazione XLS/PDF, selezione multipla e modifica completa dei campi.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            onClick={exportSlaContractsXls}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
          >
            <Download size={17} />
            Esporta XLS
          </button>

          <button
            onClick={exportSlaContractsPdf}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white"
          >
            <Printer size={17} />
            Esporta PDF
          </button>

          <button
            onClick={openNewSlaContractForm}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
          >
            + Nuovo contratto
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_240px_180px]">
        <input
          className={input}
          value={contractSearchText}
          onChange={(event) => setContractSearchText(event.target.value)}
          placeholder="Cerca cliente, categoria, SLA, garanzia, ricambi, figli..."
        />

        <select
          className={input}
          value={contractCategoryFilter}
          onChange={(event) => setContractCategoryFilter(event.target.value)}
        >
          {slaContractCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button
          onClick={toggleAllVisibleSlaContracts}
          className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-black"
        >
          {filteredSlaContracts.every((contract) => selectedSlaContractKeys[contract.key])
            ? "Deseleziona"
            : "Seleziona"}{" "}
          visibili
        </button>
      </div>

      <div className={`mb-5 grid gap-3 ${isMobile ? "grid-cols-2" : "md:grid-cols-4"}`}>
        <div className={`rounded-3xl border p-4 ${panel}`}>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${mutedText}`}>Contratti</p>
          <p className="mt-1 text-3xl font-black">{filteredSlaContracts.length}</p>
        </div>
        <div className={`rounded-3xl border p-4 ${panel}`}>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${mutedText}`}>Selezionati</p>
          <p className="mt-1 text-3xl font-black">{selectedCount}</p>
        </div>
        <div className={`rounded-3xl border p-4 ${panel}`}>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${mutedText}`}>Export</p>
          <p className="mt-1 text-3xl font-black">{exportCount}</p>
        </div>
        <div className={`rounded-3xl border p-4 ${panel}`}>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${mutedText}`}>Categorie</p>
          <p className="mt-1 text-3xl font-black">{slaContractCategories.length - 1}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredSlaContracts.map((contract) => (
          <div
            key={contract.key}
            className="rounded-3xl border border-white/20 bg-slate-950/25 p-4 shadow-lg shadow-black/10"
          >
            <div className="grid gap-4 xl:grid-cols-[auto_1.1fr_1.4fr_1fr_1fr_auto] xl:items-start">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={Boolean(selectedSlaContractKeys[contract.key])}
                  onChange={() => toggleSlaContractSelection(contract.key)}
                />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Categoria
                  </p>
                  <p className="mt-1 break-words text-sm font-black leading-snug">
                    {contract.category || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Tipologia cliente
                </p>
                <p className="mt-1 break-words text-base font-black leading-snug text-white">
                  {contract.customerType || "—"}
                </p>
                <p className="mt-2 break-words text-xs font-bold text-slate-400">
                  Padre: {contract.parentCustomer || "—"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Figli / sedi collegate
                </p>
                <p className="mt-1 break-words text-sm font-bold leading-relaxed text-slate-200">
                  {contract.childCustomers || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniContractValue label="Durata" value={contract.durationMonths || "—"} />
                <MiniContractValue label="Garanzia" value={contract.warrantyMonths || "—"} />
                <MiniContractValue label="Bloccante" value={contract.blockingResponse || "—"} />
                <MiniContractValue label="Non bloccante" value={contract.nonblockingResponse || "—"} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Ricambi / copertura
                </p>
                <p className="mt-1 line-clamp-5 break-words text-sm font-bold leading-relaxed text-slate-200">
                  {contract.sparePartsIncluded || "—"}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-400">
                  Ritiro/sped.: {contract.pickupShipping || "—"} · Orari: {contract.serviceHours || "—"}
                </p>
              </div>

              <button
                onClick={() => openEditSlaContractForm(contract)}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 xl:w-[150px]"
              >
                Apri / modifica
              </button>
            </div>
          </div>
        ))}
      </div>

      {contractFormOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-8 backdrop-blur-sm"
          onMouseDown={() => setContractFormOpen(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/20 bg-[#081523] p-5 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  {editingSlaContractKey ? "Modifica contratto" : "Nuovo contratto"}
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {slaContractForm.customerType || "Compila profilo SLA"}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Tutti i campi del file SLA sono modificabili. Usa padre/figli per associare categorie, enti e sedi.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onMouseDown={() => setContractFormOpen(false)}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
                >
                  Annulla
                </button>
                <button
                  onClick={saveSlaContractForm}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
                >
                  <Save size={17} />
                  Salva contratto
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {SLA_CONTRACT_FIELDS.map((field) => (
                <label key={String(field.key)} className={field.wide ? "md:col-span-2" : ""}>
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {field.label}
                  </p>

                  {field.key === "category" ? (
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                      value={String(slaContractForm[field.key] || "")}
                      onChange={(event) =>
                        setSlaContractForm((prev: any) => ({
                          ...prev,
                          category: event.target.value,
                          parentCustomer: prev.parentCustomer || event.target.value,
                        }))
                      }
                    >
                      <option value="">Seleziona categoria...</option>
                      {slaContractCategories
                        .filter((category) => category !== "Tutte")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      <option value="NUOVA CATEGORIA">NUOVA CATEGORIA</option>
                    </select>
                  ) : (
                    <textarea
                      value={String(slaContractForm[field.key] ?? "")}
                      onChange={(event) =>
                        setSlaContractForm((prev: any) => ({
                          ...prev,
                          [field.key]:
                            field.key === "matchPriority"
                              ? Number(event.target.value || 0)
                              : event.target.value,
                        }))
                      }
                      rows={field.rows || 2}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


function MiniContractValue({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black leading-snug text-white">
        {value}
      </p>
    </div>
  );
}
