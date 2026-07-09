// Rule-based recommendation engine. Plain TypeScript, no AI/API calls.
//
// Each rule is a small object: a condition function and a message function,
// both reading from the same `Context`. Rules are checked in order, sorted
// by priority (lower = more important), deduplicated to one per category, and
// the top 2-4 are returned. Add a new rule by pushing to RULES — nothing else
// needs to change.
//
// These are lifestyle suggestions, not medical advice. If the profile notes a
// health condition, some rules soften their tone accordingly.

import type { DailyLog, Profile } from '../types';
import {
  average,
  daysSinceLastActivity,
  effectiveCaloriesConsumed,
  estimateBMR,
  getCalorieLimit,
  getStepGoal,
  getWaterGoalGlasses,
  sleepDebtHours,
} from './calculations';

export interface Recommendation {
  id: string;
  categoria: 'sueno' | 'nutricion' | 'actividad' | 'animo' | 'agua' | 'general' | 'positivo';
  mensaje: string;
}

export interface Context {
  profile: Profile;
  today: DailyLog | null;
  /** Logs from the last ~14 days, ascending by date, may include today. */
  recent: DailyLog[];
  dateKey: string;
  /** Effective daily calorie limit — the user's manual override if set, otherwise the computed estimate. */
  calorieLimit: number;
  bmr: number;
  waterGoal: number;
  stepGoal: number;
  sleepDebt: number;
  daysSinceActivity: number | null;
  avgSleepRecent: number | null;
  avgAnimoRecent: number | null;
  tieneCondicion: boolean;
}

export function buildContext(profile: Profile, recent: DailyLog[], dateKey: string): Context {
  const today = recent.find((l) => l.fecha === dateKey) ?? null;
  const last7 = recent.filter((l) => l.fecha <= dateKey).slice(-7);
  return {
    profile,
    today,
    recent,
    dateKey,
    calorieLimit: getCalorieLimit(profile),
    bmr: estimateBMR(profile),
    waterGoal: getWaterGoalGlasses(profile),
    stepGoal: getStepGoal(profile),
    sleepDebt: sleepDebtHours(last7, profile.metaHorasSueno),
    daysSinceActivity: daysSinceLastActivity(recent, dateKey),
    avgSleepRecent: average(last7.filter((l) => l.horasSueno != null).map((l) => l.horasSueno as number)),
    avgAnimoRecent: average(last7.filter((l) => l.animo != null).map((l) => l.animo as number)),
    tieneCondicion: profile.condiciones.trim().length > 0,
  };
}

interface Rule {
  id: string;
  categoria: Recommendation['categoria'];
  prioridad: number;
  condicion: (ctx: Context) => boolean;
  mensaje: (ctx: Context) => string;
}

