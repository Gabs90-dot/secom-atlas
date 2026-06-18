"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

function useAnimationFrame(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frameId = 0;
    const loop = () => {
      callbackRef.current();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);
}

function useMousePositionRef(containerRef: { current: HTMLElement | null }) {
  const positionRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const updatePosition = (x: number, y: number) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = { x: x - rect.left, y: y - rect.top };
      } else {
        positionRef.current = { x, y };
      }
    };

    const handleMouseMove = (event: MouseEvent) => updatePosition(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

type VariableProximityProps = HTMLAttributes<HTMLSpanElement> & {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: { current: HTMLElement | null };
  radius?: number;
  falloff?: "linear" | "exponential" | "gaussian";
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
};

const VariableProximity = forwardRef<HTMLSpanElement, VariableProximityProps>(
  (
    {
      label,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 120,
      falloff = "gaussian",
      className = "",
      onClick,
      style,
      ...restProps
    },
    ref,
  ) => {
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const interpolatedSettingsRef = useRef<string[]>([]);
    const mousePositionRef = useMousePositionRef(containerRef);
    const lastPositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    const parsedSettings = useMemo(() => {
      const parseSettings = (settings: string) =>
        new Map(
          settings
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const [name, value] = part.split(/\s+/);
              return [name.replace(/["']/g, ""), Number.parseFloat(value)] as const;
            })
            .filter(([, value]) => Number.isFinite(value)),
        );

      const fromSettings = parseSettings(fromFontVariationSettings);
      const toSettings = parseSettings(toFontVariationSettings);

      return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
        axis,
        fromValue,
        toValue: toSettings.get(axis) ?? fromValue,
      }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    function calculateFalloff(distance: number) {
      const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
      if (falloff === "exponential") return norm ** 2;
      if (falloff === "gaussian") return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      return norm;
    }

    useAnimationFrame(() => {
      if (!containerRef.current) return;

      const { x, y } = mousePositionRef.current;
      if (lastPositionRef.current.x === x && lastPositionRef.current.y === y) return;
      lastPositionRef.current = { x, y };

      const containerRect = containerRef.current.getBoundingClientRect();

      letterRefs.current.forEach((letterRef, index) => {
        if (!letterRef) return;

        const rect = letterRef.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
        const letterCenterY = rect.top + rect.height / 2 - containerRect.top;
        const distance = Math.hypot(x - letterCenterX, y - letterCenterY);

        const weightAxis = parsedSettings.find((setting) => setting.axis === "wght");

        if (distance >= radius) {
          letterRef.style.fontVariationSettings = fromFontVariationSettings;
          letterRef.style.fontWeight = weightAxis ? String(Math.round(weightAxis.fromValue)) : "650";
          letterRef.style.transform = "translateY(0) scale(1)";
          letterRef.style.textShadow = "0 0 14px rgba(34,211,238,0.06)";
          return;
        }

        const falloffValue = calculateFalloff(distance);
        const newSettings = parsedSettings
          .map(({ axis, fromValue, toValue }) => {
            const value = fromValue + (toValue - fromValue) * falloffValue;
            return `'${axis}' ${value}`;
          })
          .join(", ");

        interpolatedSettingsRef.current[index] = newSettings;
        letterRef.style.fontVariationSettings = newSettings;
        if (weightAxis) {
          const weight = weightAxis.fromValue + (weightAxis.toValue - weightAxis.fromValue) * falloffValue;
          letterRef.style.fontWeight = String(Math.round(weight));
        }
        letterRef.style.transform = `translateY(${-falloffValue * 1.5}px) scale(${1 + falloffValue * 0.025})`;
        letterRef.style.textShadow = `0 0 ${Math.round(8 + falloffValue * 14)}px rgba(34,211,238,${0.08 + falloffValue * 0.18})`;
      });
    });

    const words = label.split(" ");
    let letterIndex = 0;

    return (
      <span
        ref={ref}
        onClick={onClick}
        style={{
          display: "inline",
          fontFamily: "inherit",
          ...style,
        }}
        className={className}
        {...restProps}
      >
        {words.map((word, wordIndex) => (
          <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
            {word.split("").map((letter) => {
              const currentLetterIndex = letterIndex;
              letterIndex += 1;
              return (
                <span
                  key={currentLetterIndex}
                  ref={(element) => {
                    letterRefs.current[currentLetterIndex] = element;
                  }}
                  style={{
                    display: "inline-block",
                    fontVariationSettings: interpolatedSettingsRef.current[currentLetterIndex] || fromFontVariationSettings,
                    transition: "transform 120ms ease-out, text-shadow 120ms ease-out",
                    willChange: "font-variation-settings, transform",
                  }}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              );
            })}
            {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
        <span className="sr-only">{label}</span>
      </span>
    );
  },
);

VariableProximity.displayName = "VariableProximity";

export default VariableProximity;
