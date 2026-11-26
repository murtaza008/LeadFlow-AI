/**
 * "Last seen" timestamp per workspace for the notifications bell, kept in
 * localStorage (a per-viewer convenience). Exposed as an external store so
 * components read it with useSyncExternalStore.
 */
const listeners = new Set<() => void>();
const key = (wsId: string) => `leadflow:notifications-seen:${wsId}`;

export function subscribeSeen(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key?.startsWith("leadflow:notifications-seen:") && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSeen(wsId: string): string {
  try {
    return localStorage.getItem(key(wsId)) ?? "";
  } catch {
    return "";
  }
}

export function setSeen(wsId: string, iso: string) {
  try {
    localStorage.setItem(key(wsId), iso);
  } catch {
    // Storage blocked (private mode): the badge just won't remember.
  }
  listeners.forEach((l) => l());
}
