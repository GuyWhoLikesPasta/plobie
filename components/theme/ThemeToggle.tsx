'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { useTheme } from './ThemeProvider';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
      />
    </svg>
  );
}

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
    if (theme === 'system') return <MonitorIcon />;
    return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'Auto';
    }
  };

  if (!isMounted) {
    return (
      <div className="w-[70px] h-[36px] bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                 bg-stone-100 hover:bg-stone-200 text-stone-600
                 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-400"
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
