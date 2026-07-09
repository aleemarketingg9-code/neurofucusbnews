import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { effectiveCaloriesConsumed } from '../lib/calculations';
import { dataService } from '../lib/dataService';
import type { DailyLog } from '../types';

function formatDate(fecha: string) {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
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

  if (loading) {
    return <div className="px-4 pt-10 text-center" style={{ color: 'var(--color-ink-muted)' }}>Cargando...</div>;
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
        Historial
      </h1>

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
              <li key={log.fecha}>
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize" style={{ color: 'var(--color-ink)' }}>
                      {formatDate(log.fecha)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                    {log.horasSueno != null && <span>😴 {log.horasSueno}h {log.calidadSueno ? `(${log.calidadSueno}/5)` : ''}</span>}
                    {consumed != null && <span>🍽️ {consumed} kcal</span>}
                    {hasWater && <span>💧 {log.waterGlasses} vasos</span>}
                    {log.minutosActividad != null && <span>🚶 {log.minutosActividad} min{log.tipoActividad ? ` · ${log.tipoActividad}` : ''}</span>}
                    {log.pasos != null && <span>👣 {log.pasos.toLocaleString('es')} pasos</span>}
                    {log.pesoKg != null && <span>⚖️ {log.pesoKg} kg</span>}
                    {log.animo != null && <span>💛 energía {log.animo}/5</span>}
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
