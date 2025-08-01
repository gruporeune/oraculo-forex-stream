-- Create a trigger to automatically reset daily stats when updating profiles
CREATE TRIGGER reset_daily_stats_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_daily_stats();