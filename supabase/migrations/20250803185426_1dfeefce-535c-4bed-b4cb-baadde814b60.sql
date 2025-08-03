-- Fix all remaining functions with security issues
CREATE OR REPLACE FUNCTION public.process_referral_commission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.make_user_admin(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;