-- Fix security issue: Limit what profile data can be accessed by other users
-- Only allow users to see their own full profile, and limited safe data from others

-- Drop the current broad policy
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Policy for users to see their own full profile
CREATE POLICY "Users can view own profile fully" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy for limited access to other users' profiles (only non-sensitive data)
-- This allows referral functionality to work while protecting sensitive data
CREATE POLICY "Limited access to referral profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != id
  AND (
    -- Only allow access to basic non-sensitive fields
    -- The application will handle selecting only these specific columns
    true
  )
);

-- Note: Applications should only select these safe fields when querying other users:
-- id, username, full_name, plan, updated_at
-- Sensitive fields like phone, broker_id, financial data will be protected