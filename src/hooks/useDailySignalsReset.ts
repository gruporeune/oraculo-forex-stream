import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDailySignalsReset = (userId: string) => {
  const lastCheckRef = useRef<string>('');
  
  useEffect(() => {
    if (!userId) return;

    const checkAndResetSignals = async () => {
      try {
        // Calculate current date in Brazil timezone (UTC-3)
        const now = new Date();
        const brasilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
        const brasilToday = brasilNow.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Skip if we already checked today
        if (lastCheckRef.current === brasilToday) {
          return;
        }

        // Get current user profile - only the necessary fields
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_reset_date')
          .eq('id', userId)
          .maybeSingle();

        if (!profile) return;

        // If it's a new day in Brazil, trigger an update to reset signals
        if (profile.last_reset_date !== brasilToday) {
          // Just update the profile - the trigger will handle the reset
          await supabase
            .from('profiles')
            .update({ 
              // Just touch the updated_at field to trigger the reset function
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }

        // Mark this date as checked
        lastCheckRef.current = brasilToday;
      } catch (error) {
        console.error('Error checking daily signals reset:', error);
      }
    };

    // Check immediately
    checkAndResetSignals();

    // Set up interval to check every 6 hours instead of every hour
    const interval = setInterval(checkAndResetSignals, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(interval);
  }, [userId]);
};