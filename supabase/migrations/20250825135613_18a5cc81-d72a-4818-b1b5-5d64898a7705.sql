-- Fix the referral commission trigger to handle duplicates properly
CREATE OR REPLACE FUNCTION public.process_referral_commissions_fixed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    level1_referrer_id uuid;
    level2_referrer_id uuid;
    level3_referrer_id uuid;
    commission_level1 numeric;
    commission_level2 numeric;
    commission_level3 numeric;
BEGIN
    -- Only process when a new plan is purchased (INSERT)
    IF TG_OP = 'INSERT' THEN
        -- Get referrer of level 1 (direct)
        SELECT referred_by INTO level1_referrer_id 
        FROM public.profiles 
        WHERE id = NEW.user_id;
        
        -- Level 1: Direct commission (10%)
        IF level1_referrer_id IS NOT NULL THEN
            commission_level1 := public.calculate_plan_commission_level(NEW.plan_name, 1);
            
            IF commission_level1 > 0 THEN
                -- Insert detailed commission record with ON CONFLICT handling
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
                ) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;
                
                -- Insert/Update total commission in user_referrals
                INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
                VALUES (level1_referrer_id, NEW.user_id, commission_level1)
                ON CONFLICT (referrer_id, referred_id) 
                DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
                
                -- Credit commission to balance and daily commissions
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level1,
                    available_balance = COALESCE(available_balance, 0) + commission_level1,
                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level1,
                    updated_at = now()
                WHERE id = level1_referrer_id;
                
                -- Get level 2 referrer
                SELECT referred_by INTO level2_referrer_id 
                FROM public.profiles 
                WHERE id = level1_referrer_id;
                
                -- Level 2: Indirect commission (3%)
                IF level2_referrer_id IS NOT NULL THEN
                    commission_level2 := public.calculate_plan_commission_level(NEW.plan_name, 2);
                    
                    IF commission_level2 > 0 THEN
                        -- Insert detailed commission record with ON CONFLICT handling
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
                        ) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;
                        
                        -- Credit commission to balance and daily commissions
                        UPDATE public.profiles
                        SET 
                            total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level2,
                            available_balance = COALESCE(available_balance, 0) + commission_level2,
                            daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_level2,
                            updated_at = now()
                        WHERE id = level2_referrer_id;
                        
                        -- Get level 3 referrer
                        SELECT referred_by INTO level3_referrer_id 
                        FROM public.profiles 
                        WHERE id = level2_referrer_id;
                        
                        -- Level 3: Indirect commission (2%)
                        IF level3_referrer_id IS NOT NULL THEN
                            commission_level3 := public.calculate_plan_commission_level(NEW.plan_name, 3);
                            
                            IF commission_level3 > 0 THEN
                                -- Insert detailed commission record with ON CONFLICT handling
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
                                ) ON CONFLICT (referrer_id, referred_id, plan_name) DO NOTHING;
                                
                                -- Credit commission to balance and daily commissions
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
$function$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS process_referral_commissions_once_trigger ON public.user_plans;
CREATE TRIGGER process_referral_commissions_fixed_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_commissions_fixed();