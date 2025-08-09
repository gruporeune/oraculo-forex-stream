-- Verificar e corrigir triggers para histórico de ganhos
-- Primeiro, vamos verificar se os triggers existem

-- Recriar o trigger na tabela profiles para salvar histórico
DROP TRIGGER IF EXISTS save_daily_history_trigger ON profiles;

CREATE TRIGGER save_daily_history_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION save_daily_history_and_reset();

-- Recriar o trigger na tabela user_plans para reset diário
DROP TRIGGER IF EXISTS reset_user_plan_daily_trigger ON user_plans;

CREATE TRIGGER reset_user_plan_daily_trigger
    BEFORE UPDATE ON user_plans
    FOR EACH ROW
    EXECUTE FUNCTION reset_user_plan_daily_stats();

-- Verificar se a função está funcionando corretamente
-- Vamos simular ganhos do dia anterior para testar o histórico

-- Inserir um histórico de teste para a sofiaelise123
INSERT INTO daily_earnings_history (
    user_id, 
    date, 
    total_earnings, 
    total_commissions, 
    operations_count,
    plan_earnings
) VALUES (
    (SELECT id FROM profiles WHERE full_name = 'sofiaelise123'),
    CURRENT_DATE - INTERVAL '1 day',
    41.25,
    0,
    15,
    '{"premium": 41.25}'::jsonb
) ON CONFLICT (user_id, date) DO UPDATE SET
    total_earnings = EXCLUDED.total_earnings,
    total_commissions = EXCLUDED.total_commissions,
    operations_count = EXCLUDED.operations_count,
    plan_earnings = EXCLUDED.plan_earnings;