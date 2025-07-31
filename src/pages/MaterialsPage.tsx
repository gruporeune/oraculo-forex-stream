import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Download, Lightbulb, Send, Loader2 } from 'lucide-react';

// Placeholder. Replace with actual files from Supabase Storage.
const availableMaterials = [
  {
    id: 1,
    title: 'Ebook: Guia Completo de Price Action',
    description: 'Aprenda os fundamentos e estratégias avançadas para operar usando a ação do preço.',
    fileUrl: '#', // TODO: Replace with actual file URL from Supabase Storage
    icon: '📖',
  },
  {
    id: 2,
    title: 'Indicador de Tendência para MT4',
    description: 'Um indicador exclusivo para identificar a força e a direção da tendência no MetaTrader 4.',
    fileUrl: '#', // TODO: Replace with actual file URL from Supabase Storage
    icon: '📊',
  },
  {
    id: 3,
    title: 'Template de Gestão de Risco',
    description: 'Planilha completa para você gerenciar seu capital de forma profissional e segura.',
    fileUrl: '#', // TODO: Replace with actual file URL from Supabase Storage
    icon: '📋',
  },
  {
    id: 4,
    title: 'Como se transformar em um operador e investidor de sucesso',
    description: 'Um guia passo a passo para sair do zero e alcançar a consistência no mercado financeiro.',
    fileUrl: '#', // TODO: Replace with actual file URL from Supabase Storage
    icon: '🚀',
  },
];

interface MaterialsPageProps {
  user: any;
  profile: any;
}

const MaterialsPage = ({ user, profile }: MaterialsPageProps) => {
  const { toast } = useToast();
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = (fileUrl: string, title: string) => {
    if (fileUrl === '#') {
      toast({
        title: "Em Breve!",
        description: `O material "${title}" ainda não está disponível para download.`,
      });
      return;
    }
    window.open(fileUrl, '_blank');
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableMaterials.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-black/40 border-white/10 text-white h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start gap-4">
                  <span className="text-3xl">{material.icon}</span>
                  <span className="text-lg">{material.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-white/70 text-sm">{material.description}</p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => handleDownload(material.fileUrl, material.title)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Agora
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

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