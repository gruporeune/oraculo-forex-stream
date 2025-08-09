-- Create missing user_referrals entries for the network structure
-- sofiaelise123 -> vitincastro123 (Level 1)
-- vitincastro123 -> anavic123 (Level 2) 
-- anavic123 -> magalhaes123 (Level 3)

-- First, make sure all user_referrals are properly created for the hierarchy
INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  p1.id as referrer_id,
  p2.id as referred_id,
  0.00 as commission_earned
FROM profiles p1, profiles p2
WHERE p1.username = 'sofiaelise123' AND p2.username = 'vitincastro123'
ON CONFLICT (referrer_id, referred_id) DO UPDATE SET commission_earned = 0.00;

INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  p1.id as referrer_id,
  p2.id as referred_id,
  0.00 as commission_earned
FROM profiles p1, profiles p2
WHERE p1.username = 'vitincastro123' AND p2.username = 'anavic123'
ON CONFLICT (referrer_id, referred_id) DO UPDATE SET commission_earned = 0.00;

INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  p1.id as referrer_id,
  p2.id as referred_id,
  0.00 as commission_earned
FROM profiles p1, profiles p2
WHERE p1.username = 'anavic123' AND p2.username = 'magalhaes123'
ON CONFLICT (referrer_id, referred_id) DO UPDATE SET commission_earned = 0.00;

-- Also create user_referrals for level 2 and 3 commissions from sofiaelise123 perspective
-- Level 2: sofiaelise123 gets commission from anavic123 (indirect through vitincastro123)
INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  (SELECT id FROM profiles WHERE username = 'sofiaelise123'),
  (SELECT id FROM profiles WHERE username = 'anavic123'),
  0.00 as commission_earned
ON CONFLICT (referrer_id, referred_id) DO UPDATE SET commission_earned = 0.00;

-- Level 3: sofiaelise123 gets commission from magalhaes123 (indirect through vitincastro123 -> anavic123)
INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
SELECT 
  (SELECT id FROM profiles WHERE username = 'sofiaelise123'),
  (SELECT id FROM profiles WHERE username = 'magalhaes123'),
  0.00 as commission_earned
ON CONFLICT (referrer_id, referred_id) DO UPDATE SET commission_earned = 0.00;