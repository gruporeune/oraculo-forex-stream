-- Create a function to reset daily earnings and signals at midnight
CREATE OR REPLACE FUNCTION reset_daily_stats()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    daily_earnings = 0,
    daily_signals_used = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the reset function daily at midnight
SELECT cron.schedule(
  'reset-daily-stats',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT reset_daily_stats();
  $$
);