-- Forçar a inserção das comissões em falta
-- Verificar se já existem as comissões para evitar duplicatas
DO $$
DECLARE
    partner_plan_exists BOOLEAN;
    neto_commission_exists BOOLEAN;
    estevam_commission_exists BOOLEAN;
BEGIN
    -- Verificar se existe comissão do neto123 para o plano partner mais recent
    SELECT EXISTS(
        SELECT 1 FROM referral_commissions 
        WHERE referrer_id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'
        AND referred_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47'
        AND plan_name = 'partner'
        AND commission_level = 1
        AND created_at >= '2025-08-25 13:00:00'
    ) INTO neto_commission_exists;
    
    -- Verificar se existe comissão do estevam123 para o plano partner mais recente
    SELECT EXISTS(
        SELECT 1 FROM referral_commissions 
        WHERE referrer_id = 'd85d7c92-8cea-4bce-852f-def73683b986'
        AND referred_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47'
        AND plan_name = 'partner'
        AND commission_level = 2
        AND created_at >= '2025-08-25 13:00:00'
    ) INTO estevam_commission_exists;
    
    -- Se não existem as comissões, inserir
    IF NOT neto_commission_exists THEN
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
        
        -- Atualizar saldo do neto123
        UPDATE public.profiles
        SET 
            total_referral_commissions = COALESCE(total_referral_commissions, 0) + 20.0,
            available_balance = COALESCE(available_balance, 0) + 20.0,
            daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 20.0,
            updated_at = now()
        WHERE id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9';
        
        -- Atualizar user_referrals
        UPDATE public.user_referrals
        SET commission_earned = commission_earned + 20.0
        WHERE referrer_id = 'f7dc81ac-a7e1-4f71-8b7c-5c1e3810cca9'
        AND referred_id = 'f63532b4-ecff-4890-b2dd-2929fee99e47';
    END IF;
    
    IF NOT estevam_commission_exists THEN
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
        
        -- Atualizar saldo do estevam123
        UPDATE public.profiles
        SET 
            total_referral_commissions = COALESCE(total_referral_commissions, 0) + 6.0,
            available_balance = COALESCE(available_balance, 0) + 6.0,
            daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + 6.0,
            updated_at = now()
        WHERE id = 'd85d7c92-8cea-4bce-852f-def73683b986';
    END IF;
END $$;

-- Recriar o trigger corretamente
CREATE OR REPLACE TRIGGER process_referral_commissions_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();