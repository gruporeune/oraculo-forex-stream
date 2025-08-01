-- Reset account for sofiaelise123@gmail.com
UPDATE public.profiles 
SET 
  available_balance = 0,
  daily_earnings = 0,
  daily_signals_used = 0,
  last_reset_date = CURRENT_DATE
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'sofiaelise123@gmail.com'
);

-- Delete all automatic signals for this user today
DELETE FROM public.signals 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'sofiaelise123@gmail.com'
) 
AND is_automatic = true 
AND created_at >= CURRENT_DATE;

-- Add columns to track automatic operations state
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auto_operations_started boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_operations_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_operations_completed_today integer DEFAULT 0;