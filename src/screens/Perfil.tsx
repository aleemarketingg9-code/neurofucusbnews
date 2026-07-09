import { useMemo, useState, type ReactNode } from 'react';
import { Card } from '../components/Card';
import { FieldLabel, SelectInput, SliderField, TextArea, TextInput } from '../components/FormControls';
import { IconBubble } from '../components/IconBubble';
import {
  AvatarPlaceholder,
  IconAuto,
  IconDroplet,
  IconFootprint,
  IconHeart,
  IconMoon,
  IconRuler,
  IconScale,
  IconSun,
  IconTarget,
} from '../components/icons';
import {
  BMI_CATEGORY_HINT,
  BMI_CATEGORY_LABELS,
  bmiCategory,
  computeBMI,
  DEFAULT_STEP_GOAL,
  healthyWeightRangeKg,
  round1,
  suggestedWaterGoalGlasses,
} from '../lib/calculations';
import { useProfile } from '../lib/useProfile';
import { useTheme } from '../lib/useTheme';
import type { ThemePreference } from '../lib/theme';
import {
  NIVEL_ACTIVIDAD_LABELS,
  OBJETIVO_LABELS,
  SEXO_LABELS,
  type NivelActividad,
  type Objetivo,
  type Profile,
  type Sexo,
} from '../types';

/** Icon bubble + title, matching the pattern Hoy's Collapsible sections use, so Perfil's cards read as part of the same system. */
function SectionHeading({ icon, color, children }: { icon: ReactNode; color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <IconBubble color={color} size={32}>
        {icon}
      </IconBubble>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
        {children}
      </h2>
    </div>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: 'sistema', label: 'Sistema', icon: <IconAuto size={18} /> },
  { value: 'claro', label: 'Claro', icon: <IconSun size={18} /> },
  { value: 'oscuro', label: 'Oscuro', icon: <IconMoon size={18} /> },
];

const DEFAULTS = {
  edad: 30,
  sexo: 'femenino' as Sexo,
  alturaCm: 165,
  pesoKg: 65,
  objetivo: 'mantener' as Objetivo,
  nivelActividad: 'ligero' as NivelActividad,
  metaHorasSueno: 8,
  restricciones: '',
  condiciones: '',
};

