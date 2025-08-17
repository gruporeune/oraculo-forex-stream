-- Tornar o usuário atual um admin
INSERT INTO public.admin_users (user_id)
SELECT auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;