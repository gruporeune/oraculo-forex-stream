import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { ResourcesSection } from "@/components/ResourcesSection";
import { HowToStartSection } from "@/components/HowToStartSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ReferralSection } from "@/components/ReferralSection";
import { VideoSection } from "@/components/VideoSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <BenefitsSection />
      <ResourcesSection />
      <HowToStartSection />
      <TestimonialsSection />
      <ReferralSection />
      <VideoSection />
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              ORÁCULO
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            A revolução da inteligência artificial aplicada ao mercado financeiro.
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 O ORÁCULO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}