-- Corrigir a função com search_path adequado
DROP FUNCTION IF EXISTS reset_daily_signals_brazil();

CREATE OR REPLACE FUNCTION reset_daily_signals_brazil()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  brasil_today DATE;
  user_last_reset DATE;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  user_last_reset := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data (comparando no horário de Brasília), resetar sinais
  IF user_last_reset < brasil_today THEN
    NEW.daily_signals_used = 0;
    NEW.last_reset_date = brasil_today;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para resetar sinais diários
DROP TRIGGER IF EXISTS check_daily_signals_reset ON public.profiles;

CREATE TRIGGER check_daily_signals_reset
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION reset_daily_signals_brazil();