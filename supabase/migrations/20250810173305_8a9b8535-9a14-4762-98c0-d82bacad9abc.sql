-- CORREÇÃO FINAL: Remover trigger duplicado que está causando a duplicação de comissões

-- 1. Remover o trigger duplicado da tabela profiles
DROP TRIGGER IF EXISTS trigger_process_multi_level_referral_commission ON public.profiles;

-- 2. Remover a função duplicada
DROP FUNCTION IF EXISTS public.process_multi_level_referral_commission();

-- 3. Limpar dados duplicados existentes
TRUNCATE TABLE public.referral_commissions;
TRUNCATE TABLE public.user_referrals;

-- 4. Resetar saldos de comissões para recalcular corretamente
UPDATE public.profiles 
SET 
  total_referral_commissions = 0,
  daily_referral_commissions = 0,
  available_balance = CASE 
    WHEN available_balance >= total_referral_commissions THEN available_balance - total_referral_commissions
    ELSE 0
  END
WHERE total_referral_commissions > 0;

-- 5. Reprocessar todas as comissões corretamente (uma única vez)
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
  -- Processar todos os planos ativos uma única vez
  FOR plan_record IN 
    SELECT DISTINCT up.user_id, up.plan_name
    FROM user_plans up 
    WHERE up.is_active = true 
    ORDER BY up.user_id, up.plan_name
  LOOP
    -- Buscar referrer de nível 1 (direto)
    SELECT referred_by INTO level1_referrer_id 
    FROM public.profiles 
    WHERE id = plan_record.user_id;
    
    -- Nível 1: Comissão direta (10%)
    IF level1_referrer_id IS NOT NULL THEN
      commission_level1 := public.calculate_plan_commission_level(plan_record.plan_name, 1);
      
      IF commission_level1 > 0 THEN
        -- Inserir comissão detalhada
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
        
        -- Inserir/Atualizar comissão total em user_referrals
        INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
        VALUES (level1_referrer_id, plan_record.user_id, commission_level1)
        ON CONFLICT (referrer_id, referred_id) 
        DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
        
        -- Creditar comissão no saldo
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
            -- Inserir comissão detalhada
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
            
            -- Creditar comissão no saldo
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
                -- Inserir comissão detalhada
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
                
                -- Creditar comissão no saldo
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