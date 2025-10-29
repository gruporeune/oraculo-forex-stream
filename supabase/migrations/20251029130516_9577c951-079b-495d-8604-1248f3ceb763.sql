-- Corrigir manualmente os usuários que pagaram mas não foram ativados

-- 1. Atualizar transação do Tutivenda13@gmail.com para paid
UPDATE payment_transactions
SET 
  status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE external_id = 'pay_8bj6ky2vm3as56k8';

-- 2. Atualizar transação do luisalbertobispo81@gmail.com para paid
UPDATE payment_transactions
SET 
  status = 'paid',
  paid_at = now(),
  updated_at = now()
WHERE external_id = 'pay_9jk5urrx4yeb2vlk';

-- 3. Ativar plano partner para Tutivenda13@gmail.com
INSERT INTO user_plans (user_id, plan_name, is_active, purchase_date)
VALUES (
  'e7fd34c8-71c2-417c-8c49-b32ef91d7cdb',
  'partner',
  true,
  now()
)
ON CONFLICT DO NOTHING;

-- 4. Ativar plano partner para luisalbertobispo81@gmail.com
INSERT INTO user_plans (user_id, plan_name, is_active, purchase_date)
VALUES (
  '28acfab0-2099-432c-ba1d-d24dd657cc58',
  'partner',
  true,
  now()
)
ON CONFLICT DO NOTHING;

-- 5. Atualizar perfil do Tutivenda13@gmail.com para partner
UPDATE profiles
SET 
  plan = 'partner',
  updated_at = now()
WHERE id = 'e7fd34c8-71c2-417c-8c49-b32ef91d7cdb';

-- 6. Atualizar perfil do luisalbertobispo81@gmail.com para partner
UPDATE profiles
SET 
  plan = 'partner',
  updated_at = now()
WHERE id = '28acfab0-2099-432c-ba1d-d24dd657cc58';