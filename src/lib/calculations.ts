// Plain-TypeScript helpers for estimates and aggregates used by the
// dashboard and the recommendation engine. Nothing here calls an API —
// these are simple, transparent formulas (Mifflin-St Jeor for BMR), not
// medical advice.

import type { DailyLog, NivelActividad, Objetivo, Profile } from '../types';

const ACTIVITY_MULTIPLIER: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
};

/** Basal Metabolic Rate estimate (Mifflin-St Jeor). */
export function estimateBMR(profile: Profile): number {
  const { pesoKg, alturaCm, edad, sexo } = profile;
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad;
  if (sexo === 'masculino') return base + 5;
  if (sexo === 'femenino') return base - 161;
  return base - 78; // 'otro' — midpoint approximation
}

/** Total Daily Energy Expenditure estimate. */
export function estimateTDEE(profile: Profile): number {
  return estimateBMR(profile) * ACTIVITY_MULTIPLIER[profile.nivelActividad];
}

const OBJETIVO_ADJUSTMENT: Record<Objetivo, number> = {
  bajar_peso: -0.15,
  subir_peso: 0.15,
  mantener: 0,
  mejorar_sueno: 0,
  mejorar_energia: 0,
};

/** A rough daily calorie target adjusted for the user's stated goal. */
export function estimateCalorieGoal(profile: Profile): number {
  const tdee = estimateTDEE(profile);
  const adj = OBJETIVO_ADJUSTMENT[profile.objetivo];
  return Math.round(tdee * (1 + adj));
}

export function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function sleepDebtHours(logs: DailyLog[], metaHorasSueno: number): number {
  const withSleep = logs.filter((l) => typeof l.horasSueno === 'number');
  if (withSleep.length === 0) return 0;
  return withSleep.reduce((total, l) => total + Math.max(0, metaHorasSueno - (l.horasSueno ?? 0)), 0);
}

export function daysSinceLastActivity(logs: DailyLog[], referenceDateKey: string): number | null {
  const withActivity = logs
    .filter((l) => (l.minutosActividad ?? 0) > 0 || (l.pasos ?? 0) >= 3000)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (withActivity.length === 0) return null;
  const last = withActivity[0].fecha;
  const diffMs = new Date(referenceDateKey).getTime() - new Date(last).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatKcal(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${Math.round(n).toLocaleString('es')} kcal`;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
