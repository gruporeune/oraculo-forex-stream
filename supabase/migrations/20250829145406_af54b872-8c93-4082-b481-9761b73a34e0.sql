
-- Permitir que admins atualizem planos de usuários
CREATE POLICY "Admins can update user plans" 
ON public.user_plans 
FOR UPDATE 
USING (is_current_user_admin());

-- Permitir que admins insiram novos planos para usuários
CREATE POLICY "Admins can insert user plans" 
ON public.user_plans 
FOR INSERT 
WITH CHECK (is_current_user_admin());

-- Permitir que admins vejam todos os planos
CREATE POLICY "Admins can view all user plans" 
ON public.user_plans 
FOR SELECT 
USING (is_current_user_admin());
