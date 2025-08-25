-- Corrigir comissões em falta para o plano partner mais recente do joaozim123@gmail.com
-- Hierarquia: joaozim123@gmail.com → neto123 (nível 1) → estevam123 (nível 2)

-- Inserir comissão de nível 1 para neto123 (10% = R$ 20,00)
INSERT INTO public.referral_commissions (
    referrer_id, 
    referred_id, 
    plan_name, 
    commission_amount, 
    commission_level,
    created_at
) VALUES (
    'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9', -- neto123
    'f63532b4-ecff-4890-b2dd-2929fee99e47', -- joaozim123@gmail.com
    'partner', 
    20.0, 
    1,
    '2025-08-25 13:59:06'
) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;

-- Inserir comissão de nível 2 para estevam123 (3% = R$ 6,00)
INSERT INTO public.referral_commissions (
    referrer_id, 
    referred_id, 
    plan_name, 
    commission_amount, 
    commission_level,
    created_at
) VALUES (
    'd85d7c92-8cea-4bce-852f-def73683b986', -- estevam123
    'f63532b4-ecff-4890-b2dd-2929fee99e47', -- joaozim123@gmail.com
    'partner', 
    6.0, 
    2,
    '2025-08-25 13:59:06'
) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;

-- Atualizar comissão total em user_referrals para neto123
UPDATE public.user_referrals
SET commission_earned = commission_earned + 20.0
WHERE referrer_id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'
AND referred_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47';

-- Creditar comissões nos saldos dos usuários
UPDATE public.profiles
SET 
    total_referral_commissions = COALESCE(total_referral_commissions, 0) + 20.0,
    available_balance = COALESCE(available_balance, 0) + 20.0,
    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 20.0,
    updated_at = now()
WHERE id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'; -- neto123

UPDATE public.profiles
SET 
    total_referral_commissions = COALESCE(total_referral_commissions, 0) + 6.0,
    available_balance = COALESCE(available_balance, 0) + 6.0,
    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 6.0,
    updated_at = now()
WHERE id = 'd85d7c92-8cea-4bce-852f-def73683b986'; -- estevam123

-- Verificar e garantir que o trigger está funcionando corretamente
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_v2_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_once_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_referral_commissions_fixed_trigger ON public.user_plans;

-- Criar o trigger correto
CREATE TRIGGER process_referral_commissions_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();