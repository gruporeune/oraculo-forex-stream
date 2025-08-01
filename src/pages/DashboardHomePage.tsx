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
        onWithdraw={handleWithdraw}
      />

      {/* Broker Recommendation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h3 className="text-2xl font-bold text-white mb-2">
          Corretora indicada com mais de{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">
            93% de chances de acertos
          </span>
        </h3>
        <p className="text-white/70 text-lg mb-6">
          Faça um cadastro na:
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05, rotateY: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer max-w-md mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-br from-purple-900/80 to-purple-700/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/819c852d-f577-4e95-b31a-c385b16a271e.png" 
                alt="Mimos Broker" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">Mimos Broker</h4>
              <p className="text-purple-200 text-sm">
                A corretora oficial recomendada pelo ORÁCULO
              </p>
            </div>
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AutomaticSignals 
        userPlan={profile?.plan || 'free'}
        onEarningsGenerated={handleEarningsGenerated}
      />
    </motion.div>
  );
}