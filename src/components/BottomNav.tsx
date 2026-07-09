import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

function iconWrap(active: boolean, children: React.ReactNode) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? 'var(--series-sleep)' : 'var(--color-ink-muted)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Hoy',
    icon: (active) => iconWrap(active, <><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /><circle cx="12" cy="12" r="4" /></>),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (active) => iconWrap(active, <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>),
  },
  {
    to: '/historial',
    label: 'Historial',
    icon: (active) => iconWrap(active, <><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></>),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: (active) => iconWrap(active, <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>),
  },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t"
      style={{
        background: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:opacity-70"
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: isActive ? 'var(--series-sleep)' : 'var(--color-ink-muted)' }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
