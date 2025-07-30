import { GradientCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Gem, Diamond } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    price: "Gratuito",
    description: "Experimente o poder do ORÁCULO",
    icon: Star,
    features: [
      "5 sinais por dia",
      "Link de referência (10% comissão)",
      "Suporte básico"
    ],
    excluded: [
      "Rentabilização diária",
      "Grupo VIP",
      "Área de membros"
    ],
    color: "text-muted-foreground",
    borderColor: "border-muted",
    route: "/register/free"
  },
  {
    name: "PARTNER",
    price: "$20",
    description: "Para quem quer resultados consistentes",
    icon: Check,
    features: [
      "20 sinais por dia",
      "1% lucro diário até 200%",
      "Link de referência (10% comissão)",
      "Grupo VIP exclusivo",
      "Área de membros completa",
      "Cursos e mentorias gratuitas"
    ],
    excluded: [],
    color: "text-cyber",
    borderColor: "border-cyber",
    route: "/register/partner"
  },
  {
    name: "MASTER",
    price: "$100",
    description: "O plano dos profissionais",
    icon: Crown,
    features: [
      "100 sinais por dia",
      "1% lucro diário até 200%",
      "Link de referência (10% comissão)",
      "Grupo VIP exclusivo",
      "Área de membros completa",
      "Cursos e mentorias gratuitas",
      "Suporte prioritário"
    ],
    excluded: [],
    color: "text-gold",
    borderColor: "border-gold",
    popular: true,
    route: "/register/master"
  },
  {
    name: "PREMIUM",
    price: "$500",
    description: "Para traders de alto volume",
    icon: Gem,
    features: [
      "500 sinais por dia",
      "1% lucro diário até 200%",
      "Link de referência (10% comissão)",
      "Grupo VIP exclusivo",
      "Área de membros completa",
      "Cursos e mentorias gratuitas",
      "Suporte VIP 24/7"
    ],
    excluded: [],
    color: "text-neon",
    borderColor: "border-neon",
    route: "/register/premium"
  },
  {
    name: "PLATINUM",
    price: "$1,000",
    description: "O máximo em performance",
    icon: Diamond,
    features: [
      "1000 sinais por dia",
      "1% lucro diário até 200%",
      "Link de referência (10% comissão)",
      "Grupo VIP exclusivo",
      "Área de membros completa",
      "Cursos e mentorias gratuitas",
      "Suporte dedicado 24/7",
      "Sessões de mentoria 1:1"
    ],
    excluded: [],
    color: "text-gradient-primary",
    borderColor: "border-gradient-primary",
    route: "/register/platinum"
  }
];

export function PlansSection() {
  const navigate = useNavigate();

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
            Escolha Seu Plano
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cada plano foi desenvolvido para maximizar seus lucros no mercado de opções binárias. 
            Quanto maior o plano, maiores são os benefícios e oportunidades de ganho.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-primary text-black font-bold px-4 py-1">
                    MAIS POPULAR
                  </Badge>
                </div>
              )}
              
              <GradientCard className="mx-auto">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-50">
                    <Badge className="bg-gradient-primary text-black font-bold px-4 py-1">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}

                {/* Icon circle */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  <plan.icon className="w-8 h-8 text-gold" />
                </div>

                {/* Content */}
                <div className="mb-auto">
                  <h3 className="text-2xl font-medium text-white mb-3">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-gold mb-2">
                    {plan.price}
                  </div>
                  <p className="text-sm mb-6 text-gray-300">
                    {plan.description}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {plan.excluded.map((excluded, i) => (
                      <div key={i} className="flex items-center gap-3 opacity-50">
                        <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-500 line-through">{excluded}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => navigate(plan.route)}
                  className={`w-full ${plan.name === 'MASTER' 
                    ? 'bg-gradient-primary text-black hover:shadow-glow' 
                    : 'border-2 border-gold text-gold bg-transparent hover:bg-gold/10'
                  } transition-all duration-300 mt-auto`}
                  variant={plan.name === 'MASTER' ? 'default' : 'outline'}
                >
                  {plan.name === 'FREE' ? 'COMEÇAR GRÁTIS' : 'ASSINAR AGORA'}
                </Button>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}