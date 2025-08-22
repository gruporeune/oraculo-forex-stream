-- Tutorial: Como ativar planos diretamente no banco de dados
-- Este script ativa o usuário serdigitalds22@gmail.com com o plano master

-- Passo 1: Encontrar o user_id pelo email
-- Primeiro, você precisa encontrar o ID do usuário na tabela auth.users

-- Passo 2: Inserir o plano na tabela user_plans
-- Ativar usuário serdigitalds22@gmail.com com plano master
INSERT INTO public.user_plans (
  user_id, 
  plan_name, 
  is_active, 
  purchase_date,
  daily_earnings,
  daily_signals_used,
  auto_operations_completed_today,
  last_reset_date
)
SELECT 
  au.id,
  'master' as plan_name,
  true as is_active,
  now() as purchase_date,
  0 as daily_earnings,
  0 as daily_signals_used,
  0 as auto_operations_completed_today,
  CURRENT_DATE as last_reset_date
FROM auth.users au
WHERE au.email = 'serdigitalds22@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_plans up 
  WHERE up.user_id = au.id AND up.plan_name = 'master' AND up.is_active = true
);

-- Passo 3: Atualizar o perfil do usuário
UPDATE public.profiles 
SET 
  plan = 'master',
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'serdigitalds22@gmail.com'
);