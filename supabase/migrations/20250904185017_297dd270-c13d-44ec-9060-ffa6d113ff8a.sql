-- Corrigir a rede conforme especificado pelo usuário
-- ismuller+777@icloud.com deve ser raiz (sem referrer)
UPDATE profiles 
SET referred_by = NULL 
WHERE id = 'e5bd421d-51ff-48ca-bca1-64af28c14cce';

-- Adicionar usernames para identificação dos usuários
UPDATE profiles 
SET username = 'ismuller777' 
WHERE id = 'e5bd421d-51ff-48ca-bca1-64af28c14cce';

UPDATE profiles 
SET username = 'ismuller888' 
WHERE id = '70866c26-81a4-45a7-9aeb-80155f3a5b89';

UPDATE profiles 
SET username = 'ismuller999' 
WHERE id = 'fd170024-6045-4308-9d4f-021515481a83';

UPDATE profiles 
SET username = 'ismuller222' 
WHERE id = '855f8550-11a4-4188-bc81-fc1b890e011e';