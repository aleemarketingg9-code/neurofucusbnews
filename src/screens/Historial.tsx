import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { DayStrip } from '../components/DayStrip';
import { EmptyState } from '../components/EmptyState';
import { IconBubble } from '../components/IconBubble';
import { IconActivity, IconDroplet, IconFlame, IconMoon, IconScale, IconSmile } from '../components/icons';
import { effectiveCaloriesConsumed } from '../lib/calculations';
import { dataService } from '../lib/dataService';
import type { DailyLog } from '../types';

function formatDate(fecha: string) {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** One stat, shown as a small colored icon bubble + text — matches the icon-bubble language used across the app. */
function Stat({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <IconBubble color={color} size={22}>
        {icon}
      </IconBubble>
      {children}
    </span>
  );
}

export function HistorialScreen() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getAllLogs().then((all) => {
      setLogs(all.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setLoading(false);
    });
  }, []);

  const logDates = useMemo(() => new Set(logs.map((l) => l.fecha)), [logs]);

  function jumpToDay(fecha: string) {
    const el = document.getElementById(`log-${fecha}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.animate([{ boxShadow: '0 0 0 3px var(--series-cal-in)' }, { boxShadow: '0 0 0 0px transparent' }], {
        duration: 900,
      });
    }
  }

  if (loading) {
    return <div className="px-4 pt-10 text-center" style={{ color: 'var(--color-ink-muted)' }}>Cargando...</div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
        Historial
      </h1>

      {logs.length > 0 && <DayStrip logDates={logDates} onSelect={jumpToDay} />}

      {logs.length === 0 ? (
        <Card>
          <EmptyState icon="📖" title="Todavía no hay registros" subtitle="Los días que registres en 'Hoy' aparecerán aquí." />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {logs.map((log) => {
            const consumed = effectiveCaloriesConsumed(log);
            const hasWater = (log.waterGlasses ?? 0) > 0;
            const hasAny =
              log.horasSueno != null ||
              consumed != null ||
              log.minutosActividad != null ||
              log.pasos != null ||
              log.pesoKg != null ||
              log.animo != null ||
              hasWater;
            return (
              <li key={log.fecha} id={`log-${log.fecha}`} className="rounded-2xl scroll-mt-4">
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize" style={{ color: 'var(--color-ink)' }}>
                      {formatDate(log.fecha)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                    {log.horasSueno != null && (
                      <Stat icon={<IconMoon size={12} />} color="var(--series-sleep)">
                        {log.horasSueno}h {log.calidadSueno ? `(${log.calidadSueno}/5)` : ''}
                      </Stat>
                    )}
                    {consumed != null && (
                      <Stat icon={<IconFlame size={12} />} color="var(--series-cal-in)">
                        {consumed} kcal
                      </Stat>
                    )}
                    {hasWater && (
                      <Stat icon={<IconDroplet size={12} />} color="var(--series-water)">
                        {log.waterGlasses} vasos
                      </Stat>
                    )}
                    {log.minutosActividad != null && (
                      <Stat icon={<IconActivity size={12} />} color="var(--series-cal-out)">
                        {log.minutosActividad} min{log.tipoActividad ? ` · ${log.tipoActividad}` : ''}
                      </Stat>
                    )}
                    {log.pasos != null && (
                      <Stat icon={<IconActivity size={12} />} color="var(--series-steps)">
                        {log.pasos.toLocaleString('es')} pasos
                      </Stat>
                    )}
                    {log.pesoKg != null && (
                      <Stat icon={<IconScale size={12} />} color="var(--series-weight)">
                        {log.pesoKg} kg
                      </Stat>
                    )}
                    {log.animo != null && (
                      <Stat icon={<IconSmile size={12} />} color="var(--series-mood)">
                        energía {log.animo}/5
                      </Stat>
                    )}
                    {!hasAny && <span>Sin datos registrados</span>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
