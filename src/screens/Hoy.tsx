import { useEffect, useMemo, useState } from 'react';
import { Card, SectionTitle } from '../components/Card';
import { Collapsible } from '../components/Collapsible';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressRing } from '../components/ProgressRing';
import { FieldLabel, RatingStars, SliderField, TextInput } from '../components/FormControls';
import {
  getCalorieLimit,
  getStepGoal,
  getWaterGoalGlasses,
} from '../lib/calculations';
import { dataService, todayKey } from '../lib/dataService';
import { PALM_PORTIONS, QUICK_FOODS } from '../lib/food';
import { buildContext, getRecommendations, type Recommendation } from '../lib/recommendations';
import { useProfile } from '../lib/useProfile';
import type { DailyLog, FoodEntry } from '../types';

const CATEGORIA_ICON: Record<Recommendation['categoria'], string> = {
  sueno: '😴',
  nutricion: '🥗',
  actividad: '🚶',
  animo: '💛',
  agua: '💧',
  general: '📝',
  positivo: '✨',
};

function emptyForm() {
  return {
    horasSueno: 7,
    calidadSueno: 0,
    caloriasConsumidas: '' as number | '',
    minutosActividad: '' as number | '',
    tipoActividad: '',
    pasos: '' as number | '',
    pesoKg: '' as number | '',
    animo: 0,
  };
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HoyScreen() {
  const { profile, loading: loadingProfile, saveProfile } = useProfile();
  const [form, setForm] = useState(emptyForm());
  const [recent, setRecent] = useState<DailyLog[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [foodQuery, setFoodQuery] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [loadingLog, setLoadingLog] = useState(true);
  const [saved, setSaved] = useState(false);
  const dateKey = todayKey();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [today, logs] = await Promise.all([dataService.getLogByDate(dateKey), dataService.getRecentLogs(14)]);
      if (cancelled) return;
      if (today) {
        setForm({
          horasSueno: today.horasSueno ?? 7,
          calidadSueno: today.calidadSueno ?? 0,
          caloriasConsumidas: today.caloriasConsumidas ?? '',
          minutosActividad: today.minutosActividad ?? '',
          tipoActividad: today.tipoActividad ?? '',
          pasos: today.pasos ?? '',
          pesoKg: today.pesoKg ?? '',
          animo: today.animo ?? 0,
        });
        setFoodEntries(today.foodEntries ?? []);
        setWaterGlasses(today.waterGlasses ?? 0);
      }
      setRecent(logs);
      setLoadingLog(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  function update<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: Partial<DailyLog> & { fecha: string } = {
      fecha: dateKey,
      horasSueno: form.horasSueno,
      calidadSueno: form.calidadSueno || undefined,
      caloriasConsumidas: form.caloriasConsumidas === '' ? undefined : Number(form.caloriasConsumidas),
      minutosActividad: form.minutosActividad === '' ? undefined : Number(form.minutosActividad),
      tipoActividad: form.tipoActividad || undefined,
      pasos: form.pasos === '' ? undefined : Number(form.pasos),
      pesoKg: form.pesoKg === '' ? undefined : Number(form.pesoKg),
      animo: form.animo || undefined,
    };
    const savedLog = await dataService.upsertLog(entry);
    setRecent((prev) => {
      const others = prev.filter((l) => l.fecha !== dateKey);
      return [...others, savedLog].sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
    setSaved(true);
  }

  async function addFood(item: { nombre: string; kcal: number }) {
    const log = await dataService.addFoodEntry(dateKey, { nombre: item.nombre, kcal: item.kcal, hora: nowHHMM() });
    setFoodEntries(log.foodEntries ?? []);
    syncRecent(log);
  }

  async function removeFood(id: string) {
    const log = await dataService.removeFoodEntry(dateKey, id);
    setFoodEntries(log.foodEntries ?? []);
    syncRecent(log);
  }

  async function changeWater(delta: number) {
    const next = Math.max(0, waterGlasses + delta);
    setWaterGlasses(next);
    const log = await dataService.setWaterGlasses(dateKey, next);
    syncRecent(log);
  }

  function syncRecent(log: DailyLog) {
    setRecent((prev) => {
      const others = prev.filter((l) => l.fecha !== dateKey);
      return [...others, log].sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
  }

  async function saveLimitOverride(value: number | undefined) {
    if (!profile) return;
    const { creadoEn, actualizadoEn, ...rest } = profile;
    void creadoEn;
    void actualizadoEn;
    await saveProfile({ ...rest, limiteCaloriasOverride: value });
    setEditingLimit(false);
  }

  const recommendations = useMemo(() => {
    if (!profile) return [];
    const ctx = buildContext(profile, recent, dateKey);
    return getRecommendations(ctx);
  }, [profile, recent, dateKey]);

  const todayLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  const calorieLimit = profile ? getCalorieLimit(profile) : null;
  const foodEntriesSum = foodEntries.reduce((sum, e) => sum + e.kcal, 0);
  const hasLegacyOnly = foodEntries.length === 0 && form.caloriasConsumidas !== '';
  const consumedToday = foodEntries.length > 0 ? foodEntriesSum : hasLegacyOnly ? Number(form.caloriasConsumidas) : 0;
  const remaining = calorieLimit != null ? calorieLimit - consumedToday : null;

  const waterGoal = profile ? getWaterGoalGlasses(profile) : 8;
  const stepGoal = profile ? getStepGoal(profile) : 8000;
  const stepsToday = form.pasos === '' ? 0 : Number(form.pasos);

  const filteredFoods = useMemo(() => {
    const q = foodQuery.trim().toLowerCase();
    if (!q) return QUICK_FOODS;
    return QUICK_FOODS.filter((f) => f.nombre.toLowerCase().includes(q));
  }, [foodQuery]);

  if (loadingProfile || loadingLog) {
    return <div className="px-4 pt-10 text-center" style={{ color: 'var(--color-ink-muted)' }}>Cargando...</div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-semibold capitalize" style={{ color: 'var(--color-ink)' }}>
        Hoy
      </h1>
      <p className="text-sm mb-4 capitalize" style={{ color: 'var(--color-ink-secondary)' }}>
        {todayLabel}
      </p>

      <Card className="mb-4">
        <SectionTitle>Recomendaciones para ti</SectionTitle>
        {recommendations.length === 0 ? (
          <EmptyState icon="🙂" title="Todo tranquilo por ahora" subtitle="Registra tu día para recibir sugerencias." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex gap-2.5 rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
                <span className="text-xl leading-none">{CATEGORIA_ICON[rec.categoria]}</span>
                <span className="text-sm leading-snug" style={{ color: 'var(--color-ink)' }}>
                  {rec.mensaje}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {/* ---- Sueño (form, saved with the button below) ---- */}
        <Collapsible
          title="Sueño"
          icon="😴"
          defaultOpen
          summary={`${form.horasSueno}h${form.calidadSueno ? ` · ★${form.calidadSueno}` : ''}`}
        >
          <FieldLabel>Horas dormidas anoche</FieldLabel>
          <SliderField value={form.horasSueno} onChange={(v) => update('horasSueno', v)} min={0} max={12} step={0.5} unit="h" />
          <div className="mt-4">
            <FieldLabel>Calidad del sueño</FieldLabel>
            <RatingStars value={form.calidadSueno} onChange={(v) => update('calidadSueno', v)} />
          </div>
        </Collapsible>

        {/* ---- Comida: calorie limit + palm portions + quick add + entry list ---- */}
        <Collapsible
          title="Comida"
          icon="🍽️"
          summary={calorieLimit != null ? `${consumedToday}/${calorieLimit} kcal` : undefined}
        >
          {calorieLimit != null && (
            <div className="mb-4 rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  Tu límite de calorías sugerido hoy
                </span>
                {!editingLimit && (
                  <button
                    type="button"
                    aria-label="Editar límite de calorías"
                    className="text-xs underline shrink-0"
                    style={{ color: 'var(--series-cal-in)' }}
                    onClick={() => {
                      setLimitInput(String(calorieLimit));
                      setEditingLimit(true);
                    }}
                  >
                    ✏️ editar
                  </button>
                )}
              </div>
              {editingLimit ? (
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white shrink-0"
                    style={{ background: 'var(--series-cal-in)' }}
                    onClick={() => saveLimitOverride(limitInput === '' ? undefined : Number(limitInput))}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm shrink-0"
                    style={{ color: 'var(--color-ink-muted)' }}
                    onClick={() => setEditingLimit(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-semibold" style={{ color: 'var(--series-cal-in)' }}>
                    {calorieLimit.toLocaleString('es')} <span className="text-base font-normal" style={{ color: 'var(--color-ink-muted)' }}>kcal</span>
                  </span>
                  {profile?.limiteCaloriasOverride != null && (
                    <button
                      type="button"
                      className="block text-xs underline mt-0.5"
                      style={{ color: 'var(--color-ink-muted)' }}
                      onClick={() => saveLimitOverride(undefined)}
                    >
                      usar cálculo automático
                    </button>
                  )}
                </>
              )}
              <div className="mt-2">
                <ProgressBar value={consumedToday} max={calorieLimit} color="var(--series-cal-in)" />
                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-secondary)' }}>
                  {remaining != null && remaining >= 0
                    ? `Te quedan ${remaining.toLocaleString('es')} kcal hoy`
                    : `${Math.abs(remaining ?? 0).toLocaleString('es')} kcal sobre tu límite — no pasa nada, mañana ajustas`}
                </p>
              </div>
            </div>
          )}

          <FieldLabel hint="Toca una opción para agregarla a tu registro de hoy.">Porción de mano</FieldLabel>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {PALM_PORTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addFood(p)}
                className="rounded-xl border p-3 text-left active:scale-95 transition-transform min-h-[64px]"
                style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--series-cal-in)' }}>
                    +{p.kcal}
                  </span>
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: 'var(--color-ink)' }}>
                  {p.nombre}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                  {p.porcion}
                </div>
              </button>
            ))}
          </div>

          <FieldLabel>Agregar alimento común</FieldLabel>
          <TextInput
            type="text"
            placeholder="Buscar: arroz, pollo, manzana..."
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto mt-2 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            {filteredFoods.length === 0 ? (
              <p className="text-sm p-3" style={{ color: 'var(--color-ink-muted)' }}>
                No encontramos ese alimento en la lista rápida.
              </p>
            ) : (
              filteredFoods.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addFood(f)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b last:border-b-0 active:opacity-70"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span className="text-lg">{f.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                      {f.nombre}
                    </span>
                    <span className="block text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                      {f.porcion}
                    </span>
                  </span>
                  <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--series-cal-in)' }}>
                    +{f.kcal}
                  </span>
                </button>
              ))
            )}
          </div>

          {foodEntries.length > 0 && (
            <div className="mt-4">
              <FieldLabel>Registrado hoy</FieldLabel>
              <ul className="flex flex-col gap-1.5">
                {foodEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-ink)' }}>
                      {entry.nombre}
                      <span className="ml-1.5 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        {entry.hora}
                      </span>
                    </span>
                    <span className="text-sm font-medium shrink-0" style={{ color: 'var(--series-cal-in)' }}>
                      {entry.kcal} kcal
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar ${entry.nombre}`}
                      className="w-8 h-8 shrink-0 rounded-full text-base flex items-center justify-center active:opacity-70"
                      style={{ color: 'var(--color-ink-muted)' }}
                      onClick={() => removeFood(entry.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {foodEntries.length === 0 && (
            <div className="mt-4">
              <FieldLabel hint="Registro simple de antes de esta actualización. Los nuevos alimentos que agregues arriba se llevarán por separado.">
                Registro anterior (opcional)
              </FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="Ej: 1800"
                value={form.caloriasConsumidas}
                onChange={(e) => update('caloriasConsumidas', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          )}
        </Collapsible>

        {/* ---- Agua ---- */}
        <Collapsible title="Agua" icon="💧" summary={`${waterGlasses}/${waterGoal} vasos`}>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Quitar un vaso"
              onClick={() => changeWater(-1)}
              disabled={waterGlasses <= 0}
              className="w-14 h-14 rounded-2xl text-2xl font-semibold border active:scale-95 transition-transform disabled:opacity-40"
              style={{ borderColor: 'var(--color-border)', color: 'var(--series-water)' }}
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-semibold" style={{ color: 'var(--series-water)' }}>
                {waterGlasses}
              </span>
              <span className="text-base" style={{ color: 'var(--color-ink-muted)' }}> / {waterGoal} vasos</span>
            </div>
            <button
              type="button"
              aria-label="Agregar un vaso"
              onClick={() => changeWater(1)}
              className="w-14 h-14 rounded-2xl text-2xl font-semibold text-white active:scale-95 transition-transform"
              style={{ background: 'var(--series-water)' }}
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {Array.from({ length: Math.max(waterGoal, waterGlasses) }).map((_, i) => (
              <span
                key={i}
                className="text-xl leading-none"
                style={{ opacity: i < waterGlasses ? 1 : 0.25 }}
                aria-hidden="true"
              >
                🥛
              </span>
            ))}
          </div>
        </Collapsible>

        {/* ---- Actividad y pasos ---- */}
        <Collapsible
          title="Actividad y pasos"
          icon="🚶"
          summary={`${stepsToday.toLocaleString('es')}/${stepGoal.toLocaleString('es')} pasos`}
        >
          <div className="flex items-center gap-4 mb-4">
            <ProgressRing
              value={stepsToday}
              goal={stepGoal}
              color="var(--series-steps)"
              label="pasos"
              size={92}
              displayValue={stepsToday.toLocaleString('es')}
            />
            <div className="flex-1">
              <FieldLabel>Pasos de hoy</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="Ej: 6000"
                value={form.pasos}
                onChange={(e) => update('pasos', e.target.value === '' ? '' : Number(e.target.value))}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                Meta: {stepGoal.toLocaleString('es')} pasos
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Minutos de ejercicio</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="Ej: 30"
                value={form.minutosActividad}
                onChange={(e) => update('minutosActividad', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Tipo de actividad</FieldLabel>
              <TextInput
                type="text"
                placeholder="Ej: caminata, yoga"
                value={form.tipoActividad}
                onChange={(e) => update('tipoActividad', e.target.value)}
              />
            </div>
          </div>
        </Collapsible>

        {/* ---- Peso y ánimo ---- */}
        <Collapsible
          title="Peso y ánimo"
          icon="⚖️"
          summary={[form.pesoKg !== '' ? `${form.pesoKg} kg` : null, form.animo ? `★${form.animo}` : null]
            .filter(Boolean)
            .join(' · ') || undefined}
        >
          <FieldLabel>Peso de hoy (kg)</FieldLabel>
          <TextInput
            type="number"
            inputMode="decimal"
            step={0.1}
            placeholder={profile ? `Ej: ${profile.pesoKg}` : 'Ej: 65'}
            value={form.pesoKg}
            onChange={(e) => update('pesoKg', e.target.value === '' ? '' : Number(e.target.value))}
          />
          <div className="mt-4">
            <FieldLabel>Energía / estado de ánimo</FieldLabel>
            <RatingStars value={form.animo} onChange={(v) => update('animo', v)} />
          </div>
        </Collapsible>

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="w-full rounded-2xl py-3.5 text-base font-semibold text-white active:opacity-90"
            style={{ background: 'var(--series-sleep)' }}
          >
            {saved ? 'Registro guardado ✓' : 'Guardar sueño, actividad y peso'}
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--color-ink-muted)' }}>
            La comida y el agua se guardan automáticamente al tocarlas.
          </p>
        </form>
      </div>
    </div>
  );
}
