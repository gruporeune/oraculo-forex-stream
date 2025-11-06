-- Add column to track total automatic operations earnings per plan
ALTER TABLE user_plans 
ADD COLUMN IF NOT EXISTS total_auto_earnings numeric DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN user_plans.total_auto_earnings IS 'Total acumulado de ganhos apenas das operações automáticas para este plano. Usado para calcular quando atingir 200% do valor investido.';