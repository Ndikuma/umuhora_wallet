
"use client"

import { useEffect, ReactNode } from 'react';
import { useSettings } from './settings-context';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    
  }, [settings.theme]);

  return <>{children}</>;
};

    