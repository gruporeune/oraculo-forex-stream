-- Add unique constraint to username column in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT unique_username UNIQUE (username);