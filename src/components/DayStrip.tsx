import { toDateKey } from '../lib/dataService';

/** Horizontal last-7-days strip. Today (or the selected day) is a filled circle. */
export function DayStrip({
  logDates,
  onSelect,
}: {
  /** Set of fecha keys (YYYY-MM-DD) that have a log, to show a small dot under that day. */
  logDates: Set<string>;
  onSelect: (fecha: string) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div className="flex justify-between gap-1.5 mb-4 px-0.5">
      {days.map((d) => {
        const key = toDateKey(d);
        const isToday = key === toDateKey(today);
        const hasLog = logDates.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            aria-label={d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          >
            <span className="text-[10px] uppercase" style={{ color: 'var(--color-ink-muted)' }}>
              {d.toLocaleDateString('es', { weekday: 'narrow' })}
            </span>
            <span
              className="flex items-center justify-center rounded-full text-sm font-semibold"
              style={{
                width: 34,
                height: 34,
                background: isToday ? 'var(--series-cal-in)' : 'transparent',
                color: isToday ? '#fff' : 'var(--color-ink)',
              }}
            >
              {d.getDate()}
            </span>
            <span
              className="rounded-full"
              style={{
                width: 4,
                height: 4,
                background: hasLog ? 'var(--series-cal-in)' : 'transparent',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
