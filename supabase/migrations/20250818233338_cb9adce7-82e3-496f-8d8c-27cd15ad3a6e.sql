-- Otimização sem índices concorrentes

-- 1. Criar índices para consultas frequentes (sem CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id_active ON user_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_plans_last_reset_date ON user_plans(last_reset_date);
CREATE INDEX IF NOT EXISTS idx_signals_user_id_status ON signals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_earnings_user_id_date ON daily_earnings_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id_status ON payment_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id_status ON withdrawal_requests(user_id, status);

-- 2. Remover triggers duplicados que causam sobrecarga
DROP TRIGGER IF EXISTS reset_user_plan_daily_stats_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;

-- 3. Criar função otimizada de reset
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset_optimized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  brasil_date DATE;
  brasil_today DATE;
BEGIN
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  brasil_date := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  IF brasil_date < brasil_today THEN
    -- Salvar histórico apenas se houve ganhos significativos
    IF OLD.daily_earnings > 0.01 OR OLD.daily_commissions > 0.01 OR OLD.daily_referral_commissions > 0.01 THEN
      INSERT INTO public.daily_earnings_history (
        user_id, 
        date, 
        total_earnings, 
        total_commissions, 
        operations_count
      ) VALUES (
        NEW.id,
        brasil_date,
        OLD.daily_earnings,
        OLD.daily_commissions + COALESCE(OLD.daily_referral_commissions, 0),
        OLD.auto_operations_completed_today
      ) ON CONFLICT (user_id, date) DO NOTHING;
    END IF;
    
    -- Reset stats
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.daily_referral_commissions = 0;
    NEW.auto_operations_completed_today = 0;
    NEW.auto_operations_started = false;
    NEW.auto_operations_paused = false;
    NEW.last_reset_date = brasil_today;
    NEW.cycle_start_time = null;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Recriar trigger otimizado
DROP TRIGGER IF EXISTS save_daily_history_and_reset_trigger ON public.profiles;
CREATE TRIGGER save_daily_history_and_reset_optimized_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.save_daily_history_and_reset_optimized();