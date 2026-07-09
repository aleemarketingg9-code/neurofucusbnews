// Manual light/dark theme preference — deliberately NOT part of the
// versioned Profile/DailyLog schema in storage.ts (no migration needed for a
// simple UI setting). Stored under its own small top-level key using the
// same storage.ts choke point as everything else.
import { readJSON, writeJSON } from './storage';

export type ThemePreference = 'sistema' | 'claro' | 'oscuro';

const THEME_KEY = 'theme-preference';

export function getStoredTheme(): ThemePreference {
  return readJSON<ThemePreference>(THEME_KEY, 'sistema');
}

export function setStoredTheme(pref: ThemePreference): void {
  writeJSON(THEME_KEY, pref);
}

/**
 * Reflects the preference onto the document so CSS can react to it.
 * "sistema" removes any override and falls back to the `prefers-color-scheme`
 * media query rules in index.css; "claro"/"oscuro" set `data-theme`, which
 * index.css gives priority over the media query.
 */
export function applyTheme(pref: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (pref === 'sistema') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', pref === 'oscuro' ? 'dark' : 'light');
  }
}
