-- Adicionar campos para armazenar username e telefone no perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;