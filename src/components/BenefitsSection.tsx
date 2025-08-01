import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, Shield, Target } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "IA Avançada",
    description: "Algoritmos de machine learning que analisam milhões de dados em tempo real para identificar as melhores oportunidades de trading.",
  },
  {
    icon: Target,
    title: "99% de Assertividade",
    description: "Sinais comprovados com alta precisão para operações CALL e PUT em expirações de 1, 5 e 15 minutos.",
  },
  {
    icon: Zap,
    title: "Velocidade Extrema",
    description: "Análises ultrarrápidas que capturam oportunidades em milissegundos, antes que o mercado se mova.",
  },
  {
    icon: Shield,
    title: "Trading Automático",
    description: "O ORÁCULO opera por você 24/7, executando trades automáticos para maximizar seus lucros.",
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-16 sm:py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Por que escolher o{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              ORÁCULO
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Nossa inteligência artificial revoluciona a forma como você opera no mercado financeiro, 
            transformando complexidade em simplicidade e incerteza em lucro garantido.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="mb-6 mx-auto w-16 h-16 bg-gradient-to-br from-purple-600/20 to-purple-400/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-4 text-lg"
            onClick={() => window.location.href = '/register'}
          >
            Começar Agora
          </Button>
        </motion.div>
      </div>
    </section>
  );
}