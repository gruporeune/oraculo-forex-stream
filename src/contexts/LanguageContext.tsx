import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get saved language or default to Portuguese
    const savedLang = localStorage.getItem('oraculo-language') as Language;
    return savedLang || 'pt';
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTranslations(language);
    localStorage.setItem('oraculo-language', language);
  }, [language]);

  const loadTranslations = async (lang: Language) => {
    try {
      setIsLoading(true);
      const translationModule = await import(`../translations/${lang}.ts`);
      setTranslations(translationModule.default);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to Portuguese if other language fails
      if (lang !== 'pt') {
        try {
          const fallbackModule = await import('../translations/pt.ts');
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
          // Set empty translations if everything fails
          setTranslations({});
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // If translations are loading, return the key as fallback
    if (isLoading) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Replace parameters in the translation
    if (params) {
      let result: string = value;
      for (const [param, val] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
      }
      return result;
    }
    
    return value;
  };

  // Show loading screen while translations are being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};