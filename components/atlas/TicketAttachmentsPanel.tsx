"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TicketAttachment = {
  id: string;
  ticket_id: string;
  filename: string;
  file_path: string;
  file_url: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  uploaded_by?: string | null;
  created_at?: string | null;
};

type TicketAttachmentsPanelProps = {
  ticketId: string | number;
  title?: string;
};

function formatFileSize(value?: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeFileName(value: string) {
  return String(value || "allegato")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

export default function TicketAttachmentsPanel({
  ticketId,
  title = "Allegati ticket",
}: TicketAttachmentsPanelProps) {
  const normalizedTicketId = String(ticketId || "").trim();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const canUsePanel = useMemo(() => normalizedTicketId.length > 0, [normalizedTicketId]);

  async function loadAttachments() {
    if (!canUsePanel) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("ticket_attachments")
      .select("id, ticket_id, filename, file_path, file_url, mime_type, size_bytes, uploaded_by, created_at")
      .eq("ticket_id", normalizedTicketId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Errore caricamento allegati:", error);
      setMessage("Errore caricamento allegati.");
      setAttachments([]);
      setLoading(false);
      return;
    }

    setAttachments((data || []) as TicketAttachment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAttachments();
  }, [normalizedTicketId]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !canUsePanel) return;

    setUploading(true);
    setMessage("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || "Operatore ATLAS";

      for (const file of Array.from(files)) {
        const safeName = sanitizeFileName(file.name);
        const filePath = `${normalizedTicketId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("ticket-attachments")
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase.from("ticket_attachments").insert({
          ticket_id: normalizedTicketId,
          filename: file.name,
          file_path: filePath,
          file_url: publicData.publicUrl,
          mime_type: file.type || null,
          size_bytes: file.size || null,
          uploaded_by: userEmail,
        });

        if (insertError) throw insertError;
      }

      await loadAttachments();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.log("Errore upload allegati:", error);
      setMessage(error?.message || "Errore upload allegato.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachment: TicketAttachment) {
    const ok = window.confirm(`Eliminare l'allegato "${attachment.filename}"?`);
    if (!ok) return;

    setDeletingId(attachment.id);
    setMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from("ticket-attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("ticket_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    } catch (error: any) {
      console.log("Errore eliminazione allegato:", error);
      setMessage(error?.message || "Errore eliminazione allegato.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-slate-300">
            <Paperclip size={17} />
            {title}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Foto, PDF, screenshot, verbali o documenti collegati al ticket.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => uploadFiles(event.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Carico..." : "Carica allegato"}
          </button>
          <button
            type="button"
            onClick={loadAttachments}
            disabled={loading || uploading}
            className="rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aggiorna
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-100">
          {message}
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm font-bold text-slate-400">
            Caricamento allegati...
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/25 p-4 text-sm font-bold text-slate-500">
            Nessun allegato presente.
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 break-words text-sm font-black text-white">
                  <FileText size={16} className="shrink-0 text-blue-300" />
                  {attachment.filename}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatFileSize(attachment.size_bytes)} · {attachment.uploaded_by || "Operatore"} · {formatDateTime(attachment.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500"
                >
                  <ExternalLink size={14} />
                  Apri
                </a>
                <a
                  href={attachment.file_url}
                  download={attachment.filename}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => deleteAttachment(attachment)}
                  disabled={deletingId === attachment.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === attachment.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
