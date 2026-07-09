// Circular progress indicator for a single "today" metric against a goal
// (steps, calories, water, etc). Deliberately simple hand-rolled SVG — no
// charting library needed for a single-value ring. Bold thick stroke with
// the percentage in the center, styled after the reference apps' hero rings.

export function ProgressRing({
  value,
  goal,
  label,
  displayValue,
  color,
  size = 108,
  strokeWidth = 12,
  /** Show the big rounded percentage in the center (default) instead of the raw value. */
  showPercent = true,
  /** Track color behind the arc — pass a lighter/transparent color on a tinted hero card. */
  trackColor = 'var(--color-gridline)',
}: {
  value: number;
  goal: number;
  label?: string;
  /** Override the big number/text shown in the center. */
  displayValue?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
  showPercent?: boolean;
  trackColor?: string;
}) {
  const pct = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const pctLabel = Math.round(pct * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
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
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        <span
          className="font-bold leading-none"
          style={{ color: 'var(--color-ink)', fontSize: size >= 100 ? 26 : 16 }}
        >
          {displayValue ?? (showPercent ? `${pctLabel}%` : value.toLocaleString('es'))}
        </span>
        {label && (
          <span
            className="leading-tight mt-1"
            style={{ color: 'var(--color-ink-muted)', fontSize: size >= 100 ? 11 : 9 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
