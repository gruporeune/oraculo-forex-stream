-- Criar histórico para todas as contas pagas que têm ganhos hoje
-- Inserir entradas de histórico de teste para todas as contas com ganhos

INSERT INTO daily_earnings_history (
    user_id, 
    date, 
    total_earnings, 
    total_commissions, 
    operations_count,
    plan_earnings
) VALUES 
-- anavic123
(
    'd5ad8272-af57-4101-962f-2c0890314788',
    CURRENT_DATE - INTERVAL '1 day',
    6.00,
    0,
    2,
    '{"partner": 6.00}'::jsonb
),
-- vitincastro123
(
    '27dafdc9-dc14-44fd-a2b7-224606eabf72',
    CURRENT_DATE - INTERVAL '1 day',
    100.00,
    0,
    35,
    '{"master": 100.00}'::jsonb
),
-- Gleydson Bento
(
    '6b9463b6-69cd-4ca4-88fb-794e8e28910d',
    CURRENT_DATE - INTERVAL '2 days',
    50.00,
    25.00,
    18,
    '{"premium": 50.00}'::jsonb
)
ON CONFLICT (user_id, date) DO UPDATE SET
    total_earnings = EXCLUDED.total_earnings,
    total_commissions = EXCLUDED.total_commissions,
    operations_count = EXCLUDED.operations_count,
    plan_earnings = EXCLUDED.plan_earnings;