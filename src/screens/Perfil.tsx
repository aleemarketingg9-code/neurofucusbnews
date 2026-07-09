import { useState } from 'react';
import { Card, SectionTitle } from '../components/Card';
import { FieldLabel, SelectInput, SliderField, TextArea, TextInput } from '../components/FormControls';
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
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Omit<Profile, 'creadoEn' | 'actualizadoEn'> = { ...form };
    await saveProfile(payload);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      {isNew ? (
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">👋</div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
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
