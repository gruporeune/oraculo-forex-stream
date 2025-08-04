-- Reset Sofia's account and ensure 3-level commission system is working
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for Sofia
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sofiaelise123@gmail.com';
    
    -- Only proceed if user exists
    IF target_user_id IS NOT NULL THEN
        -- Reset all daily operations and keep only direct referral commissions
        UPDATE public.profiles 
        SET 
            daily_earnings = 0,
            auto_operations_completed_today = 0,
            auto_operations_started = false,
            auto_operations_paused = false,
            available_balance = (
                -- Keep only direct referral commissions (level 1)
                SELECT COALESCE(SUM(commission_earned), 0)
                FROM public.user_referrals 
                WHERE referrer_id = target_user_id
            ),
            daily_commissions = 0
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Sofia account reset with only direct referral commissions preserved';
    ELSE
        RAISE NOTICE 'User sofiaelise123@gmail.com not found';
    END IF;
END
$$;