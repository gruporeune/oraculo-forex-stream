-- First, let's reset all test accounts to 'free' plan
UPDATE public.profiles 
SET 
  plan = 'free',
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
WHERE username IN ('vitincastro123', 'anavic123', 'magalhaes123');

-- Set sofiaelise123 back to premium plan
UPDATE public.profiles 
SET 
  plan = 'premium',
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
WHERE username = 'sofiaelise123';

-- Clear all user_plans for test accounts
DELETE FROM public.user_plans 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE username IN ('vitincastro123', 'anavic123', 'magalhaes123')
);

-- Remove old user_plans for sofiaelise123 and add clean premium plan
DELETE FROM public.user_plans 
WHERE user_id = (SELECT id FROM profiles WHERE username = 'sofiaelise123');

INSERT INTO public.user_plans (user_id, plan_name, is_active, daily_earnings, daily_signals_used, auto_operations_started, auto_operations_paused, auto_operations_completed_today) 
SELECT id, 'premium', true, 0, 0, false, false, 0
FROM profiles 
WHERE username = 'sofiaelise123';

-- Clear all commissions in user_referrals
UPDATE public.user_referrals 
SET commission_earned = 0
WHERE referrer_id IN (
  SELECT id FROM profiles 
  WHERE username IN ('sofiaelise123', 'vitincastro123', 'anavic123', 'magalhaes123')
) OR referred_id IN (
  SELECT id FROM profiles 
  WHERE username IN ('sofiaelise123', 'vitincastro123', 'anavic123', 'magalhaes123')
);

-- Clear daily earnings history
DELETE FROM public.daily_earnings_history 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE username IN ('sofiaelise123', 'vitincastro123', 'anavic123', 'magalhaes123')
);