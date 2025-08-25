-- Remove the unique constraint that prevents multiple plans of same type
ALTER TABLE public.user_plans 
DROP CONSTRAINT IF EXISTS unique_user_plan;

-- Allow users to have multiple plans of the same type (up to 5 total)