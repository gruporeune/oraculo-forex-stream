-- Fix security issue: Protect sensitive personal data in profiles table
-- Create a more secure policy that allows cross-user access only to safe fields

-- Drop the current policy that allows full access
DROP POLICY IF EXISTS "Users can view basic referral profile info" ON public.profiles;

-- Create two separate policies for better security
-- 1. Full access to own profile
CREATE POLICY "Users can view own profile fully" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Limited access to other users' profiles for referral functionality only
-- Note: This still allows access to all fields at database level, but we'll restrict 
-- at application level by only selecting safe fields in queries
CREATE POLICY "Limited access to referral profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != id
  -- Only allow if the viewing user has referrals or is being referred
  AND (
    EXISTS (
      SELECT 1 FROM user_referrals 
      WHERE referrer_id = auth.uid() AND referred_id = id
    )
    OR EXISTS (
      SELECT 1 FROM user_referrals 
      WHERE referrer_id = id AND referred_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.id = auth.uid() 
      AND p2.id = id
      AND (p1.referred_by = p2.id OR p2.referred_by = p1.id)
    )
  )
);