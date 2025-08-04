-- Ativar conta anavic123@gmail.com com plano premium
UPDATE public.profiles 
SET plan = 'premium'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'anavic123@gmail.com'
);