import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <span className="text-3xl font-bold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400 tracking-wider">
              O ORÁCULO
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection('resources')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Recursos
            </button>
            <button
              onClick={() => scrollToSection('how-to-start')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Começar
            </button>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="w-4 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-sm"></span>
              <span>Português</span>
            </div>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/login'}
            >
              Entrar
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
              onClick={() => window.location.href = '/register'}
            >
              Registrar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
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
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('resources')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Recursos
              </button>
              <button
                onClick={() => scrollToSection('how-to-start')}
                className="text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Começar
              </button>
              <div className="flex flex-col space-y-2 pt-4">
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => window.location.href = '/login'}
                >
                  Entrar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white justify-start"
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