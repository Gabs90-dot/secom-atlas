"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { UserRound, X, ZoomIn } from "lucide-react";

type OperatorAvatarProps = {
  avatar?: string;
  displayName?: string;
  onUpload?: (file?: File | null) => void | Promise<void>;
};

type CropImage = {
  file: File;
  url: string;
  width: number;
  height: number;
};

const CROP_VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function getInitials(displayName?: string) {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBaseScale(image: CropImage) {
  return Math.max(
    CROP_VIEWPORT_SIZE / image.width,
    CROP_VIEWPORT_SIZE / image.height,
  );
}

function clampOffset(
  image: CropImage,
  zoom: number,
  offset: { x: number; y: number },
) {
  const scale = getBaseScale(image) * zoom;
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  const maxX = Math.max(0, (renderedWidth - CROP_VIEWPORT_SIZE) / 2);
  const maxY = Math.max(0, (renderedHeight - CROP_VIEWPORT_SIZE) / 2);

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

async function loadCropImage(file: File): Promise<CropImage> {
  const url = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };

        image.onerror = () => {
          reject(new Error("Impossibile leggere l'immagine selezionata."));
        };

        image.src = url;
      },
    );

    return {
      file,
      url,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function createCroppedFile(
  image: CropImage,
  zoom: number,
  offset: { x: number; y: number },
) {
  const scale = getBaseScale(image) * zoom;
  const sourceCropSize = CROP_VIEWPORT_SIZE / scale;

  const sourceX = clamp(
    image.width / 2 - offset.x / scale - sourceCropSize / 2,
    0,
    image.width - sourceCropSize,
  );

  const sourceY = clamp(
    image.height / 2 - offset.y / scale - sourceCropSize / 2,
    0,
    image.height - sourceCropSize,
  );

  const sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const loadedImage = new Image();

    loadedImage.onload = () => resolve(loadedImage);
    loadedImage.onerror = () =>
      reject(new Error("Impossibile elaborare l'immagine."));
    loadedImage.src = image.url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Ritaglio immagine non disponibile.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    sourceCropSize,
    sourceCropSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Impossibile salvare il ritaglio."));
        }
      },
      "image/jpeg",
      0.9,
    );
  });

  const cleanName =
    image.file.name.replace(/\.[^.]+$/, "").trim() || "avatar-profile";

  return new File([blob], `${cleanName}-cropped.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export default function OperatorAvatar({
  avatar = "",
  displayName = "",
  onUpload,
}: OperatorAvatarProps) {
  const initials = getInitials(displayName);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const easterEggClicksRef = useRef<number[]>([]);
  const uploadClickTimerRef = useRef<number | null>(null);

  const [cropImage, setCropImage] = useState<CropImage | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFarting, setIsFarting] = useState(false);

  useEffect(() => {
    return () => {
      if (cropImage?.url) {
        URL.revokeObjectURL(cropImage.url);
      }
    };
  }, [cropImage]);

  useEffect(() => {
    return () => {
      if (uploadClickTimerRef.current) {
        clearTimeout(uploadClickTimerRef.current);
      }
    };
  }, []);

  const renderedImageStyle = useMemo(() => {
    if (!cropImage) return undefined;

    const scale = getBaseScale(cropImage) * zoom;

    return {
      width: cropImage.width * scale,
      height: cropImage.height * scale,
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
    };
  }, [cropImage, offset.x, offset.y, zoom]);

  function handleAvatarClick() {
    if (uploadClickTimerRef.current) {
      clearTimeout(uploadClickTimerRef.current);
      uploadClickTimerRef.current = null;
    }

    const now = Date.now();
    easterEggClicksRef.current = [...easterEggClicksRef.current, now].filter(
      (clickTime) => now - clickTime < 2000,
    );

    if (easterEggClicksRef.current.length >= 5) {
      easterEggClicksRef.current = [];

      const audio = new Audio("/sounds/fart.mp3");
      audio.volume = 0.8;
      void audio.play().catch(() => undefined);

      setIsFarting(true);
      window.setTimeout(() => setIsFarting(false), 350);
      return;
    }

    uploadClickTimerRef.current = window.setTimeout(() => {
      easterEggClicksRef.current = [];
      uploadClickTimerRef.current = null;
      fileInputRef.current?.click();
    }, 450);
  }

  function closeCropper() {
    if (saving) return;

    setCropImage(null);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setError("");
    dragStartRef.current = null;
  }

  async function handleSelectedFile(file?: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine valido.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError("La foto supera il limite di 12 MB.");
      return;
    }

    setError("");

    try {
      const nextImage = await loadCropImage(file);
      setCropImage(nextImage);
      setZoom(MIN_ZOOM);
      setOffset({ x: 0, y: 0 });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile aprire la foto.",
      );
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropImage) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropImage || !dragStartRef.current) return;

    const nextOffset = {
      x:
        dragStartRef.current.offsetX +
        event.clientX -
        dragStartRef.current.pointerX,
      y:
        dragStartRef.current.offsetY +
        event.clientY -
        dragStartRef.current.pointerY,
    };

    setOffset(clampOffset(cropImage, zoom, nextOffset));
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
  }

  function handleZoomChange(nextZoom: number) {
    if (!cropImage) return;

    setZoom(nextZoom);
    setOffset((currentOffset) =>
      clampOffset(cropImage, nextZoom, currentOffset),
    );
  }

  async function saveCrop() {
    if (!cropImage || saving) return;

    setSaving(true);
    setError("");

    try {
      const croppedFile = await createCroppedFile(cropImage, zoom, offset);
      await onUpload?.(croppedFile);
      closeCropper();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile salvare la foto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        title="Cambia foto profilo"
        onClick={handleAvatarClick}
        className={`relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-amber-200/30 bg-amber-300/10 text-sm font-black text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.12)] transition-all hover:border-amber-200/60 hover:bg-amber-300/20 ${
          isFarting ? "animate-pulse" : ""
        }`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt="Foto profilo"
            className="h-full w-full object-cover"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <UserRound size={20} aria-hidden="true" />
        )}

      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleSelectedFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      {cropImage &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="atlas-avatar-crop-title"
          >
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#081523] p-5 text-white shadow-2xl md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                    Foto profilo
                  </p>
                  <h2
                    id="atlas-avatar-crop-title"
                    className="mt-1 text-2xl font-black"
                  >
                    Scegli il ritaglio
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Trascina la foto e regola lo zoom.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCropper}
                  disabled={saving}
                  className="rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                  aria-label="Chiudi ritaglio foto"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                className="relative mx-auto mt-6 h-[min(320px,78vw)] w-[min(320px,78vw)] touch-none cursor-grab overflow-hidden rounded-[2rem] bg-slate-950 active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
              >
                <img
                  src={cropImage.url}
                  alt="Anteprima ritaglio"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={renderedImageStyle}
                />

                <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-cyan-300/80 shadow-[inset_0_0_0_999px_rgba(2,8,20,0.34)]" />
                <div className="pointer-events-none absolute inset-[8%] rounded-full border border-white/35" />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <ZoomIn
                  size={18}
                  className="shrink-0 text-cyan-300"
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(event) =>
                    handleZoomChange(Number(event.target.value))
                  }
                  className="w-full accent-cyan-400"
                  aria-label="Zoom foto"
                />
                <span className="w-12 text-right text-xs font-black text-slate-400">
                  {zoom.toFixed(1)}×
                </span>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeCropper}
                  disabled={saving}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-50"
                >
                  Annulla
                </button>

                <button
                  type="button"
                  onClick={() => void saveCrop()}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvataggio..." : "Salva foto"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
