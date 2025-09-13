-- Add new material "Indicador do Oráculo" with plan restrictions
INSERT INTO materials (
  title,
  description,
  author,
  file_url,
  file_type,
  price_brl,
  is_free,
  allowed_plans,
  category,
  image_url,
  is_active
) VALUES (
  'Indicador do Oráculo',
  'Material exclusivo para análise avançada do mercado financeiro. Aprenda técnicas profissionais utilizadas pelos melhores traders.',
  'Equipe Oracle Trading',
  'https://drive.google.com/file/d/1KrwJciH728PjP-6TRkrFAUXk5bJ9BN-M/view?usp=sharing',
  'PDF',
  599.00,
  true,
  ARRAY['partner', 'master', 'premium', 'platinum'],
  'trading',
  '/src/assets/indicador-oraculo.png',
  true
);