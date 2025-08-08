-- Create table to track user plan purchases (multiple plans per user)
CREATE TABLE public.user_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('partner', 'master', 'premium', 'platinum')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_earnings NUMERIC NOT NULL DEFAULT 0,
  daily_signals_used INTEGER NOT NULL DEFAULT 0,
  auto_operations_started BOOLEAN NOT NULL DEFAULT false,
  auto_operations_paused BOOLEAN NOT NULL DEFAULT false,
  auto_operations_completed_today INTEGER NOT NULL DEFAULT 0,
  cycle_start_time TIMESTAMP WITH TIME ZONE,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own plans" 
ON public.user_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" 
ON public.user_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
ON public.user_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to handle daily reset for user plans
CREATE OR REPLACE FUNCTION public.reset_user_plan_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  brasil_today DATE;
  brasil_date DATE;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  brasil_date := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data, resetar stats do plano
  IF brasil_date < brasil_today THEN
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.auto_operations_completed_today = 0;
    NEW.auto_operations_started = false;
    NEW.auto_operations_paused = false;
    NEW.cycle_start_time = null;
    NEW.last_reset_date = brasil_today;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for user plans daily reset
CREATE TRIGGER reset_user_plan_daily_stats_trigger
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_user_plan_daily_stats();

-- Update existing profiles table to remove plan-specific columns that are now in user_plans
-- Keep the old plan column for backwards compatibility but it will show 'multiple' for users with multiple plans
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_referral_commissions NUMERIC DEFAULT 0;

-- Function to process multi-level referral commissions for multiple plans
CREATE OR REPLACE FUNCTION public.process_multi_level_referral_commission_v2()
RETURNS TRIGGER AS $$
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
                -- Insert/Update commission in user_referrals
                INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
                VALUES (level1_referrer_id, NEW.user_id, commission_level1)
                ON CONFLICT (referrer_id, referred_id) 
                DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
                
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for new plan purchases
CREATE TRIGGER process_multi_level_referral_commission_v2_trigger
    AFTER INSERT ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.process_multi_level_referral_commission_v2();

-- Add unique constraint to prevent duplicate referral records
ALTER TABLE public.user_referrals 
ADD CONSTRAINT unique_referral_pair UNIQUE (referrer_id, referred_id);

-- Update the daily reset function to also reset daily_referral_commissions
CREATE OR REPLACE FUNCTION public.save_daily_history_and_reset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  brasil_date DATE;
  brasil_today DATE;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  brasil_date := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data (comparando no horário de Brasília), salvar histórico do dia anterior se havia ganhos
  IF brasil_date < brasil_today THEN
    -- Salvar histórico apenas se houve ganhos ou comissões no dia anterior
    IF OLD.daily_earnings > 0 OR OLD.daily_commissions > 0 OR OLD.daily_referral_commissions > 0 THEN
      INSERT INTO public.daily_earnings_history (
        user_id, 
        date, 
        total_earnings, 
        total_commissions, 
        operations_count
      ) VALUES (
        NEW.id,
        brasil_date, -- Usar a data do Brasil do dia anterior
        OLD.daily_earnings,
        OLD.daily_commissions + COALESCE(OLD.daily_referral_commissions, 0), -- Include referral commissions
        OLD.auto_operations_completed_today
      ) ON CONFLICT (user_id, date) DO UPDATE SET
        total_earnings = EXCLUDED.total_earnings,
        total_commissions = EXCLUDED.total_commissions,
        operations_count = EXCLUDED.operations_count;
    END IF;
    
    -- Reset daily stats
    NEW.daily_signals_used = 0;
    NEW.daily_earnings = 0;
    NEW.daily_commissions = 0;
    NEW.daily_referral_commissions = 0; -- Reset daily referral commissions
    NEW.auto_operations_completed_today = 0;
    NEW.auto_operations_started = false;
    NEW.auto_operations_paused = false;
    NEW.last_reset_date = brasil_today; -- Usar data do Brasil
    NEW.cycle_start_time = null; -- Reset cycle start time
    
    -- Limpar histórico antigo (mais de 30 dias)
    DELETE FROM public.daily_earnings_history 
    WHERE user_id = NEW.id 
    AND date < brasil_today - INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$$;