-- Remover duplicados da tabela referral_commissions mantendo apenas o mais recente
DELETE FROM public.referral_commissions a USING public.referral_commissions b
WHERE a.id < b.id 
AND a.referrer_id = b.referrer_id 
AND a.referred_id = b.referred_id 
AND a.plan_name = b.plan_name;

-- Criar o constraint único necessário
ALTER TABLE public.referral_commissions 
ADD CONSTRAINT referral_commissions_unique_combo 
UNIQUE (referrer_id, referred_id, plan_name);

-- Ativar o plano partner para equipemelchior@gmail.com
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