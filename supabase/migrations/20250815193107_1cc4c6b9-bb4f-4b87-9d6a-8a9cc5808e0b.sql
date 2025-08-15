-- Fix infinite recursion in admin_users policies by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- Drop existing policies on admin_users that cause recursion
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view admin list" 
ON public.admin_users 
FOR SELECT 
USING (public.is_current_user_admin());

-- Also fix other policies that might reference admin_users
DROP POLICY IF EXISTS "Admins can manage materials" ON public.materials;
CREATE POLICY "Admins can manage materials" 
ON public.materials 
FOR ALL 
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can update withdrawal requests" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (public.is_current_user_admin());

-- Add pix_key_type column to withdrawal_requests
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS pix_key_type text DEFAULT 'other';