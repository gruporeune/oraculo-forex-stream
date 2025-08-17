-- Fix duplicate usernames by adding numeric suffix
WITH duplicates AS (
  SELECT id, username, 
    ROW_NUMBER() OVER (PARTITION BY username ORDER BY updated_at) as rn
  FROM public.profiles 
  WHERE username = 'Majormkt'
)
UPDATE public.profiles 
SET username = CASE 
  WHEN d.rn = 1 THEN 'Majormkt'
  ELSE 'Majormkt' || d.rn::text
END
FROM duplicates d
WHERE profiles.id = d.id AND d.rn > 1;

-- Now add unique constraint to username column
ALTER TABLE public.profiles ADD CONSTRAINT unique_username UNIQUE (username);