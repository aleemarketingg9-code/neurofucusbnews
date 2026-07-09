// Static reference data for the calorie counter. No camera/AI, no external
// lookups — just the "palm portion" method (a well-known rule-of-thumb for
// eyeballing portions) plus a short list of common foods with everyday kcal
// estimates. These are intentionally approximate: this is a lifestyle app,
// not a clinical food database.

export interface QuickFood {
  id: string;
  nombre: string;
  kcal: number;
  porcion: string;
  icon: string;
}

/** The four palm-portion buttons: tapping one adds its estimated kcal to today's log. */
export const PALM_PORTIONS: QuickFood[] = [
  { id: 'palma-proteina', nombre: 'Proteína', kcal: 150, porcion: '1 palma', icon: '🍗' },
  { id: 'puno-carbohidrato', nombre: 'Carbohidrato', kcal: 200, porcion: '1 puño', icon: '🍚' },
  { id: 'pulgar-grasa', nombre: 'Grasa', kcal: 100, porcion: '1 pulgar', icon: '🥑' },
  { id: 'mano-verduras', nombre: 'Verduras', kcal: 50, porcion: 'mano ahuecada', icon: '🥦' },
];

/** ~20-25 common everyday foods with approximate kcal per typical serving. */
export const QUICK_FOODS: QuickFood[] = [
  { id: 'arroz', nombre: 'Arroz blanco', kcal: 200, porcion: '1 taza cocido', icon: '🍚' },
  { id: 'pollo', nombre: 'Pechuga de pollo', kcal: 165, porcion: '100 g', icon: '🍗' },
  { id: 'huevo', nombre: 'Huevo', kcal: 78, porcion: '1 unidad', icon: '🥚' },
  { id: 'frijoles', nombre: 'Frijoles', kcal: 130, porcion: '1/2 taza', icon: '🫘' },
  { id: 'tortilla', nombre: 'Tortilla de maíz', kcal: 52, porcion: '1 unidad', icon: '🫓' },
  { id: 'aguacate', nombre: 'Aguacate', kcal: 160, porcion: '1/2 unidad', icon: '🥑' },
  { id: 'manzana', nombre: 'Manzana', kcal: 95, porcion: '1 unidad', icon: '🍎' },
  { id: 'platano', nombre: 'Plátano', kcal: 105, porcion: '1 unidad', icon: '🍌' },
  { id: 'leche', nombre: 'Leche', kcal: 120, porcion: '1 vaso (250 ml)', icon: '🥛' },
  { id: 'pan', nombre: 'Pan blanco', kcal: 80, porcion: '1 rebanada', icon: '🍞' },
  { id: 'queso', nombre: 'Queso', kcal: 110, porcion: '1 rebanada (30 g)', icon: '🧀' },
  { id: 'yogur', nombre: 'Yogur natural', kcal: 100, porcion: '1 taza', icon: '🥣' },
  { id: 'pasta', nombre: 'Pasta', kcal: 220, porcion: '1 taza cocida', icon: '🍝' },
  { id: 'papa', nombre: 'Papa', kcal: 160, porcion: '1 mediana', icon: '🥔' },
  { id: 'carne-res', nombre: 'Carne de res', kcal: 250, porcion: '100 g', icon: '🥩' },
  { id: 'pescado', nombre: 'Pescado', kcal: 140, porcion: '100 g', icon: '🐟' },
  { id: 'avena', nombre: 'Avena', kcal: 150, porcion: '1/2 taza cruda', icon: '🥣' },
  { id: 'nueces', nombre: 'Nueces / almendras', kcal: 170, porcion: '1 puñado (30 g)', icon: '🥜' },
  { id: 'aceite', nombre: 'Aceite (para cocinar)', kcal: 120, porcion: '1 cucharada', icon: '🫒' },
  { id: 'jugo', nombre: 'Jugo de fruta', kcal: 110, porcion: '1 vaso (250 ml)', icon: '🧃' },
  { id: 'refresco', nombre: 'Refresco', kcal: 140, porcion: '1 lata (355 ml)', icon: '🥤' },
  { id: 'pizza', nombre: 'Pizza', kcal: 285, porcion: '1 rebanada', icon: '🍕' },
  { id: 'ensalada', nombre: 'Ensalada con aderezo', kcal: 150, porcion: '1 plato', icon: '🥗' },
  { id: 'sopa', nombre: 'Sopa / caldo', kcal: 120, porcion: '1 taza', icon: '🍲' },
  { id: 'cafe-con-leche', nombre: 'Café con leche', kcal: 60, porcion: '1 taza', icon: '☕' },
];
