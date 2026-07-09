import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
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
import { average, estimateCalorieGoal, round1 } from '../lib/calculations';
import { dataService, todayKey } from '../lib/dataService';
import { useProfile } from '../lib/useProfile';
import type { DailyLog } from '../types';

const GRID = 'var(--color-gridline)';
const MUTED = 'var(--color-ink-muted)';

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
  const calorieGoal = profile ? estimateCalorieGoal(profile) : null;

  const sleepData = windowed
    .filter((l) => l.horasSueno != null)
    .map((l) => ({ fecha: shortDate(l.fecha), horas: l.horasSueno }));

  const calorieData = windowed
    .filter((l) => l.caloriasConsumidas != null || l.caloriasQuemadas != null)
    .map((l) => ({ fecha: shortDate(l.fecha), consumidas: l.caloriasConsumidas ?? null, quemadas: l.caloriasQuemadas ?? null }));

  const weightData = windowed.filter((l) => l.pesoKg != null).map((l) => ({ fecha: shortDate(l.fecha), peso: l.pesoKg }));

  const sleepVsEnergy = windowed
    .filter((l) => l.horasSueno != null && l.animo != null)
    .map((l) => ({ horas: l.horasSueno, animo: l.animo }));

  const avgSleep = average(sleepData.map((d) => d.horas as number));
  const avgCaloriesIn = average(
    windowed.filter((l) => l.caloriasConsumidas != null).map((l) => l.caloriasConsumidas as number),
  );

  const todaySleep = today?.horasSueno;
  const todayCalIn = today?.caloriasConsumidas;
  const todayCalOut = today?.caloriasQuemadas;
  const todayActivityMin = today?.minutosActividad;

  if (loading) {
    return <div className="px-4 pt-10 text-center" style={{ color: MUTED }}>Cargando...</div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
        Dashboard
      </h1>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatTile label="Sueño hoy" value={todaySleep != null ? `${todaySleep}h` : '—'} sub={`meta ${sleepGoal}h`} color="var(--series-sleep)" />
        <StatTile
          label="Balance cal."
          value={todayCalIn != null ? `${todayCalIn}` : '—'}
          sub={calorieGoal ? `meta ~${calorieGoal}` : ''}
          color="var(--series-cal-in)"
        />
        <StatTile
          label="Actividad"
          value={todayActivityMin != null ? `${todayActivityMin}m` : todayCalOut != null ? `${todayCalOut} kcal` : '—'}
          sub="hoy"
          color="var(--series-cal-out)"
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
              <LineChart data={sleepData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
            Promedio del período: {round1(avgSleep)}h
          </p>
        )}
      </Card>

      {/* Calories in vs out */}
      <Card className="mb-4">
        <SectionTitle>Calorías: consumidas vs quemadas</SectionTitle>
        {calorieData.length < 2 ? (
          <EmptyState icon="🍽️" title="Aún no hay suficientes datos" subtitle="Registra tus calorías unos días para ver el balance." />
        ) : (
          <>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={calorieData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip formatter={(p: any) => `${p.name}: ${p.value} kcal`} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="consumidas" name="Consumidas" stroke="var(--series-cal-in)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="quemadas" name="Quemadas" stroke="var(--series-cal-out)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {avgCaloriesIn != null && calorieGoal && (
              <p className="text-xs mt-2" style={{ color: MUTED }}>
                Promedio consumido: {Math.round(avgCaloriesIn)} kcal · estimado para ti: ~{calorieGoal} kcal
              </p>
            )}
          </>
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
              <LineChart data={weightData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: MUTED }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={36} domain={['dataMin - 1', 'dataMax + 1']} />
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
              <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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

function StatTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border p-3 flex flex-col gap-0.5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
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