export function PerfilScreen() {
  const { profile, saveProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const isNew = profile === null;

  const [form, setForm] = useState({
    edad: profile?.edad ?? DEFAULTS.edad,
    sexo: profile?.sexo ?? DEFAULTS.sexo,
    alturaCm: profile?.alturaCm ?? DEFAULTS.alturaCm,
    pesoKg: profile?.pesoKg ?? DEFAULTS.pesoKg,
    objetivo: profile?.objetivo ?? DEFAULTS.objetivo,
    nivelActividad: profile?.nivelActividad ?? DEFAULTS.nivelActividad,
    metaHorasSueno: profile?.metaHorasSueno ?? DEFAULTS.metaHorasSueno,
    restricciones: profile?.restricciones ?? DEFAULTS.restricciones,
    condiciones: profile?.condiciones ?? DEFAULTS.condiciones,
    pesoObjetivoKg: profile?.pesoObjetivoKg ?? ('' as number | ''),
    metaPasos: profile?.metaPasos ?? DEFAULT_STEP_GOAL,
    metaAguaVasos: profile?.metaAguaVasos ?? ('' as number | ''),
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const bmi = useMemo(() => computeBMI(form.pesoKg, form.alturaCm), [form.pesoKg, form.alturaCm]);
  const bmiCat = bmiCategory(bmi);
  const healthyRange = useMemo(() => healthyWeightRangeKg(form.alturaCm), [form.alturaCm]);
  const targetBmi = form.pesoObjetivoKg !== '' ? computeBMI(Number(form.pesoObjetivoKg), form.alturaCm) : null;
  const suggestedWaterGoal = suggestedWaterGoalGlasses(form.pesoKg);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Omit<Profile, 'creadoEn' | 'actualizadoEn'> = {
      ...form,
      pesoObjetivoKg: form.pesoObjetivoKg === '' ? undefined : Number(form.pesoObjetivoKg),
      metaAguaVasos: form.metaAguaVasos === '' ? undefined : Number(form.metaAguaVasos),
      // Preserve an existing calorie-limit override (edited from the Hoy screen); this form doesn't touch it.
      limiteCaloriasOverride: profile?.limiteCaloriasOverride,
    };
    await saveProfile(payload);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      {isNew ? (
        <div className="mb-6 text-center flex flex-col items-center">
          <AvatarPlaceholder size={56} />
          <h1 className="text-xl font-semibold mt-2" style={{ color: 'var(--color-ink)' }}>
            Bienvenido/a a Bienestar Diario
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-secondary)' }}>
            Cuéntanos un poco sobre ti para poder darte recomendaciones a tu medida.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4">
          <AvatarPlaceholder size={40} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            Tu perfil
          </h1>
        </div>
      )}

      {/* ---- Appearance: manual light/dark/system theme choice, persisted separately from the profile ---- */}
      <Card className="mb-4">
        <SectionHeading icon={<IconSun size={16} />} color="var(--series-energy)">
          Apariencia
        </SectionHeading>
        <p className="text-xs mb-3" style={{ color: 'var(--color-ink-muted)' }}>
          Elige cómo se ve la app, o déjala seguir el tema de tu teléfono.
        </p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema de la app">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(opt.value)}
                className="flex flex-col items-center gap-1.5 rounded-xl border py-3 active:scale-95 transition-transform"
                style={{
                  background: active ? 'color-mix(in oklab, var(--series-energy) 18%, var(--color-card))' : 'var(--color-card)',
                  borderColor: active ? 'var(--series-energy)' : 'var(--color-border)',
                  color: active ? 'var(--series-energy)' : 'var(--color-ink-muted)',
                }}
              >
                {opt.icon}
                <span className="text-xs font-medium" style={{ color: active ? 'var(--series-energy)' : 'var(--color-ink)' }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ---- IMC hero: the single most-referenced number on this screen, given the Hoy-style tinted treatment ---- */}
      <div
        className="rounded-3xl p-5 mb-4 flex items-center gap-4"
        style={{ background: 'color-mix(in oklab, var(--series-weight) 16%, var(--color-card))' }}
      >
        <IconBubble color="var(--series-weight)" size={64}>
          <IconScale size={30} />
        </IconBubble>
        <div className="flex-1 min-w-0">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mb-1.5"
            style={{ background: 'color-mix(in oklab, var(--series-weight) 28%, transparent)', color: 'var(--series-weight)' }}
          >
            Tu IMC (índice de masa corporal)
          </span>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            {round1(bmi)}
            <span
              className="ml-2 inline-block align-middle text-xs font-medium rounded-full px-2.5 py-1"
              style={{ background: 'var(--color-card)', color: 'var(--series-weight)' }}
            >
              {BMI_CATEGORY_LABELS[bmiCat]}
            </span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-secondary)' }}>
            {BMI_CATEGORY_HINT[bmiCat]}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
            {targetBmi != null
              ? `Con tu peso objetivo (${form.pesoObjetivoKg} kg), tu IMC sería ${round1(targetBmi)}.`
              : `Rango de peso saludable sugerido para tu estatura: ${healthyRange[0]}–${healthyRange[1]} kg.`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <SectionHeading icon={<IconRuler size={16} />} color="var(--series-cal-out)">
            Datos básicos
          </SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Edad</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                min={10}
                max={100}
                required
                value={form.edad}
                onChange={(e) => update('edad', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Sexo</FieldLabel>
              <SelectInput value={form.sexo} onChange={(e) => update('sexo', e.target.value as Sexo)}>
                {Object.entries(SEXO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel>Altura (cm)</FieldLabel>
              <TextInput
                type="number"
                inputMode="numeric"
                min={100}
                max={230}
                required
                value={form.alturaCm}
                onChange={(e) => update('alturaCm', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Peso actual (kg)</FieldLabel>
              <TextInput
                type="number"
                inputMode="decimal"
                min={30}
                max={300}
                step={0.1}
                required
                value={form.pesoKg}
                onChange={(e) => update('pesoKg', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel hint="Opcional. Si lo dejas vacío, te mostramos el rango de peso saludable para tu estatura como referencia.">
              Peso objetivo (kg)
            </FieldLabel>
            <TextInput
              type="number"
              inputMode="decimal"
              min={30}
              max={300}
              step={0.1}
              placeholder="Ej: 62"
              value={form.pesoObjetivoKg}
              onChange={(e) => update('pesoObjetivoKg', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </Card>

        <Card>
          <SectionHeading icon={<IconTarget size={16} />} color="var(--series-cal-in)">
            Tu objetivo
          </SectionHeading>
          <SelectInput value={form.objetivo} onChange={(e) => update('objetivo', e.target.value as Objetivo)}>
            {Object.entries(OBJETIVO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>

          <div className="mt-4">
            <FieldLabel>Nivel de actividad habitual</FieldLabel>
            <SelectInput
              value={form.nivelActividad}
              onChange={(e) => update('nivelActividad', e.target.value as NivelActividad)}
            >
              {Object.entries(NIVEL_ACTIVIDAD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </div>
        </Card>

        <Card>
          <SectionHeading icon={<IconMoon size={16} />} color="var(--series-sleep)">
            Meta de sueño
          </SectionHeading>
          <SliderField
            value={form.metaHorasSueno}
            onChange={(v) => update('metaHorasSueno', v)}
            min={5}
            max={10}
            step={0.5}
            unit="horas"
          />
        </Card>

        <Card>
          <SectionHeading icon={<IconFootprint size={16} />} color="var(--series-steps)">
            Metas de pasos y agua
          </SectionHeading>
          <FieldLabel>Meta de pasos diarios</FieldLabel>
          <TextInput
            type="number"
            inputMode="numeric"
            min={1000}
            max={40000}
            step={500}
            value={form.metaPasos}
            onChange={(e) => update('metaPasos', Number(e.target.value))}
          />

          <div className="mt-4">
            <FieldLabel hint={`Sugerido para tu peso: ${suggestedWaterGoal} vasos (250 ml) al día. Déjalo vacío para usar la sugerencia.`}>
              <span className="inline-flex items-center gap-1.5">
                <IconDroplet size={13} />
                Meta de vasos de agua diarios
              </span>
            </FieldLabel>
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={25}
              placeholder={`Sugerido: ${suggestedWaterGoal}`}
              value={form.metaAguaVasos}
              onChange={(e) => update('metaAguaVasos', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </Card>

        <Card>
          <SectionHeading icon={<IconHeart size={16} />} color="var(--series-verduras)">
            Salud y alimentación
          </SectionHeading>
          <FieldLabel hint="Opcional. Ej: intolerancia a la lactosa, vegetariano/a, alergia a frutos secos.">
            Restricciones alimentarias o alergias
          </FieldLabel>
          <TextArea
            rows={2}
            value={form.restricciones}
            onChange={(e) => update('restricciones', e.target.value)}
            placeholder="Escribe aquí si tienes alguna..."
          />

          <div className="mt-4">
            <FieldLabel hint="Opcional. Ej: hipotiroidismo, dermatitis, lesión en la rodilla. Solo para ajustar el tono de las sugerencias — esto no es un diagnóstico ni reemplaza a tu médico.">
              Condiciones de salud o notas relevantes
            </FieldLabel>
            <TextArea
              rows={2}
              value={form.condiciones}
              onChange={(e) => update('condiciones', e.target.value)}
              placeholder="Escribe aquí si tienes alguna..."
            />
          </div>
        </Card>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl py-3.5 text-base font-semibold text-white active:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--series-sleep)' }}
        >
          {isNew ? 'Comenzar' : saving ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar cambios'}
        </button>
        {!isNew && saved && (
          <p className="text-center text-sm" style={{ color: 'var(--color-good)' }}>
            Tu perfil se actualizó correctamente.
          </p>
        )}
      </form>
    </div>
  );
}
