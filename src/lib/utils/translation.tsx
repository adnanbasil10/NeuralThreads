'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Supported languages
export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te';

export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'neural_threads_language';

// Translation cache
const translationCache: Record<Language, Record<string, any>> = {
  en: {},
  hi: {},
  kn: {},
  ta: {},
  te: {},
};

/**
 * Load translations for a specific language
 */
export async function loadTranslations(lang: Language): Promise<Record<string, any>> {
  // Return from cache if available
  if (Object.keys(translationCache[lang]).length > 0) {
    return translationCache[lang];
  }

  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    const translations = await response.json();
    translationCache[lang] = translations;
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    // Fallback to English if loading fails
    if (lang !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

/**
 * Get the current language from localStorage or browser
 */
export function getCurrentLanguage(): Language {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored as Language;
    }

    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
      return browserLang as Language;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Set the language preference
 */
export function setLanguagePreference(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate variables in translation string
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

// Translation Context
interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

/**
 * Translation Provider Component
 */
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initLang = getCurrentLanguage();
    setLanguageState(initLang);
  }, []);

  // Load translations when language changes (only on client)
  // Only reload if translations are not already cached
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if translations are already loaded for this language
    if (Object.keys(translationCache[language]).length > 0 && Object.keys(translations).length > 0) {
      // Translations already loaded, no need to fetch again
      return;
    }
    
    setIsLoading(true);
    loadTranslations(language)
      .then((trans) => {
        setTranslations(trans);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [language, translations]);

  // Listen for language change events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguageState(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguagePreference(lang);
    setLanguageState(lang);
  }, []);

  // Memoize translation function to prevent unnecessary re-renders
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(translations, key);
      if (value) {
        return interpolate(value, params);
      }
      // Return the key if translation is not found
      return key;
    },
    [translations]
  );

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * useTranslation hook
 */
export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    // Return a fallback if used outside provider
    return {
      language: DEFAULT_LANGUAGE as Language,
      setLanguage: () => {},
      t: (key: string) => key,
      isLoading: false,
    };
  }

  return context;
}

/**
 * Standalone translation function for server components
 */
export async function getTranslation(lang: Language, key: string, params?: Record<string, string | number>): Promise<string> {
  const translations = await loadTranslations(lang);
  const value = getNestedValue(translations, key);
  if (value) {
    return interpolate(value, params);
  }
  return key;
}

export { TranslationContext };


