// Single choke point for touching localStorage.
//
// Everything else in the app (dataService.ts) talks to this module instead of
// calling `localStorage` directly. Keys are versioned so we can migrate the
// shape later without clobbering existing user data, and every read has a
// sensible default so callers never have to null-check "nothing stored yet".
//
// Phase 2 (Supabase) will replace `dataService.ts` internals with remote
// calls; this file can stay as an offline cache/fallback or be retired, but
// nothing above it needs to change shape-wise.

const NAMESPACE = 'bienestar';
const VERSION = 'v1';

function buildKey(key: string): string {
  return `${NAMESPACE}:${VERSION}:${key}`;
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(buildKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] No se pudo leer "${key}", usando valor por defecto.`, err);
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(buildKey(key), JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] No se pudo guardar "${key}".`, err);
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(buildKey(key));
  } catch (err) {
    console.warn(`[storage] No se pudo borrar "${key}".`, err);
  }
}
