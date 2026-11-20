import { useCallback, useEffect, useState } from 'react';
import {
  WALLBOARD_THEME_STORAGE_KEY,
  type WallboardThemeMode,
} from './wallboard-theme';

function readStoredTheme(): WallboardThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const raw = window.localStorage.getItem(WALLBOARD_THEME_STORAGE_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useWallboardTheme() {
  const [theme, setThemeState] = useState<WallboardThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  const setTheme = useCallback((next: WallboardThemeMode) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(WALLBOARD_THEME_STORAGE_KEY, next);
    } catch {
      // private mode / quota
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme, ready };
}
