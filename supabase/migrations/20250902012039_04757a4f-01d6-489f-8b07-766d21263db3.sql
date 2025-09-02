-- Create a function to get user creation date from auth.users
CREATE OR REPLACE FUNCTION public.get_user_creation_date(user_uuid uuid)
RETURNS timestamp with time zone
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT created_at 
  FROM auth.users 
  WHERE id = user_uuid;
$$;

-- Create a view that combines profile data with real creation dates
CREATE OR REPLACE VIEW public.users_with_creation_date AS
SELECT 
  p.*,
  COALESCE(au.created_at, p.updated_at) as created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;