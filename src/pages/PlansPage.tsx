import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Gem, Diamond, Star } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';

const plans = [
  {
    name: "PARTNER",
    price: "R$ 200",
    originalPrice: "R$ 299",
    description: "Para resultados consistentes",
    icon: Star,
    features: [
      "20 sinais por dia",
      "0,5% lucro diário até 200%",
      "Área de membros exclusiva",
      "Suporte básico",
      "Análises de mercado",
      "Gestão de risco"
    ],
    popular: false,
    gradient: "from-green-600 to-green-400",
    borderColor: "border-green-500/50",
    buttonColor: "bg-green-600 hover:bg-green-700"
  },
  {
    name: "MASTER",
    price: "R$ 600",
    originalPrice: "R$ 899",
    description: "O plano dos profissionais",
    icon: Crown,
    features: [
      "100 sinais por dia",
      "1% lucro diário até 200%",
      "Área de membros VIP",
      "Suporte prioritário",
      "Análises técnicas avançadas",
      "Webinars exclusivos",
      "Relatórios personalizados"
    ],
    popular: false,
    gradient: "from-purple-600 to-purple-400",
    borderColor: "border-purple-500/50",
    buttonColor: "bg-purple-600 hover:bg-purple-700"
  },
  {
    name: "PREMIUM",
    price: "R$ 999",
    originalPrice: "R$ 1.299",
    description: "Para traders de alto volume",
    icon: Gem,
    features: [
      "500 sinais por dia",
      "1,5% lucro diário até 200%",
      "Área de membros Premium",
      "Grupo VIP Telegram",
      "Consultoria 1:1 mensal",
      "Estratégias personalizadas",
      "Acesso antecipado a novos recursos",
      "Suporte 24/7"
    ],
    popular: true,
    gradient: "from-blue-600 to-blue-400",
    borderColor: "border-blue-500/50",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  }
];

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePurchase = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Escolha Seu{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
            Plano
          </span>
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Cada plano foi desenvolvido para maximizar seus lucros no mercado de opções binárias com nossa IA avançada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="relative"
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                  MAIS POPULAR
                </div>
              </div>
            )}
            
            <Card className={`h-full bg-black/40 backdrop-blur-xl border-2 ${plan.borderColor} hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 ${plan.popular ? 'scale-105' : ''} group`}>
              <CardHeader className="text-center pb-4">
                <div className="mb-4">
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white">
                      {plan.price}
                    </div>
                    <div className="text-sm text-white/50 line-through">
                      {plan.originalPrice}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mt-2">
                    {plan.description}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-sm text-white/90">
                      <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className={`w-full ${plan.buttonColor} text-white font-semibold py-3 text-base hover:scale-105 transition-all duration-300`}
                  onClick={() => handlePurchase(plan)}
                >
                  ASSINAR AGORA
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-white/50">
                    Pagamento único • Acesso imediato
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
        />
      )}

    </motion.div>
  );
}