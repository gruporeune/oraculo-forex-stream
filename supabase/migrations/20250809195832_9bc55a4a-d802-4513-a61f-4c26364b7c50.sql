-- Add abacate_payment_id column to payment_transactions table
ALTER TABLE public.payment_transactions 
ADD COLUMN abacate_payment_id TEXT;