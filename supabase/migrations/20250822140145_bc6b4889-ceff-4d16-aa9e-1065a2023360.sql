-- Criar storage bucket para comprovantes USDT
INSERT INTO storage.buckets (id, name, public) VALUES ('usdt-payments', 'usdt-payments', false);

-- Criar políticas para bucket usdt-payments
CREATE POLICY "Users can upload their own USDT payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'usdt-payments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own USDT payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'usdt-payments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all USDT payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'usdt-payments' AND is_current_user_admin());

-- Criar tabela para pagamentos USDT do plano international
CREATE TABLE public.usdt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'international',
  amount_usd NUMERIC NOT NULL DEFAULT 100,
  wallet_address TEXT NOT NULL DEFAULT 'TVSQjGopxtp81AaNrrw8B25CWeAGVddLf4',
  user_wallet TEXT,
  transaction_hash TEXT NOT NULL,
  proof_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS na tabela usdt_payments
ALTER TABLE public.usdt_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para usdt_payments
CREATE POLICY "Users can view their own USDT payments"
ON public.usdt_payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own USDT payments" 
ON public.usdt_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all USDT payments"
ON public.usdt_payments
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Adicionar nova coluna para carteiras USDT nas solicitações de saque
ALTER TABLE public.withdrawal_requests 
ADD COLUMN usdt_wallet TEXT,
ADD COLUMN withdrawal_type TEXT DEFAULT 'pix' CHECK (withdrawal_type IN ('pix', 'usdt'));

-- Atualizar função de comissões para incluir plano international
CREATE OR REPLACE FUNCTION public.calculate_plan_commission_level(plan_name text, level integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN level = 1 THEN
      CASE plan_name
        WHEN 'partner' THEN 20.0        -- 10% de R$ 200,00
        WHEN 'master' THEN 60.0         -- 10% de R$ 600,00  
        WHEN 'international' THEN 60.0  -- 10% de R$ 600,00 (equivalente ao master)
        WHEN 'premium' THEN 275.0       -- 10% de R$ 2.750,00
        WHEN 'platinum' THEN 500.0      -- 10% de R$ 5.000,00
        ELSE 0.0
      END
    WHEN level = 2 THEN
      CASE plan_name
        WHEN 'partner' THEN 6.0         -- 3% de R$ 200,00
        WHEN 'master' THEN 18.0         -- 3% de R$ 600,00  
        WHEN 'international' THEN 18.0  -- 3% de R$ 600,00 (equivalente ao master)
        WHEN 'premium' THEN 82.5        -- 3% de R$ 2.750,00
        WHEN 'platinum' THEN 150.0      -- 3% de R$ 5.000,00
        ELSE 0.0
      END
    WHEN level = 3 THEN
      CASE plan_name
        WHEN 'partner' THEN 4.0         -- 2% de R$ 200,00
        WHEN 'master' THEN 12.0         -- 2% de R$ 600,00  
        WHEN 'international' THEN 12.0  -- 2% de R$ 600,00 (equivalente ao master)
        WHEN 'premium' THEN 55.0        -- 2% de R$ 2.750,00
        WHEN 'platinum' THEN 100.0      -- 2% de R$ 5.000,00
        ELSE 0.0
      END
    ELSE 0.0
  END;
$function$;