-- Reset daily earnings for Sofia but keep commissions
UPDATE public.profiles 
SET 
  daily_earnings = 0,
  available_balance = daily_commissions,
  auto_operations_completed_today = 0,
  auto_operations_started = false,
  auto_operations_paused = false,
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'sofiaelise123@gmail.com'
);

-- Clear daily earnings history for Sofia (keeping commission history)
DELETE FROM public.daily_earnings_history 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'sofiaelise123@gmail.com'
) AND total_earnings > 0;