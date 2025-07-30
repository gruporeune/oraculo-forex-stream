import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { VideoModal } from "@/components/ui/video-modal";
import { useState } from "react";

export function HeroSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Headline section - positioned at top */}
        <div className="text-center mb-16 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="w-full max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight text-white">
              Opere opções binárias com a{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                inteligência artificial
              </span>{" "}
              mais assertiva do mercado financeiro
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.2 }} 
              className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Comece agora a usar o oráculo e ganhe 1% de lucro ao dia de forma automática ou gere sinais com até 99% de assertividade.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.4 }} 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold min-w-[200px]"
                onClick={() => window.location.href = '/register'}
              >
                Abrir sua conta
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-purple-500 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg min-w-[200px]"
                onClick={() => setIsVideoModalOpen(true)}
              >
                Ver demonstração
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.6 }} 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">99%</div>
                <div className="text-sm text-muted-foreground">Taxa de assertividade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Operação automática</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">1%</div>
                <div className="text-sm text-muted-foreground">Lucro diário garantido</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* New Hero Section with Spline */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full h-[500px] relative overflow-hidden rounded-lg"
        >
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />
          
          <div className="flex h-full bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
            {/* Left content */}
            <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                ORÁCULO IA
              </h2>
              <p className="mt-4 text-neutral-300 max-w-lg">
                Tecnologia avançada de inteligência artificial para maximizar seus lucros no mercado de opções binárias com precisão incomparável.
              </p>
            </div>

            {/* Right content - 3D Scene */}
            <div className="flex-1 relative">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <VideoModal 
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  );
}