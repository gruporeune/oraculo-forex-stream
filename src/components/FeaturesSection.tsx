import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Brain, TrendingUp, Shield, Zap, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "IA Avançada",
    description: "Algoritmos de machine learning que analisam milhões de dados em tempo real para identificar as melhores oportunidades."
  },
  {
    icon: TrendingUp,
    title: "Sinais Precisos",
    description: "75% de assertividade comprovada com sinais para CALL e PUT em expirações de 1, 5 e 15 minutos."
  },
  {
    icon: Shield,
    title: "Trading Automático",
    description: "O ORÁCULO opera por você 24/7, executando trades automáticos para maximizar seus lucros."
  },
  {
    icon: Zap,
    title: "Velocidade Extrema",
    description: "Análises ultrarrápidas que capturam oportunidades em milissegundos, antes que o mercado se mova."
  },
  {
    icon: Users,
    title: "Sistema MLM",
    description: "Ganhe 10% de comissão indicando novos usuários e construa uma rede de renda passiva."
  },
  {
    icon: Trophy,
    title: "Rentabilidade Diária",
    description: "Receba 1% de lucro diário sobre seu investimento até atingir 200% de retorno total."
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-primary mb-6">
            Por que escolher o ORÁCULO?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Nossa inteligência artificial revoluciona a forma como você opera no mercado financeiro, 
            transformando complexidade em simplicidade e incerteza em lucro garantido.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <CardSpotlight className="h-full" color="#FFD700">
                <div className="text-center">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                    <feature.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}