-- Alterar username de gleydsonbento2@gmail.com de "liberdade2" para "AMERICA"
UPDATE profiles 
SET username = 'AMERICA'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'gleydsonbento2@gmail.com'
);