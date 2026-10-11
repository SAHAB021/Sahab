import { createContext, useContext, useEffect, useState, type ReactNode, useLayoutEffect } from 'react';
import { translations, type Language, type Translation } from '@/i18n/translations';

type Theme = 'dark' | 'light';

interface AppContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: Translation;
  dir: 'rtl' | 'ltr';
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Each section of the site (public pages, customer account, admin) mounts its own
// provider, so the visitor's choices are kept on the device to survive navigation.
const THEME_KEY = 'sahab.theme';
const LANG_KEY = 'sahab.lang';

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v && (allowed as readonly string[]).includes(v)) return v as T;
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => readStored<Language>(LANG_KEY, ['ar', 'en'], 'ar'));
  const [theme, setTheme] = useState<Theme>(() => readStored<Theme>(THEME_KEY, ['dark', 'light'], 'dark'));

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body.setAttribute('dir', dir);
    store(LANG_KEY, lang);
  }, [dir, lang]);

  // Apply before paint. Transitions are paused for one frame so every surface
  // switches at once instead of fading at different speeds.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') !== theme) {
      root.classList.add('theme-switching');
      root.setAttribute('data-theme', theme);
      void root.offsetHeight;
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f5f5' : '#0a0a0a');
    store(THEME_KEY, theme);
  }, [theme]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) setTheme(e.newValue);
      if (e.key === LANG_KEY && (e.newValue === 'ar' || e.newValue === 'en')) setLang(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        theme,
        setTheme,
        toggleTheme,
        t: translations[lang],
        dir,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
