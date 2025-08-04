-- Corrigir função para usar horário de Brasília ao invés de UTC
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  brasil_date DATE;
  brasil_today DATE;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  brasil_date := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data (comparando no horário de Brasília), salvar histórico do dia anterior se havia ganhos
  IF brasil_date < brasil_today THEN
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
        brasil_date, -- Usar a data do Brasil do dia anterior
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
    NEW.last_reset_date = brasil_today; -- Usar data do Brasil
    NEW.cycle_start_time = null; -- Reset cycle start time
    
    -- Limpar histórico antigo (mais de 30 dias)
    DELETE FROM public.daily_earnings_history 
    WHERE user_id = NEW.id 
    AND date < brasil_today - INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$function$;