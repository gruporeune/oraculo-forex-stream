-- Fix plan names in earnings history for vitincastro123 and anavic123
DO $$
DECLARE
    vitincastro_id uuid;
    anavic_id uuid;
    master_value numeric;
    partner_value numeric;
BEGIN
    -- Get user IDs
    SELECT id INTO vitincastro_id FROM auth.users WHERE email = 'vitincastro123@gmail.com';
    SELECT id INTO anavic_id FROM auth.users WHERE email = 'anavic123@gmail.com';
    
    -- Fix vitincastro123 earnings history (should show platinum, not master)
    IF vitincastro_id IS NOT NULL THEN
        FOR master_value IN 
            SELECT (plan_earnings->>'master')::numeric 
            FROM public.daily_earnings_history 
            WHERE user_id = vitincastro_id AND plan_earnings ? 'master'
        LOOP
            UPDATE public.daily_earnings_history 
            SET plan_earnings = jsonb_build_object('platinum', master_value)
            WHERE user_id = vitincastro_id 
            AND plan_earnings ? 'master'
            AND (plan_earnings->>'master')::numeric = master_value;
        END LOOP;
    END IF;
    
    -- Fix anavic123 earnings history (should show master, not partner)
    IF anavic_id IS NOT NULL THEN
        FOR partner_value IN 
            SELECT (plan_earnings->>'partner')::numeric 
            FROM public.daily_earnings_history 
            WHERE user_id = anavic_id AND plan_earnings ? 'partner'
        LOOP
            UPDATE public.daily_earnings_history 
            SET plan_earnings = jsonb_build_object('master', partner_value)
            WHERE user_id = anavic_id 
            AND plan_earnings ? 'partner'
            AND (plan_earnings->>'partner')::numeric = partner_value;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Fixed plan names in earnings history for vitincastro123 and anavic123';
END $$;