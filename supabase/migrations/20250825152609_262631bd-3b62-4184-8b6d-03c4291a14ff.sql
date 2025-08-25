-- Remove unused payment provider columns from payment_transactions
ALTER TABLE public.payment_transactions 
DROP COLUMN IF EXISTS abacate_payment_id,
DROP COLUMN IF EXISTS paylatam_transaction_id;

-- Update default payment provider to secretpay
ALTER TABLE public.payment_transactions 
ALTER COLUMN payment_provider SET DEFAULT 'secretpay';