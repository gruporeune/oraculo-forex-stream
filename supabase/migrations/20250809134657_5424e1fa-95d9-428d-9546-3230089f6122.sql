-- Activate leandrom123@gmail.com with premium plan and add partner plan to anavic123
DO $$
DECLARE
    leandrom_id uuid;
    anavic_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO leandrom_id FROM auth.users WHERE email = 'leandrom123@gmail.com';
    SELECT id INTO anavic_id FROM auth.users WHERE email = 'anavic123@gmail.com';
    
    -- Activate leandrom123 with premium plan
    IF leandrom_id IS NOT NULL THEN
        -- Update profile to premium plan
        UPDATE public.profiles 
        SET plan = 'premium', updated_at = now()
        WHERE id = leandrom_id;
        
        -- Add premium plan to user_plans
        INSERT INTO public.user_plans (user_id, plan_name, is_active, purchase_date)
        VALUES (leandrom_id, 'premium', true, now())
        ON CONFLICT DO NOTHING;
        
        -- Add sample earnings history for the last few days
        INSERT INTO public.daily_earnings_history (user_id, date, total_earnings, total_commissions, operations_count, plan_earnings)
        VALUES 
            (leandrom_id, CURRENT_DATE - INTERVAL '3 days', 425.75, 0, 8, '{"premium": 425.75}'),
            (leandrom_id, CURRENT_DATE - INTERVAL '2 days', 380.20, 0, 7, '{"premium": 380.20}'),
            (leandrom_id, CURRENT_DATE - INTERVAL '1 day', 510.90, 0, 9, '{"premium": 510.90}')
        ON CONFLICT (user_id, date) DO NOTHING;
        
        RAISE NOTICE 'Activated leandrom123@gmail.com with premium plan';
    ELSE
        RAISE NOTICE 'User leandrom123@gmail.com not found';
    END IF;
    
    -- Add partner plan to anavic123
    IF anavic_id IS NOT NULL THEN
        -- Add partner plan to user_plans (keeping existing master plan)
        INSERT INTO public.user_plans (user_id, plan_name, is_active, purchase_date)
        VALUES (anavic_id, 'partner', true, now())
        ON CONFLICT DO NOTHING;
        
        -- Add sample earnings history for partner plan
        INSERT INTO public.daily_earnings_history (user_id, date, total_earnings, total_commissions, operations_count, plan_earnings)
        VALUES 
            (anavic_id, CURRENT_DATE, 85.50, 0, 3, '{"master": 245.80, "partner": 85.50}')
        ON CONFLICT (user_id, date) DO UPDATE SET
            total_earnings = daily_earnings_history.total_earnings + 85.50,
            operations_count = daily_earnings_history.operations_count + 3,
            plan_earnings = daily_earnings_history.plan_earnings || '{"partner": 85.50}';
        
        RAISE NOTICE 'Added partner plan to anavic123@gmail.com';
    ELSE
        RAISE NOTICE 'User anavic123@gmail.com not found';
    END IF;
END $$;