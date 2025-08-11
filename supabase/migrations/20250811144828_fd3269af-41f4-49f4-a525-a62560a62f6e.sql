-- Fix the security vulnerability properly
-- The previous policy still allowed access to sensitive financial data
-- We need to completely remove access to other users' profiles

-- Drop the problematic policy that still allows viewing other users' data
DROP POLICY IF EXISTS "Public profile info for referrals only" ON public.profiles;

-- Only keep the policy that allows users to view their own profile
-- No other user should be able to see ANY data from another user's profile

-- If the application needs to display referral information, 
-- create a separate view or table that only contains non-sensitive public data
-- For now, we're removing all cross-user access to ensure security