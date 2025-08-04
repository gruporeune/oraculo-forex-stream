-- Reset Sofia's account (sofiaelise123@gmail.com)
-- Keep only referral commission earnings

-- First, get Sofia's user ID
DO $$
DECLARE
    sofia_user_id uuid;
BEGIN
    -- Get Sofia's user ID from auth.users
    SELECT id INTO sofia_user_id
    FROM auth.users 
    WHERE email = 'sofiaelise123@gmail.com';
    
    IF sofia_user_id IS NOT NULL THEN
        -- Reset her profile but keep referral commissions
        UPDATE public.profiles 
        SET 
            daily_signals_used = 0,
            daily_earnings = 0,
            -- Keep daily_commissions as they are referral earnings
            auto_operations_started = false,
            auto_operations_paused = false,
            auto_operations_completed_today = 0,
            last_reset_date = CURRENT_DATE,
            plan = 'free' -- Reset to free plan
        WHERE id = sofia_user_id;
        
        -- Delete all her automatic signals history
        DELETE FROM public.signals 
        WHERE user_id = sofia_user_id AND is_automatic = true;
        
        -- Delete all her earnings history (but keep commission history via user_referrals table)
        DELETE FROM public.daily_earnings_history 
        WHERE user_id = sofia_user_id;
        
        RAISE NOTICE 'Sofia account reset successfully, keeping referral commissions';
    ELSE
        RAISE NOTICE 'Sofia user not found';
    END IF;
END $$;

-- Add cycle_start_time to profiles table to persist countdown timer
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cycle_start_time timestamp with time zone;