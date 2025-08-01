-- Reset da conta sofiaelise123@gmail.com para testes
UPDATE profiles 
SET 
  available_balance = 0,
  daily_signals_used = 0,
  daily_earnings = 0,
  daily_commissions = 0,
  last_reset_date = CURRENT_DATE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'sofiaelise123@gmail.com'
);

-- Deletar todos os sinais automáticos da Sofia para recomeçar
DELETE FROM signals 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'sofiaelise123@gmail.com'
) AND is_automatic = true;