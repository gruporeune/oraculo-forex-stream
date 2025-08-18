import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDailySignalsReset = (userId: string) => {
  useEffect(() => {
    if (!userId) return;

    const checkAndResetSignals = async () => {
      try {
        // Get current user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_signals_used, last_reset_date, plan')
          .eq('id', userId)
          .single();

        if (!profile) return;

        // Calculate current date in Brazil timezone (UTC-3)
        const now = new Date();
        const brasilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
        const brasilToday = brasilNow.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Get the user's last reset date in Brazil timezone
        const lastResetDate = profile.last_reset_date;

        // If it's a new day in Brazil, trigger an update to reset signals
        if (lastResetDate !== brasilToday) {
          // Just update the profile - the trigger will handle the reset
          await supabase
            .from('profiles')
            .update({ 
              // Just touch the updated_at field to trigger the reset function
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      } catch (error) {
        console.error('Error checking daily signals reset:', error);
      }
    };

    // Check immediately
    checkAndResetSignals();

    // Set up interval to check every 6 hours to reduce database load
    const interval = setInterval(checkAndResetSignals, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(interval);
  }, [userId]);
};