import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Gem, Diamond, Star } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { USDTPaymentModal } from '@/components/USDTPaymentModal';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PlansPage() {
  const { t } = useLanguage();

  const plans = [
    {
      name: "PARTNER",
      price: "R$ 200",
      priceUSD: "$33 USD",
      originalPrice: "R$ 299",
      originalPriceUSD: "$50 USD",
      description: t('plans.planTypes.partner.description'),
      icon: Star,
      features: [
        `20 ${t('plans.features.dailySignals')}`,
        `0,5% ${t('plans.features.dailyProfit')}`,
        t('plans.features.exclusiveMembers'),
        t('plans.features.basicSupport'),
        t('plans.features.marketAnalysis'),
        t('plans.features.riskManagement')
      ],
      popular: false,
      gradient: "from-green-600 to-green-400",
      borderColor: "border-green-500/50",
      buttonColor: "bg-green-600 hover:bg-green-700",
      paymentType: "both"
    },
    {
      name: "MASTER",
      price: "R$ 600",
      priceUSD: "$100 USD",
      originalPrice: "R$ 899",
      originalPriceUSD: "$150 USD",
      description: t('plans.planTypes.master.description'),
      icon: Crown,
      features: [
        `100 ${t('plans.features.dailySignals')}`,
        `1% ${t('plans.features.dailyProfit')}`,
        t('plans.features.vipMembers'),
        t('plans.features.prioritySupport'),
        t('plans.features.advancedAnalysis'),
        t('plans.features.exclusiveWebinars'),
        t('plans.features.customReports')
      ],
      popular: true,
      gradient: "from-purple-600 to-purple-400",
      borderColor: "border-purple-500/50",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      paymentType: "both"
    },
    {
      name: "PREMIUM",
      price: "$458 USD",
      priceInReals: "R$ 2.750",
      originalPrice: "$687 USD",
      description: t('plans.planTypes.premium.description'),
      icon: Gem,
      features: [
        `500 ${t('plans.features.dailySignals')}`,
        `1,5% ${t('plans.features.dailyProfit')}`,
        t('plans.features.premiumMembers'),
        t('plans.features.vipTelegram'),
        t('plans.features.monthlyConsulting'),
        t('plans.features.customStrategies'),
        t('plans.features.earlyAccess'),
        t('plans.features.support247')
      ],
      popular: false,
      gradient: "from-blue-600 to-blue-400",
      borderColor: "border-blue-500/50",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      paymentType: "both"
    },
    {
      name: "PLATINUM",
      price: "$833 USD",
      priceInReals: "R$ 5.000",
      originalPrice: "$1250 USD",
      description: t('plans.planTypes.platinum.description'),
      icon: Diamond,
      features: [
        `1000 ${t('plans.features.dailySignals')}`,
        `2% ${t('plans.features.dailyProfit')}`,
        t('plans.features.platinumMembers'),
        t('plans.features.weeklyConsulting'),
        t('plans.features.vipStrategies'),
        t('plans.features.betaAccess'),
        t('plans.features.prioritySupport247'),
        t('plans.features.personalAnalyst')
      ],
      popular: false,
      gradient: "from-slate-600 to-slate-400",
      borderColor: "border-slate-500/50",
      buttonColor: "bg-slate-600 hover:bg-slate-700",
      paymentType: "both"
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUSDTModalOpen, setIsUSDTModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);

  const handlePurchase = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    
    if (plan.paymentType === 'both') {
      // Premium and Platinum - show method selection
      setIsPaymentMethodModalOpen(true);
    } else if (plan.paymentType === 'usdt') {
      // International - direct USDT
      setIsUSDTModalOpen(true);
    } else {
      // Partner and Master - direct PIX
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentMethodSelect = (method: 'pix' | 'usdt') => {
    setIsPaymentMethodModalOpen(false);
    
    if (method === 'pix') {
      setIsPaymentModalOpen(true);
    } else {
      setIsUSDTModalOpen(true);
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
            {t('plans.planWord')}
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
            {t('plans.multipleAccounts')} <span className="font-bold text-yellow-400">{t('plans.accountsPerPlan')}</span>, {t('plans.buyOneAtTime')} <span className="font-bold text-yellow-400">{t('plans.oneAtATime')}</span>. 
            {t('plans.afterPayment')}
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
                  {t('plans.mostPopular')}
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
                    {plan.priceUSD ? (
                      <>
                        <div className="text-3xl font-bold text-white">
                          {plan.priceUSD}
                        </div>
                        <div className="text-lg font-semibold text-yellow-400">
                          {plan.price}
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-white">
                        {plan.price}
                      </div>
                    )}
                    {plan.priceInReals && (
                      <div className="text-lg font-semibold text-yellow-400">
                        {plan.priceInReals}
                      </div>
                    )}
                    <div className="text-sm text-white/50 line-through">
                      {plan.originalPrice}
                      {plan.originalPriceUSD && (
                        <div>{plan.originalPriceUSD}</div>
                      )}
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
                  className={`w-full font-semibold py-3 text-base transition-all duration-300 ${plan.buttonColor} text-white hover:scale-105`}
                  onClick={() => handlePurchase(plan)}
                >
                  {t('plans.subscribeNow')}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-white/50">
                    {t('plans.singlePayment')} • {t('plans.immediateAccess')}
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
        </>
      )}

    </motion.div>
  );
}