-- Atualizar função para calcular comissões com valores corretos
CREATE OR REPLACE FUNCTION public.calculate_plan_commission(plan_name text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE plan_name
    WHEN 'partner' THEN 20.0   -- 10% de R$ 200,00
    WHEN 'master' THEN 60.0    -- 10% de R$ 600,00  
    WHEN 'premium' THEN 275.0  -- 10% de R$ 2.750,00
    WHEN 'platinum' THEN 500.0 -- 10% de R$ 5.000,00
    ELSE 0.0
  END;
$$;

-- Atualizar a comissão do vitincastro123@gmail.com para o valor correto do platinum
DO $$
DECLARE
  vitin_id uuid;
  sofia_id uuid;
  old_commission numeric := 10.0;
  new_commission numeric := 500.0; -- 10% de R$ 5.000,00 (platinum)
  commission_diff numeric := new_commission - old_commission;
BEGIN
  -- Buscar IDs dos usuários
  SELECT id INTO vitin_id FROM auth.users WHERE email = 'vitincastro123@gmail.com';
  SELECT id INTO sofia_id FROM auth.users WHERE email = 'sofiaelise123@gmail.com';
  
  IF vitin_id IS NOT NULL AND sofia_id IS NOT NULL THEN
    -- Atualizar comissão na tabela user_referrals
    UPDATE public.user_referrals
    SET commission_earned = new_commission
    WHERE referrer_id = sofia_id AND referred_id = vitin_id;
    
    -- Creditar a diferença no saldo da sofia
    UPDATE public.profiles
    SET 
      available_balance = available_balance + commission_diff,
      updated_at = now()
    WHERE id = sofia_id;
  END IF;
END;
$$;