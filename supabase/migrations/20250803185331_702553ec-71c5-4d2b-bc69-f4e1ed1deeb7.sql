-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_materials_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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