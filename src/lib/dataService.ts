// Domain-level data access. This is the abstraction the rest of the app
// depends on — screens never import storage.ts directly.
//
// Every method returns a Promise on purpose, even though phase 1 resolves
// synchronously from localStorage: it means swapping this module's internals
// for Supabase calls in phase 2 requires no changes to any caller.

import { readJSON, writeJSON, removeKey } from './storage';
import type { DailyLog, FoodEntry, Profile } from '../types';

const PROFILE_KEY = 'profile';
const LOGS_KEY = 'logs';

type LogsByDate = Record<string, DailyLog>;

function nowISO(): string {
  return new Date().toISOString();
}

// Defensive defaults applied on every read, on top of the one-time storage
// migration (storage.ts). This means even a record that somehow skipped the
// migration (or was written by an older cached build) still loads with safe
// values instead of throwing when new code reaches for `.foodEntries.length`
// or similar on an old record. Profile's new fields (pesoObjetivoKg,
// limiteCaloriasOverride, metaPasos, metaAguaVasos) are all optional and read
// through fallback helpers in calculations.ts, so no normalization is needed
// there.
function normalizeLog(log: DailyLog): DailyLog {
  return {
    ...log,
    waterGlasses: log.waterGlasses ?? 0,
    foodEntries: log.foodEntries ?? [],
  };
}

export const dataService = {
  // ---- Profile ----

  async getProfile(): Promise<Profile | null> {
    return readJSON<Profile | null>(PROFILE_KEY, null);
  },

  async saveProfile(profile: Omit<Profile, 'creadoEn' | 'actualizadoEn'> & { creadoEn?: string }): Promise<Profile> {
    const existing = readJSON<Profile | null>(PROFILE_KEY, null);
    const full: Profile = {
      ...profile,
      creadoEn: existing?.creadoEn ?? profile.creadoEn ?? nowISO(),
      actualizadoEn: nowISO(),
    };
    writeJSON(PROFILE_KEY, full);
    return full;
  },

  async clearProfile(): Promise<void> {
    removeKey(PROFILE_KEY);
  },

  // ---- Daily logs ----

  async getAllLogs(): Promise<DailyLog[]> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    return Object.values(map)
      .map(normalizeLog)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  async getLogByDate(fecha: string): Promise<DailyLog | null> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const log = map[fecha];
    return log ? normalizeLog(log) : null;
  },

  async upsertLog(entry: Partial<DailyLog> & { fecha: string }): Promise<DailyLog> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const existing = map[entry.fecha];
    const merged: DailyLog = normalizeLog({
      ...existing,
      ...entry,
      comidas: { ...existing?.comidas, ...entry.comidas },
      fecha: entry.fecha,
      actualizadoEn: nowISO(),
    });
    map[entry.fecha] = merged;
    writeJSON(LOGS_KEY, map);
    return merged;
  },

  async deleteLog(fecha: string): Promise<void> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    delete map[fecha];
    writeJSON(LOGS_KEY, map);
  },

  async getRecentLogs(days: number, referenceDate = new Date()): Promise<DailyLog[]> {
    const all = await this.getAllLogs();
    const cutoff = new Date(referenceDate);
    cutoff.setDate(cutoff.getDate() - days + 1);
    const cutoffStr = toDateKey(cutoff);
    return all.filter((log) => log.fecha >= cutoffStr);
  },

  // ---- Food log (palm-portion + quick-add entries) ----

  async addFoodEntry(fecha: string, item: Omit<FoodEntry, 'id'>): Promise<DailyLog> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const existing = normalizeLog(map[fecha] ?? { fecha, actualizadoEn: nowISO() });
    const entry: FoodEntry = { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const merged: DailyLog = {
      ...existing,
      foodEntries: [...(existing.foodEntries ?? []), entry],
      actualizadoEn: nowISO(),
    };
    map[fecha] = merged;
    writeJSON(LOGS_KEY, map);
    return merged;
  },

  async removeFoodEntry(fecha: string, entryId: string): Promise<DailyLog> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const existing = normalizeLog(map[fecha] ?? { fecha, actualizadoEn: nowISO() });
    const merged: DailyLog = {
      ...existing,
      foodEntries: (existing.foodEntries ?? []).filter((e) => e.id !== entryId),
      actualizadoEn: nowISO(),
    };
    map[fecha] = merged;
    writeJSON(LOGS_KEY, map);
    return merged;
  },

  // ---- Water ----

  async setWaterGlasses(fecha: string, glasses: number): Promise<DailyLog> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const existing = normalizeLog(map[fecha] ?? { fecha, actualizadoEn: nowISO() });
    const merged: DailyLog = {
      ...existing,
      waterGlasses: Math.max(0, glasses),
      actualizadoEn: nowISO(),
    };
    map[fecha] = merged;
    writeJSON(LOGS_KEY, map);
    return merged;
  },
};

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}
