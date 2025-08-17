-- Verificar se todas as colunas necessárias existem na tabela withdrawal_requests
-- Adicionar colunas que podem estar faltando para o painel admin

ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar índices para melhor performance no painel admin
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);

-- Atualizar políticas RLS para admins poderem gerenciar tudo
CREATE POLICY IF NOT EXISTS "Admins can manage all withdrawal requests"
ON public.withdrawal_requests
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Garantir que admins possam ver informações de perfil necessárias
CREATE POLICY IF NOT EXISTS "Admins can view all profiles for withdrawal management"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_current_user_admin());