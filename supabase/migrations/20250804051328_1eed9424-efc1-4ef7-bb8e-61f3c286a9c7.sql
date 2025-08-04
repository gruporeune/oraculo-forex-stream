-- Restore Sofia's premium plan
-- Get Sofia's user ID and set her plan back to premium

DO $$
DECLARE
    sofia_user_id uuid;
BEGIN
    -- Get Sofia's user ID from auth.users
    SELECT id INTO sofia_user_id
    FROM auth.users 
    WHERE email = 'sofiaelise123@gmail.com';
    
    IF sofia_user_id IS NOT NULL THEN
        -- Set her plan back to premium
        UPDATE public.profiles 
        SET plan = 'premium'
        WHERE id = sofia_user_id;
        
        RAISE NOTICE 'Sofia plan restored to premium successfully';
    ELSE
        RAISE NOTICE 'Sofia user not found';
    END IF;
END $$;