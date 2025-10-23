-- Remover funções antigas
DROP FUNCTION IF EXISTS get_user_email(uuid);
DROP FUNCTION IF EXISTS get_users_emails(uuid[]);

-- Recriar função para buscar email de um usuário (retornando varchar)
CREATE OR REPLACE FUNCTION get_user_email(user_uuid uuid)
RETURNS varchar(255)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email varchar(255);
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$;

-- Recriar função para buscar emails de múltiplos usuários (retornando varchar)
CREATE OR REPLACE FUNCTION get_users_emails(user_uuids uuid[])
RETURNS TABLE(user_id uuid, email varchar(255))
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, auth.users.email::varchar(255)
  FROM auth.users
  WHERE id = ANY(user_uuids);
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_emails(uuid[]) TO authenticated;