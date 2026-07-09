// Domain-level data access. This is the abstraction the rest of the app
// depends on — screens never import storage.ts directly.
//
// Every method returns a Promise on purpose, even though phase 1 resolves
// synchronously from localStorage: it means swapping this module's internals
// for Supabase calls in phase 2 requires no changes to any caller.

import { readJSON, writeJSON, removeKey } from './storage';
import type { DailyLog, Profile } from '../types';

const PROFILE_KEY = 'profile';
const LOGS_KEY = 'logs';

type LogsByDate = Record<string, DailyLog>;

function nowISO(): string {
  return new Date().toISOString();
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
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  async getLogByDate(fecha: string): Promise<DailyLog | null> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    return map[fecha] ?? null;
  },

  async upsertLog(entry: Partial<DailyLog> & { fecha: string }): Promise<DailyLog> {
    const map = readJSON<LogsByDate>(LOGS_KEY, {});
    const existing = map[entry.fecha];
    const merged: DailyLog = {
      ...existing,
      ...entry,
      comidas: { ...existing?.comidas, ...entry.comidas },
      fecha: entry.fecha,
      actualizadoEn: nowISO(),
    };
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
