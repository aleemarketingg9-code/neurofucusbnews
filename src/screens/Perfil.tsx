import { useMemo, useState } from 'react';
import { Card, SectionTitle } from '../components/Card';
import { FieldLabel, SelectInput, SliderField, TextArea, TextInput } from '../components/FormControls';
import { IconBubble } from '../components/IconBubble';
import { AvatarPlaceholder, IconScale } from '../components/icons';
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
import {
  NIVEL_ACTIVIDAD_LABELS,
  OBJETIVO_LABELS,
  SEXO_LABELS,
  type NivelActividad,
  type Objetivo,
  type Profile,
  type Sexo,
} from '../types';

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
        <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          Tu perfil
        </h1>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <SectionTitle>Datos básicos</SectionTitle>
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
          <SectionTitle>Tu IMC (índice de masa corporal)</SectionTitle>
          <div className="flex items-center gap-4">
            <IconBubble color="var(--series-weight)" size={44}>
              <IconScale size={22} />
            </IconBubble>
            <div>
              <span className="text-3xl font-semibold" style={{ color: 'var(--series-weight)' }}>
                {round1(bmi)}
              </span>
            </div>
            <div>
              <span
                className="inline-block text-xs font-medium rounded-full px-2.5 py-1"
                style={{ background: 'var(--color-surface)', color: 'var(--color-ink)' }}
              >
                {BMI_CATEGORY_LABELS[bmiCat]}
              </span>
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-secondary)' }}>
                {BMI_CATEGORY_HINT[bmiCat]}
              </p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-ink-muted)' }}>
            {targetBmi != null
              ? `Con tu peso objetivo (${form.pesoObjetivoKg} kg), tu IMC sería ${round1(targetBmi)}.`
              : `Rango de peso saludable sugerido para tu estatura: ${healthyRange[0]}–${healthyRange[1]} kg.`}
          </p>
        </Card>

        <Card>
          <SectionTitle>Tu objetivo</SectionTitle>
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
          <SectionTitle>Meta de sueño</SectionTitle>
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
          <SectionTitle>Metas de pasos y agua</SectionTitle>
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
              Meta de vasos de agua diarios
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
          <SectionTitle>Salud y alimentación</SectionTitle>
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
