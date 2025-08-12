import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCards } from '@/components/DashboardCards';
import MultiPlanAutomaticSignals from '@/components/MultiPlanAutomaticSignals';
import { EarningsHistory } from '@/components/EarningsHistory';

import { useToast } from '@/hooks/use-toast';
import { Tilt } from '@/components/ui/tilt';
import { Spotlight } from '@/components/ui/spotlight';

interface DashboardHomePageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export default function DashboardHomePage({ user, profile, onProfileUpdate }: DashboardHomePageProps) {
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadUserPlans();
    }
  }, [user?.id]);

  const loadUserPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserPlans(data || []);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

  const handleWithdraw = () => {
    window.location.href = '/dashboard/withdrawals';
  };

  const handleEarningsGenerated = async (amount: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_earnings: (profile?.daily_earnings || 0) + amount,
          available_balance: (profile?.available_balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      onProfileUpdate();
      
      toast({
        title: "Lucro gerado!",
        description: `+$${amount.toFixed(2)} adicionado ao seu saldo`,
      });
    } catch (error) {
      console.error('Error updating earnings:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Bem-vindo ao ORÁCULO! 🎉
        </h2>
        <p className="text-white/70">
          Sua jornada para operar com inteligência artificial começa aqui.
        </p>
      </div>


      <DashboardCards 
        profile={profile} 
        userPlans={userPlans}
        onWithdraw={handleWithdraw}
      />

      {/* Broker Recommendation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto px-4">
          {/* Logo Card with Tilt Effect */}
          <div className="flex-shrink-0">
            <Tilt
              rotationFactor={8}
              isRevese
              style={{
                transformOrigin: 'center center',
              }}
              springOptions={{
                stiffness: 26.7,
                damping: 4.1,
                mass: 0.2,
              }}
              className="group relative rounded-lg"
            >
              <Spotlight
                className="z-10 from-white/50 via-white/20 to-white/10 blur-2xl"
                size={200}
                springOptions={{
                  stiffness: 26.7,
                  damping: 4.1,
                  mass: 0.2,
                }}
              />
              <div className="relative bg-gradient-to-br from-purple-900/80 to-purple-700/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 hover:border-purple-400/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src="/lovable-uploads/bd5c3c52-6bcd-4d40-b489-1c9a7cb7ba3c.png" 
                    alt="BullTec" 
                    className="h-16 w-auto object-contain md:h-20"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <h4 className="text-xs md:text-sm font-bold text-white">BullTec</h4>
                  <p className="text-purple-200 text-[10px] md:text-xs max-w-[120px]">
                    A corretora oficial recomendada pelo ORÁCULO
                  </p>
                </div>
                <div className="absolute top-1 right-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Tilt>
          </div>

          {/* Texto ao lado */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
              Corretora indicada com mais de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600 font-black">
                93% de chances de acertos
              </span>
            </h3>
            <p className="text-white/70 text-sm md:text-lg font-medium">
              Faça um cadastro na corretora oficial do ORÁCULO
            </p>
          </div>
        </div>
      </motion.div>

      <MultiPlanAutomaticSignals 
        user={user}
        userPlans={userPlans}
        onPlansUpdate={loadUserPlans}
      />

      <EarningsHistory userId={user?.id} />
    </motion.div>
  );
}