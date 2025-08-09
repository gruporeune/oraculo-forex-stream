-- Fix sofiaelise123 missing commissions and add platinum plans
DO $$
DECLARE
    sofia_id uuid := 'a31e7c41-2823-48f3-a458-59c2f1e3190f';
    vitincastro_id uuid := '27dafdc9-dc14-44fd-a2b7-224606eabf72';
    anavic_id uuid := 'd5ad8272-af57-4101-962f-2c0890314788';
    platinum_commission_level1 numeric := 500.0; -- 10% of 5000
    platinum_commission_level2 numeric := 150.0; -- 3% of 5000
    master_commission_level1 numeric := 60.0; -- 10% of 600
    master_commission_level2 numeric := 18.0; -- 3% of 600
BEGIN
    -- Restore missing commission for sofiaelise123 from vitincastro123's platinum plan
    -- Sofia should have received 500 reais (level 1) for vitincastro's platinum
    INSERT INTO public.referral_commissions (
        referrer_id, 
        referred_id, 
        plan_name, 
        commission_amount, 
        commission_level
    ) VALUES (
        sofia_id, 
        vitincastro_id, 
        'platinum', 
        platinum_commission_level1, 
        1
    ) ON CONFLICT (referrer_id, referred_id, plan_name) 
    DO UPDATE SET 
        commission_amount = EXCLUDED.commission_amount,
        created_at = now();
    
    -- Update sofia's commissions and balance to include the missing 500
    UPDATE public.profiles
    SET 
        total_referral_commissions = COALESCE(total_referral_commissions, 0) + platinum_commission_level1,
        available_balance = available_balance + platinum_commission_level1,
        daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + platinum_commission_level1,
        updated_at = now()
    WHERE id = sofia_id;
    
    -- Add master commission for sofia from anavic (level 1 - direct)
    INSERT INTO public.referral_commissions (
        referrer_id, 
        referred_id, 
        plan_name, 
        commission_amount, 
        commission_level
    ) VALUES (
        sofia_id, 
        anavic_id, 
        'master', 
        master_commission_level1, 
        1
    ) ON CONFLICT (referrer_id, referred_id, plan_name) 
    DO UPDATE SET 
        commission_amount = EXCLUDED.commission_amount,
        created_at = now();
    
    -- Update sofia's balance with master commission
    UPDATE public.profiles
    SET 
        total_referral_commissions = COALESCE(total_referral_commissions, 0) + master_commission_level1,
        available_balance = available_balance + master_commission_level1,
        daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + master_commission_level1,
        updated_at = now()
    WHERE id = sofia_id;
    
    -- Add platinum plan for sofiaelise123
    INSERT INTO public.user_plans (
        user_id,
        plan_name,
        purchase_date,
        is_active,
        daily_earnings,
        daily_signals_used,
        auto_operations_started,
        auto_operations_paused,
        auto_operations_completed_today,
        cycle_start_time,
        last_reset_date
    ) VALUES (
        sofia_id,
        'platinum',
        now(),
        true,
        0,
        0,
        false,
        false,
        0,
        null,
        CURRENT_DATE
    );
    
    -- Add platinum plan for vitincastro123
    INSERT INTO public.user_plans (
        user_id,
        plan_name,
        purchase_date,
        is_active,
        daily_earnings,
        daily_signals_used,
        auto_operations_started,
        auto_operations_paused,
        auto_operations_completed_today,
        cycle_start_time,
        last_reset_date
    ) VALUES (
        vitincastro_id,
        'platinum',
        now(),
        true,
        0,
        0,
        false,
        false,
        0,
        null,
        CURRENT_DATE
    );
    
    -- Update profiles plan to highest (platinum)
    UPDATE public.profiles
    SET plan = 'platinum', updated_at = now()
    WHERE id IN (sofia_id, vitincastro_id);
    
    RAISE NOTICE 'Fixed sofiaelise123 commissions and added platinum plans for both users';
    RAISE NOTICE 'Restored missing platinum commission: R$ 500 + master commission: R$ 60';
END $$;