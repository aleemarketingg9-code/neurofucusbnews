import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  style,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
      style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
      {children}
    </h2>
  );
}
