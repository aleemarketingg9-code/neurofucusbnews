// Circular progress indicator for a single "today" metric against a goal
// (steps, water, etc). Deliberately simple hand-rolled SVG — no charting
// library needed for a single-value ring.

export function ProgressRing({
  value,
  goal,
  label,
  displayValue,
  color,
  size = 108,
  strokeWidth = 10,
}: {
  value: number;
  goal: number;
  label?: string;
  /** Override the big number shown in the center (defaults to `value`). */
  displayValue?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const pct = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-gridline)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        <span className="text-base font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>
          {displayValue ?? value.toLocaleString('es')}
        </span>
        {label && (
          <span className="text-[10px] leading-tight" style={{ color: 'var(--color-ink-muted)' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
