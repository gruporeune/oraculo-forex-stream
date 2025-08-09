-- Activate magalhaes123 user with premium plan
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get user ID for magalhaes123
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'magalhaes123@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Update profile to premium plan
        UPDATE public.profiles 
        SET 
            plan = 'premium',
            updated_at = now()
        WHERE id = target_user_id;
        
        -- Insert premium plan into user_plans
        INSERT INTO public.user_plans (
            user_id, 
            plan_name, 
            is_active, 
            purchase_date, 
            created_at, 
            updated_at
        ) VALUES (
            target_user_id,
            'premium',
            true,
            now(),
            now(),
            now()
        );
        
        -- Insert sample daily earnings history entries for magalhaes123
        INSERT INTO public.daily_earnings_history (
            user_id,
            date,
            total_earnings,
            total_commissions,
            operations_count,
            plan_earnings
        ) VALUES 
        (target_user_id, '2025-08-07'::date, 275.00, 50.00, 25, '{"premium": 275.00}'::jsonb),
        (target_user_id, '2025-08-06'::date, 300.00, 75.00, 30, '{"premium": 300.00}'::jsonb),
        (target_user_id, '2025-08-05'::date, 250.00, 25.00, 20, '{"premium": 250.00}'::jsonb);
        
        RAISE NOTICE 'User magalhaes123 successfully activated with premium plan';
    ELSE
        RAISE NOTICE 'User magalhaes123 not found';
    END IF;
END $$;