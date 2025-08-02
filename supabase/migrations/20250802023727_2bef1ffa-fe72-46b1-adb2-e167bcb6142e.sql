-- Corrigir warning de search_path nas funções
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se mudou a data, salvar histórico do dia anterior se havia ganhos
  IF OLD.last_reset_date < CURRENT_DATE THEN
    -- Salvar histórico apenas se houve ganhos ou comissões no dia anterior
    IF OLD.daily_earnings > 0 OR OLD.daily_commissions > 0 THEN
      INSERT INTO public.daily_earnings_history (
        user_id, 
        date, 
        total_earnings, 
        total_commissions, 
        operations_count
      ) VALUES (
        NEW.id,
        OLD.last_reset_date,
        OLD.daily_earnings,
        OLD.daily_commissions,
        OLD.auto_operations_completed_today
      ) ON CONFLICT (user_id, date) DO UPDATE SET
        total_earnings = EXCLUDED.total_earnings,
        total_commissions = EXCLUDED.total_commissions,
        operations_count = EXCLUDED.operations_count;
    END IF;
    
    -- Reset daily stats
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.auto_operations_completed_today = 0;
    NEW.auto_operations_started = false;
    NEW.auto_operations_paused = false;
    NEW.last_reset_date = CURRENT_DATE;
    
    -- Limpar histórico antigo (mais de 30 dias)
    DELETE FROM public.daily_earnings_history 
    WHERE user_id = NEW.id 
    AND date < CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar função handle_new_user com search_path correto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Recriar função process_referral_commission com search_path correto
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

-- Recriar função make_user_admin com search_path correto
CREATE OR REPLACE FUNCTION public.make_user_admin(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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