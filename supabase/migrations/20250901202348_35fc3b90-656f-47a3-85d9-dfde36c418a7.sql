-- Create table for manual PIX payments
CREATE TABLE public.manual_pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount_brl NUMERIC NOT NULL,
  proof_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manual_pix_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own manual PIX payments" 
ON public.manual_pix_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own manual PIX payments" 
ON public.manual_pix_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all manual PIX payments" 
ON public.manual_pix_payments 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create storage bucket for PIX payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pix-proofs', 'pix-proofs', false);

-- Create storage policies for PIX payment proofs
CREATE POLICY "Users can upload their own PIX proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pix-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PIX proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pix-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all PIX proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pix-proofs' AND is_current_user_admin());