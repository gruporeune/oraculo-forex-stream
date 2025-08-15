-- Add name field to withdrawal_requests table for SecretPay integration
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS secretpay_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_data JSONB;