import type { ReactNode } from 'react';

/**
 * Small colored circle behind an icon — the "icon bubble" used consistently
 * across the app for a given metric (steps, water, calories, sleep, weight,
 * mood...). `color` should be one of the `--series-*` custom properties so
 * bubbles stay consistent and theme-safe in light/dark.
 */
export function IconBubble({
  color,
  size = 40,
  soft = true,
  children,
}: {
  color: string;
  size?: number;
  /** Soft tinted background + solid icon (default) vs. solid background + white icon. */
  soft?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: soft ? `color-mix(in oklab, ${color} 18%, transparent)` : color,
        color: soft ? color : '#fff',
      }}
    >
      {children}
    </span>
  );
}
