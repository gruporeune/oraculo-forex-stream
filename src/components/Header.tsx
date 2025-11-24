import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import oraculoLogo from "@/assets/oraculo-logo.png";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useI18n();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-400 backdrop-blur-md border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <img src={oraculoLogo} alt="Oráculo Logo" className="w-10 h-10" />
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-white tracking-wider">
                ORÁCULO
              </span>
              <span className="text-2xl font-bold text-white tracking-wider">
                OPTION
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-white/90 hover:text-white transition-colors"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection('resources')}
              className="text-white/90 hover:text-white transition-colors"
            >
              Recursos
            </button>
            <button
              onClick={() => scrollToSection('how-to-start')}
              className="text-white/90 hover:text-white transition-colors"
            >
              Como Começar
            </button>
            <LanguageSelector />
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => window.location.href = '/login'}
            >
              Entrar
            </Button>
            <Button 
              className="bg-white hover:bg-white/90 text-blue-600"
              onClick={() => window.location.href = '/register'}
            >
              Registrar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 pb-4 border-t border-border/50"
          >
            <nav className="flex flex-col space-y-4 mt-4">
              <button
                onClick={() => scrollToSection('benefits')}
                className="text-left text-white/90 hover:text-white transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('resources')}
                className="text-left text-white/90 hover:text-white transition-colors"
              >
                Recursos
              </button>
              <button
                onClick={() => scrollToSection('how-to-start')}
                className="text-left text-white/90 hover:text-white transition-colors"
              >
                Como Começar
              </button>
              <div className="flex items-center justify-between pt-2">
                <LanguageSelector />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                <Button 
                  variant="ghost" 
                  className="justify-start text-white hover:text-white hover:bg-white/20"
                  onClick={() => window.location.href = '/login'}
                >
                  Entrar
                </Button>
                <Button 
                  className="bg-white hover:bg-white/90 text-blue-600 justify-start"
                  onClick={() => window.location.href = '/register'}
                >
                  Registrar
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}