-- Activate the user with PARTNER plan
UPDATE profiles 
SET plan = 'partner', updated_at = now()
WHERE id = '9baba66d-8b4a-472a-93ae-5bfd5627d5f3';

-- Insert user plan record
INSERT INTO user_plans (
  user_id, 
  plan_name, 
  purchase_date, 
  is_active
) VALUES (
  '9baba66d-8b4a-472a-93ae-5bfd5627d5f3',
  'partner',
  NOW(),
  true
);