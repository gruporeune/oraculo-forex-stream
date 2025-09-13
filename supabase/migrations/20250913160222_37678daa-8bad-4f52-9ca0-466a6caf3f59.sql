-- Remove duplicated e-books
DELETE FROM materials WHERE id IN ('48ab4ba2-211a-4f52-a064-ed2239966a03', 'cc79b51f-2b4f-49e3-a1b8-6bc85ba7b33b');

-- Update the file URLs for the remaining e-books
UPDATE materials 
SET file_url = 'https://nzxidhlktjpzkxhofswx.supabase.co/storage/v1/object/public/materials/ebook-analise-tecnica-essencial.pdf'
WHERE id = '4ee672d5-d5eb-4958-a908-22fafe0c9daf';

UPDATE materials 
SET file_url = 'https://nzxidhlktjpzkxhofswx.supabase.co/storage/v1/object/public/materials/Os%20segredos%20de%20George%20Soros%20e%20Warren%20Buffett%20-%20Mark%20Tier.pdf'
WHERE id = '7f2d1b3a-fbb6-4e09-8b15-0889c5ebfe73';