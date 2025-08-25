-- Corrigir a duplicação e as comissões não processadas

-- 1. Remover o plano partner duplicado (criado manualmente)
DELETE FROM public.user_plans 
WHERE id = 'e216496f-720c-4e2c-9473-2fd0929195fd'
AND user_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47'
AND plan_name = 'partner'
AND purchase_date = '2025-08-25 13:53:02.14+00';

-- 2. Processar as comissões que não foram creditadas para a compra de 2025-08-25
-- Comissão nível 1 para neto123 (10% de R$ 200 = R$ 20)
INSERT INTO public.referral_commissions (
    referrer_id, 
    referred_id, 
    plan_name, 
    commission_amount, 
    commission_level
) VALUES (
    'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9', -- neto123
    'f63532b4-ecff-4890-b2dd-2929fee99e47', -- joaozim123@gmail.com
    'partner', 
    20.0, 
    1
) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;

-- Comissão nível 2 para estevam123 (3% de R$ 200 = R$ 6)
INSERT INTO public.referral_commissions (
    referrer_id, 
    referred_id, 
    plan_name, 
    commission_amount, 
    commission_level
) VALUES (
    'd85d7c92-8cea-4bce-852f-def73683b986', -- estevam123
    'f63532b4-ecff-4890-b2dd-2929fee99e47', -- joaozim123@gmail.com
    'partner', 
    6.0, 
    2
) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;

-- 3. Atualizar saldos dos referrers com as comissões devidas
-- Creditar R$ 20 para neto123
UPDATE public.profiles
SET 
    total_referral_commissions = COALESCE(total_referral_commissions, 0) + 20.0,
    available_balance = COALESCE(available_balance, 0) + 20.0,
    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 20.0,
    updated_at = now()
WHERE id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'; -- neto123

-- Creditar R$ 6 para estevam123
UPDATE public.profiles
SET 
    total_referral_commissions = COALESCE(total_referral_commissions, 0) + 6.0,
    available_balance = COALESCE(available_balance, 0) + 6.0,
    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 6.0,
    updated_at = now()
WHERE id = 'd85d7c92-8cea-4bce-852f-def73683b986'; -- estevam123

-- 4. Atualizar user_referrals com as comissões
INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
VALUES ('f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9', 'f63532b4-ecff-4890-b2dd-2929fee99e47', 20.0)
ON CONFLICT (referrer_id, referred_id) 
DO UPDATE SET commission_earned = user_referrals.commission_earned + 20.0;