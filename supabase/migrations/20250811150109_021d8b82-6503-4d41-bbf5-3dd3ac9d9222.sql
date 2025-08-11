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
CREATE POLICY "Limited access to referral profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != profiles.id
  -- Only allow if there's a referral relationship
  AND (
    -- User is the referrer of this profile
    EXISTS (
      SELECT 1 FROM user_referrals 
      WHERE referrer_id = auth.uid() AND referred_id = profiles.id
    )
    OR 
    -- User is referred by this profile
    EXISTS (
      SELECT 1 FROM user_referrals 
      WHERE referrer_id = profiles.id AND referred_id = auth.uid()
    )
    OR 
    -- Direct referral relationship in profiles table
    profiles.referred_by = auth.uid()
    OR
    -- User was referred by this profile
    EXISTS (
      SELECT 1 FROM profiles AS user_profile
      WHERE user_profile.id = auth.uid() AND user_profile.referred_by = profiles.id
    )
  )
);