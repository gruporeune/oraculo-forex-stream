-- Add unique constraint to admin_users table
ALTER TABLE public.admin_users 
ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);