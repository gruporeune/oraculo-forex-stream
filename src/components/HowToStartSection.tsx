import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Crown, Gem, Diamond } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Escolha seu Plano",
    description: "Selecione o plano que melhor se adapta ao seu perfil de investimento e objetivos financeiros.",
  },
  {
    number: "02", 
    title: "Configure sua Conta",
    description: "Crie sua conta e configure os parâmetros de risco de acordo com sua estratégia de trading.",
  },
  {
    number: "03",
    title: "Ative a IA",
    description: "Ative o ORÁCULO e deixe nossa inteligência artificial trabalhar para você 24/7.",
  },
  {
    number: "04",
    title: "Acompanhe os Resultados",
    description: "Monitore seus lucros em tempo real através do dashboard completo e relatórios detalhados.",
  },
];

const plans = [
  {
    name: "FREE",
    price: "Gratuito",
    description: "Experimente o poder do ORÁCULO",
    icon: Star,
    features: ["5 sinais por dia", "Link de referência", "Suporte básico"],
    color: "border-muted",
    buttonVariant: "outline" as const,
  },
  {
    name: "PARTNER", 
    price: "R$ 200",
    description: "Para resultados consistentes",
    icon: Check,
    features: ["20 sinais por dia", "0,5% lucro diário até 200%", "Área de membros", "Suporte básico"],
    color: "border-green-500",
    buttonVariant: "outline" as const,
  },
  {
    name: "MASTER",
    price: "R$ 600",
    description: "O plano dos profissionais",
    icon: Crown, 
    features: ["100 sinais por dia", "1% lucro diário até 200%", "Área de membros", "Suporte prioritário"],
    color: "border-purple-500",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "INTERNATIONAL",
    price: "$100 USD",
    description: "Para traders internacionais",
    icon: Crown,
    features: ["100 sinais por dia", "1% lucro diário até 200%", "Área de membros VIP", "Suporte prioritário"],
    color: "border-cyan-500",
    buttonVariant: "outline" as const,
  },
  {
    name: "PREMIUM",
    price: "$458 USD",
    priceInReals: "R$ 2.750", 
    description: "Para traders de alto volume",
    icon: Gem,
    features: ["500 sinais por dia", "1,5% lucro diário até 200%", "Área de membros Premium", "Grupo VIP"],
    color: "border-blue-500",
    buttonVariant: "outline" as const,
  },
  {
    name: "PLATINUM",
    price: "$833 USD",
    priceInReals: "R$ 5.000",
    description: "O máximo em trading automatizado",
    icon: Diamond,
    features: ["1000 sinais por dia", "2% lucro diário até 200%", "Área de membros Platinum", "Analista dedicado"],
    color: "border-slate-500",
    buttonVariant: "outline" as const,
  },
];

export function HowToStartSection() {
  return (
    <section id="how-to-start" className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Steps Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Como{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              Começar
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Em apenas 4 passos simples você estará operando com a mais avançada IA do mercado financeiro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-600/50 to-transparent -translate-y-0.5"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl lg:text-4xl font-bold mb-6">
            Escolha Seu{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              Plano
            </span>
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada plano foi desenvolvido para maximizar seus lucros no mercado de opções binárias.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
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
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                </div>
              )}
              
              <Card className={`h-full ${plan.color} border-2 hover:shadow-lg transition-all duration-300 ${plan.popular ? 'scale-105' : ''}`}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <plan.icon className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                    <h4 className="text-xl font-bold">{plan.name}</h4>
                    <div className="text-2xl font-bold mt-2">{plan.price}</div>
                    {plan.priceInReals && (
                      <div className="text-sm font-semibold text-yellow-600 mt-1">
                        {plan.priceInReals}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-left">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full ${plan.buttonVariant === 'default' 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white' 
                      : 'border-purple-500 text-purple-600 hover:bg-purple-50'
                    }`}
                    onClick={() => window.location.href = '/register'}
                  >
                    {plan.name === 'FREE' ? 'COMEÇAR GRÁTIS' : 'ASSINAR AGORA'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}