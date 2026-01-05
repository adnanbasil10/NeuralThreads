'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '@/lib/utils/translation';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
  showLabel?: boolean;
}

export default function LanguageSwitcher({
  variant = 'default',
  className = '',
  showLabel = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language change
  const handleLanguageChange = async (lang: Language) => {
    if (lang === language) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    setLanguage(lang);

    // Optionally save to user profile via API
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languagePreference: lang.toUpperCase() }),
      });
    } catch (error) {
      // Silently fail - local storage is the primary source
      console.error('Failed to save language preference to profile:', error);
    }

    setIsSaving(false);
    setIsOpen(false);
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  // Compact variant - just icon
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Select language"
        >
          <Globe className="w-5 h-5 text-gray-600" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-50 ${
                  language === lang.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span>
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-gray-400 text-sm ml-2">{lang.name}</span>
                </span>
                {language === lang.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full variant - shows all languages as buttons
  if (variant === 'full') {
    return (
      <div className={`space-y-2 ${className}`}>
        {showLabel && (
          <label className="block text-sm font-medium text-gray-700">
            {t('settings.selectLanguage')}
          </label>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isSaving}
              className={`px-4 py-3 rounded-xl border-2 text-center transition-all ${
                language === lang.code
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-indigo-300 text-gray-700'
              }`}
            >
              <span className="block font-medium">{lang.nativeName}</span>
              <span className="block text-xs text-gray-500">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant - dropdown with current language
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isSaving}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        {showLabel && (
          <span className="text-sm text-gray-700">
            {currentLang?.nativeName || 'English'}
          </span>
        )}
        {isLoading || isSaving ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t('settings.selectLanguage')}
            </p>
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                language === lang.code ? 'bg-indigo-50' : ''
              }`}
            >
              <div>
                <span
                  className={`font-medium ${
                    language === lang.code ? 'text-indigo-600' : 'text-gray-900'
                  }`}
                >
                  {lang.nativeName}
                </span>
                <span className="text-gray-400 text-sm ml-2">({lang.name})</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}










