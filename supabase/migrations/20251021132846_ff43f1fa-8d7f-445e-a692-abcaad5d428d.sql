-- Adicionar 'pro' ao check constraint da tabela user_plans
ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_name_check;

ALTER TABLE user_plans ADD CONSTRAINT user_plans_plan_name_check 
CHECK (plan_name IN ('partner', 'master', 'pro', 'premium', 'platinum', 'international'));