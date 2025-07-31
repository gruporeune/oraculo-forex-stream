import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCards } from '@/components/DashboardCards';
import { AutomaticSignals } from '@/components/AutomaticSignals';
import { useToast } from '@/hooks/use-toast';

interface DashboardHomePageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export default function DashboardHomePage({ user, profile, onProfileUpdate }: DashboardHomePageProps) {
  const { toast } = useToast();

  const handleWithdraw = () => {
    toast({
      title: "Solicitação de saque",
      description: "Sua solicitação foi enviada para análise. Você receberá uma confirmação em breve.",
    });
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
        onWithdraw={handleWithdraw}
      />

      <AutomaticSignals 
        userPlan={profile?.plan || 'free'}
        onEarningsGenerated={handleEarningsGenerated}
      />
    </motion.div>
  );
}