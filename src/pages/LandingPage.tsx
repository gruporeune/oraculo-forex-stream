import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { VideoSection } from "@/components/VideoSection";
import { PlansSection } from "@/components/PlansSection";
import { BinaryFloatingElements } from "@/components/BinaryFloatingElements";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-background/50 relative overflow-hidden">
      <BinaryFloatingElements />
      
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <VideoSection />
        <PlansSection />
        
        {/* Footer */}
        <footer className="py-12 px-4 border-t border-gold/20">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-primary mb-4">
              O ORÁCULO PRO
            </h3>
            <p className="text-muted-foreground mb-4">
              A revolução da inteligência artificial aplicada ao mercado financeiro.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 O ORÁCULO PRO. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}