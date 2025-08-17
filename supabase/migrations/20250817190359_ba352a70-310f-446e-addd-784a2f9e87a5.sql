-- Add foreign key constraint between withdrawal_requests and profiles
ALTER TABLE public.withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;