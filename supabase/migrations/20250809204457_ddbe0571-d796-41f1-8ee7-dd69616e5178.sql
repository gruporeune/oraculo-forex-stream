-- Primeiro, vamos limpar TODOS os dados incorretos de comissões
TRUNCATE TABLE public.referral_commissions;
TRUNCATE TABLE public.user_referrals;

-- Reset todas as comissões nos perfis
UPDATE public.profiles 
SET 
    total_referral_commissions = 0,
    daily_referral_commissions = 0,
    available_balance = 0
WHERE total_referral_commissions > 0 OR daily_referral_commissions > 0;

-- Agora vamos remover TODOS os triggers de comissão existentes
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_detailed_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_v2_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;

-- Criar uma nova função simples e limpa para processar comissões UMA VEZ APENAS
CREATE OR REPLACE FUNCTION public.process_referral_commissions_once()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    level1_referrer_id uuid;
    level2_referrer_id uuid;
    level3_referrer_id uuid;
    commission_level1 numeric;
    commission_level2 numeric;
    commission_level3 numeric;
BEGIN
    -- Só processar se for INSERT (novo plano)
    IF TG_OP = 'INSERT' THEN
        -- Buscar referrer de nível 1 (direto)
        SELECT referred_by INTO level1_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;
        
        -- Nível 1: Comissão direta (10%)
        IF level1_referrer_id IS NOT NULL THEN
            commission_level1 := public.calculate_plan_commission_level(NEW.plan_name, 1);
            
            IF commission_level1 > 0 THEN
                -- Inserir registro de comissão detalhada
                INSERT INTO public.referral_commissions (
                    referrer_id, 
                    referred_id, 
                    plan_name, 
                    commission_amount, 
                    commission_level
                ) VALUES (
                    level1_referrer_id, 
                    NEW.user_id, 
                    NEW.plan_name, 
                    commission_level1, 
                    1
                );
                
                -- Inserir/Atualizar comissão total em user_referrals
                INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
                VALUES (level1_referrer_id, NEW.user_id, commission_level1)
                ON CONFLICT (referrer_id, referred_id) 
                DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
                
                -- Creditar comissão no saldo e comissões
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level1,
                    available_balance = COALESCE(available_balance, 0) + commission_level1,
                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level1,
                    updated_at = now()
                WHERE id = level1_referrer_id;
                
                -- Buscar referrer de nível 2
                SELECT referred_by INTO level2_referrer_id 
                FROM public.profiles 
                WHERE id = level1_referrer_id;
                
                -- Nível 2: Comissão indireta (3%)
                IF level2_referrer_id IS NOT NULL THEN
                    commission_level2 := public.calculate_plan_commission_level(NEW.plan_name, 2);
                    
                    IF commission_level2 > 0 THEN
                        -- Inserir registro de comissão detalhada
                        INSERT INTO public.referral_commissions (
                            referrer_id, 
                            referred_id, 
                            plan_name, 
                            commission_amount, 
                            commission_level
                        ) VALUES (
                            level2_referrer_id, 
                            NEW.user_id, 
                            NEW.plan_name, 
                            commission_level2, 
                            2
                        );
                        
                        -- Creditar comissão no saldo e comissões
                        UPDATE public.profiles
                        SET 
                            total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level2,
                            available_balance = COALESCE(available_balance, 0) + commission_level2,
                            daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level2,
                            updated_at = now()
                        WHERE id = level2_referrer_id;
                        
                        -- Buscar referrer de nível 3
                        SELECT referred_by INTO level3_referrer_id 
                        FROM public.profiles 
                        WHERE id = level2_referrer_id;
                        
                        -- Nível 3: Comissão indireta (2%)
                        IF level3_referrer_id IS NOT NULL THEN
                            commission_level3 := public.calculate_plan_commission_level(NEW.plan_name, 3);
                            
                            IF commission_level3 > 0 THEN
                                -- Inserir registro de comissão detalhada
                                INSERT INTO public.referral_commissions (
                                    referrer_id, 
                                    referred_id, 
                                    plan_name, 
                                    commission_amount, 
                                    commission_level
                                ) VALUES (
                                    level3_referrer_id, 
                                    NEW.user_id, 
                                    NEW.plan_name, 
                                    commission_level3, 
                                    3
                                );
                                
                                -- Creditar comissão no saldo e comissões
                                UPDATE public.profiles
                                SET 
                                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level3,
                                    available_balance = COALESCE(available_balance, 0) + commission_level3,
                                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level3,
                                    updated_at = now()
                                WHERE id = level3_referrer_id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar APENAS UM trigger para processar comissões
