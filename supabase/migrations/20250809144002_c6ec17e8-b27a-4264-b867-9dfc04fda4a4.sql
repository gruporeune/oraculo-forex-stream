-- Reset complete accounts for specified users
DO $$
DECLARE
    sofia_id uuid := 'a31e7c41-2823-48f3-a458-59c2f1e3190f';
    vitincastro_id uuid := '27dafdc9-dc14-44fd-a2b7-224606eabf72';
    anavic_id uuid := 'd5ad8272-af57-4101-962f-2c0890314788';
    leandro_id uuid := 'de55c616-5c75-4b74-b21d-542621a7c1ff';
    user_ids uuid[] := ARRAY[sofia_id, vitincastro_id, anavic_id, leandro_id];
    user_id uuid;
BEGIN
    RAISE NOTICE 'Starting complete reset for specified users...';
    
    -- Reset each user
    FOREACH user_id IN ARRAY user_ids
    LOOP
        -- 1. Deactivate all user plans
        UPDATE public.user_plans
        SET 
            is_active = false,
            daily_earnings = 0,
            daily_signals_used = 0,
            auto_operations_started = false,
            auto_operations_paused = false,
            auto_operations_completed_today = 0,
            cycle_start_time = null,
            updated_at = now()
        WHERE user_id = user_id;
        
        -- 2. Reset profile to free plan with zero balances
        UPDATE public.profiles
        SET 
            plan = 'free',
            daily_signals_used = 0,
            daily_earnings = 0,
            daily_commissions = 0,
            available_balance = 0,
            total_referral_commissions = 0,
            daily_referral_commissions = 0,
            auto_operations_started = false,
            auto_operations_paused = false,
            auto_operations_completed_today = 0,
            cycle_start_time = null,
            last_reset_date = CURRENT_DATE,
            updated_at = now()
        WHERE id = user_id;
        
        -- 3. Delete all referral commissions where this user is the referrer
        DELETE FROM public.referral_commissions
        WHERE referrer_id = user_id;
        
        -- 4. Delete all user_referrals where this user is the referrer
        DELETE FROM public.user_referrals
        WHERE referrer_id = user_id;
        
        -- 5. Delete daily earnings history
        DELETE FROM public.daily_earnings_history
        WHERE user_id = user_id;
        
        -- 6. Delete all signals
        DELETE FROM public.signals
        WHERE user_id = user_id;
        
        -- 7. Delete withdrawal requests
        DELETE FROM public.withdrawal_requests
        WHERE user_id = user_id;
        
        RAISE NOTICE 'Reset completed for user: %', user_id;
    END LOOP;
    
    -- Also clean up any referral_commissions where these users were referred (remove commissions from others)
    DELETE FROM public.referral_commissions
    WHERE referred_id IN (SELECT unnest(user_ids));
    
    -- Clean up user_referrals where these users were referred
    DELETE FROM public.user_referrals
    WHERE referred_id IN (SELECT unnest(user_ids));
    
    RAISE NOTICE 'Complete reset finished for all specified users';
    RAISE NOTICE 'All users are now on FREE plan with zero balances and no commission history';
END $$;