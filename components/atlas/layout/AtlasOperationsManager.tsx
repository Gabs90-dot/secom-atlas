"use client";

import { useState } from "react";
import TicketForm from "@/components/atlas/TicketForm";

function toPositiveNumberOrNull(value: any) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function toNullableString(value: any) {
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

export default function AtlasOperationsManager(props: any) {
  const {
    mode,
    input,
    card = "",
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
    euro = (value: any) => String(value ?? ""),
    getBudgetTotal = () => 0,
    getBudgetSpent = () => 0,
    getBudgetRemaining = () => 0,
    setSelectedGlpiEntityId,
    setSelectedGlpiEntityPath,
    region = "",
    technician = "",
    setTechnician,
    technicians = [],
    renderDateInput,
    selectedDate,
    setSelectedDate,
    selectedSlot = "",
    setSelectedSlot,
    materials = [],
    onAddMaterial,
    toggleMaterial,
    selectedMaterials = [],
    materialCost = () => 0,
    creatingTicket = false,
    glpiEnabled = true,
  } = props;
  const [materialForm, setMaterialForm] = useState({ name: "", code: "", cost: "" });

  function submitMaterial() {
    onAddMaterial?.(materialForm);
    setMaterialForm({ name: "", code: "", cost: "" });
  }

  if (mode === "mobile") {
    return (
      <div className="grid gap-4">
        {ticketFormReturnTarget && (
          <button
            type="button"
            onClick={goBackFromTicketForm}
            className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]"
          >
            ← Torna indietro
          </button>
        )}
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
          glpiEnabled={glpiEnabled}
        />
      </div>
    );
  }

  return (
    <section className={`${card} hidden md:block`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-black">Apri nuova chiamata manuale</h2>
        {ticketFormReturnTarget && (
          <button
            type="button"
            onClick={goBackFromTicketForm}
            className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.1]"
          >
            ← Torna indietro
          </button>
        )}
      </div>

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
                    getContractStatus?.(selectedContract)?.color || ""
                  }`}
                >
                  {getContractStatus?.(selectedContract)?.label || ""}
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
                  <p className="text-slate-400">Straordinario scalato</p>
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
              setSelectedGlpiEntityId?.(null);
              setSelectedGlpiEntityPath?.("");
            }}
          />

          {siteSearch && !site && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
              {filteredSites.length === 0 && (
                <div className="p-3 text-sm text-slate-400">
                  Nessuna sede trovata
                </div>
              )}

              {filteredSites.map((s: any) => (
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
                    setSelectedGlpiEntityId?.(
                      toPositiveNumberOrNull(s.glpiEntityId || s.glpi_entity_id)
                    );
                    setSelectedGlpiEntityPath?.(
                      toNullableString(s.glpi_entity_path || s.complete_name) || ""
                    );
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
          placeholder="Scrivi un titolo intervento"
          value={ticketTitle}
          onChange={(e) => setTicketTitle(e.target.value)}
        />

        <select
          className={input}
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value as any)}
        >
          {ticketCategoryOptions.map((option: any) => (
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
          onChange={(e) => setTechnician?.(e.target.value)}
        >
          <option value="">Tecnico non assegnato</option>
          {technicians.map((t: any) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          className={input}
          value={ticketStatus}
          onChange={(e) => setTicketStatus(e.target.value as any)}
        >
          {ticketStatusOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {renderDateInput?.(selectedDate, setSelectedDate)}

        <select
          className={input}
          value={selectedSlot}
          onChange={(e) => setSelectedSlot?.(e.target.value)}
        >
          <option value="">Seleziona slot</option>
          <option value="Mattina">Mattina</option>
          <option value="Pomeriggio">Pomeriggio</option>
        </select>
      </div>

      <h3 className="mt-6 mb-3 font-black">Materiali necessari</h3>

      <div className="mb-4 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_160px_160px_auto]">
        <input
          className={input}
          value={materialForm.name}
          onChange={(event) => setMaterialForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Nuovo materiale tenant"
        />
        <input
          className={input}
          value={materialForm.code}
          onChange={(event) => setMaterialForm((prev) => ({ ...prev, code: event.target.value }))}
          placeholder="Codice"
        />
        <input
          className={input}
          value={materialForm.cost}
          onChange={(event) => setMaterialForm((prev) => ({ ...prev, cost: event.target.value }))}
          placeholder="Costo"
          inputMode="decimal"
        />
        <button
          type="button"
          onClick={submitMaterial}
          disabled={!materialForm.name.trim()}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aggiungi
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {materials.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-slate-400 md:col-span-4">
            Nessun materiale configurato per questo tenant.
          </div>
        )}

        {materials.map((m: any) => (
          <button
            key={m.id}
            onClick={() => toggleMaterial?.(m.id)}
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
          <p className="text-sm text-slate-400">Costo nuova chiamata</p>
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
          disabled={creatingTicket || !site || !ticketTitle.trim() || !problem.trim()}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creatingTicket ? "Apertura..." : "Apri chiamata"}
        </button>
      </div>
    </section>
  );
}
