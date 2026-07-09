import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Card, SectionTitle } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { IconBubble } from '../components/IconBubble';
import { IconActivity, IconChart, IconDroplet, IconFlame, IconMoon, IconScale } from '../components/icons';
import {
  average,
  BMI_CATEGORY_LABELS,
  bmiCategory,
  computeBMI,
  effectiveCaloriesConsumed,
  getCalorieLimit,
  getStepGoal,
  getWaterGoalGlasses,
  round1,
} from '../lib/calculations';
import { dataService, todayKey } from '../lib/dataService';
import { useProfile } from '../lib/useProfile';
import type { DailyLog } from '../types';

const GRID = 'var(--color-gridline)';
const MUTED = 'var(--color-ink-muted)';

/** Renders a "% of goal" label above each bar, bold + full color on the highlighted (today's) bar. */
function pctLabelRenderer(data: { isToday: boolean; pct: number }[], color: string) {
  return (props: any) => {
    const { x, y, width, index } = props;
    const d = data[index];
    if (!d) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fontSize={10}
        fontWeight={d.isToday ? 700 : 500}
        fill={d.isToday ? color : 'var(--color-ink-muted)'}
      >
        {d.pct}%
      </text>
    );
  };
}

function shortDate(fecha: string) {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
    >
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {formatter ? formatter(p) : `${p.name}: ${p.value}`}
        </div>
      ))}
    </div>
  );
}

