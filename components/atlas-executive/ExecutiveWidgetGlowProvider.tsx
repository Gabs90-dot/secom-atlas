"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ExecutiveWidgetGlowProviderProps = {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  secondaryGlowColor?: string;
  spotlightRadius?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceFromPointerToRect(clientX: number, clientY: number, rect: DOMRect) {
  const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
  const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
  return Math.hypot(dx, dy);
}

function updateCardGlow(card: HTMLElement, clientX: number, clientY: number, intensity: number, radius: number) {
  const rect = card.getBoundingClientRect();
  const relativeX = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  const relativeY = ((clientY - rect.top) / Math.max(rect.height, 1)) * 100;

  card.style.setProperty("--atlas-glow-x", `${relativeX}%`);
  card.style.setProperty("--atlas-glow-y", `${relativeY}%`);
  card.style.setProperty("--atlas-glow-intensity", intensity.toFixed(3));
  card.style.setProperty("--atlas-glow-radius", `${radius}px`);

  if (intensity > 0.02) {
    card.setAttribute("data-atlas-glow-active", "true");
  } else {
    card.removeAttribute("data-atlas-glow-active");
  }
}

export default function ExecutiveWidgetGlowProvider({
  children,
  className = "",
  glowColor = "132, 0, 255",
  secondaryGlowColor = "6, 182, 212",
  spotlightRadius = 430,
}: ExecutiveWidgetGlowProviderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = () => Array.from(root.querySelectorAll<HTMLElement>("[data-atlas-executive-glow-card]"));

    const resetCard = (card: HTMLElement) => {
      card.style.setProperty("--atlas-glow-intensity", "0");
      card.removeAttribute("data-atlas-glow-active");
    };

    const resetAll = () => {
      cards().forEach(resetCard);
      lastPointerRef.current = null;
    };

    const paint = () => {
      frameRef.current = null;
      const pointer = lastPointerRef.current;
      if (!pointer) return;

      const fadeStart = spotlightRadius * 0.36;
      const fadeEnd = spotlightRadius;

      cards().forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distance = distanceFromPointerToRect(pointer.x, pointer.y, rect);

        if (distance > fadeEnd) {
          resetCard(card);
          return;
        }

        const rawIntensity = distance <= fadeStart ? 1 : (fadeEnd - distance) / Math.max(fadeEnd - fadeStart, 1);
        const intensity = clamp(rawIntensity, 0, 1);
        updateCardGlow(card, pointer.x, pointer.y, intensity, spotlightRadius);
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-atlas-executive-glow-ignore]")) {
        resetAll();
        return;
      }
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(paint);
    };

    const handlePointerLeave = () => resetAll();

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      resetAll();
    };
  }, [spotlightRadius]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={
        {
          "--atlas-glow-primary": glowColor,
          "--atlas-glow-secondary": secondaryGlowColor,
        } as React.CSSProperties
      }
    >
      <style>
        {`
          .atlas-executive-glow-card {
            --atlas-glow-x: 50%;
            --atlas-glow-y: 50%;
            --atlas-glow-intensity: 0;
            --atlas-glow-radius: ${spotlightRadius}px;
            isolation: isolate;
          }

          .atlas-executive-glow-card::before,
          .atlas-executive-glow-card::after {
            content: "";
            position: absolute;
            border-radius: inherit;
            pointer-events: none;
            opacity: var(--atlas-glow-intensity);
            transition: opacity 220ms ease-out;
          }

          .atlas-executive-glow-card::before {
            inset: -1px;
            z-index: 1;
            padding: 1px;
            background:
              radial-gradient(
                var(--atlas-glow-radius) circle at var(--atlas-glow-x) var(--atlas-glow-y),
                rgba(var(--atlas-glow-primary), 0.95) 0%,
                rgba(var(--atlas-glow-secondary), 0.58) 18%,
                rgba(var(--atlas-glow-primary), 0.34) 32%,
                rgba(var(--atlas-glow-secondary), 0.14) 49%,
                transparent 67%
              );
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            mask-composite: exclude;
          }

          .atlas-executive-glow-card::after {
            inset: -18px;
            z-index: 0;
            background:
              radial-gradient(
                calc(var(--atlas-glow-radius) * 0.62) circle at var(--atlas-glow-x) var(--atlas-glow-y),
                rgba(var(--atlas-glow-primary), 0.16) 0%,
                rgba(var(--atlas-glow-secondary), 0.08) 28%,
                transparent 72%
              );
            filter: blur(14px);
          }

          .atlas-executive-glow-card > * {
            position: relative;
            z-index: 5;
          }

          @media (hover: none), (pointer: coarse) {
            .atlas-executive-glow-card::before,
            .atlas-executive-glow-card::after {
              display: none;
            }
          }
        `}
      </style>
      {children}
    </div>
  );
}
