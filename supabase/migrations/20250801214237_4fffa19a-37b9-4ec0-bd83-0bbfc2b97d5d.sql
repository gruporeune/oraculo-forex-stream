-- Reset account for sofiaelise123@gmail.com
UPDATE public.profiles 
SET 
  daily_earnings = 0,
  daily_signals_used = 0,
  last_reset_date = CURRENT_DATE - INTERVAL '1 day',
  auto_operations_started = false,
  auto_operations_paused = false,
  auto_operations_completed_today = 0
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'sofiaelise123@gmail.com'
);

-- Also delete today's automatic signals for this user
DELETE FROM public.signals 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'sofiaelise123@gmail.com'
)
AND is_automatic = true 
AND created_at >= CURRENT_DATE;