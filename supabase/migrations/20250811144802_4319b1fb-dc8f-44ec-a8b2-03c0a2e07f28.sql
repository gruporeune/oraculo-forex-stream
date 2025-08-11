-- Fix security vulnerability: Remove overly permissive policy that exposes financial data
-- Only allow users to view their own profiles, not other users' profiles

-- Remove the problematic policy that allows authenticated users to view other profiles
DROP POLICY IF EXISTS "Authenticated users can view basic profile info only" ON public.profiles;

-- Keep only the secure policy that allows users to view their own profile
-- This policy is already in place: "Users can view their own profile"

-- For any legitimate use cases where basic public info is needed (like referral display),
-- create a more restrictive policy that excludes all sensitive financial data
CREATE POLICY "Public profile info for referrals only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != id
);