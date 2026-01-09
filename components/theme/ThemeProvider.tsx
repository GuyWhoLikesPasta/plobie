'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'plobie_theme';

// Helper to get theme from localStorage (client-side only)
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

// Helper to get system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Custom hook for managing theme with external store pattern
function useThemeStore() {
  const subscribe = useCallback((callback: () => void) => {
    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', callback);
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', callback);

    return () => {
      window.removeEventListener('storage', callback);
      mediaQuery.removeEventListener('change', callback);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return getStoredTheme();
  }, []);

  const getServerSnapshot = useCallback(() => {
    return 'system' as Theme;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storedTheme = useThemeStore();
  const [theme, setThemeInternal] = useState<Theme>(storedTheme);

  // Compute resolved theme
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : theme;

  // Apply theme to document
  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  // Sync with stored theme changes
  useEffect(() => {
    setThemeInternal(storedTheme);
  }, [storedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return default values if used outside provider (e.g., during SSR/prerender)
  if (context === undefined) {
    return {
      theme: 'system' as const,
      resolvedTheme: 'light' as const,
      setTheme: () => {},
    };
  }
  return context;
}
