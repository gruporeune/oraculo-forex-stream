-- Reset users vitincastro123 and anavic123 back to free plan
UPDATE profiles 
SET plan = 'free',
    available_balance = 0,
    daily_earnings = 0,
    daily_commissions = 0,
    daily_referral_commissions = 0,
    total_referral_commissions = 0,
    auto_operations_started = false,
    auto_operations_paused = false,
    auto_operations_completed_today = 0,
    cycle_start_time = null
WHERE full_name IN ('vitincastro123', 'anavic123');

-- Delete their user plans
DELETE FROM user_plans 
WHERE user_id IN (
  SELECT id FROM profiles WHERE full_name IN ('vitincastro123', 'anavic123')
);

-- Reset sofiaelise123 completely
UPDATE profiles 
SET available_balance = 0,
    daily_earnings = 0,
    daily_commissions = 0,
    daily_referral_commissions = 0,
    total_referral_commissions = 0,
    auto_operations_started = false,
    auto_operations_paused = false,
    auto_operations_completed_today = 0,
    cycle_start_time = null
WHERE full_name = 'sofiaelise123';

-- Delete sofiaelise123's earnings history
DELETE FROM daily_earnings_history 
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Delete sofiaelise123's referral commissions
DELETE FROM user_referrals 
WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');