-- Reset the vitincastro123@gmail.com account completely
UPDATE public.profiles 
SET 
  daily_signals_used = 0,
  daily_earnings = 0,
  daily_commissions = 0,
  available_balance = 0,
  auto_operations_started = false,
  auto_operations_paused = false,
  auto_operations_completed_today = 0,
  cycle_start_time = null,
  last_reset_date = CURRENT_DATE,
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'vitincastro123@gmail.com' LIMIT 1
);

-- Delete all signals for this user
DELETE FROM public.signals 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'vitincastro123@gmail.com' LIMIT 1
);

-- Delete all daily earnings history for this user  
DELETE FROM public.daily_earnings_history
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'vitincastro123@gmail.com' LIMIT 1
);