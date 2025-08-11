-- Revert to a more permissive policy that allows referral functionality
-- but protect only the most sensitive data at application level

-- Drop the current restrictive policies
DROP POLICY IF EXISTS "Users can view own profile fully" ON public.profiles;
DROP POLICY IF EXISTS "Limited access to referral profiles" ON public.profiles;

-- Create a policy that allows authenticated users to view basic profile info
-- Financial and sensitive personal data protection will be handled at application level
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Note: The application will be responsible for:
-- 1. Only selecting non-sensitive fields when querying other users' profiles  
-- 2. Users can see their own full profile when querying with their own ID
-- 3. Cross-user queries will only select: id, username, full_name, plan, updated_at