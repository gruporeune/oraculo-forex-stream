-- Ativar plano partner para equipemelchior@gmail.com
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'equipemelchior@gmail.com';
    
    -- Verificar se o usuário existe
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email equipemelchior@gmail.com não encontrado';
    END IF;
    
    -- Inserir o plano partner na tabela user_plans
    INSERT INTO public.user_plans (
        user_id,
        plan_name,
        is_active,
        purchase_date,
        daily_earnings,
        daily_signals_used,
        auto_operations_completed_today
    ) VALUES (
        target_user_id,
        'partner',
        true,
        now(),
        0,
        0,
        0
    );
    
    -- Atualizar o perfil do usuário
    UPDATE public.profiles 
    SET 
        plan = 'partner',
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Plano partner ativado com sucesso para o usuário equipemelchior@gmail.com';
END $$;