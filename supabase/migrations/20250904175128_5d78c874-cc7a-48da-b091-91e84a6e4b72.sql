-- Transferir usuário ismuller+777@icloud.com para ser indicado direto de admin1@gmail.com

-- Primeiro, vamos buscar o ID do usuário admin1@gmail.com
-- Depois, atualizar o referred_by do usuário ismuller+777@icloud.com

UPDATE public.profiles 
SET referred_by = (
  SELECT p.id 
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'admin1@gmail.com'
)
WHERE id = (
  SELECT p.id 
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'ismuller+777@icloud.com'
);