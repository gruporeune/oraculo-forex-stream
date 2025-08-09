-- Corrigir comissão do vitincastro123 para 60 reais (10% de 600 reais do plano master)
UPDATE profiles 
SET total_referral_commissions = 60.0,
    daily_referral_commissions = 60.0,
    available_balance = 60.0
WHERE full_name = 'vitincastro123';

-- Corrigir tabela user_referrals - vitincastro123 deveria ganhar 60 reais pela anavic123
UPDATE user_referrals 
SET commission_earned = 60.0
WHERE referrer_id = (SELECT id FROM profiles WHERE full_name = 'vitincastro123')
AND referred_id = (SELECT id FROM profiles WHERE full_name = 'anavic123');