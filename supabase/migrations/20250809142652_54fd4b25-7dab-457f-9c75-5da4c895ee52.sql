-- Create table for detailed commission history by plan
CREATE TABLE public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) NOT NULL,
  plan_name text NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  commission_level integer NOT NULL, -- 1, 2, or 3
  created_at timestamp with time zone DEFAULT now(),
  unique(referrer_id, referred_id, plan_name)
);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own commission history"
ON public.referral_commissions
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert their own commission history"
ON public.referral_commissions
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Update existing trigger function to record detailed commissions
CREATE OR REPLACE FUNCTION public.process_multi_level_referral_commission_detailed()
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
                -- Insert detailed commission record
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
                ) ON CONFLICT (referrer_id, referred_id, plan_name) 
                DO UPDATE SET 
                    commission_amount = EXCLUDED.commission_amount,
                    created_at = now();
                
                -- Insert/Update total commission in user_referrals
                INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
                VALUES (level1_referrer_id, NEW.user_id, commission_level1)
                ON CONFLICT (referrer_id, referred_id) 
                DO UPDATE SET commission_earned = user_referrals.commission_earned + commission_level1;
                
                -- Credit commission to balance and daily commissions
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level1,
                    available_balance = available_balance + commission_level1,
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
                        -- Insert detailed commission record
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
                        ) ON CONFLICT (referrer_id, referred_id, plan_name) 
                        DO UPDATE SET 
                            commission_amount = EXCLUDED.commission_amount,
                            created_at = now();
                        
                        -- Credit commission to balance and daily commissions
                        UPDATE public.profiles
                        SET 
                            total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level2,
                            available_balance = available_balance + commission_level2,
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
                                -- Insert detailed commission record
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
                                ) ON CONFLICT (referrer_id, referred_id, plan_name) 
                                DO UPDATE SET 
                                    commission_amount = EXCLUDED.commission_amount,
                                    created_at = now();
                                
                                -- Credit commission to balance and daily commissions
                                UPDATE public.profiles
                                SET 
                                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_level3,
                                    available_balance = available_balance + commission_level3,
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

-- Remove old trigger and add new one
DROP TRIGGER IF EXISTS process_multi_level_referral_commission_trigger ON public.user_plans;
CREATE TRIGGER process_multi_level_referral_commission_detailed_trigger
AFTER INSERT ON public.user_plans
FOR EACH ROW
EXECUTE FUNCTION public.process_multi_level_referral_commission_detailed();

-- Fix the missing commission for sofiaelise123 when anavic123 bought partner plan
DO $$
DECLARE
    sofia_id uuid := '27dafdc9-dc14-44fd-a2b7-224606eabf72';
    anavic_id uuid := 'd5ad8272-af57-4101-962f-2c0890314788';
    partner_commission_level2 numeric := 6.0; -- 3% of 200
BEGIN
    -- Add detailed commission record for sofia (level 2 from anavic's partner plan)
    INSERT INTO public.referral_commissions (
        referrer_id, 
        referred_id, 
        plan_name, 
        commission_amount, 
        commission_level
    ) VALUES (
        sofia_id, 
        anavic_id, 
        'partner', 
        partner_commission_level2, 
        2
    ) ON CONFLICT (referrer_id, referred_id, plan_name) 
    DO UPDATE SET 
        commission_amount = EXCLUDED.commission_amount,
        created_at = now();
    
    -- Update sofia's total commissions and balance
    UPDATE public.profiles
    SET 
        total_referral_commissions = COALESCE(total_referral_commissions, 0) + partner_commission_level2,
        available_balance = available_balance + partner_commission_level2,
        daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + partner_commission_level2,
        updated_at = now()
    WHERE id = sofia_id;
    
    RAISE NOTICE 'Added missing partner plan commission for sofiaelise123: R$ %', partner_commission_level2;
END $$;