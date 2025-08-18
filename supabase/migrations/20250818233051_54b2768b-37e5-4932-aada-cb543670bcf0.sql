-- Otimização de performance para resolver problemas de recursos

-- 1. Criar índices para consultas frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_plans_user_id_active ON user_plans(user_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_plans_last_reset_date ON user_plans(last_reset_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signals_user_id_status ON signals(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_earnings_user_id_date ON daily_earnings_history(user_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_user_id_status ON payment_transactions(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawal_requests_user_id_status ON withdrawal_requests(user_id, status);

-- 2. Otimizar função de reset diário
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset_optimized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  brasil_date DATE;
  brasil_today DATE;
  plan_earnings_data jsonb;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  brasil_date := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data, salvar histórico do dia anterior apenas se havia ganhos significativos
  IF brasil_date < brasil_today THEN
    -- Salvar histórico apenas se houve ganhos ou comissões > 0.01 no dia anterior
    IF OLD.daily_earnings > 0.01 OR OLD.daily_commissions > 0.01 OR OLD.daily_referral_commissions > 0.01 THEN
      -- Buscar ganhos por plano apenas se necessário
      SELECT jsonb_object_agg(plan_name, daily_earnings)
      INTO plan_earnings_data
      FROM public.user_plans
      WHERE user_id = NEW.id AND daily_earnings > 0.01;
      
      INSERT INTO public.daily_earnings_history (
        user_id, 
        date, 
        total_earnings, 
        total_commissions, 
        operations_count,
        plan_earnings
      ) VALUES (
        NEW.id,
        brasil_date,
        OLD.daily_earnings,
        OLD.daily_commissions + COALESCE(OLD.daily_referral_commissions, 0),
        OLD.auto_operations_completed_today,
        COALESCE(plan_earnings_data, '{}')
      ) ON CONFLICT (user_id, date) DO UPDATE SET
        total_earnings = EXCLUDED.total_earnings,
        total_commissions = EXCLUDED.total_commissions,
        operations_count = EXCLUDED.operations_count,
        plan_earnings = EXCLUDED.plan_earnings;
    END IF;
    
    -- Reset daily stats
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.daily_referral_commissions = 0;
    NEW.auto_operations_completed_today = 0;
    NEW.auto_operations_started = false;
    NEW.auto_operations_paused = false;
    NEW.last_reset_date = brasil_today;
    NEW.cycle_start_time = null;
    
    -- Limpar histórico antigo apenas uma vez por mês
    IF EXTRACT(DAY FROM brasil_today) = 1 THEN
      DELETE FROM public.daily_earnings_history 
      WHERE user_id = NEW.id 
      AND date < brasil_today - INTERVAL '60 days';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Remover triggers duplicados e problemáticos que podem estar causando sobrecarga
DROP TRIGGER IF EXISTS reset_user_plan_daily_stats_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;

-- 4. Recriar apenas o trigger essencial otimizado
DROP TRIGGER IF EXISTS save_daily_history_and_reset_trigger ON public.profiles;
CREATE TRIGGER save_daily_history_and_reset_optimized_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.save_daily_history_and_reset_optimized();

-- 5. Manter apenas um trigger de comissão simples
CREATE OR REPLACE TRIGGER process_referral_commissions_once_trigger
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_commissions_once();

-- 6. Atualizar estatísticas das tabelas principais
ANALYZE public.profiles;
ANALYZE public.user_plans;
ANALYZE public.signals;
ANALYZE public.daily_earnings_history;
ANALYZE public.referral_commissions;