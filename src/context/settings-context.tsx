
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type DisplayUnit = 'btc' | 'sats' | 'usd' | 'bif';
type Currency = 'usd' | 'eur' | 'jpy' | 'bif';
type Theme = 'light' | 'dark' | 'system';

interface Settings {
  displayUnit: DisplayUnit;
  currency: Currency;
  theme: Theme;
}

interface SettingsContextType {
  settings: Settings;
  setDisplayUnit: (unit: DisplayUnit) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = { displayUnit: 'btc', currency: 'usd', theme: 'dark' };

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    // This effect runs only on the client after initial render to sync with localStorage
    const getSettingsFromStorage = (): Settings => {
      if (typeof window !== 'undefined') {
          const savedSettings = localStorage.getItem('walletSettings');
          if (savedSettings) {
              try {
                  const parsed = JSON.parse(savedSettings);
                  return {
                      displayUnit: parsed.displayUnit || 'btc',
                      currency: parsed.currency || 'usd',
                      theme: parsed.theme || 'dark',
                  };
              } catch (e) {
                  console.error("Failed to parse settings from localStorage", e);
                  return defaultSettings;
              }
          }
      }
      return defaultSettings;
    };
    setSettings(getSettingsFromStorage());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletSettings', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);


  const setDisplayUnit = useCallback((displayUnit: DisplayUnit) => {
    updateSettings({ displayUnit });
  }, [updateSettings]);

  const setCurrency = useCallback((currency: Currency) => {
    updateSettings({ currency });
  }, [updateSettings]);

  const setTheme = useCallback((theme: Theme) => {
    updateSettings({ theme });
  }, [updateSettings]);


  return (
    <SettingsContext.Provider value={{ settings, setDisplayUnit, setCurrency, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

    