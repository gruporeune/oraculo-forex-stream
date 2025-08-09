-- Fix plan names in earnings history for vitincastro123 and anavic123
DO $$
DECLARE
    vitincastro_id uuid;
    anavic_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO vitincastro_id FROM auth.users WHERE email = 'vitincastro123@gmail.com';
    SELECT id INTO anavic_id FROM auth.users WHERE email = 'anavic123@gmail.com';
    
    -- Fix vitincastro123 earnings history (should show platinum, not master)
    IF vitincastro_id IS NOT NULL THEN
        UPDATE public.daily_earnings_history 
        SET plan_earnings = '{"platinum": ' || (plan_earnings->>'master')::numeric || '}'::jsonb
        WHERE user_id = vitincastro_id 
        AND plan_earnings ? 'master';
    END IF;
    
    -- Fix anavic123 earnings history (should show master, not partner)
    IF anavic_id IS NOT NULL THEN
        UPDATE public.daily_earnings_history 
        SET plan_earnings = '{"master": ' || (plan_earnings->>'partner')::numeric || '}'::jsonb
        WHERE user_id = anavic_id 
        AND plan_earnings ? 'partner';
    END IF;
    
    RAISE NOTICE 'Fixed plan names in earnings history for vitincastro123 and anavic123';
END $$;