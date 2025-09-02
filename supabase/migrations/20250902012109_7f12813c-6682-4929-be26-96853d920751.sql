-- Remove the security-problematic view
DROP VIEW IF EXISTS public.users_with_creation_date;

-- Update the function to be more secure
DROP FUNCTION IF EXISTS public.get_user_creation_date(uuid);

-- Create a secure function that returns only the creation date without exposing auth.users
CREATE OR REPLACE FUNCTION public.get_user_creation_date(user_uuid uuid)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creation_date timestamp with time zone;
BEGIN
  -- Only allow users to query their own creation date or admins to query any
  IF auth.uid() != user_uuid AND NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT created_at INTO creation_date
  FROM auth.users 
  WHERE id = user_uuid;
  
  RETURN COALESCE(creation_date, now());
END;
$$;