import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Download, Lightbulb, Send, Loader2, Star } from 'lucide-react';
import ebookAnaliseTecnica from '@/assets/ebook-analise-tecnica.png';
import ebookInvestimentos from '@/assets/ebook-investimentos-soros-buffett.png';

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  category: string;
  allowed_plans?: string[];
  price_brl?: number;
  image_url?: string;
  author?: string;
  is_free?: boolean;
}

interface MaterialsPageProps {
  user: any;
  profile: any;
}

const MaterialsPage = ({ user, profile }: MaterialsPageProps) => {
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMaterials(data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: 'Erro ao carregar materiais',
          description: 'Não foi possível carregar os materiais. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleDownload = (fileUrl: string, title: string) => {
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      toast({
        title: "Em Breve!",
        description: `O material "${title}" ainda não está disponível para download.`,
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📖';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'doc':
      case 'docx':
        return '📄';
      case 'zip':
      case 'rar':
        return '📦';
      case 'mp4':
      case 'avi':
        return '🎥';
      default:
        return '📁';
    }
  };

  const getMaterialImage = (material: Material) => {
    if (material.image_url === '/src/assets/ebook-analise-tecnica.png') {
      return ebookAnaliseTecnica;
    }
    if (material.image_url === '/src/assets/ebook-investimentos-soros-buffett.png') {
      return ebookInvestimentos;
    }
    return null;
  };

  const canAccessMaterial = (material: Material) => {
    if (!material.allowed_plans || material.allowed_plans.length === 0) return true;
    return material.allowed_plans.includes(profile?.plan || 'free');
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      toast({ title: 'Opa!', description: 'Por favor, escreva sua sugestão.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('material_suggestions')
        .insert({ user_id: user.id, suggestion: suggestion.trim() });

      if (error) throw error;

      toast({
        title: 'Sugestão Enviada!',
        description: 'Obrigado! Sua sugestão nos ajudará a trazer os melhores materiais para você.',
        className: 'bg-green-500 text-white',
      });
      setSuggestion('');
    } catch (error: any) {
      toast({
        title: 'Erro ao Enviar',
        description: 'Não foi possível enviar sua sugestão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-400" />
          Materiais Extras
        </h1>
        <p className="text-white/70 mt-2">Baixe ebooks, indicadores e outros recursos para turbinar seus resultados.</p>
      </motion.div>

      {loadingMaterials ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="ml-2 text-white">Carregando materiais...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70">Nenhum material disponível no momento.</p>
          <p className="text-white/50 text-sm">Use o formulário abaixo para sugerir novos materiais!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material, index) => {
            const materialImage = getMaterialImage(material);
            const hasAccess = canAccessMaterial(material);
            
            return (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-black/40 border-white/10 text-white h-full flex flex-col overflow-hidden">
                  {materialImage && (
                    <div className="relative">
                      <img 
                        src={materialImage} 
                        alt={material.title}
                        className="w-full h-48 object-cover"
                      />
                      {material.price_brl && material.price_brl > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          R$ {material.price_brl.toFixed(0)}
                        </div>
                      )}
                      {material.is_free && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          GRÁTIS
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardHeader className={materialImage ? "pb-2" : ""}>
                    <CardTitle className="flex items-start gap-3">
                      {!materialImage && (
                        <span className="text-3xl">{getFileIcon(material.file_type)}</span>
                      )}
                      <div className="flex-1">
                        <span className="text-lg leading-tight">{material.title}</span>
                        {material.author && (
                          <p className="text-sm text-white/60 mt-1">por {material.author}</p>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-white/70 text-sm mb-3">
                      {material.description || 'Material educativo para aprimorar seus conhecimentos.'}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                        {material.file_type.toUpperCase()}
                      </span>
                      {material.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded capitalize">
                          {material.category}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  
                  <div className="p-6 pt-0">
                    <Button 
                      className={`w-full ${hasAccess 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                      onClick={() => handleDownload(material.file_url, material.title)}
                      disabled={!hasAccess}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {hasAccess ? (material.is_free ? 'FREE' : 'Baixar Agora') : 'Bloqueado'}
                    </Button>
                    {!hasAccess && (
                      <p className="text-xs text-white/50 text-center mt-2">
                        Disponível para: {material.allowed_plans?.join(', ')}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card className="bg-black/40 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
              Tem uma Ideia?
            </CardTitle>
            <CardDescription className="text-white/60">
              Qual material você gostaria de ver aqui? Envie sua sugestão!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <Textarea
                placeholder="Ex: Um e-book sobre padrões de candlestick..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={4}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Sugestão
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MaterialsPage;