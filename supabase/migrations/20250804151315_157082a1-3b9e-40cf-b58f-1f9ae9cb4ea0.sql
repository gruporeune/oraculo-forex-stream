-- Corrigir trigger que tem ambiguidade e ativar conta premium
-- Remover trigger antigo
DROP TRIGGER IF EXISTS process_referral_commission_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.process_referral_commission();

-- Usar função multinível existente
-- Ativar conta anavic123@gmail.com com plano premium
UPDATE public.profiles 
SET plan = 'premium'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'anavic123@gmail.com'
);