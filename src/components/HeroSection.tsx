import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { InteractiveRobotSpline } from "@/components/ui/interactive-3d-robot";
import { VideoModal } from "@/components/ui/video-modal";
import { useState } from "react";

export function HeroSection() {
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content with responsive layout */}
      <div className="relative z-10 max-w-7xl mx-auto hero-responsive py-20">
        <div className="hero-content min-h-screen">
          {/* Text content */}
          <div className="hero-text text-white drop-shadow-lg pointer-events-none">
            <motion.div 
              initial={{
                opacity: 0,
                x: -50
              }} 
              animate={{
                opacity: 1,
                x: 0
              }} 
              transition={{
                duration: 0.8
              }} 
              className="pointer-events-auto"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-8 leading-tight">
                Opere opções binárias com a{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                  inteligência artificial
                </span>{" "}
                mais assertiva do mercado financeiro
              </h1>
              
              <motion.p 
                initial={{
                  opacity: 0,
                  x: -30
                }} 
                animate={{
                  opacity: 1,
                  x: 0
                }} 
                transition={{
                  duration: 0.8,
                  delay: 0.2
                }} 
                className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed"
              >
                Comece agora a usar o oráculo e ganhe até 2% de lucro ao dia de forma automática ou gere sinais com até 99% de assertividade.
              </motion.p>

              <motion.div 
                initial={{
                  opacity: 0,
                  x: -30
                }} 
                animate={{
                  opacity: 1,
                  x: 0
                }} 
                transition={{
                  duration: 0.8,
                  delay: 0.4
                }} 
                className="flex flex-col sm:flex-row gap-4 mb-16"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 sm:px-8 py-4 text-base sm:text-lg font-semibold min-w-[180px] sm:min-w-[200px]"
                  onClick={() => window.location.href = '/register'}
                >
                  Abrir sua conta
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 px-6 sm:px-8 py-4 text-base sm:text-lg min-w-[180px] sm:min-w-[200px]"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  Ver demonstração
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{
                  opacity: 0,
                  x: -30
                }} 
                animate={{
                  opacity: 1,
                  x: 0
                }} 
                transition={{
                  duration: 0.8,
                  delay: 0.6
                }} 
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl"
              >
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">99%</div>
                  <div className="text-sm text-muted-foreground">Taxa de assertividade</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Operação automática</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">2%</div>
                  <div className="text-sm text-muted-foreground">Até 2% lucro diário</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* 3D Robot */}
          <div className="hero-image">
            <motion.div
              initial={{
                opacity: 0,
                x: 50
              }} 
              animate={{
                opacity: 1,
                x: 0
              }} 
              transition={{
                duration: 0.8,
                delay: 0.3
              }}
              className="robot-container"
            >
              <InteractiveRobotSpline
                scene={ROBOT_SCENE_URL}
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal 
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  );
}