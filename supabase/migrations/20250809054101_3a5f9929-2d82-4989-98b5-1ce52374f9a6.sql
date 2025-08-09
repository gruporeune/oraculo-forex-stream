-- Corrigir totalmente a lógica de comissões e restaurar planos da sofiaelise123

-- 1. Restaurar planos da sofiaelise123 (Premium)
INSERT INTO user_plans (user_id, plan_name, is_active, purchase_date)
SELECT id, 'premium', true, now()
FROM profiles 
WHERE full_name = 'sofiaelise123';

-- 2. Corrigir comissões da sofiaelise123 para 518 reais (500 + 18)
UPDATE profiles 
SET total_referral_commissions = 518.0,
    daily_referral_commissions = 518.0,
    available_balance = 518.0
WHERE full_name = 'sofiaelise123';

-- 3. Corrigir vitincastro123 - ele deveria ganhar apenas 6 reais (10% de 60 do plano master)
UPDATE profiles 
SET total_referral_commissions = 6.0,
    daily_referral_commissions = 6.0,
    available_balance = 6.0
WHERE full_name = 'vitincastro123';

-- 4. Corrigir tabela user_referrals - vitincastro123 deveria ganhar 6 reais pela anavic123
UPDATE user_referrals 
SET commission_earned = 6.0
WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'vitincastro123')
AND referred_id = (SELECT id FROM profiles WHERE full_name = 'anavic123');

-- 5. Corrigir comissão da sofiaelise123 para valores corretos
UPDATE user_referrals 
SET commission_earned = 500.0
WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123')
AND referred_id = (SELECT id FROM profiles WHERE full_name = 'vitincastro123');