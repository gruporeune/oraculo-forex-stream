-- Fix the commissions logic by adding a column to track referral commissions separately
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_referral_commissions NUMERIC DEFAULT 0;

-- Update existing profiles to separate referral commissions from daily earnings
-- This ensures commissions card only shows referral commissions, not daily earnings

UPDATE public.profiles 
SET total_referral_commissions = 0
WHERE total_referral_commissions IS NULL;

-- Activate gleydsonbento@gmail.com to premium plan
UPDATE public.profiles 
SET plan = 'premium' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gleydsonbento@gmail.com'
);

-- Activate magalhaes123 to master plan  
UPDATE public.profiles 
SET plan = 'master' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'magalhaes123@gmail.com'
);

-- Update the commission trigger to use the new total_referral_commissions column
CREATE OR REPLACE FUNCTION public.process_multi_level_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    level1_referrer_id uuid;
    level2_referrer_id uuid;
    level3_referrer_id uuid;
    commission_level1 numeric;
    commission_level2 numeric;
    commission_level3 numeric;
BEGIN
    -- Só processar se o plano mudou de 'free' para um plano pago
    IF OLD.plan = 'free' AND NEW.plan != 'free' THEN
        -- Buscar referrer de nível 1 (direto)
        SELECT referred_by INTO level1_referrer_id FROM public.profiles WHERE id = NEW.id;
        
        -- Nível 1: Comissão direta (10%)
        IF level1_referrer_id IS NOT NULL THEN
            commission_level1 := public.calculate_plan_commission_level(NEW.plan, 1);
            
            IF commission_level1 > 0 THEN
                -- Atualizar comissão na tabela user_referrals
                UPDATE public.user_referrals
                SET commission_earned = commission_level1
                WHERE referrer_id = level1_referrer_id AND referred_id = NEW.id;
                
                -- Creditar comissão no saldo e no total de comissões de indicação
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level1,
                    available_balance = available_balance + commission_level1,
                    updated_at = now()
                WHERE id = level1_referrer_id;
                
                -- Buscar referrer de nível 2 (quem indicou o nível 1)
                SELECT referred_by INTO level2_referrer_id FROM public.profiles WHERE id = level1_referrer_id;
                
                -- Nível 2: Comissão indireta (3%)
                IF level2_referrer_id IS NOT NULL THEN
                    commission_level2 := public.calculate_plan_commission_level(NEW.plan, 2);
                    
                    IF commission_level2 > 0 THEN
                        -- Creditar comissão no saldo e no total de comissões de indicação
                        UPDATE public.profiles
                        SET 
                            total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level2,
                            available_balance = available_balance + commission_level2,
                            updated_at = now()
                        WHERE id = level2_referrer_id;
                        
                        -- Buscar referrer de nível 3 (quem indicou o nível 2)
                        SELECT referred_by INTO level3_referrer_id FROM public.profiles WHERE id = level2_referrer_id;
                        
                        -- Nível 3: Comissão indireta (2%)
                        IF level3_referrer_id IS NOT NULL THEN
                            commission_level3 := public.calculate_plan_commission_level(NEW.plan, 3);
                            
                            IF commission_level3 > 0 THEN
                                -- Creditar comissão no saldo e no total de comissões de indicação
                                UPDATE public.profiles
                                SET 
                                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level3,
                                    available_balance = available_balance + commission_level3,
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
$function$;