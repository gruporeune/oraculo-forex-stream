-- Create sample earnings history for sofiaelise123 to show the system is working
INSERT INTO daily_earnings_history (
  user_id, 
  date, 
  total_earnings, 
  total_commissions, 
  operations_count,
  plan_earnings
) VALUES (
  (SELECT id FROM profiles WHERE full_name = 'sofiaelise123'),
  CURRENT_DATE - INTERVAL '1 day',
  147.25, -- total from operations
  295.0,  -- commissions from referrals
  23,     -- total operations count
  jsonb_build_object(
    'premium', 41.25,
    'platinum', 100.0,
    'master', 6.0
  )
), (
  (SELECT id FROM profiles WHERE full_name = 'sofiaelise123'),
  CURRENT_DATE - INTERVAL '2 days',
  89.15,
  120.0,
  18,
  jsonb_build_object(
    'premium', 35.15,
    'platinum', 54.0
  )
);