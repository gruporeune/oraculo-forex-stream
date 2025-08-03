import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Download, Lightbulb, Send, Loader2 } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  category: string;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-white/10 text-white h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start gap-4">
                    <span className="text-3xl">{getFileIcon(material.file_type)}</span>
                    <span className="text-lg">{material.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-white/70 text-sm">{material.description || 'Material educativo para aprimorar seus conhecimentos.'}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                      {material.file_type.toUpperCase()}
                    </span>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => handleDownload(material.file_url, material.title)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Agora
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
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