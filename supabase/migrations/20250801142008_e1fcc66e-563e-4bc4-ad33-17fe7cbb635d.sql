-- Reset da conta sofiaelise123@gmail.com novamente para corrigir problemas
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

-- Deletar todos os sinais da Sofia para recomeçar completamente
DELETE FROM signals 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'sofiaelise123@gmail.com'
);