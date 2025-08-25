import React from 'react';
import { Languages, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const languages = [
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
          <Globe className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
          <span className="md:hidden">
            {currentLanguage?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className="text-white hover:bg-white/10 cursor-pointer"
            onClick={() => setLanguage(lang.code)}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
            {language === lang.code && (
              <span className="ml-auto text-purple-400">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};