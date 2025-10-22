
-- Restaurar toda a rede de indicados do sistema
-- Inserir todos os registros faltantes em user_referrals baseado em profiles.referred_by

INSERT INTO user_referrals (referrer_id, referred_id, created_at, commission_earned)
SELECT 
  p.referred_by as referrer_id,
  p.id as referred_id,
  COALESCE(au.created_at, now()) as created_at,
  0 as commission_earned
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.referred_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_referrals ur 
    WHERE ur.referred_id = p.id 
    AND ur.referrer_id = p.referred_by
  )
ON CONFLICT DO NOTHING;
