-- Fix commission logic and remove fake earnings history
DO $$
DECLARE
    leandrom_id uuid;
    anavic_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO leandrom_id FROM auth.users WHERE email = 'leandrom123@gmail.com';
    SELECT id INTO anavic_id FROM auth.users WHERE email = 'anavic123@gmail.com';
    
    -- Remove fake earnings history from leandrom123
    IF leandrom_id IS NOT NULL THEN
        DELETE FROM public.daily_earnings_history 
        WHERE user_id = leandrom_id;
        
        RAISE NOTICE 'Removed fake earnings history for leandrom123@gmail.com';
    END IF;
    
    -- Remove fake earnings history from anavic123 and fix commissions
    IF anavic_id IS NOT NULL THEN
        -- Remove any fake earnings history that was added today
        DELETE FROM public.daily_earnings_history 
        WHERE user_id = anavic_id 
        AND date = CURRENT_DATE 
        AND plan_earnings::text LIKE '%partner%';
        
        -- Fix the commission calculation - should be 275 for premium plan, not 550
        -- Reset total_referral_commissions to correct amount
        UPDATE public.profiles 
        SET 
            total_referral_commissions = 275.0,  -- 10% of premium plan (2750)
            available_balance = available_balance - 275.0,  -- Remove the extra 275 that was wrongly added
            daily_referral_commissions = 275.0,
            updated_at = now()
        WHERE id = anavic_id;
        
        -- Fix the user_referrals table - should be 275 for premium plan
        UPDATE public.user_referrals 
        SET commission_earned = 275.0
        WHERE referrer_id = anavic_id AND referred_id = leandrom_id;
        
        RAISE NOTICE 'Fixed commission logic for anavic123@gmail.com - now shows correct 275 for premium referral';
    END IF;
END $$;