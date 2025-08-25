-- Modificar a constraint única para permitir múltiplas comissões do mesmo plano em datas diferentes
-- Primeiro, remover a constraint atual
ALTER TABLE public.referral_commissions 
DROP CONSTRAINT IF EXISTS referral_commissions_referrer_id_referred_id_plan_name_key;

-- Criar uma nova constraint que inclui a data da criação para permitir múltiplas ativações do mesmo plano
ALTER TABLE public.referral_commissions 
ADD CONSTRAINT referral_commissions_unique_per_activation 
UNIQUE (referrer_id, referred_id, plan_name, created_at);

-- Agora inserir a comissão em falta para o plano partner mais recente
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
);

-- Inserir comissão de nível 2 para estevam123
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
);

-- Atualizar os saldos dos usuários
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

-- Atualizar user_referrals
UPDATE public.user_referrals
SET commission_earned = commission_earned + 20.0
WHERE referrer_id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'
AND referred_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47';

-- Garantir que o trigger está ativo
CREATE OR REPLACE TRIGGER process_referral_commissions_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();