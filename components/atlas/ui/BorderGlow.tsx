"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type BorderGlowProps = {
  children?: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
  borderOnly?: boolean;
};

type HslParts = {
  h: number;
  s: number;
  l: number;
};

function parseHSL(hslStr: string): HslParts {
  const match = hslStr.match(/([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
  if (!match) return { h: 112, s: 100, l: 70 };

  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

function buildBoxShadow(glowColor: string, intensity: number): string {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;

  const layers: [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true],
    [0, 0, 1, 0, 60, true],
    [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true],
    [0, 0, 15, 0, 30, true],
    [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false],
    [0, 0, 3, 0, 50, false],
    [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false],
    [0, 0, 25, 2, 20, false],
    [0, 0, 50, 2, 10, false],
  ];

  return layers
    .map(([x, y, blur, spread, alpha, inset]) => {
      const a = Math.min(alpha * intensity, 100);
      return `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
    })
    .join(", ");
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number) {
  return x * x * x;
}

type AnimateOptions = {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (t: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
};

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateOptions) {
  if (typeof window === "undefined") return;

  const t0 = performance.now() + delay;
  let frameId = 0;

  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));

    if (t < 1) {
      frameId = requestAnimationFrame(tick);
    } else if (onEnd) {
      onEnd();
    }
  }

  const timeoutId = window.setTimeout(() => {
    frameId = requestAnimationFrame(tick);
  }, delay);

  return () => {
    window.clearTimeout(timeoutId);
    if (frameId) cancelAnimationFrame(frameId);
  };
}

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildMeshGradients(colors: string[]): string[] {
  const safeColors = colors.length ? colors : ["#7CFF67", "#06B6D4", "#C6A76F"];

  const gradients: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const color = safeColors[Math.min(COLOR_MAP[i], safeColors.length - 1)];
    gradients.push(`radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${color} 0px, transparent 50%)`);
  }

  gradients.push(`linear-gradient(${safeColors[0]} 0 100%)`);
  return gradients;
}

export default function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 18,
  glowColor = "112 100 70",
  backgroundColor = "rgba(3, 10, 20, 0.98)",
  borderRadius = 28,
  glowRadius = 24,
  glowIntensity = 0.65,
  coneSpread = 22,
  animated = false,
  colors = ["#7CFF67", "#06B6D4", "#C6A76F"],
  fillOpacity = 0.18,
  borderOnly = false,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorAngle, setCursorAngle] = useState(45);
  const [edgeProximity, setEdgeProximity] = useState(0);
  const [sweepActive, setSweepActive] = useState(false);

  const getCenterOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;

      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);

      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [getCenterOfElement],
  );

  const getCursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(el);
      const dx = x - cx;
      const dy = y - cy;

      if (dx === 0 && dy === 0) return 0;

      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    },
    [getCenterOfElement],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setEdgeProximity(getEdgeProximity(card, x, y));
      setCursorAngle(getCursorAngle(card, x, y));
    },
    [getEdgeProximity, getCursorAngle],
  );

  useEffect(() => {
    if (!animated) return;

    const cleanupFns: Array<(() => void) | undefined> = [];
    const angleStart = 110;
    const angleEnd = 465;

    setSweepActive(true);
    setCursorAngle(angleStart);

    cleanupFns.push(animateValue({ duration: 500, onUpdate: (value) => setEdgeProximity(value / 100) }));
    cleanupFns.push(
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: (value) => {
          setCursorAngle((angleEnd - angleStart) * (value / 100) + angleStart);
        },
      }),
    );
    cleanupFns.push(
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: (value) => {
          setCursorAngle((angleEnd - angleStart) * (value / 100) + angleStart);
        },
      }),
    );
    cleanupFns.push(
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (value) => setEdgeProximity(value / 100),
        onEnd: () => setSweepActive(false),
      }),
    );

    return () => {
      cleanupFns.forEach((cleanup) => cleanup?.());
    };
  }, [animated]);

  const colorSensitivity = edgeSensitivity + 20;
  const isVisible = isHovered || sweepActive;
  const borderOpacity = isVisible ? Math.max(0, (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity)) : 0;
  const glowOpacity = isVisible ? Math.max(0, (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity)) : 0;

  const meshGradients = buildMeshGradients(colors);
  const borderBg = meshGradients.map((gradient) => `${gradient} border-box`);
  const fillBg = meshGradients.map((gradient) => `${gradient} padding-box`);
  const angleDeg = `${cursorAngle.toFixed(3)}deg`;

  const rootClassName = borderOnly
    ? `relative rounded-[inherit] ${className}`
    : `relative isolate border border-white/15 ${className}`;

  const rootStyle = borderOnly
    ? {
        background: "transparent",
        borderRadius: `${borderRadius}px`,
        transform: "translate3d(0, 0, 0.01px)",
      }
    : {
        background: backgroundColor,
        borderRadius: `${borderRadius}px`,
        transform: "translate3d(0, 0, 0.01px)",
        boxShadow:
          "rgba(0,0,0,0.1) 0 1px 2px, rgba(0,0,0,0.1) 0 2px 4px, rgba(0,0,0,0.1) 0 4px 8px, rgba(0,0,0,0.1) 0 8px 16px, rgba(0,0,0,0.1) 0 16px 32px, rgba(0,0,0,0.1) 0 32px 64px",
      };

  const overlayZClass = borderOnly ? "z-[35]" : "-z-[1]";
  const outerGlowZClass = borderOnly ? "z-[36]" : "z-[1]";

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={rootClassName}
      style={rootStyle}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${overlayZClass} rounded-[inherit]`}
        style={{
          border: "1px solid transparent",
          background: [
            `linear-gradient(${backgroundColor} 0 100%) padding-box`,
            "linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box",
            ...borderBg,
          ].join(", "),
          opacity: borderOpacity,
          maskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${
            coneSpread + 15
          }%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${
            coneSpread + 15
          }%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          transition: isVisible ? "opacity 0.25s ease-out" : "opacity 0.75s ease-in-out",
        }}
      />

      {!borderOnly && fillOpacity > 0 && (
        <div
          className="absolute inset-0 -z-[1] rounded-[inherit]"
          style={
            {
              border: "1px solid transparent",
              background: fillBg.join(", "),
              maskImage: [
                "linear-gradient(to bottom, black, black)",
                "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
                "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
                `conic-gradient(from ${angleDeg} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
              ].join(", "),
              WebkitMaskImage: [
                "linear-gradient(to bottom, black, black)",
                "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
                "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
                "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
                `conic-gradient(from ${angleDeg} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
              ].join(", "),
              maskComposite: "subtract, add, add, add, add, add",
              WebkitMaskComposite: "source-out, source-over, source-over, source-over, source-over, source-over",
              opacity: borderOpacity * fillOpacity,
              mixBlendMode: "soft-light",
              transition: isVisible ? "opacity 0.25s ease-out" : "opacity 0.75s ease-in-out",
            } as React.CSSProperties
          }
        />
      )}

      <span
        className={`pointer-events-none absolute ${outerGlowZClass} rounded-[inherit]`}
        style={
          {
            inset: `${-glowRadius}px`,
            maskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
            WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
            opacity: glowOpacity,
            mixBlendMode: "plus-lighter",
            transition: isVisible ? "opacity 0.25s ease-out" : "opacity 0.75s ease-in-out",
          } as React.CSSProperties
        }
      >
        <span
          className="absolute rounded-[inherit]"
          style={{
            inset: `${glowRadius}px`,
            boxShadow: buildBoxShadow(glowColor, glowIntensity),
          }}
        />
      </span>

      <div className="relative z-[2] rounded-[inherit]">{children}</div>
    </div>
  );
}
