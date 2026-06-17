"use client";

import { ChevronRight } from "lucide-react";

type AtlasContactsManagerProps = {
  mode: "mobile" | "desktop";
  theme: string;
  card: string;
  input: string;
  strongText: string;
  mutedText: string;
  contactSearch: string;
  setContactSearch: (value: string) => void;
  filteredContacts: any[];
  contactForm: any;
  setContactForm: (value: any) => void;
  editingContactId: string | null;
  setEditingContactId: (value: string | null) => void;
  contactClientSearch: string;
  setContactClientSearch: (value: string) => void;
  contactClient: any | null;
  setContactClient: (value: any | null) => void;
  contactClientResults: any[];
  mobileContactFilter: any;
  setMobileContactFilter: (value: any) => void;
  mobileContactFormOpen: boolean;
  setMobileContactFormOpen: (value: boolean) => void;
  startContactCreate: () => void;
  startContactEdit: (contact: any) => void;
  saveMobileContact: () => void;
  saveContact: () => void;
  resetContactForm: () => void;
  editContact: (contact: any) => void;
  deleteContact: (id: string) => void;
};

export default function AtlasContactsManager({
  mode,
  theme,
  card,
  input,
  strongText,
  mutedText,
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
}: AtlasContactsManagerProps) {
  if (mode === "mobile") {
    return (
      <div className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-white">Contatti</h2>
            <p className="text-base text-slate-400">
              Rubrica tecnica, personale e fornitori.
            </p>
          </div>
          <button
            onClick={startContactCreate}
            className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
          >
            + Nuovo
          </button>
        </div>

        <input
          className={input}
          placeholder="Cerca contatto, telefono, email, azienda..."
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
        />

        <div className="flex max-w-full gap-5 overflow-x-auto border-b border-white/10 text-sm font-black">
          {[
            { key: "Tutti", label: "Tutti" },
            { key: "Personale", label: "Personale" },
            { key: "Fornitore", label: "Fornitori" },
            { key: "Istituzione", label: "Istituzioni" },
            { key: "Preferiti", label: "Preferiti" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMobileContactFilter(tab.key);
                setMobileContactFormOpen(false);
                setEditingContactId(null);
              }}
              className={`shrink-0 px-2 py-3 ${
                mobileContactFilter === tab.key
                  ? "border-b-2 border-blue-500 text-blue-400"
                  : "text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mobileContactFormOpen && (
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">
                {editingContactId ? "Modifica contatto" : "Nuovo contatto"}
              </h3>
              <button
                onClick={() => setMobileContactFormOpen(false)}
                className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
              >
                Chiudi
              </button>
            </div>

            <div className="grid gap-3">
              <input
                className={input}
                placeholder="Nome"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
              />

              <input
                className={input}
                placeholder="Telefono"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
              />

              <input
                className={input}
                placeholder="Indirizzo"
                value={contactForm.address}
                onChange={(e) =>
                  setContactForm({ ...contactForm, address: e.target.value })
                }
              />

              <textarea
                className={input}
                placeholder="Note"
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm({ ...contactForm, notes: e.target.value })
                }
              />

              <div className="relative">
                <input
                  className={`w-full ${input}`}
                  placeholder="Collega cliente/sede"
                  value={contactClientSearch}
                  onChange={(e) => {
                    setContactClientSearch(e.target.value);
                    setContactClient(null);
                  }}
                />

                {contactClientSearch && !contactClient && (
                  <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
                    {contactClientResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="block w-full border-b border-white/10 p-4 text-left"
                        onClick={() => {
                          setContactClient(s);
                          setContactClientSearch(s.name);
                        }}
                      >
                        <div className="font-black text-white">{s.name}</div>
                        <div className="text-xs text-slate-400">
                          {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                className={input}
                value={contactForm.tag}
                onChange={(e) =>
                  setContactForm({ ...contactForm, tag: e.target.value })
                }
              >
                <option value="Personale">Personale</option>
                <option value="Fornitore">Fornitore</option>
                <option value="Istituzione">Istituzione</option>
              </select>

              <button
                onClick={saveMobileContact}
                className="rounded-3xl bg-blue-600 p-5 text-xl font-black text-white"
              >
                Salva contatto
              </button>

              {editingContactId && (
                <button
                  onClick={() => {
                    deleteContact(editingContactId);
                    setMobileContactFormOpen(false);
                  }}
                  className="rounded-3xl bg-red-600 p-4 text-lg font-black text-white"
                >
                  Elimina contatto
                </button>
              )}
            </div>
          </div>
        )}

        {!mobileContactFormOpen && (
          <>
            <p className="text-sm text-slate-400">
              {filteredContacts.length} contatti trovati
            </p>

            {filteredContacts.map((contact: any) => (
              <button
                key={contact.id}
                onClick={() => startContactEdit(contact)}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/40 text-lg font-black text-white">
                    {String(contact.name || "?")
                      .split(" ")
                      .map((x: string) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black text-white">
                      {contact.name}
                    </span>
                    <span className="block truncate text-sm text-slate-400">
                      {contact.notes || contact.clientName || "Contatto"}
                    </span>
                    <span className="mt-2 block text-xs text-slate-400">
                      ☎ {contact.phone || "Telefono n/d"}
                    </span>
                    <span className="mt-2 inline-block rounded-full bg-blue-600/20 px-2 py-1 text-[11px] font-black text-blue-300">
                      {contact.tag || "Personale"}
                    </span>
                  </span>
                </div>
                <ChevronRight className="shrink-0 text-slate-400" />
              </button>
            ))}

            {filteredContacts.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-slate-400">
                La lista è vuota.
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <section className={card}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={`text-2xl font-black ${strongText}`}>Contatti</h2>
          <p className={`text-sm ${mutedText}`}>
            Rubrica tecnica associata ai clienti, modificabile dai tecnici.
          </p>
        </div>

        <input
          className={`md:w-96 ${input}`}
          placeholder="Cerca nome, telefono, cliente, note..."
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
        />
      </div>

      <div
        className={`mb-6 rounded-3xl border p-5 ${
          theme === "dark"
            ? "border-white/10 bg-slate-950/40"
            : "border-slate-400 bg-slate-50"
        }`}
      >
        <h3 className="mb-4 text-xl font-black">
          {editingContactId ? "Modifica contatto" : "Nuovo contatto"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={input}
            placeholder="Nome e cognome / referente"
            value={contactForm.name}
            onChange={(e) =>
              setContactForm({ ...contactForm, name: e.target.value })
            }
          />

          <input
            className={input}
            placeholder="Numero di telefono"
            value={contactForm.phone}
            onChange={(e) =>
              setContactForm({ ...contactForm, phone: e.target.value })
            }
          />

          <div className="relative md:col-span-2">
            <input
              className={`w-full ${input}`}
              placeholder="Associa cliente / sede..."
              value={contactClientSearch}
              onChange={(e) => {
                setContactClientSearch(e.target.value);
                setContactClient(null);
              }}
            />

            {contactClientSearch && !contactClient && (
              <div
                className={`absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-xl ${
                  theme === "dark"
                    ? "border-white/10 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {contactClientResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`block w-full border-b p-3 text-left text-sm ${
                      theme === "dark"
                        ? "border-white/10 hover:bg-white/10"
                        : "border-slate-200 hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setContactClient(s);
                      setContactClientSearch(s.name);
                    }}
                  >
                    <div className="font-black">{s.name}</div>
                    <div className="text-xs opacity-70">
                      {s.city || "Città n/d"} · {s.region || "Regione n/d"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            className="md:col-span-2 rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500"
            placeholder="Indirizzo"
            value={contactForm.address}
            onChange={(e) =>
              setContactForm({ ...contactForm, address: e.target.value })
            }
          />

          <textarea
            className={`md:col-span-2 min-h-28 ${input}`}
            placeholder="Note operative"
            value={contactForm.notes}
            onChange={(e) =>
              setContactForm({ ...contactForm, notes: e.target.value })
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={saveContact}
            className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
          >
            {editingContactId ? "Salva modifica" : "Aggiungi contatto"}
          </button>

          {editingContactId && (
            <button
              onClick={resetContactForm}
              className={`rounded-2xl px-5 py-3 font-black ${
                theme === "dark"
                  ? "bg-white/10 text-white"
                  : "bg-slate-200 text-slate-900"
              }`}
            >
              Annulla modifica
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`rounded-3xl border p-5 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.04]"
                : "border-slate-400 bg-white shadow-sm"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{contact.name}</p>
                <p className={`text-sm ${mutedText}`}>
                  {contact.clientName || "Cliente non associato"}
                </p>
              </div>

              <button
                onClick={() => editContact(contact)}
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
              >
                Modifica
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <a
                href={`tel:${contact.phone}`}
                className="block rounded-xl bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-500"
              >
                📞 {contact.phone}
              </a>

              {contact.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    contact.address,
                  )}`}
                  target="_blank"
                  className={`block rounded-xl px-3 py-2 font-bold ${
                    theme === "dark"
                      ? "bg-white/10 text-blue-300"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  📍 {contact.address}
                </a>
              )}

              {(contact.clientCity || contact.clientRegion) && (
                <p className={mutedText}>
                  {contact.clientCity || "Città n/d"} ·{" "}
                  {contact.clientRegion || "Regione n/d"}
                </p>
              )}

              {contact.notes && (
                <div
                  className={`rounded-2xl p-3 ${
                    theme === "dark"
                      ? "bg-slate-950/40"
                      : "bg-slate-100 border border-slate-300"
                  }`}
                >
                  {contact.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => deleteContact(contact.id)}
              className="mt-4 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-500"
            >
              Elimina
            </button>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div
            className={`rounded-3xl border p-8 text-center md:col-span-2 xl:col-span-3 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.04] text-slate-400"
                : "border-slate-300 bg-slate-50 text-slate-600"
            }`}
          >
            Nessun contatto trovato.
          </div>
        )}
      </div>
    </section>
  );
}
