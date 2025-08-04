-- Restore commissions for Sofia without affecting daily operations reset
-- Only restore available_balance and daily_commissions without touching other fields
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
        -- Restore the referral commission balance (500 reais)
        -- This restores her commissions without affecting the operations reset
        UPDATE public.profiles 
        SET 
            available_balance = 500.0,
            daily_commissions = 500.0
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Commissions restored for Sofia: 500 reais';
    ELSE
        RAISE NOTICE 'User sofiaelise123@gmail.com not found';
    END IF;
END
$$;