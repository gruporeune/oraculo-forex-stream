-- Primeiro, vamos atualizar o username da sofia elise
UPDATE profiles 
SET username = 'sofiaelise123' 
WHERE id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';

-- Corrigir a comissão incorreta da sofiaelise123 por anavic123
-- Ela recebeu R$ 82,50 (3% de R$ 2.750) que está correto para nível 2
-- Mas seu saldo total está incorreto, vamos recalcular

-- Primeiro, remover a comissão incorreta que ela recebeu diretamente de anavic123
DELETE FROM user_referrals 
WHERE referrer_id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f' 
AND referred_id = 'd5ad8272-af57-4101-962f-2c0890314788';

-- Corrigir o saldo da sofia elise (ela deveria ter apenas R$ 500 + R$ 82,50 = R$ 582,50)
UPDATE profiles 
SET 
  available_balance = 582.50,
  daily_commissions = 0.00
WHERE id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';

-- Agora vamos corrigir a estrutura de referência
-- A anavic123 deve ser referida pelo vitincastro123, não diretamente pela sofia
-- Isso já está correto nos dados (anavic123.referred_by = vitincastro123.id)

-- Adicionar a comissão correta de nível 2 para sofia elise
-- Quando anavic123 ativou o plano premium (R$ 2.750), sofia deveria receber 3% = R$ 82,50
UPDATE profiles 
SET 
  available_balance = available_balance + 82.50,
  daily_commissions = daily_commissions + 82.50
WHERE id = 'a31e7c41-2823-48f3-a458-59c2f1e3190f';

-- Função para resetar sinais diários baseado em horário do Brasil
CREATE OR REPLACE FUNCTION reset_daily_signals_brazil()
RETURNS TRIGGER AS $$
DECLARE
  brasil_today DATE;
  user_last_reset DATE;
BEGIN
  -- Calcular data atual no horário de Brasília (UTC-3)
  brasil_today := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
  user_last_reset := (OLD.last_reset_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE;
  
  -- Se mudou a data (comparando no horário de Brasília), resetar sinais
  IF user_last_reset < brasil_today THEN
    NEW.daily_signals_used = 0;
    NEW.last_reset_date = brasil_today;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;