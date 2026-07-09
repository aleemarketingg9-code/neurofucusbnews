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

/**
 * Basal Metabolic Rate estimate (Mifflin-St Jeor).
 * Mifflin-St Jeor's formula takes a binary sex input; the profile's `sexo`
 * field also allows 'otro', which we map to the midpoint of the male/female
 * constant (+5 / -161) as the least-biased estimate we can offer without
 * more data.
 */
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

// Fixed kcal/day adjustment applied to TDEE based on the user's stated goal
// (not a percentage — a flat, gentle deficit/surplus).
const OBJETIVO_KCAL_ADJUSTMENT: Record<Objetivo, number> = {
  bajar_peso: -500,
  subir_peso: 400,
  mantener: 0,
  mejorar_sueno: 0,
  mejorar_energia: 0,
};

/** A rough daily calorie target adjusted for the user's stated goal. */
export function estimateCalorieGoal(profile: Profile): number {
  const tdee = estimateTDEE(profile);
  return Math.round(tdee + OBJETIVO_KCAL_ADJUSTMENT[profile.objetivo]);
}

/** The calorie limit actually shown/used: the user's manual override if set, otherwise the computed estimate. */
export function getCalorieLimit(profile: Profile): number {
  return profile.limiteCaloriasOverride ?? estimateCalorieGoal(profile);
}

// ---- BMI (IMC) ----

export type BmiCategory = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  bajo_peso: 'Bajo peso',
  normal: 'Peso normal',
  sobrepeso: 'Sobrepeso',
  obesidad: 'Obesidad',
};

// Gently worded, non-clinical notes — this is a wellness app, not a diagnosis.
export const BMI_CATEGORY_HINT: Record<BmiCategory, string> = {
  bajo_peso: 'Por debajo del rango típico. Sumar un poco más de energía a tus comidas puede ayudarte.',
  normal: 'Dentro del rango típico saludable para tu estatura.',
  sobrepeso: 'Un poco por encima del rango típico — pequeños ajustes constantes suelen ser lo más efectivo.',
  obesidad: 'Bastante por encima del rango típico. Ir paso a paso, sin prisa, es la mejor estrategia.',
};

export function computeBMI(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  if (alturaM <= 0) return 0;
  return pesoKg / (alturaM * alturaM);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'bajo_peso';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'sobrepeso';
  return 'obesidad';
}

/** Healthy-weight range (BMI 18.5–24.9) in kg for a given height, used as a suggested target when no explicit target weight is set. */
export function healthyWeightRangeKg(alturaCm: number): [number, number] {
  const alturaM = alturaCm / 100;
  const min = 18.5 * alturaM * alturaM;
  const max = 24.9 * alturaM * alturaM;
  return [round1(min), round1(max)];
}

// ---- Water ----

const ML_PER_GLASS = 250;

/** Suggested daily water goal in glasses (~35ml per kg of body weight, rounded to the nearest glass). */
export function suggestedWaterGoalGlasses(pesoKg: number): number {
  const totalMl = 35 * pesoKg;
  return Math.max(1, Math.round(totalMl / ML_PER_GLASS));
}

export function getWaterGoalGlasses(profile: Profile): number {
  return profile.metaAguaVasos ?? suggestedWaterGoalGlasses(profile.pesoKg);
}

// ---- Steps ----

export const DEFAULT_STEP_GOAL = 8000;

export function getStepGoal(profile: Profile): number {
  return profile.metaPasos ?? DEFAULT_STEP_GOAL;
}

// ---- Food log aggregation ----

export function totalFoodEntryKcal(log: DailyLog | null | undefined): number {
  if (!log) return 0;
  return (log.foodEntries ?? []).reduce((sum, e) => sum + e.kcal, 0);
}

/**
 * Effective calories consumed for a day: the new-style food log (palm
 * portions + quick-add entries) if it has any entries, otherwise the legacy
 * single manual number from before the food log existed.
 */
export function effectiveCaloriesConsumed(log: DailyLog | null | undefined): number | undefined {
  if (!log) return undefined;
  if ((log.foodEntries ?? []).length > 0) return totalFoodEntryKcal(log);
  return log.caloriasConsumidas;
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
