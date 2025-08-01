-- Primeiro, vamos tornar o usuário sofia admin efetivamente
UPDATE profiles 
SET plan = 'premium' 
WHERE id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';

-- Garantir que a conta está como admin
INSERT INTO admin_users (user_id) 
VALUES ('a31e7c41-2823-48f3-a458-59c2f1e3190f')
ON CONFLICT (user_id) DO NOTHING;