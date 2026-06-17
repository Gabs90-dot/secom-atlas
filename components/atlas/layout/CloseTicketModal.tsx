"use client";

type CloseTicketModalProps = {
  ticketId: string | null;
  inputClass: string;
  closingNotes: string;
  futureNeeds: string;
  resolved: boolean;
  onClosingNotesChange: (value: string) => void;
  onFutureNeedsChange: (value: string) => void;
  onResolvedChange: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: (ticketId: string) => void;
};

export default function CloseTicketModal({
  ticketId,
  inputClass,
  closingNotes,
  futureNeeds,
  resolved,
  onClosingNotesChange,
  onFutureNeedsChange,
  onResolvedChange,
  onCancel,
  onConfirm,
}: CloseTicketModalProps) {
  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1728] p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-black">Chiudi intervento</h2>

        <textarea
          className={`mb-3 w-full ${inputClass}`}
          placeholder="Note chiusura intervento"
          value={closingNotes}
          onChange={(event) => onClosingNotesChange(event.target.value)}
        />

        <textarea
          className={`mb-3 w-full ${inputClass}`}
          placeholder="Necessità future / materiale da ordinare"
          value={futureNeeds}
          onChange={(event) => onFutureNeedsChange(event.target.value)}
        />

        <label className="mb-5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={resolved}
            onChange={(event) => onResolvedChange(event.target.checked)}
          />
          Intervento risolto
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-bold"
          >
            Annulla
          </button>

          <button
            onClick={() => onConfirm(ticketId)}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
          >
            Conferma chiusura
          </button>
        </div>
      </div>
    </div>
  );
}
