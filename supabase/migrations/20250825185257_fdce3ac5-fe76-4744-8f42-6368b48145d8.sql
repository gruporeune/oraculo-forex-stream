-- Ativar plano Partner para o usuário André Estevam que teve pagamento confirmado
-- User ID: d85d7c92-8cea-4bce-852f-def73683b986
-- Transaction ID: 6f2c9bdb-c043-4e19-b5f5-6a275a5cefc1

-- 1. Inserir o plano na tabela user_plans
INSERT INTO public.user_plans (
    user_id,
    plan_name,
    is_active,
    purchase_date,
    created_at,
    updated_at
) VALUES (
    'd85d7c92-8cea-4bce-852f-def73683b986',
    'partner',
    true,
    '2025-08-25 18:45:03.123+00:00',
    now(),
    now()
) ON CONFLICT (user_id, plan_name) DO UPDATE SET
    is_active = true,
    purchase_date = EXCLUDED.purchase_date,
    updated_at = now();

-- 2. Atualizar o plano no perfil do usuário
UPDATE public.profiles 
SET 
    plan = 'partner',
    updated_at = now()
WHERE id = 'd85d7c92-8cea-4bce-852f-def73683b986';