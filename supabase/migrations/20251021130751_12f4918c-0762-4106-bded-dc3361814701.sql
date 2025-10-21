-- Atualizar função de cálculo de comissões para incluir plano PRO (mantendo Platinum)
CREATE OR REPLACE FUNCTION public.calculate_plan_commission_level(plan_name text, level integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN level = 1 THEN
      CASE plan_name
        WHEN 'partner' THEN 20.0        -- 10% de R$ 200,00
        WHEN 'master' THEN 60.0         -- 10% de R$ 600,00  
        WHEN 'pro' THEN 100.0           -- 10% de R$ 1.000,00
        WHEN 'international' THEN 10.0  -- 10% de $100 USD
        WHEN 'premium' THEN 275.0       -- 10% de R$ 2.750,00
        WHEN 'platinum' THEN 500.0      -- 10% de R$ 5.000,00
        ELSE 0.0
      END
    WHEN level = 2 THEN
      CASE plan_name
        WHEN 'partner' THEN 6.0         -- 3% de R$ 200,00
        WHEN 'master' THEN 18.0         -- 3% de R$ 600,00  
        WHEN 'pro' THEN 30.0            -- 3% de R$ 1.000,00
        WHEN 'international' THEN 3.0   -- 3% de $100 USD
        WHEN 'premium' THEN 82.5        -- 3% de R$ 2.750,00
        WHEN 'platinum' THEN 150.0      -- 3% de R$ 5.000,00
        ELSE 0.0
      END
    WHEN level = 3 THEN
      CASE plan_name
        WHEN 'partner' THEN 4.0         -- 2% de R$ 200,00
        WHEN 'master' THEN 12.0         -- 2% de R$ 600,00  
        WHEN 'pro' THEN 20.0            -- 2% de R$ 1.000,00
        WHEN 'international' THEN 2.0   -- 2% de $100 USD
        WHEN 'premium' THEN 55.0        -- 2% de R$ 2.750,00
        WHEN 'platinum' THEN 100.0      -- 2% de R$ 5.000,00
        ELSE 0.0
      END
    ELSE 0.0
  END;
$function$;