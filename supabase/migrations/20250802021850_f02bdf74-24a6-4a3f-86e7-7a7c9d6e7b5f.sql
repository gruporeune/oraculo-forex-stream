-- Criar função para calcular e creditar comissões
CREATE OR REPLACE FUNCTION public.calculate_plan_commission(plan_name text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE plan_name
    WHEN 'partner' -> 1.0 * 0.10  -- 10% de R$ 1,00
    WHEN 'premium' -> 41.25 * 0.10  -- 10% de R$ 41,25
    WHEN 'master' -> 6.0 * 0.10     -- 10% de R$ 6,00
    WHEN 'platinum' -> 100.0 * 0.10 -- 10% de R$ 100,00
    ELSE 0.0
  END;
$$;

-- Criar função para processar comissão de referral
CREATE OR REPLACE FUNCTION public.process_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_amount numeric;
  referrer_id uuid;
BEGIN
  -- Só processar se o plano mudou de 'free' para um plano pago
  IF OLD.plan = 'free' AND NEW.plan != 'free' THEN
    -- Calcular comissão baseada no novo plano
    commission_amount := public.calculate_plan_commission(NEW.plan);
    
    -- Buscar referrer se existe
    SELECT referred_by INTO referrer_id FROM public.profiles WHERE id = NEW.id;
    
    IF referrer_id IS NOT NULL AND commission_amount > 0 THEN
      -- Atualizar comissão na tabela user_referrals
      UPDATE public.user_referrals
      SET commission_earned = commission_amount
      WHERE referrer_id = referrer_id AND referred_id = NEW.id;
      
      -- Creditar comissão no saldo do referrer
      UPDATE public.profiles
      SET 
        daily_commissions = daily_commissions + commission_amount,
        available_balance = available_balance + commission_amount,
        updated_at = now()
      WHERE id = referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para processar comissões automaticamente
CREATE TRIGGER process_referral_commission_trigger
  AFTER UPDATE OF plan ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_commission();

-- Processar comissão para o caso específico do vitincastro123@gmail.com
-- já que ele foi upgrade para platinum manualmente
DO $$
DECLARE
  vitin_id uuid;
  sofia_id uuid;
  commission_amount numeric := 10.0; -- 10% de R$ 100,00 (platinum)
BEGIN
  -- Buscar IDs dos usuários
  SELECT id INTO vitin_id FROM auth.users WHERE email = 'vitincastro123@gmail.com';
  SELECT id INTO sofia_id FROM auth.users WHERE email = 'sofiaelise123@gmail.com';
  
  IF vitin_id IS NOT NULL AND sofia_id IS NOT NULL THEN
    -- Atualizar comissão na tabela user_referrals
    UPDATE public.user_referrals
    SET commission_earned = commission_amount
    WHERE referrer_id = sofia_id AND referred_id = vitin_id;
    
    -- Creditar comissão no saldo da sofia
    UPDATE public.profiles
    SET 
      daily_commissions = daily_commissions + commission_amount,
      available_balance = available_balance + commission_amount,
      updated_at = now()
    WHERE id = sofia_id;
  END IF;
END;
$$;