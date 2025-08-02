-- Corrigir as comissões da Sofia manualmente
DO $$
DECLARE
  sofia_id uuid;
  current_commissions numeric;
BEGIN
  -- Buscar ID da Sofia
  SELECT id INTO sofia_id FROM auth.users WHERE email = 'sofiaelise123@gmail.com';
  
  IF sofia_id IS NOT NULL THEN
    -- Buscar comissões atuais da Sofia
    SELECT daily_commissions INTO current_commissions 
    FROM public.profiles 
    WHERE id = sofia_id;
    
    -- Se a comissão atual for 0, significa que ela não recebeu os 500 reais hoje
    IF current_commissions = 0 THEN
      -- Atualizar com a comissão de 500 reais do Victor
      UPDATE public.profiles
      SET 
        daily_commissions = 500.0,
        available_balance = available_balance + 500.0,
        updated_at = now()
      WHERE id = sofia_id;
      
      RAISE NOTICE 'Sofia comissões atualizadas: daily_commissions = 500, balance atualizado';
    ELSE
      RAISE NOTICE 'Sofia já possui comissões do dia: %', current_commissions;
    END IF;
  ELSE
    RAISE NOTICE 'Sofia não encontrada';
  END IF;
END;
$$;