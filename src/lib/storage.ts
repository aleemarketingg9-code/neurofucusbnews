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
const VERSION = 'v2';
// Versions we know how to migrate forward from. Add the previous CURRENT here
// whenever VERSION is bumped again.
const PREVIOUS_VERSIONS = ['v1'];

function buildKey(key: string, version: string = VERSION): string {
  return `${NAMESPACE}:${version}:${key}`;
}

/**
 * v1 -> v2: added `foodEntries`/`waterGlasses` to DailyLog and
 * `pesoObjetivoKg`/`limiteCaloriasOverride`/`metaPasos`/`metaAguaVasos` to Profile.
 * All of these are optional fields, so the old records are structurally valid
 * as-is — this migration just copies them into the new namespace once so
 * `readJSON` finds them under the current version key, and callers can rely
 * on sensible defaults (0 / [] / undefined) for anything missing.
 */
function migrateIfNeeded(): void {
  try {
    const doneMarker = buildKey('__migrated_v2');
    if (window.localStorage.getItem(doneMarker)) return;

    for (const prevVersion of PREVIOUS_VERSIONS) {
      for (const key of ['profile', 'logs']) {
        const currentRaw = window.localStorage.getItem(buildKey(key));
        if (currentRaw !== null) continue; // already migrated or already has v2 data
        const oldRaw = window.localStorage.getItem(buildKey(key, prevVersion));
        if (oldRaw === null) continue;
        // Old data is copied as-is; new optional fields are simply absent,
        // which every reader already treats as "not set yet".
        window.localStorage.setItem(buildKey(key), oldRaw);
      }
    }
    window.localStorage.setItem(doneMarker, '1');
  } catch (err) {
    console.warn('[storage] Migración a v2 falló, se continuará sin datos previos.', err);
  }
}

migrateIfNeeded();

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
