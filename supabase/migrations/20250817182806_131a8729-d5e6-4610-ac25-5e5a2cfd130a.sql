-- Adicionar colunas necessárias para o painel admin
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar índices para melhor performance no painel admin
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);

-- Política para admins gerenciarem todos os saques
DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can manage all withdrawal requests"
ON public.withdrawal_requests
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Política para admins verem todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles for withdrawal management" ON public.profiles;
CREATE POLICY "Admins can view all profiles for withdrawal management"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_current_user_admin());