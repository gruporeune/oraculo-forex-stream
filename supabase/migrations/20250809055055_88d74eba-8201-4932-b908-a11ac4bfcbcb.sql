-- Corrigir dados inconsistentes nas contas que deveriam estar funcionando
-- Reset das operações para contas que estão travadas

-- Reset da anavic123 (master - target 6.00)
UPDATE user_plans 
SET daily_earnings = 0, 
    auto_operations_started = false, 
    auto_operations_paused = false,
    cycle_start_time = null,
    auto_operations_completed_today = 0
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'anavic123');

-- Reset da vitincastro123 (platinum - target 100.00)  
UPDATE user_plans 
SET daily_earnings = 0,
    auto_operations_started = false,
    auto_operations_paused = false, 
    cycle_start_time = null,
    auto_operations_completed_today = 0
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'vitincastro123');

-- Reset da Gleydson Bento (premium - target 41.25)
UPDATE user_plans 
SET daily_earnings = 0,
    auto_operations_started = false,
    auto_operations_paused = false,
    cycle_start_time = null, 
    auto_operations_completed_today = 0
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'Gleydson Bento');

-- Reset da sofiaelise123 para começar do zero também
UPDATE user_plans 
SET daily_earnings = 0,
    auto_operations_started = false,
    auto_operations_paused = false,
    cycle_start_time = null,
    auto_operations_completed_today = 0  
WHERE user_id = (SELECT id FROM profiles WHERE full_name = 'sofiaelise123');

-- Também resetar os ganhos diários nos profiles para sincronizar
UPDATE profiles 
SET daily_earnings = 0
WHERE plan != 'free';