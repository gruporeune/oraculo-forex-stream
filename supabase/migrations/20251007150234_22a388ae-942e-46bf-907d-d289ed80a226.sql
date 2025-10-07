-- Criar função para recalcular o saldo correto baseado nos planos ativos
CREATE OR REPLACE FUNCTION fix_user_balances_and_earnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  total_daily_target numeric;
  correct_daily_earnings numeric;
  correct_balance numeric;
BEGIN
  -- Loop através de todos os usuários afetados
  FOR user_record IN 
    SELECT DISTINCT p.id, p.daily_earnings, p.available_balance
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE au.email IN (
      'dorazzio.lrj@gmail.com',
      'leonardo.oraculo1@gmail.com',
      'marcos.oraculo1@gmail.com',
      'marcosbinance288@gmail.com',
      'lucasassegura0@gmail.com',
      'laudemarewendelloraculo@gmail.com',
      'tbplucas.drop@gmail.com',
      'dorazzio.binance@gmail.com',
      'leonardodorazzio@gmail.com',
      'mm.solucoesfinanceirasbrasil@gmail.com',
      'm.oraculoprime2@gmail.com',
      'm.oraculosprime@gmail.com',
      'lucas.oraculo5@gmail.com',
      'lucas.oraculo6@gmail.com',
      'laudemar.mj@gmail.com',
      'lucas.oraculo1@gmail.com'
    )
  LOOP
    -- Calcular meta diária total baseada nos planos ativos
    SELECT COALESCE(SUM(
      CASE up.plan_name
        WHEN 'partner' THEN 2.00
        WHEN 'master' THEN 6.00
        WHEN 'premium' THEN 41.25
        WHEN 'platinum' THEN 100.00
        ELSE 0
      END
    ), 0) INTO total_daily_target
    FROM user_plans up
    WHERE up.user_id = user_record.id 
    AND up.is_active = true;
    
    -- Se daily_earnings está acima do limite, corrigir para o limite
    IF user_record.daily_earnings > total_daily_target THEN
      correct_daily_earnings := total_daily_target;
      
      -- Calcular quanto foi creditado a mais
      correct_balance := user_record.available_balance - (user_record.daily_earnings - total_daily_target);
      correct_balance := GREATEST(correct_balance, 0); -- Não permitir saldo negativo
      
      -- Atualizar o perfil com os valores corretos
      UPDATE profiles
      SET 
        daily_earnings = correct_daily_earnings,
        available_balance = correct_balance,
        updated_at = now()
      WHERE id = user_record.id;
      
      RAISE NOTICE 'Corrigido usuário %: earnings de % para %, balance de % para %', 
        user_record.id, user_record.daily_earnings, correct_daily_earnings, 
        user_record.available_balance, correct_balance;
    END IF;
    
    -- Também corrigir os valores em user_plans se estiverem acima do limite individual
    UPDATE user_plans
    SET 
      daily_earnings = LEAST(daily_earnings, 
        CASE plan_name
          WHEN 'partner' THEN 2.00
          WHEN 'master' THEN 6.00
          WHEN 'premium' THEN 41.25
          WHEN 'platinum' THEN 100.00
          ELSE daily_earnings
        END
      ),
      updated_at = now()
    WHERE user_id = user_record.id 
    AND daily_earnings > (
      CASE plan_name
        WHEN 'partner' THEN 2.00
        WHEN 'master' THEN 6.00
        WHEN 'premium' THEN 41.25
        WHEN 'platinum' THEN 100.00
        ELSE daily_earnings
      END
    );
  END LOOP;
  
  RAISE NOTICE 'Correção de saldos concluída!';
END;
$$;

-- Executar a função de correção
SELECT fix_user_balances_and_earnings();

-- Remover a função após uso (opcional, para manter banco limpo)
-- DROP FUNCTION IF EXISTS fix_user_balances_and_earnings();