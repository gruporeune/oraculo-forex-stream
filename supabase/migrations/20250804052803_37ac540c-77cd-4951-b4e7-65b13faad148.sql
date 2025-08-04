-- Reset Vitin's account for testing
-- Get Vitin's user ID and reset his daily stats and auto operations

DO $$
DECLARE
    vitin_user_id uuid;
BEGIN
    -- Get Vitin's user ID from auth.users
    SELECT id INTO vitin_user_id
    FROM auth.users 
    WHERE email = 'vitincastro123@gmail.com';
    
    IF vitin_user_id IS NOT NULL THEN
        -- Reset his daily stats and auto operations
        UPDATE public.profiles 
        SET 
            daily_signals_used = 0,
            daily_earnings = 0,
            daily_commissions = 0,
            auto_operations_started = false,
            auto_operations_paused = false,
            auto_operations_completed_today = 0,
            cycle_start_time = null,
            last_reset_date = CURRENT_DATE
        WHERE id = vitin_user_id;
        
        -- Delete his daily earnings history
        DELETE FROM public.daily_earnings_history
        WHERE user_id = vitin_user_id;
        
        -- Delete his signals
        DELETE FROM public.signals
        WHERE user_id = vitin_user_id;
        
        RAISE NOTICE 'Vitin account reset successfully for testing';
    ELSE
        RAISE NOTICE 'Vitin user not found';
    END IF;
END $$;