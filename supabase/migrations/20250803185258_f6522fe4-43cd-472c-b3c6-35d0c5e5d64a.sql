-- Criar tabela para materiais extras
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, video, doc, etc
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing materials (all authenticated users can view)
CREATE POLICY "All users can view active materials" 
ON public.materials 
FOR SELECT 
USING (is_active = true);

-- Create policy for admins to manage materials
CREATE POLICY "Admins can manage materials" 
ON public.materials 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for materials bucket
CREATE POLICY "Materials are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'materials');

CREATE POLICY "Admins can upload materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'materials' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update materials" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'materials' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete materials" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'materials' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.update_materials_updated_at();