import { useState, type ReactNode } from 'react';
import { Card } from './Card';

/** Collapsible section used to keep a busy screen (Hoy) scannable on a small phone. */
export function Collapsible({
  title,
  icon,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: string;
  /** Short status shown next to the title when collapsed, e.g. "7h · 4/5". */
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 min-h-[44px] -my-1 py-1"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {!open && summary && (
            <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              {summary}
            </span>
          )}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </Card>
  );
}
