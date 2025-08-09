-- Update user profiles to reflect their highest plan
UPDATE profiles 
SET plan = 'premium' 
WHERE full_name = 'vitincastro123';

UPDATE profiles 
SET plan = 'master' 
WHERE full_name = 'anavic123';

-- Fix auto operations for anavic123 (unpause)
UPDATE user_plans 
SET auto_operations_paused = false, auto_operations_started = true 
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'anavic123') AND plan_name = 'master';

-- Recalculate commissions correctly for sofiaelise123
-- First, clear existing referral commissions
UPDATE profiles SET 
  total_referral_commissions = 0,
  available_balance = available_balance - total_referral_commissions,
  daily_referral_commissions = 0 
WHERE full_name = 'sofiaelise123';

-- Delete existing referral records to recalculate
DELETE FROM user_referrals WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Now recalculate commissions for all plans of vitincastro123
INSERT INTO user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  (SELECT id FROM profiles WHERE full_name = 'sofiaelise123'),
  (SELECT id FROM profiles WHERE full_name = 'vitincastro123'),
  SUM(
    CASE up.plan_name
      WHEN 'partner' THEN 20.0    -- 10% of R$ 200,00
      WHEN 'premium' THEN 275.0   -- 10% of R$ 2.750,00
      ELSE 0.0
    END
  )
FROM user_plans up
WHERE up.user_id = (SELECT id FROM profiles WHERE full_name = 'vitincastro123') 
  AND up.is_active = true;

-- Update sofia's balance with correct commissions
UPDATE profiles SET 
  total_referral_commissions = 295.0, -- 20 + 275 from vitincastro123's plans
  available_balance = available_balance + 295.0,
  daily_referral_commissions = 295.0
WHERE full_name = 'sofiaelise123';