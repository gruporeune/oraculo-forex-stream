-- Reset Sofia's account to start from zero properly
UPDATE profiles SET 
  daily_earnings = 0, 
  available_balance = 0,  -- Start from 0, not 500
  daily_commissions = 0,
  daily_referral_commissions = 0,
  updated_at = now() 
WHERE id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';

UPDATE user_plans SET 
  daily_earnings = 0, 
  auto_operations_completed_today = 0, 
  auto_operations_started = false, 
  auto_operations_paused = false, 
  cycle_start_time = null,
  updated_at = now()
WHERE user_id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';