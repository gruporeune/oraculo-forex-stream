-- Reset sofiaelise123 completely including user_plans
UPDATE profiles 
SET available_balance = 0,
    daily_earnings = 0,
    daily_commissions = 0,
    daily_referral_commissions = 0,
    total_referral_commissions = 0,
    auto_operations_started = false,
    auto_operations_paused = false,
    auto_operations_completed_today = 0,
    cycle_start_time = null,
    daily_signals_used = 0
WHERE full_name = 'sofiaelise123';

-- Delete sofiaelise123's user plans to completely reset
DELETE FROM user_plans 
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Delete sofiaelise123's earnings history
DELETE FROM daily_earnings_history 
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Delete sofiaelise123's referral commissions
DELETE FROM user_referrals 
WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Activate vitincastro123 with platinum plan
UPDATE profiles 
SET plan = 'platinum'
WHERE full_name = 'vitincastro123';

INSERT INTO user_plans (user_id, plan_name, is_active, purchase_date)
SELECT id, 'platinum', true, now()
FROM profiles 
WHERE full_name = 'vitincastro123';

-- Activate anavic123 with master plan
UPDATE profiles 
SET plan = 'master'
WHERE full_name = 'anavic123';

INSERT INTO user_plans (user_id, plan_name, is_active, purchase_date)
SELECT id, 'master', true, now()
FROM profiles 
WHERE full_name = 'anavic123';