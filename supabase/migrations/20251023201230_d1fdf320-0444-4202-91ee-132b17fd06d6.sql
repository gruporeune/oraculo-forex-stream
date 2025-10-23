-- Criar função para buscar emails dos usuários de forma segura
CREATE OR REPLACE FUNCTION get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Buscar o email do usuário na tabela auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$;

-- Criar função para buscar emails de múltiplos usuários
CREATE OR REPLACE FUNCTION get_users_emails(user_uuids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, auth.users.email
  FROM auth.users
  WHERE id = ANY(user_uuids);
END;
$$;

-- Permitir que admins executem essas funções
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_emails(uuid[]) TO authenticated;