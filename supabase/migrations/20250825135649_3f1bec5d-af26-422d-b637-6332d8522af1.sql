-- Create the missing user plan for the paid transaction
INSERT INTO public.user_plans (
    user_id,
    plan_name,
    purchase_date,
    is_active,
    daily_earnings,
    daily_signals_used,
    auto_operations_started,
    auto_operations_paused,
    auto_operations_completed_today,
    cycle_start_time,
    last_reset_date
) VALUES (
    'f63532b4-ecff-4890-b2dd-2929fee99e47'::uuid,
    'partner',
    '2025-08-25 13:53:02.14+00'::timestamptz,
    true,
    0,
    0,
    false,
    false,
    0,
    null,
    CURRENT_DATE
);

-- Update the user's main plan in profiles table
UPDATE public.profiles 
SET plan = 'partner', updated_at = now()
WHERE id = 'f63532b4-ecff-4890-b2dd-2929fee99e47';