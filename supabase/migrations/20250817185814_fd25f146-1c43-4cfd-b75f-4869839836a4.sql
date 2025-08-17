-- Fix RLS policy for admin withdrawals page to properly join with profiles
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;

-- Create new policy that allows admins to view all withdrawal requests
CREATE POLICY "Admins can view all withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (is_current_user_admin());

-- Ensure profiles table has proper policy for admin access
DROP POLICY IF EXISTS "Admins can view all profiles for withdrawal management" ON public.profiles;

CREATE POLICY "Admins can view all profiles for withdrawal management" 
ON public.profiles 
FOR SELECT 
USING (is_current_user_admin());