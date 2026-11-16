import React, { createContext, useContext, useState, useEffect } from 'react';

export type AccentPresetId = 'indigo' | 'eosin' | 'hematoxylin' | 'emerald' | 'graphite';
export type ThemeMode = 'light' | 'dark';

export interface AccentPreset {
  id: AccentPresetId;
  name: string;
  badge: string;
  primary: string;
  hover: string;
  soft: string;
  softText: string;
  shadow: string;
}

export const ACCENT_PRESETS: Record<AccentPresetId, AccentPreset> = {
  indigo: {
    id: 'indigo',
    name: 'Индиго (База)',
    badge: 'База',
    primary: '#4F46E5',
    hover: '#4338CA',
    soft: '#EEF2FF',
    softText: '#4F46E5',
    shadow: 'rgba(79, 70, 229, 0.25)',
  },
  eosin: {
    id: 'eosin',
    name: 'Эозин (Розовый)',
    badge: 'H&E',
    primary: '#EC4899',
    hover: '#DB2777',
    soft: '#FDF2F8',
    softText: '#EC4899',
    shadow: 'rgba(236, 72, 153, 0.25)',
  },
  hematoxylin: {
    id: 'hematoxylin',
    name: 'Гематоксилин (Фиолетовый)',
    badge: 'Ядра',
    primary: '#7C3AED',
    hover: '#6D28D9',
    soft: '#F5F3FF',
    softText: '#7C3AED',
    shadow: 'rgba(124, 58, 237, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Изумруд (Медицинский)',
    badge: 'Мед',
    primary: '#10B981',
    hover: '#059669',
    soft: '#ECFDF5',
    softText: '#059669',
    shadow: 'rgba(16, 185, 129, 0.25)',
  },
  graphite: {
    id: 'graphite',
    name: 'Графит (Монохром)',
    badge: 'Dark',
    primary: '#0F172A',
    hover: '#1E293B',
    soft: '#F1F5F9',
    softText: '#0F172A',
    shadow: 'rgba(15, 23, 42, 0.25)',
  },
};

interface ThemeContextType {
  accent: AccentPresetId;
  currentPreset: AccentPreset;
  setAccent: (accent: AccentPresetId) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_STORAGE_KEY = 'histo_theme_accent';
const MODE_STORAGE_KEY = 'histo_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accent, setAccentState] = useState<AccentPresetId>(() => {
    try {
      const saved = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentPresetId;
      if (saved && ACCENT_PRESETS[saved]) return saved;
    } catch (e) {
      console.warn('Could not read accent theme from localStorage', e);
    }
    return 'indigo';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.warn('Could not read theme mode from localStorage', e);
    }
    return 'light';
  });

  const currentPreset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.indigo;

  // Apply CSS variables whenever accent or mode changes
  useEffect(() => {
    const root = document.documentElement;

    // Accent variables
    root.style.setProperty('--accent-primary', currentPreset.primary);
    root.style.setProperty('--accent-hover', currentPreset.hover);
    root.style.setProperty('--accent-soft', mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : currentPreset.soft);
    root.style.setProperty('--accent-text', mode === 'dark' ? '#F8FAFC' : currentPreset.softText);
    root.style.setProperty('--accent-shadow', currentPreset.shadow);

    // Mode variables
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-page', '#0B0F17');
      root.style.setProperty('--bg-card', '#161D2A');
      root.style.setProperty('--bg-card-secondary', '#1E293B');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-muted', '#94A3B8');
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--nav-bg', 'rgba(22, 29, 42, 0.92)');
      document.body.style.backgroundColor = '#0B0F17';
      document.body.style.color = '#F8FAFC';
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-page', '#F2F4F7');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--bg-card-secondary', '#F8FAFC');
      root.style.setProperty('--text-primary', '#0F172A');
      root.style.setProperty('--text-muted', '#64748B');
      root.style.setProperty('--border-subtle', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--nav-bg', 'rgba(255, 255, 255, 0.92)');
      document.body.style.backgroundColor = '#F2F4F7';
      document.body.style.color = '#0F172A';
    }

    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, accent);
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }, [accent, mode, currentPreset]);

  const setAccent = (newAccent: AccentPresetId) => {
    if (ACCENT_PRESETS[newAccent]) {
      setAccentState(newAccent);
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        accent,
        currentPreset,
        setAccent,
        mode,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
