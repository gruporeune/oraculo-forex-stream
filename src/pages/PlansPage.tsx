import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Gem, Diamond, Star } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { USDTPaymentModal } from '@/components/USDTPaymentModal';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { ManualPixPaymentModal } from '@/components/ManualPixPaymentModal';
import { useI18n } from '@/lib/i18n';

const plans = [
  {
    name: "PARTNER",
    price: "$36 USD",
    priceInReals: "R$ 198",
    originalPrice: "$50 USD",
    description: "plan.partner.description",
    icon: Star,
    features: [
      "20 feature.signals.day",
      "0,5% feature.profit.daily",
      "feature.members.area exclusiva",
      "feature.support.basic",
      "feature.market.analysis",
      "feature.risk.management"
    ],
    popular: false,
    gradient: "from-green-600 to-green-400",
    borderColor: "border-green-500/50",
    buttonColor: "bg-green-600 hover:bg-green-700",
    paymentType: "both"
  },
  {
    name: "MASTER",
    price: "$109 USD",
    priceInReals: "R$ 600",
    originalPrice: "$150 USD",
    description: "plan.master.description",
    icon: Crown,
    features: [
      "100 feature.signals.day",
      "1% feature.profit.daily",
      "feature.members.area VIP",
      "feature.support.priority",
      "feature.technical.analysis",
      "feature.webinars",
      "feature.reports"
    ],
    popular: true,
    gradient: "from-purple-600 to-purple-400",
    borderColor: "border-purple-500/50",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    paymentType: "both"
  },
  {
    name: "PREMIUM",
    price: "$500 USD",
    priceInReals: "R$ 2.750",
    originalPrice: "$687 USD",
    description: "plan.premium.description",
    icon: Gem,
    features: [
      "500 feature.signals.day",
      "1,5% feature.profit.daily",
      "feature.members.area Premium",
      "feature.telegram.vip",
      "feature.consultation mensal",
      "feature.strategies",
      "feature.early.access",
      "feature.support.24_7"
    ],
    popular: false,
    gradient: "from-blue-600 to-blue-400",
    borderColor: "border-blue-500/50",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    paymentType: "both" // Premium can pay with both PIX or USDT
  },
  {
    name: "PLATINUM",
    price: "$909 USD",
    priceInReals: "R$ 5.000",
    originalPrice: "$1250 USD",
    description: "plan.platinum.description",
    icon: Diamond,
    features: [
      "1000 feature.signals.day",
      "2% feature.profit.daily",
      "feature.members.area Platinum",
      "feature.consultation semanal",
      "Estratégias VIP exclusivas",
      "feature.early.access",
      "feature.support.vip",
      "feature.dedicated.analyst"
    ],
    popular: false,
    gradient: "from-slate-600 to-slate-400",
    borderColor: "border-slate-500/50",
    buttonColor: "bg-slate-600 hover:bg-slate-700",
    paymentType: "both" // Platinum can pay with both PIX or USDT
  }
];

export default function PlansPage() {
  const { t } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUSDTModalOpen, setIsUSDTModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isManualPixModalOpen, setIsManualPixModalOpen] = useState(false);

  const handlePurchase = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    
    if (plan.paymentType === 'both') {
      // Partner, Master, Premium and Platinum - show method selection
      setIsPaymentMethodModalOpen(true);
    } else if (plan.paymentType === 'usdt') {
      // International - direct USDT
      setIsUSDTModalOpen(true);
    } else {
      // Direct PIX only
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentMethodSelect = (method: 'pix' | 'usdt' | 'pix-manual') => {
    setIsPaymentMethodModalOpen(false);
    
    if (method === 'pix') {
      setIsPaymentModalOpen(true);
    } else if (method === 'usdt') {
      setIsUSDTModalOpen(true);
    } else if (method === 'pix-manual') {
      setIsManualPixModalOpen(true);
    }
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
          {t('plans.title')}{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
            
          </span>
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-6">
          {t('plans.subtitle')}
        </p>
        
        {/* Important Notice */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="text-yellow-400 font-bold text-lg">{t('plans.important')}</h3>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-white/90 text-base">
            {t('plans.important.text')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {t('plans.popular')}
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
                    {plan.priceInReals && (
                      <div className="text-lg font-semibold text-yellow-400">
                        {plan.priceInReals}
                      </div>
                    )}
                    <div className="text-sm text-white/50 line-through">
                      {plan.originalPrice}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mt-2">
                    {t(plan.description)}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                 <div className="space-y-3">
                   {plan.features.map((feature, i) => {
                     // Handle translation keys within feature strings
                     const translatedFeature = feature.replace(/feature\.[a-z.]+/g, (match) => t(match));
                     return (
                       <div key={i} className="flex items-center text-sm text-white/90">
                         <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                         <span>{translatedFeature}</span>
                       </div>
                     );
                   })}
                 </div>
                
                <Button
                  className={`w-full font-semibold py-3 text-base transition-all duration-300 ${plan.buttonColor} text-white hover:scale-105`}
                  onClick={() => handlePurchase(plan)}
                >
                  {t('plans.subscribe')}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-white/50">
                    {t('plans.payment.single')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Modals */}
      {selectedPlan && (
        <>
          <PaymentMethodModal
            isOpen={isPaymentMethodModalOpen}
            onClose={() => {
              setIsPaymentMethodModalOpen(false);
              setSelectedPlan(null);
            }}
            onSelectPaymentMethod={handlePaymentMethodSelect}
            plan={selectedPlan}
          />
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
          />
          <USDTPaymentModal
            isOpen={isUSDTModalOpen}
            onClose={() => {
              setIsUSDTModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
          />
          <ManualPixPaymentModal
            isOpen={isManualPixModalOpen}
            onClose={() => {
              setIsManualPixModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
          />
        </>
      )}

    </motion.div>
  );
}