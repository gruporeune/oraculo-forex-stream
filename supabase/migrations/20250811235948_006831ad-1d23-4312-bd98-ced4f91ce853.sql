-- Add missing columns for SuitPay compatibility
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'abacatepay',
ADD COLUMN IF NOT EXISTS transaction_data jsonb;