const RULES: Rule[] = [
  {
    id: 'sin-registro-hoy',
    categoria: 'general',
    prioridad: 0,
    condicion: (ctx) => ctx.today === null,
    mensaje: () =>
      'Todavía no registraste tu día de hoy. Tómate un minuto en "Hoy" para anotarlo — así tus recomendaciones serán más precisas.',
  },
  {
    id: 'sueno-corto-hoy',
    categoria: 'sueno',
    prioridad: 1,
    condicion: (ctx) => (ctx.today?.horasSueno ?? 99) < 6,
    mensaje: (ctx) =>
      `Dormiste ${ctx.today?.horasSueno}h anoche, menos de lo ideal. Hoy elige una actividad más ligera, cuida la hidratación y suma algo de proteína en tus comidas. Intenta adelantar la hora de dormir esta noche.`,
  },
  {
    id: 'deficit-sueno-semanal',
    categoria: 'sueno',
    prioridad: 2,
    condicion: (ctx) => ctx.sleepDebt >= 5,
    mensaje: (ctx) =>
      `Esta semana acumulaste cerca de ${Math.round(ctx.sleepDebt)}h de déficit de sueño frente a tu meta. Si puedes, date hoy un día de recuperación: menos exigencia física y una siesta corta pueden ayudar.`,
  },
  {
    id: 'animo-bajo-y-poco-sueno',
    categoria: 'animo',
    prioridad: 2,
    condicion: (ctx) => (ctx.today?.animo ?? 99) <= 2 && (ctx.today?.horasSueno ?? 99) < 7,
    mensaje: () =>
      'Hoy tu energía está baja y dormiste menos de lo recomendable — suelen ir de la mano. Prioriza descansar esta noche y evita cafeína por la tarde.',
  },
  {
    id: 'calorias-muy-bajas-bmr',
    categoria: 'nutricion',
    prioridad: 2,
    condicion: (ctx) => {
      const consumed = effectiveCaloriesConsumed(ctx.today);
      return consumed != null && consumed > 0 && consumed < ctx.bmr * 0.6;
    },
    mensaje: (ctx) =>
      `Hoy registraste muy pocas calorías (~${Math.round(effectiveCaloriesConsumed(ctx.today) ?? 0).toLocaleString('es')} kcal), por debajo incluso de lo que tu cuerpo usa en reposo. Comer muy poco no acelera resultados — intenta sumar una comida balanceada más hoy.`,
  },
  {
    id: 'calorias-muy-altas',
    categoria: 'nutricion',
    prioridad: 3,
    condicion: (ctx) => {
      const consumed = effectiveCaloriesConsumed(ctx.today);
      return consumed != null && consumed > ctx.calorieLimit * 1.25;
    },
    mensaje: (ctx) =>
      `Hoy tus calorías consumidas quedaron bastante por encima de tu límite (~${ctx.calorieLimit.toLocaleString('es')} kcal). No pasa nada por un día así: mañana intenta comidas más ligeras y buena hidratación.`,
  },
  {
    id: 'calorias-muy-bajas',
    categoria: 'nutricion',
    prioridad: 3,
    condicion: (ctx) => {
      const consumed = effectiveCaloriesConsumed(ctx.today);
      return consumed != null && consumed < ctx.calorieLimit * 0.7;
    },
    mensaje: (ctx) =>
      `Hoy comiste bastante menos de lo estimado para ti (~${ctx.calorieLimit.toLocaleString('es')} kcal). Evita saltarte comidas — tu cuerpo necesita combustible constante para rendir bien.`,
  },
  {
    id: 'calorias-un-poco-sobre-limite',
    categoria: 'nutricion',
    prioridad: 4,
    condicion: (ctx) => {
      const consumed = effectiveCaloriesConsumed(ctx.today);
      return consumed != null && consumed > ctx.calorieLimit;
    },
    mensaje: () =>
      'Hoy comiste un poco más de lo planeado. No pasa nada — mañana es un nuevo día: prioriza vegetales y agua, y sigue adelante sin culpa.',
  },
  {
    id: 'agua-baja-tarde',
    categoria: 'agua',
    prioridad: 3,
    condicion: (ctx) => new Date().getHours() >= 17 && (ctx.today?.waterGlasses ?? 0) < ctx.waterGoal * 0.5,
    mensaje: (ctx) =>
      `Llevas ${ctx.today?.waterGlasses ?? 0} de ${ctx.waterGoal} vasos de agua hoy. Todavía estás a tiempo de sumar un par más antes de que termine el día.`,
  },
  {
    id: 'pasos-bajos-condicion',
    categoria: 'actividad',
    prioridad: 3,
    condicion: (ctx) => ctx.today?.pasos != null && ctx.today.pasos < ctx.stepGoal * 0.5 && ctx.tieneCondicion,
    mensaje: (ctx) =>
      `Hoy llevas ${(ctx.today?.pasos ?? 0).toLocaleString('es')} de ${ctx.stepGoal.toLocaleString('es')} pasos. Considerando lo que compartiste en tu perfil, una caminata corta y a tu ritmo ya suma bastante.`,
  },
  {
    id: 'pasos-bajos',
    categoria: 'actividad',
    prioridad: 3,
    condicion: (ctx) => ctx.today?.pasos != null && ctx.today.pasos < ctx.stepGoal * 0.5 && !ctx.tieneCondicion,
    mensaje: (ctx) =>
      `Vas en ${(ctx.today?.pasos ?? 0).toLocaleString('es')} de tu meta de ${ctx.stepGoal.toLocaleString('es')} pasos hoy. Una caminata de 15-20 minutos te puede acercar bastante.`,
  },
  {
    id: 'sin-actividad-varios-dias-con-condicion',
    categoria: 'actividad',
    prioridad: 2,
    condicion: (ctx) => (ctx.daysSinceActivity ?? 99) >= 3 && ctx.tieneCondicion,
    mensaje: () =>
      'Llevas varios días sin registrar movimiento. Considerando lo que anotaste en tu perfil, una caminata suave de 10-15 minutos es un buen punto de partida — sin forzar.',
  },
  {
    id: 'sin-actividad-varios-dias',
    categoria: 'actividad',
    prioridad: 2,
    condicion: (ctx) => (ctx.daysSinceActivity ?? 99) >= 3 && !ctx.tieneCondicion,
    mensaje: (ctx) =>
      `Llevas ${ctx.daysSinceActivity} días sin registrar actividad. Una caminata de 15-20 minutos ya cuenta — tu cuerpo lo va a agradecer.`,
  },
  {
    id: 'nunca-actividad',
    categoria: 'actividad',
    prioridad: 3,
    condicion: (ctx) => ctx.daysSinceActivity === null && ctx.recent.length >= 3,
    mensaje: () =>
      'Todavía no registraste actividad física esta semana. No necesitas nada intenso: una caminata corta o estirar 10 minutos ya suma.',
  },
  {
    id: 'buen-equilibrio',
    categoria: 'positivo',
    prioridad: 4,
    condicion: (ctx) => {
      const consumed = effectiveCaloriesConsumed(ctx.today);
      return (
        (ctx.avgSleepRecent ?? 0) >= ctx.profile.metaHorasSueno - 0.5 &&
        consumed != null &&
        Math.abs(consumed - ctx.calorieLimit) <= ctx.calorieLimit * 0.1
      );
    },
    mensaje: () =>
      'Vas muy bien: tu sueño y tu balance calórico de los últimos días están alineados con tus metas. ¡Sigue así!',
  },
  {
    id: 'racha-buen-sueno',
    categoria: 'positivo',
    prioridad: 4,
    condicion: (ctx) => (ctx.avgSleepRecent ?? 0) >= ctx.profile.metaHorasSueno,
    mensaje: (ctx) =>
      `Tu promedio de sueño reciente (${ctx.avgSleepRecent?.toFixed(1)}h) cumple tu meta. Un descanso consistente es una de las mejores inversiones para tu energía.`,
  },
  {
    id: 'general-seguimiento',
    categoria: 'general',
    prioridad: 5,
    condicion: (ctx) => ctx.recent.length < 3,
    mensaje: () =>
      'Sigue registrando tus días — con solo un par de datos más podremos darte recomendaciones bastante más afinadas.',
  },
];

export function getRecommendations(ctx: Context, max = 4): Recommendation[] {
  const matches = RULES.filter((r) => {
    try {
      return r.condicion(ctx);
    } catch {
      return false;
    }
  }).sort((a, b) => a.prioridad - b.prioridad);

  const seenCategorias = new Set<string>();
  const result: Recommendation[] = [];

  for (const rule of matches) {
    if (seenCategorias.has(rule.categoria)) continue;
    seenCategorias.add(rule.categoria);
    result.push({ id: rule.id, categoria: rule.categoria, mensaje: rule.mensaje(ctx) });
    if (result.length >= max) break;
  }

  if (result.length < 2) {
    result.push({
      id: 'animo-general',
      categoria: 'general',
      mensaje: 'Cada pequeño registro cuenta. Gracias por cuidarte hoy.',
    });
  }

  return result;
}
