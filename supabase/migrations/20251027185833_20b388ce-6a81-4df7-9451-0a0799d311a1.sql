
-- Função temporária para sincronizar ganhos do perfil com os planos
CREATE OR REPLACE FUNCTION sync_profile_earnings_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_plan_earnings numeric := 0;
BEGIN
  -- Calcular total de ganhos de todos os planos ativos
  SELECT COALESCE(SUM(daily_earnings), 0)
  INTO total_plan_earnings
  FROM user_plans
  WHERE user_id = target_user_id
    AND is_active = true;
  
  -- Atualizar perfil com o total correto
  UPDATE profiles
  SET 
    daily_earnings = total_plan_earnings,
    updated_at = now()
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Perfil sincronizado: daily_earnings = %', total_plan_earnings;
END;
$$;

-- Executar a sincronização para o usuário junin.astalavista@gmail.com
SELECT sync_profile_earnings_for_user('cc26ad62-9c67-48a7-a2d2-427d0da514f4');

-- Remover a função temporária
DROP FUNCTION sync_profile_earnings_for_user(uuid);
