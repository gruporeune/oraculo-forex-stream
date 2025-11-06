-- Add new required fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS full_name_verified text;

-- Update the full_name column to be more specific
COMMENT ON COLUMN profiles.full_name IS 'Nome completo e verdadeiro do usuário';
COMMENT ON COLUMN profiles.cpf IS 'CPF válido do usuário';
COMMENT ON COLUMN profiles.date_of_birth IS 'Data de nascimento do usuário';