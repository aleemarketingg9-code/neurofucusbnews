// Small hand-authored inline SVG icon set — no icon library dependency.
// Each icon is a plain stroke drawing on a 24x24 grid, colored via
// `currentColor` so it inherits whatever color the caller sets.

type IconProps = { size?: number; className?: string };

function base(size: number, className: string | undefined, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconFlame({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c1.5 1 2 3 2 4.5A6 6 0 1 1 8 13c0-2 1-3 1-3 .5 2 2 2 2 1 0-2-1.5-3-1.5-5.5C9.5 3.5 11 2.5 12 2Z" />
  );
}

export function IconFootprint({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <ellipse cx="9.5" cy="15.5" rx="3" ry="4.5" />
      <path d="M9 8.5c0 1.5-1.2 2-1.8 3" />
      <ellipse cx="15" cy="7" rx="2.4" ry="3.5" transform="rotate(15 15 7)" />
      <path d="M14.7 12c0 1.4 1 1.8 1.6 2.6" />
    </>
  );
}

export function IconDroplet({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <path d="M12 2.5s6 6.7 6 11a6 6 0 1 1-12 0c0-4.3 6-11 6-11Z" />
  );
}

export function IconMoon({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />);
}

export function IconScale({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M5 7 2.5 12.5a2.5 2.5 0 0 0 5 0Z" />
      <path d="M19 7l-2.5 5.5a2.5 2.5 0 0 0 5 0Z" />
      <rect x="8" y="19" width="8" height="2.4" rx="1.2" />
    </>
  );
}

export function IconSmile({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c.9 1.2 2 1.8 3.5 1.8s2.6-.6 3.5-1.8" />
      <path d="M9 9.5h.01" />
      <path d="M15 9.5h.01" />
    </>
  );
}

export function IconActivity({ size = 18, className }: IconProps) {
  return base(size, className, <path d="M2.5 12h4l2-6 4 12 2-8 1.5 2h5.5" />);
}

export function IconPlus({ size = 24, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  );
}

export function IconRuler({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" transform="rotate(-8 12 12)" />
      <path d="M7.3 8.3l.7 2M10.3 7.8l.7 2M13.3 7.3l.7 2M16.3 6.8l.7 2" />
    </>
  );
}

/** Generic friendly avatar placeholder (no auth/photo yet) for the greeting header. */
export function AvatarPlaceholder({ size = 44, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className} aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="var(--series-cal-in)" />
      <circle cx="22" cy="18" r="7" fill="rgba(255,255,255,0.92)" />
      <path d="M8 40c1.5-8 7-12.5 14-12.5S36.5 32 38 40Z" fill="rgba(255,255,255,0.92)" />
    </svg>
  );
}
