import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { MovingSpotlight } from "@/components/ui/moving-spotlight";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ParticleTextEffect } from "@/components/ui/interactive-text-particle";
import { GradualSpacing } from "@/components/ui/gradual-spacing";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Card className="w-full max-w-7xl mx-auto bg-background/5 backdrop-blur-3xl border-gold/20 relative overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="var(--gold)"
        />
        <MovingSpotlight />
        
        <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
          {/* Left content */}
          <div className="flex-1 p-8 lg:p-12 relative z-10 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-6 flex justify-center">
                <ParticleTextEffect
                  text="O ORÁCULO PRO"
                  colors={['ffad70', 'f7d297', 'edb9a1', 'e697ac', 'b38dca']}
                  className="mx-auto"
                />
              </div>
              <div className="mb-8">
                <GradualSpacing
                  text="A revolução chegou! Pare de quebrar a cabeça operando e perdendo dinheiro. Nossa IA de alta precisão gera sinais assertivos que transformam traders iniciantes em verdadeiros oráculos do mercado financeiro."
                  className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl"
                  delayMultiple={0.02}
                />
              </div>
              <p className="text-lg text-gold mb-8 font-semibold">
                🎯 Sinais com 75% de assertividade<br/>
                🤖 Operações 100% automatizadas<br/>
                💰 Lucros diários garantidos
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary text-black font-bold px-8 py-4 text-lg hover:shadow-glow transition-all duration-300"
                >
                  COMEÇAR AGORA
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gold text-gold hover:bg-gold/10 px-8 py-4 text-lg"
                >
                  VER DEMONSTRAÇÃO
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right content - 3D Scene */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="w-full h-full"
            >
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      </Card>
    </section>
  );
}