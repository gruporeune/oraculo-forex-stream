-- Criar registro de referral que estava faltando para anavic123
INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  '27dafdc9-dc14-44fd-a2b7-224606eabf72', -- vitincastro123 (referrer)
  'd5ad8272-af57-4101-962f-2c0890314788', -- anavic123 (referred)
  275.0 -- comissão de 10% para plano premium
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_referrals 
  WHERE referrer_id = '27dafdc9-dc14-44fd-a2b7-224606eabf72' 
  AND referred_id = 'd5ad8272-af57-4101-962f-2c0890314788'
);