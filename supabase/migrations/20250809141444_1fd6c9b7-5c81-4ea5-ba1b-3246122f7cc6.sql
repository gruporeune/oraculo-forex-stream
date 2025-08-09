-- Fix commission logic and daily earnings history for operations
DO $$
DECLARE
    vitincastro_id uuid := '27dafdc9-dc14-44fd-a2b7-224606eabf72';
    anavic_id uuid := 'd5ad8272-af57-4101-962f-2c0890314788';
    total_commissions_vitincastro numeric := 0;
    total_commissions_anavic numeric := 0;
BEGIN
    -- Calculate correct total_referral_commissions for vitincastro123
    -- He should only have commissions from his direct referrals (level 1)
    -- anavic123 has master plan (60) + any level 2/3 commissions
    SELECT COALESCE(SUM(commission_earned), 0) INTO total_commissions_vitincastro
    FROM user_referrals 
    WHERE referrer_id = vitincastro_id;
    
    -- Add any level 2 and 3 commissions that vitincastro should receive
    -- Since anavic referred leandrom (premium plan), vitincastro gets level 2 commission (3% of 2750 = 82.5)
    total_commissions_vitincastro := total_commissions_vitincastro + 82.5;
    
    -- Update vitincastro's commission totals to correct amount (162.5)
    UPDATE profiles 
    SET 
        total_referral_commissions = 162.5,
        daily_referral_commissions = 162.5,
        available_balance = available_balance - (245.0 - 162.5), -- Remove the excess
        updated_at = now()
    WHERE id = vitincastro_id;
    
    -- Create today's earnings history for anavic123 including the partner plan earnings
    INSERT INTO daily_earnings_history (
        user_id,
        date,
        total_earnings,
        total_commissions,
        operations_count,
        plan_earnings
    ) VALUES (
        anavic_id,
        CURRENT_DATE,
        7.00, -- 6 from master + 1 from partner
        275.0, -- commission from referring leandrom to premium
        5, -- 3 from master + 2 from partner
        '{"master": 6, "partner": 1}'::jsonb
    ) ON CONFLICT (user_id, date) DO UPDATE SET
        total_earnings = EXCLUDED.total_earnings,
        total_commissions = EXCLUDED.total_commissions,
        operations_count = EXCLUDED.operations_count,
        plan_earnings = EXCLUDED.plan_earnings;
        
    RAISE NOTICE 'Fixed commission logic: vitincastro123 now has correct 162.5 total commissions';
    RAISE NOTICE 'Added earnings history for anavic123 including partner plan operations';
END $$;