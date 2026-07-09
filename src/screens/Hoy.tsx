import { useEffect, useMemo, useState } from 'react';
import { Card, SectionTitle } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { FieldLabel, RatingStars, SliderField, TextInput } from '../components/FormControls';
import { dataService, todayKey } from '../lib/dataService';
import { buildContext, getRecommendations, type Recommendation } from '../lib/recommendations';
import { useProfile } from '../lib/useProfile';
import type { ComidasCalorias, DailyLog } from '../types';

const CATEGORIA_ICON: Record<Recommendation['categoria'], string> = {
  sueno: '😴',
  nutricion: '🥗',
  actividad: '🚶',
  animo: '💛',
  general: '📝',
  positivo: '✨',
};

function emptyForm() {
  return {
    horasSueno: 7,
    calidadSueno: 0,
    usarDesglose: false,
    caloriasConsumidas: '' as number | '',
    comidas: {} as ComidasCalorias,
    minutosActividad: '' as number | '',
    tipoActividad: '',
    pasos: '' as number | '',
    pesoKg: '' as number | '',
    animo: 0,
  };
}

export function HoyScreen() {
  const { profile, loading: loadingProfile } = useProfile();
  const [form, setForm] = useState(emptyForm());
  const [recent, setRecent] = useState<DailyLog[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);
  const [saved, setSaved] = useState(false);
  const dateKey = todayKey();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [today, logs] = await Promise.all([dataService.getLogByDate(dateKey), dataService.getRecentLogs(14)]);
      if (cancelled) return;
      if (today) {
        const hasBreakdown = !!today.comidas && Object.values(today.comidas).some((v) => v !== undefined);
        setForm({
          horasSueno: today.horasSueno ?? 7,
          calidadSueno: today.calidadSueno ?? 0,
          usarDesglose: hasBreakdown,
          caloriasConsumidas: today.caloriasConsumidas ?? '',
          comidas: today.comidas ?? {},
          minutosActividad: today.minutosActividad ?? '',
          tipoActividad: today.tipoActividad ?? '',
          pasos: today.pasos ?? '',
          pesoKg: today.pesoKg ?? '',
          animo: today.animo ?? 0,
        });
      }
      setRecent(logs);
      setLoadingLog(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const comidasSum = useMemo(() => {
    const { desayuno = 0, comida = 0, cena = 0, snacks = 0 } = form.comidas;
    return desayuno + comida + cena + snacks;
  }, [form.comidas]);

  function update<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function updateComida(field: keyof ComidasCalorias, value: string) {
    const num = value === '' ? undefined : Number(value);
    setForm((f) => ({ ...f, comidas: { ...f.comidas, [field]: num } }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: Partial<DailyLog> & { fecha: string } = {
      fecha: dateKey,
      horasSueno: form.horasSueno,
      calidadSueno: form.calidadSueno || undefined,
      caloriasConsumidas: form.usarDesglose ? comidasSum || undefined : form.caloriasConsumidas === '' ? undefined : Number(form.caloriasConsumidas),
      comidas: form.usarDesglose ? form.comidas : undefined,
      minutosActividad: form.minutosActividad === '' ? undefined : Number(form.minutosActividad),
      tipoActividad: form.tipoActividad || undefined,
      pasos: form.pasos === '' ? undefined : Number(form.pasos),
      pesoKg: form.pesoKg === '' ? undefined : Number(form.pesoKg),
      animo: form.animo || undefined,
    };
    const saved = await dataService.upsertLog(entry);
    setRecent((prev) => {
      const others = prev.filter((l) => l.fecha !== dateKey);
      return [...others, saved].sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
    setSaved(true);
  }

  const recommendations = useMemo(() => {
    if (!profile) return [];
    const ctx = buildContext(profile, recent, dateKey);
    return getRecommendations(ctx);
  }, [profile, recent, dateKey]);

  const todayLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <SectionTitle>😴 Sueño</SectionTitle>
          <FieldLabel>Horas dormidas anoche</FieldLabel>
          <SliderField value={form.horasSueno} onChange={(v) => update('horasSueno', v)} min={0} max={12} step={0.5} unit="h" />
          <div className="mt-4">
            <FieldLabel>Calidad del sueño</FieldLabel>
            <RatingStars value={form.calidadSueno} onChange={(v) => update('calidadSueno', v)} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>🍽️ Calorías consumidas</SectionTitle>
          </div>
          {!form.usarDesglose ? (
            <>
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="Ej: 1800"
                value={form.caloriasConsumidas}
                onChange={(e) => update('caloriasConsumidas', e.target.value === '' ? '' : Number(e.target.value))}
              />
              <button
                type="button"
                className="text-xs mt-2 underline"
                style={{ color: 'var(--series-sleep)' }}
                onClick={() => update('usarDesglose', true)}
              >
                Desglosar por comida
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {(['desayuno', 'comida', 'cena', 'snacks'] as const).map((meal) => (
                  <div key={meal}>
                    <FieldLabel>{meal[0].toUpperCase() + meal.slice(1)}</FieldLabel>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      placeholder="kcal"
                      value={form.comidas[meal] ?? ''}
                      onChange={(e) => updateComida(meal, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm mt-3" style={{ color: 'var(--color-ink-secondary)' }}>
                Total: <span className="font-semibold">{comidasSum} kcal</span>
              </p>
              <button
                type="button"
                className="text-xs mt-1 underline"
                style={{ color: 'var(--series-sleep)' }}
                onClick={() => update('usarDesglose', false)}
              >
                Usar total simple
              </button>
            </>
          )}
        </Card>

        <Card>
          <SectionTitle>🚶 Actividad</SectionTitle>
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
              <FieldLabel>Pasos (opcional)</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="Ej: 6000"
                value={form.pasos}
                onChange={(e) => update('pasos', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel>Tipo de actividad (opcional)</FieldLabel>
            <TextInput
              type="text"
              placeholder="Ej: caminata, yoga, pesas"
              value={form.tipoActividad}
              onChange={(e) => update('tipoActividad', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle>⚖️ Peso y ánimo (opcional)</SectionTitle>
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
        </Card>

        <button
          type="submit"
          className="w-full rounded-2xl py-3.5 text-base font-semibold text-white active:opacity-90"
          style={{ background: 'var(--series-sleep)' }}
        >
          {saved ? 'Registro guardado ✓' : 'Guardar registro de hoy'}
        </button>
      </form>
    </div>
  );
}
