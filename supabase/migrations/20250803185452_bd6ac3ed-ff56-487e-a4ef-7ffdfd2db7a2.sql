-- Fix the calculate_plan_commission function 
CREATE OR REPLACE FUNCTION public.calculate_plan_commission(plan_name text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE plan_name
    WHEN 'partner' THEN 20.0   -- 10% de R$ 200,00
    WHEN 'master' THEN 60.0    -- 10% de R$ 600,00  
    WHEN 'premium' THEN 275.0  -- 10% de R$ 2.750,00
    WHEN 'platinum' THEN 500.0 -- 10% de R$ 5.000,00
    ELSE 0.0
  END;
$$;