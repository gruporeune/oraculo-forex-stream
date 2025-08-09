-- Update the usernames to match what the user expects
UPDATE profiles 
SET username = 'vitincastro123', full_name = 'vitincastro123'
WHERE full_name = 'victor castro';

UPDATE profiles 
SET username = 'anavic123', full_name = 'anavic123'
WHERE full_name = 'ana victoria';

UPDATE profiles 
SET username = 'sofiaelise123', full_name = 'sofiaelise123'
WHERE full_name = 'sofia elise';

-- Update the profile plan to reflect the highest plan they have
UPDATE profiles p
SET plan = (
  SELECT up.plan_name 
  FROM user_plans up 
  WHERE up.user_id = p.id 
  AND up.is_active = true
  ORDER BY 
    CASE up.plan_name
      WHEN 'platinum' THEN 4
      WHEN 'premium' THEN 3
      WHEN 'master' THEN 2
      WHEN 'partner' THEN 1
      ELSE 0
    END DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM user_plans up 
  WHERE up.user_id = p.id AND up.is_active = true
);

-- Recalculate and update referral commissions for all plans
DO $$
DECLARE
    plan_record RECORD;
    level1_user_id uuid;
    level2_user_id uuid;
    level3_user_id uuid;
    commission_l1 numeric;
    commission_l2 numeric;
    commission_l3 numeric;
BEGIN
    -- Process each active user plan
    FOR plan_record IN 
        SELECT up.*, p.referred_by 
        FROM user_plans up 
        JOIN profiles p ON p.id = up.user_id 
        WHERE up.is_active = true
    LOOP
        -- Get level 1 referrer
        level1_user_id := plan_record.referred_by;
        
        IF level1_user_id IS NOT NULL THEN
            -- Calculate commissions for each level
            commission_l1 := public.calculate_plan_commission_level(plan_record.plan_name, 1);
            
            -- Update or insert level 1 commission
            INSERT INTO public.user_referrals (referrer_id, referred_id, commission_earned)
            VALUES (level1_user_id, plan_record.user_id, commission_l1)
            ON CONFLICT (referrer_id, referred_id) 
            DO UPDATE SET commission_earned = user_referrals.commission_earned + EXCLUDED.commission_earned;
            
            -- Update level 1 user balance and commissions
            UPDATE public.profiles
            SET 
                total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_l1,
                available_balance = available_balance + commission_l1,
                daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_l1
            WHERE id = level1_user_id;
            
            -- Get level 2 referrer
            SELECT referred_by INTO level2_user_id FROM profiles WHERE id = level1_user_id;
            
            IF level2_user_id IS NOT NULL THEN
                commission_l2 := public.calculate_plan_commission_level(plan_record.plan_name, 2);
                
                -- Update level 2 user balance and commissions
                UPDATE public.profiles
                SET 
                    total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_l2,
                    available_balance = available_balance + commission_l2,
                    daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_l2
                WHERE id = level2_user_id;
                
                -- Get level 3 referrer
                SELECT referred_by INTO level3_user_id FROM profiles WHERE id = level2_user_id;
                
                IF level3_user_id IS NOT NULL THEN
                    commission_l3 := public.calculate_plan_commission_level(plan_record.plan_name, 3);
                    
                    -- Update level 3 user balance and commissions
                    UPDATE public.profiles
                    SET 
                        total_referral_commissions = COALESCE(total_referral_commissions, 0) + commission_l3,
                        available_balance = available_balance + commission_l3,
                        daily_referral_commissions = COALESCE(daily_referral_commissions, 0) + commission_l3
                    WHERE id = level3_user_id;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;