"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_SHELL_QUERY = "(min-width: 1024px)";

function subscribeToDesktopShellChange(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia(DESKTOP_SHELL_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getDesktopShellSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_SHELL_QUERY).matches;
}

function getServerDesktopShellSnapshot() {
  return false;
}

export function useIsDesktopShell() {
  return useSyncExternalStore(
    subscribeToDesktopShellChange,
    getDesktopShellSnapshot,
    getServerDesktopShellSnapshot,
  );
}
