-- Make pix_key nullable since it's only required for PIX withdrawals, not USDT
ALTER TABLE public.withdrawal_requests 
ALTER COLUMN pix_key DROP NOT NULL;