-- Modificar a tabela daily_earnings_history para incluir ganhos por plano
ALTER TABLE public.daily_earnings_history 
ADD COLUMN IF NOT EXISTS plan_earnings jsonb DEFAULT '{}';

-- Ativar contas solicitadas sem ON CONFLICT
-- Buscar IDs dos usuários primeiro
DO $$
DECLARE
    vitinho_id uuid;
    ana_id uuid;
BEGIN
    -- Buscar ID do vitincastro123
    SELECT id INTO vitinho_id FROM public.profiles WHERE username = 'vitincastro123';
    
    -- Buscar ID do anavic123  
    SELECT id INTO ana_id FROM public.profiles WHERE username = 'anavic123';
    
    -- Ativar vitincastro123 com planos partner e premium
    IF vitinho_id IS NOT NULL THEN
        INSERT INTO public.user_plans (user_id, plan_name, is_active)
        VALUES (vitinho_id, 'partner', true);
        
        INSERT INTO public.user_plans (user_id, plan_name, is_active)
        VALUES (vitinho_id, 'premium', true);
    END IF;
    
    -- Ativar anavic123 com plano master
    IF ana_id IS NOT NULL THEN
        INSERT INTO public.user_plans (user_id, plan_name, is_active)
        VALUES (ana_id, 'master', true);
    END IF;
END $$;

-- Atualizar função de salvar histórico para incluir ganhos por plano
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
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
  
  -- Se mudou a data, salvar histórico do dia anterior se havia ganhos
  IF brasil_date < brasil_today THEN
    -- Buscar ganhos por plano do dia anterior
    SELECT jsonb_object_agg(plan_name, daily_earnings)
    INTO plan_earnings_data
    FROM public.user_plans
    WHERE user_id = NEW.id AND daily_earnings > 0;
    
    -- Salvar histórico apenas se houve ganhos ou comissões no dia anterior
    IF OLD.daily_earnings > 0 OR OLD.daily_commissions > 0 OR OLD.daily_referral_commissions > 0 THEN
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
    NEW.cycle_start_time = null;
    
    -- Limpar histórico antigo (mais de 30 dias)
    DELETE FROM public.daily_earnings_history 
    WHERE user_id = NEW.id 
    AND date < brasil_today - INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$function$;