import type { ReactNode } from 'react';

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
        {children}
      </label>
      {hint && (
        <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:ring-2 ${className}`}
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-ink)',
        ...(props.style ?? {}),
      }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:ring-2 ${className}`}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
    />
  );
}

export function SelectInput({
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className="w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:ring-2"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
    >
      {children}
    </select>
  );
}

export function SliderField({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl font-semibold" style={{ color: 'var(--series-sleep)' }}>
          {value}
          <span className="text-base font-normal" style={{ color: 'var(--color-ink-muted)' }}>
            {' '}
            {unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8"
      />
      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Calificar ${n}`}
          className="flex-1 h-12 rounded-xl text-xl border active:scale-95 transition-transform"
          style={{
            background: n <= value ? 'var(--series-energy)' : 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
