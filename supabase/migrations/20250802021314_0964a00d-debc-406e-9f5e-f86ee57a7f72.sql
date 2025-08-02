-- Set vitincastro123@gmail.com as platinum user
UPDATE public.profiles 
SET plan = 'platinum'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'vitincastro123@gmail.com'
);