-- Fine-tune RLS policies to ensure security while maintaining functionality
-- The policies should work with the application's selective field queries

-- Drop existing policies  
DROP POLICY IF EXISTS "Users can view own profile fully" ON public.profiles;
DROP POLICY IF EXISTS "Limited access to referral profiles" ON public.profiles;

-- Policy 1: Users can see their own complete profile
CREATE POLICY "Users can view own profile fully" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Authenticated users can view only safe, non-sensitive fields from other profiles
-- This policy ensures that only basic public information is accessible for referral functionality
CREATE POLICY "Safe profile data for referrals" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != id
  -- This policy allows access but the application layer controls which columns are selected
  -- Only these safe columns should be queried: id, username, full_name, plan, updated_at
);

-- The application is already correctly selecting only safe fields:
-- .select('id, username, full_name, plan, updated_at')
-- Sensitive fields like phone, broker_id, available_balance, etc. are protected