import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyTheme, getStoredTheme, setStoredTheme, type ThemePreference } from './theme';

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: ThemePreference) {
    setStoredTheme(t);
    setThemeState(t);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
