
-- Restaurar rede de indicados da damarysup@gmail.com
-- Inserir todos os registros faltantes em user_referrals

INSERT INTO user_referrals (referrer_id, referred_id, created_at, commission_earned)
SELECT 
  '1883f3c1-355d-463d-9e6e-fab718d4d9e1' as referrer_id,
  p.id as referred_id,
  COALESCE(au.created_at, now()) as created_at,
  0 as commission_earned
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.referred_by = '1883f3c1-355d-463d-9e6e-fab718d4d9e1'
  AND NOT EXISTS (
    SELECT 1 FROM user_referrals ur 
    WHERE ur.referred_id = p.id 
    AND ur.referrer_id = '1883f3c1-355d-463d-9e6e-fab718d4d9e1'
  )
ON CONFLICT DO NOTHING;
