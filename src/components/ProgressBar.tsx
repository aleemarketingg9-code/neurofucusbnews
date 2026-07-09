// Simple linear progress bar (calories consumed vs. limit, etc).
// A single-series meter, so no legend is needed — the label beside it names it.

export function ProgressBar({
  value,
  max,
  color,
  height = 10,
  overColor = 'var(--color-warning)',
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
  /** Color used for the filled bar once value exceeds max (gentle over-limit cue, not alarming red). */
  overColor?: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const over = max > 0 && value > max;
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'var(--color-surface)' }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        style={{
          width: `${Math.max(over ? 100 : pct * 100, value > 0 ? 3 : 0)}%`,
          height: '100%',
          background: over ? overColor : color,
          borderRadius: 9999,
          transition: 'width 0.2s ease, background 0.2s ease',
        }}
      />
    </div>
  );
}
