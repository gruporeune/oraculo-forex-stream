import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCards } from '@/components/DashboardCards';
import MultiPlanAutomaticSignals from '@/components/MultiPlanAutomaticSignals';
import { EarningsHistory } from '@/components/EarningsHistory';
import { useI18n } from '@/lib/i18n';
import { BrokersCarousel } from '@/components/BrokersCarousel';
import { BrazilianStocksCarousel } from '@/components/BrazilianStocksCarousel';
import { useToast } from '@/hooks/use-toast';

interface DashboardHomePageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export default function DashboardHomePage({ user, profile, onProfileUpdate }: DashboardHomePageProps) {
  const { t } = useI18n();
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
      className="space-y-3 md:space-y-4 lg:space-y-6 bg-white rounded-lg p-3 md:p-4 lg:p-6 max-w-full overflow-hidden"
    >
      <DashboardCards
        profile={profile} 
        userPlans={userPlans}
        onWithdraw={handleWithdraw}
      />

      {/* Broker Carousel Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        <BrokersCarousel />
      </motion.div>

      {/* Brazilian Stocks Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-8"
      >
        <BrazilianStocksCarousel />
      </motion.div>

      {/* Multiple Plans Automatic Operations */}
      <MultiPlanAutomaticSignals 
        user={user}
        userPlans={userPlans}
        onPlansUpdate={loadUserPlans}
      />

      {/* Earnings History */}
      <EarningsHistory userId={user?.id} />
    </motion.div>
  );
}
