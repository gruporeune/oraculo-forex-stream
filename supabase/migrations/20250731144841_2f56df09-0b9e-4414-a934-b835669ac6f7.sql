-- Fix security issue with search_path
CREATE OR REPLACE FUNCTION public.make_user_admin(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert into admin_users if not already admin
  INSERT INTO public.admin_users (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;