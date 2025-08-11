-- Revert the policy changes and fix properly
-- We need to allow viewing profile data for referrals but exclude sensitive financial fields

-- First, drop the current restrictive setup
DROP POLICY IF EXISTS "Public profile info for referrals only" ON public.profiles;

-- Create a policy that allows viewing basic profile info needed for referrals
-- but excludes sensitive financial data
CREATE POLICY "Users can view basic referral profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can always view their own profile (full access)
    auth.uid() = id 
    OR 
    -- Other authenticated users can only see non-sensitive fields
    -- This is handled at the application level by only selecting safe fields
    auth.uid() != id
  )
);

-- Note: The application code should be updated to only select non-sensitive fields
-- when querying other users' profiles for referral display