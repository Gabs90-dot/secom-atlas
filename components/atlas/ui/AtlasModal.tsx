import type { ReactNode } from "react";
import { X } from "lucide-react";
import { atlasDesign } from "@/lib/designSystem";

type AtlasModalProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidthClass?: string;
};

export default function AtlasModal({ open, eyebrow = "ATLAS", title, children, onClose, maxWidthClass = "max-w-3xl" }: AtlasModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-[2rem] border border-white/10 bg-[#081523] p-5 shadow-2xl md:p-7`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className={atlasDesign.typography.eyebrow}>{eyebrow}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
          </div>
          <button onClick={onClose} className={atlasDesign.button.ghost} aria-label="Chiudi">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
