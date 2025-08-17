-- Adicionar policy para permitir que admins atualizem perfis (necessário para devolver saldo quando saque é rejeitado)
CREATE POLICY "Admins can update profiles for withdrawal management" 
ON public.profiles 
FOR UPDATE 
USING (is_current_user_admin());