import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCards } from '@/components/DashboardCards';
import MultiPlanAutomaticSignals from '@/components/MultiPlanAutomaticSignals';
import { EarningsHistory } from '@/components/EarningsHistory';
import { useToast } from '@/hooks/use-toast';

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
        <div className="flex items-center justify-center gap-8 max-w-4xl mx-auto">
          {/* Logo Card - Reduzido 6x */}
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer flex-shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-900/80 to-purple-700/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 hover:border-purple-400/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src="/lovable-uploads/bd5c3c52-6bcd-4d40-b489-1c9a7cb7ba3c.png" 
                  alt="BullTec" 
                  className="h-24 w-auto object-contain"
                />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-sm font-bold text-white">BullTec</h4>
                <p className="text-purple-200 text-xs">
                  A corretora oficial recomendada pelo ORÁCULO
                </p>
              </div>
              <div className="absolute top-1 right-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Texto ao lado */}
          <div className="flex-1 text-left">
            <h3 className="text-4xl font-black text-white mb-2 tracking-tight">
              Corretora indicada com mais de{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600 font-black">
                93% de chances de acertos
              </span>
            </h3>
            <p className="text-white/70 text-lg font-medium">
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