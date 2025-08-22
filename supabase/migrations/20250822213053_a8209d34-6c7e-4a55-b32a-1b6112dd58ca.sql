-- Atualizar função para incluir os novos planos PREMIUM e PLATINUM em USD
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
        WHEN 'international' THEN 10.0  -- 10% de $100 USD
        WHEN 'premium' THEN 50.0        -- 10% de $500 USD
        WHEN 'platinum' THEN 100.0      -- 10% de $1000 USD
        ELSE 0.0
      END
    WHEN level = 2 THEN
      CASE plan_name
        WHEN 'partner' THEN 6.0         -- 3% de R$ 200,00
        WHEN 'master' THEN 18.0         -- 3% de R$ 600,00  
        WHEN 'international' THEN 3.0   -- 3% de $100 USD
        WHEN 'premium' THEN 15.0        -- 3% de $500 USD
        WHEN 'platinum' THEN 30.0       -- 3% de $1000 USD
        ELSE 0.0
      END
    WHEN level = 3 THEN
      CASE plan_name
        WHEN 'partner' THEN 4.0         -- 2% de R$ 200,00
        WHEN 'master' THEN 12.0         -- 2% de R$ 600,00  
        WHEN 'international' THEN 2.0   -- 2% de $100 USD
        WHEN 'premium' THEN 10.0        -- 2% de $500 USD
        WHEN 'platinum' THEN 20.0       -- 2% de $1000 USD
        ELSE 0.0
      END
    ELSE 0.0
  END;
$function$;