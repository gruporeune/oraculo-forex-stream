-- Insert test plans for specific users
INSERT INTO public.user_plans (user_id, plan_name) 
VALUES 
-- Get gleydsonbento@gmail.com user id and add premium plan
((SELECT id FROM auth.users WHERE email = 'gleydsonbento@gmail.com'), 'premium'),
-- Get anavic123 user id and add master plan  
((SELECT p.id FROM profiles p INNER JOIN auth.users u ON u.id = p.id WHERE p.username = 'anavic123' OR u.email LIKE '%anavic%' LIMIT 1), 'master');

-- Also add a test user for magalhaes123 if exists
INSERT INTO public.user_plans (user_id, plan_name) 
SELECT p.id, 'master'
FROM profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.username = 'magalhaes123' OR p.full_name LIKE '%magalhaes%' OR u.email LIKE '%magalhaes%'
LIMIT 1;