-- Add columns for plan restrictions and pricing to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS allowed_plans text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS price_brl numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true;

-- Insert the two new e-books
INSERT INTO public.materials (
  title, 
  description, 
  file_type, 
  file_url, 
  category, 
  allowed_plans, 
  price_brl, 
  image_url, 
  author, 
  is_free, 
  is_active
) VALUES 
(
  'Análise Técnica Essencial',
  'Um guia completo sobre análise técnica para traders iniciantes e intermediários. Aprenda os fundamentos para tomar decisões mais assertivas no mercado.',
  'pdf',
  'https://exemplo.com/analise-tecnica-essencial.pdf',
  'trading',
  '{"free", "partner", "master", "premium", "platinum"}',
  89.00,
  '/src/assets/ebook-analise-tecnica.png',
  'André Moraes',
  true,
  true
),
(
  'Investimentos: Os Segredos de George Soros & Warren Buffett',
  'Descubra as estratégias e segredos dos maiores investidores do mundo. Um livro essencial para quem quer aprender com os mestres.',
  'pdf', 
  'https://exemplo.com/segredos-soros-buffett.pdf',
  'investimentos',
  '{"free", "partner", "master", "premium", "platinum"}',
  89.00,
  '/src/assets/ebook-investimentos-soros-buffett.png',
  'Mark Tier',
  true,
  true
);