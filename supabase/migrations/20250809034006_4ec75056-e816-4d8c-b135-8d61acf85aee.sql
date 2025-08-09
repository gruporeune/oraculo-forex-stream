-- Ativar planos adicionais para sofiaelise123 para testes
-- Adicionar plano Platinum
INSERT INTO public.user_plans (user_id, plan_name, is_active, daily_earnings, daily_signals_used, auto_operations_started, auto_operations_paused, auto_operations_completed_today) 
SELECT id, 'platinum', true, 0, 0, false, false, 0
FROM profiles 
WHERE username = 'sofiaelise123';

-- Adicionar plano Master
INSERT INTO public.user_plans (user_id, plan_name, is_active, daily_earnings, daily_signals_used, auto_operations_started, auto_operations_paused, auto_operations_completed_today) 
SELECT id, 'master', true, 0, 0, false, false, 0
FROM profiles 
WHERE username = 'sofiaelise123';