import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{
        opacity: 0,
        y: 50
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
            Opere opções binárias com{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              inteligência artificial
            </span>{" "}
            facilmente
          </h1>
          
          <motion.p initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">Comece agora com nossa IA que gera sinais 
com até 99% de assertividade.</motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.4
        }} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold min-w-[200px]">
              Abrir sua conta
            </Button>
            <Button variant="outline" size="lg" className="border-purple-500 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg min-w-[200px]">
              Ver demonstração
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.6
        }} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">75%</div>
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
    </section>;
}