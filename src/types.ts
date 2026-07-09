// Core domain types shared across the app.
// Keep these stable — both the local storage layer (phase 1) and the future
// Supabase-backed layer (phase 2) will speak this shape.

export type Sexo = 'femenino' | 'masculino' | 'otro';

export type Objetivo =
  | 'bajar_peso'
  | 'subir_peso'
  | 'mantener'
  | 'mejorar_sueno'
  | 'mejorar_energia';

export type NivelActividad = 'sedentario' | 'ligero' | 'moderado' | 'activo';

export interface Profile {
  edad: number;
  sexo: Sexo;
  alturaCm: number;
  pesoKg: number;
  objetivo: Objetivo;
  nivelActividad: NivelActividad;
  metaHorasSueno: number;
  restricciones: string;
  condiciones: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ComidasCalorias {
  desayuno?: number;
  comida?: number;
  cena?: number;
  snacks?: number;
}

export interface DailyLog {
  /** ISO date, YYYY-MM-DD, used as the unique key for the day. */
  fecha: string;
  horasSueno?: number;
  calidadSueno?: number; // 1-5
  caloriasConsumidas?: number;
  comidas?: ComidasCalorias;
  caloriasQuemadas?: number;
  minutosActividad?: number;
  tipoActividad?: string;
  pasos?: number;
  pesoKg?: number;
  animo?: number; // 1-5 estado de ánimo / energía
  actualizadoEn: string;
}

export const OBJETIVO_LABELS: Record<Objetivo, string> = {
  bajar_peso: 'Bajar de peso',
  subir_peso: 'Subir de peso',
  mantener: 'Mantener mi peso',
  mejorar_sueno: 'Mejorar mi sueño',
  mejorar_energia: 'Mejorar mi energía',
};

export const NIVEL_ACTIVIDAD_LABELS: Record<NivelActividad, string> = {
  sedentario: 'Sedentario (poco o nada de ejercicio)',
  ligero: 'Ligero (1-3 días/semana)',
  moderado: 'Moderado (3-5 días/semana)',
  activo: 'Activo (6-7 días/semana)',
};

export const SEXO_LABELS: Record<Sexo, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  otro: 'Otro',
};
