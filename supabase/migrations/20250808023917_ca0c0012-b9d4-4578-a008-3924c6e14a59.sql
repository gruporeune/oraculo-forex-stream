-- Reset all automatic earnings and network earnings for test accounts
UPDATE public.profiles 
SET 
  daily_earnings = 0,
  daily_commissions = 0,
  daily_referral_commissions = 0,
  total_referral_commissions = 0,
  available_balance = 0,
  auto_operations_started = false,
  auto_operations_paused = false,
  auto_operations_completed_today = 0,
  cycle_start_time = null,
  daily_signals_used = 0
WHERE id IN (
  SELECT u.id FROM auth.users u 
  WHERE u.email IN ('sofiaelise123@gmail.com') 
  OR u.id IN (
    SELECT p.id FROM profiles p 
    WHERE p.username IN ('sofiaelise123', 'vitincastro123', 'anavic123')
  )
);

-- Remove paid plans from test accounts (keep only free plans)
DELETE FROM public.user_plans 
WHERE user_id IN (
  SELECT p.id FROM profiles p 
  WHERE p.username IN ('vitincastro123', 'anavic123', 'magalhaes123')
);

-- Add premium plan back to sofiaelise123
INSERT INTO public.user_plans (user_id, plan_name) 
SELECT p.id, 'premium'
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.username = 'sofiaelise123' OR u.email = 'sofiaelise123@gmail.com'
LIMIT 1;

-- Clear user_referrals commissions for fresh start
UPDATE public.user_referrals 
SET commission_earned = 0
WHERE referrer_id IN (
  SELECT p.id FROM profiles p 
  WHERE p.username IN ('sofiaelise123', 'vitincastro123', 'anavic123')
) OR referred_id IN (
  SELECT p.id FROM profiles p 
  WHERE p.username IN ('sofiaelise123', 'vitincastro123', 'anavic123')
);

-- Clear daily earnings history for clean restart
DELETE FROM public.daily_earnings_history 
WHERE user_id IN (
  SELECT p.id FROM profiles p 
  WHERE p.username IN ('sofiaelise123', 'vitincastro123', 'anavic123')
);