export function DashboardScreen() {
  const { profile } = useProfile();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [range, setRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getAllLogs().then((all) => {
      setLogs(all);
      setLoading(false);
    });
  }, []);

  const dateKey = todayKey();
  const today = logs.find((l) => l.fecha === dateKey) ?? null;

  const windowed = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range + 1);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    return logs.filter((l) => l.fecha >= cutoffKey).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [logs, range]);

  const sleepGoal = profile?.metaHorasSueno ?? 8;
  const calorieLimit = profile ? getCalorieLimit(profile) : null;
  const stepGoal = profile ? getStepGoal(profile) : 8000;
  const waterGoal = profile ? getWaterGoalGlasses(profile) : 8;

  const bmi = profile ? computeBMI(profile.pesoKg, profile.alturaCm) : null;
  const bmiCat = bmi != null ? bmiCategory(bmi) : null;

  const sleepData = windowed
    .filter((l) => l.horasSueno != null)
    .map((l) => ({ fecha: shortDate(l.fecha), horas: l.horasSueno }));

  const calorieData = windowed
    .map((l) => ({ fecha: shortDate(l.fecha), consumidas: effectiveCaloriesConsumed(l) ?? null }))
    .filter((d) => d.consumidas != null);

  const weightData = windowed.filter((l) => l.pesoKg != null).map((l) => ({ fecha: shortDate(l.fecha), peso: l.pesoKg }));

  const stepsData = windowed
    .filter((l) => l.pasos != null)
    .map((l) => ({
      fecha: shortDate(l.fecha),
      pasos: l.pasos as number,
      isToday: l.fecha === dateKey,
      pct: stepGoal > 0 ? Math.round(((l.pasos as number) / stepGoal) * 100) : 0,
    }));

  const waterData = windowed
    .filter((l) => l.waterGlasses != null)
    .map((l) => ({
      fecha: shortDate(l.fecha),
      vasos: l.waterGlasses as number,
      isToday: l.fecha === dateKey,
      pct: waterGoal > 0 ? Math.round(((l.waterGlasses as number) / waterGoal) * 100) : 0,
    }));

  const sleepVsEnergy = windowed
    .filter((l) => l.horasSueno != null && l.animo != null)
    .map((l) => ({ horas: l.horasSueno, animo: l.animo }));

  const avgSleep = average(sleepData.map((d) => d.horas as number));
  const avgCaloriesIn = average(calorieData.map((d) => d.consumidas as number));
  const avgSteps = average(stepsData.map((d) => d.pasos as number));
  const avgWater = average(waterData.map((d) => d.vasos as number));

  const todaySleep = today?.horasSueno;
  const todayCalIn = effectiveCaloriesConsumed(today);
  const todayActivityMin = today?.minutosActividad;
  const todaySteps = today?.pasos;
  const todayWater = today?.waterGlasses;

  if (loading) {
    return <div className="px-4 pt-10 text-center" style={{ color: MUTED }}>Cargando...</div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <IconBubble color="var(--series-cal-out)" size={32}>
          <IconChart size={16} />
        </IconBubble>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
          Dashboard
        </h1>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <StatTile
          icon={<IconMoon size={15} />}
          label="Sueño hoy"
          value={todaySleep != null ? `${todaySleep}h` : '—'}
          sub={`meta ${sleepGoal}h`}
          color="var(--series-sleep)"
        />
        <StatTile
          icon={<IconFlame size={15} />}
          label="Calorías hoy"
          value={todayCalIn != null ? `${todayCalIn}` : '—'}
          sub={calorieLimit ? `límite ~${calorieLimit}` : ''}
          color="var(--series-cal-in)"
        />
        <StatTile
          icon={<IconActivity size={15} />}
          label="Actividad"
          value={todayActivityMin != null ? `${todayActivityMin}m` : '—'}
          sub="hoy"
          color="var(--series-cal-out)"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatTile
          icon={<IconActivity size={15} />}
          label="Pasos hoy"
          value={todaySteps != null ? todaySteps.toLocaleString('es') : '—'}
          sub={`meta ${stepGoal.toLocaleString('es')}`}
          color="var(--series-steps)"
        />
        <StatTile
          icon={<IconDroplet size={15} />}
          label="Agua hoy"
          value={todayWater != null ? `${todayWater}` : '—'}
          sub={`meta ${waterGoal} vasos`}
          color="var(--series-water)"
        />
        <StatTile
          icon={<IconScale size={15} />}
          label="IMC"
          value={bmi != null ? round1(bmi).toString() : '—'}
          sub={bmiCat ? BMI_CATEGORY_LABELS[bmiCat] : ''}
          color="var(--series-weight)"
        />
      </div>

      {/* Range filter */}
      <div className="flex gap-2 mb-4">
        {([7, 30] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="flex-1 rounded-xl py-2 text-sm font-medium border"
            style={{
              background: range === r ? 'var(--series-sleep)' : 'var(--color-card)',
              color: range === r ? '#fff' : 'var(--color-ink)',
              borderColor: 'var(--color-border)',
            }}
          >
            {r} días
          </button>
        ))}
      </div>

      {/* Sleep trend */}
      <Card className="mb-4">
        <SectionTitle>Horas de sueño</SectionTitle>
        {sleepData.length < 2 ? (
          <EmptyState icon="😴" title="Aún no hay suficientes datos" subtitle="Registra tu sueño unos días para ver la tendencia." />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={sleepData} margin={{ top: 8, right: 8, left: -2, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                <ReferenceLine y={sleepGoal} stroke={MUTED} strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.value}h de sueño`} />} />
                <Line type="monotone" dataKey="horas" name="Sueño" stroke="var(--series-sleep)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {avgSleep != null && sleepData.length >= 2 && (
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Promedio del período: {round1(avgSleep)}h · línea punteada = tu meta
          </p>
        )}
      </Card>

      {/* Calories consumed vs daily limit */}
      <Card className="mb-4">
        <SectionTitle>Calorías consumidas</SectionTitle>
        {calorieData.length < 2 ? (
          <EmptyState icon="🍽️" title="Aún no hay suficientes datos" subtitle="Registra tu comida unos días para ver la tendencia." />
        ) : (
          <>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={calorieData} margin={{ top: 8, right: 8, left: -2, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                  {calorieLimit != null && <ReferenceLine y={calorieLimit} stroke={MUTED} strokeDasharray="4 4" />}
                  <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.name}: ${p.value} kcal`} />} />
                  <Line type="monotone" dataKey="consumidas" name="Consumidas" stroke="var(--series-cal-in)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {avgCaloriesIn != null && calorieLimit && (
              <p className="text-xs mt-2" style={{ color: MUTED }}>
                Promedio consumido: {Math.round(avgCaloriesIn)} kcal · tu límite: ~{calorieLimit} kcal (línea punteada)
              </p>
            )}
          </>
        )}
      </Card>

      {/* Steps trend */}
      <Card className="mb-4">
        <SectionTitle>Pasos diarios</SectionTitle>
        {stepsData.length < 2 ? (
          <EmptyState icon="👣" title="Aún no hay suficientes datos" subtitle="Registra tus pasos unos días para ver la tendencia." />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={stepsData} margin={{ top: 20, right: 8, left: -2, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                <ReferenceLine y={stepGoal} stroke={MUTED} strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.value?.toLocaleString('es')} pasos`} />} />
                <Bar dataKey="pasos" name="Pasos" radius={[8, 8, 0, 0]} maxBarSize={28} label={pctLabelRenderer(stepsData, 'var(--series-steps)')}>
                  {stepsData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.isToday ? 'var(--series-steps)' : 'color-mix(in oklab, var(--series-steps) 22%, var(--color-card))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {avgSteps != null && stepsData.length >= 2 && (
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Promedio del período: {Math.round(avgSteps).toLocaleString('es')} pasos · meta: {stepGoal.toLocaleString('es')} (línea punteada)
          </p>
        )}
      </Card>

      {/* Water trend */}
      <Card className="mb-4">
        <SectionTitle>Vasos de agua diarios</SectionTitle>
        {waterData.length < 2 ? (
          <EmptyState icon="💧" title="Aún no hay suficientes datos" subtitle="Registra tu agua unos días para ver la tendencia." />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={waterData} margin={{ top: 20, right: 8, left: -2, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                <ReferenceLine y={waterGoal} stroke={MUTED} strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.value} vasos`} />} />
                <Bar dataKey="vasos" name="Vasos" radius={[8, 8, 0, 0]} maxBarSize={28} label={pctLabelRenderer(waterData, 'var(--series-water)')}>
                  {waterData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.isToday ? 'var(--series-water)' : 'color-mix(in oklab, var(--series-water) 22%, var(--color-card))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {avgWater != null && waterData.length >= 2 && (
          <p className="text-xs mt-2" style={{ color: MUTED }}>
            Promedio del período: {round1(avgWater)} vasos · meta: {waterGoal} (línea punteada)
          </p>
        )}
      </Card>

      {/* Weight trend */}
      <Card className="mb-4">
        <SectionTitle>Tendencia de peso</SectionTitle>
        {weightData.length < 2 ? (
          <EmptyState icon="⚖️" title="Aún no hay suficientes datos" subtitle="Registra tu peso algunos días para ver la tendencia." />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={weightData} margin={{ top: 8, right: 8, left: -2, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={44} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.value} kg`} />} />
                <Line type="monotone" dataKey="peso" name="Peso" stroke="var(--series-weight)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Sleep vs energy correlation */}
      <Card className="mb-4">
        <SectionTitle>Sueño vs. energía</SectionTitle>
        {sleepVsEnergy.length < 5 ? (
          <EmptyState
            icon="✨"
            title="Aún no hay suficientes datos"
            subtitle="Registra sueño y ánimo varios días para ver si están relacionados."
          />
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 8, right: 8, left: -2, bottom: 0 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  dataKey="horas"
                  name="Sueño"
                  unit="h"
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                  domain={[0, 12]}
                />
                <YAxis
                  type="number"
                  dataKey="animo"
                  name="Energía"
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  domain={[0, 6]}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<ChartTooltip formatter={(p: any) => (p.name === 'Sueño' ? `${p.value}h de sueño` : `energía ${p.value}/5`)} />}
                />
                <Scatter data={sleepVsEnergy} fill="var(--series-energy)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border p-3 flex flex-col gap-1" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <IconBubble color={color} size={26}>
        {icon}
      </IconBubble>
      <span className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </span>
      <span className="text-lg font-semibold" style={{ color }}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
