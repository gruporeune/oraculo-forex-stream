-- Create table for daily earnings history
CREATE TABLE public.daily_earnings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_commissions NUMERIC NOT NULL DEFAULT 0,
  operations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_earnings_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own earnings history" 
ON public.daily_earnings_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own earnings history" 
ON public.daily_earnings_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update the save_daily_history_and_reset function to save history before resetting
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create trigger to save daily history before reset
DROP TRIGGER IF EXISTS trigger_save_daily_history ON public.profiles;
CREATE TRIGGER trigger_save_daily_history
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.save_daily_history_and_reset();