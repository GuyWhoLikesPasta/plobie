'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { useTheme } from './ThemeProvider';

// Track if we're mounted (client-side)
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cycleTheme = useCallback(() => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  const getIcon = () => {
    if (theme === 'system') {
      return '💻';
    }
    return resolvedTheme === 'dark' ? '🌙' : '☀️';
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="w-[70px] h-[36px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                 bg-gray-100 hover:bg-gray-200 text-gray-700
                 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={`Theme: ${getLabel()}`}
    >
      <span className="text-base">{getIcon()}</span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
