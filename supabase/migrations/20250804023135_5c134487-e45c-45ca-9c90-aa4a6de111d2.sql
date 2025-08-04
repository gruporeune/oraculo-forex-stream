-- Reset all daily gains for user sofiaelise123@gmail.com
-- First, get the user ID from the auth.users table using the email
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for the email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sofiaelise123@gmail.com';
    
    -- Only proceed if user exists
    IF target_user_id IS NOT NULL THEN
        -- Reset profile data
        UPDATE public.profiles 
        SET 
            daily_earnings = 0,
            daily_commissions = 0,
            available_balance = 0,
            daily_signals_used = 0,
            auto_operations_started = false,
            auto_operations_paused = false,
            auto_operations_completed_today = 0,
            last_reset_date = CURRENT_DATE
        WHERE id = target_user_id;
        
        -- Clear daily earnings history
        DELETE FROM public.daily_earnings_history 
        WHERE user_id = target_user_id;
        
        -- Clear automatic signals from today
        DELETE FROM public.signals 
        WHERE user_id = target_user_id 
        AND is_automatic = true 
        AND created_at >= CURRENT_DATE;
        
        RAISE NOTICE 'Successfully reset data for user: sofiaelise123@gmail.com';
    ELSE
        RAISE NOTICE 'User sofiaelise123@gmail.com not found';
    END IF;
END
$$;