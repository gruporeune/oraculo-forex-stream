-- Fix remaining function with security issue
CREATE OR REPLACE FUNCTION public.reset_daily_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Reset daily stats if it's a new day
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.last_reset_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;