CREATE TRIGGER process_referral_commissions_once_trigger 
    AFTER INSERT ON public.user_plans
    FOR EACH ROW EXECUTE FUNCTION process_referral_commissions_once();

-- Agora vamos reprocessar APENAS os planos ativos existentes para recalcular comissões corretas
DO $$
DECLARE
    plan_record RECORD;
    level1_referrer_id uuid;
    level2_referrer_id uuid;
    level3_referrer_id uuid;
    commission_level1 numeric;
    commission_level2 numeric;
    commission_level3 numeric;
BEGIN
    -- Para cada plano ativo, reprocessar comissões
    FOR plan_record IN 
        SELECT up.user_id, up.plan_name, up.id as plan_id
        FROM user_plans up 
        WHERE up.is_active = true
    LOOP
        -- Buscar referrer de nível 1
        SELECT referred_by INTO level1_referrer_id 
        FROM public.profiles 
        WHERE id = plan_record.user_id;
        
        -- Nível 1: Comissão direta (10%)
        IF level1_referrer_id IS NOT NULL THEN
            commission_level1 := public.calculate_plan_commission_level(plan_record.plan_name, 1);
            
            IF commission_level1 > 0 THEN
                -- Inserir registro de comissão detalhada
                INSERT INTO public.referral_commissions (
                    referrer_id, 
                    referred_id, 
                    plan_name, 
                    commission_amount, 
                    commission_level
                ) VALUES (
                    level1_referrer_id, 
                    plan_record.user_id, 
                    plan_record.plan_name, 
                    commission_level1, 
                    1
                );
                
                -- Inserir comissão total em user_referrals
                INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
                VALUES (level1_referrer_id, plan_record.user_id, commission_level1)
                ON CONFLICT (referrer_id, referred_id) 
                DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
                
                -- Creditar comissão no saldo e comissões
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level1,
                    available_balance = COALESCE(available_balance, 0) + commission_level1,
                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level1,
                    updated_at = now()
                WHERE id = level1_referrer_id;
                
                -- Buscar referrer de nível 2
                SELECT referred_by INTO level2_referrer_id 
                FROM public.profiles 
                WHERE id = level1_referrer_id;
                
                -- Nível 2: Comissão indireta (3%)
                IF level2_referrer_id IS NOT NULL THEN
                    commission_level2 := public.calculate_plan_commission_level(plan_record.plan_name, 2);
                    
                    IF commission_level2 > 0 THEN
                        -- Inserir registro de comissão detalhada
                        INSERT INTO public.referral_commissions (
                            referrer_id, 
                            referred_id, 
                            plan_name, 
                            commission_amount, 
                            commission_level
                        ) VALUES (
                            level2_referrer_id, 
                            plan_record.user_id, 
                            plan_record.plan_name, 
                            commission_level2, 
                            2
                        );
                        
                        -- Creditar comissão no saldo e comissões
                        UPDATE public.profiles
                        SET 
                            total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level2,
                            available_balance = COALESCE(available_balance, 0) + commission_level2,
                            daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level2,
                            updated_at = now()
                        WHERE id = level2_referrer_id;
                        
                        -- Buscar referrer de nível 3
                        SELECT referred_by INTO level3_referrer_id 
                        FROM public.profiles 
                        WHERE id = level2_referrer_id;
                        
                        -- Nível 3: Comissão indireta (2%)
                        IF level3_referrer_id IS NOT NULL THEN
                            commission_level3 := public.calculate_plan_commission_level(plan_record.plan_name, 3);
                            
                            IF commission_level3 > 0 THEN
                                -- Inserir registro de comissão detalhada
                                INSERT INTO public.referral_commissions (
                                    referrer_id, 
                                    referred_id, 
                                    plan_name, 
                                    commission_amount, 
                                    commission_level
                                ) VALUES (
                                    level3_referrer_id, 
                                    plan_record.user_id, 
                                    plan_record.plan_name, 
                                    commission_level3, 
                                    3
                                );
                                
                                -- Creditar comissão no saldo e comissões
                                UPDATE public.profiles
                                SET 
                                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level3,
                                    available_balance = COALESCE(available_balance, 0) + commission_level3,
                                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level3,
                                    updated_at = now()
                                WHERE id = level3_referrer_id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;