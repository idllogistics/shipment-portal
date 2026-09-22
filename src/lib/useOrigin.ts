import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return window.location.origin;
}

function getServerSnapshot() {
  return "";
}

// Reads window.location.origin without causing a hydration mismatch: the
// server snapshot is empty, and React reconciles to the real origin right
// after hydration without an extra effect+setState render.
export function useOrigin() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
