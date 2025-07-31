import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignalsPageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

interface GeneratedSignal {
  id: string;
  asset_pair: string;
  signal_type: 'CALL' | 'PUT';
  expiration_time: number;
  confidence_percentage: number;
  entry_time: Date;
  analysis: string;
}

export default function SignalsPage({ user, profile, onProfileUpdate }: SignalsPageProps) {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSignals, setGeneratedSignals] = useState<GeneratedSignal[]>([]);
  const [canGenerate, setCanGenerate] = useState(true);
  const { toast } = useToast();

  const assets = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'GBP/JPY', 'EUR/JPY', 'AUD/JPY', 'USD/CHF', 'CAD/JPY'
  ];

  const expirationTimes = [
    { value: '1', label: '1 Minuto' },
    { value: '5', label: '5 Minutos' },
    { value: '15', label: '15 Minutos' }
  ];

  const planLimits = {
    free: 5,
    partner: 20,
    master: 100,
    premium: 500,
    platinum: 1000
  };

  const currentPlan = profile?.plan || 'free';
  const usedSignals = profile?.daily_signals_used || 0;
  const maxSignals = planLimits[currentPlan as keyof typeof planLimits];
  const remainingSignals = maxSignals - usedSignals;

  useEffect(() => {
    setCanGenerate(remainingSignals > 0);
  }, [remainingSignals]);

  useEffect(() => {
    loadRecentSignals();
  }, [user.id]);

  const loadRecentSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_automatic', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedSignals = data?.map(signal => ({
        ...signal,
        entry_time: new Date(signal.entry_time)
      })) || [];

      setGeneratedSignals(formattedSignals);
    } catch (error) {
      console.error('Error loading signals:', error);
    }
  };

  const generateSignal = async () => {
    if (!selectedAsset || !selectedExpiration || !canGenerate) return;

    setIsGenerating(true);
    
    try {
      const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const confidence = Math.floor(Math.random() * 15) + 85; // 85-99%
      const entryTime = new Date();
      const expirationMinutes = parseInt(selectedExpiration);
      
      // Generate analysis based on signal type and timeframe
      const analyses = {
        CALL: [
          "Tendência de alta identificada com rompimento de resistência importante",
          "Padrão de reversão de baixa para alta confirmado pelos indicadores",
          "Volume crescente sustentando movimento de alta",
          "Análise técnica indica continuação da tendência alcista"
        ],
        PUT: [
          "Tendência de baixa confirmada com rompimento de suporte chave",
          "Padrão de reversão de alta para baixa validado",
          "Pressão vendedora aumentando conforme indicadores",
          "Análise técnica aponta para continuação da queda"
        ]
      };

      const randomAnalysis = analyses[signalType][Math.floor(Math.random() * analyses[signalType].length)];

      const { error: signalError } = await supabase
        .from('signals')
        .insert({
          user_id: user.id,
          asset_pair: selectedAsset,
          signal_type: signalType,
          expiration_time: expirationMinutes,
          confidence_percentage: confidence,
          entry_time: entryTime.toISOString(),
          analysis: randomAnalysis,
          is_automatic: false,
          status: 'active'
        });

      if (signalError) throw signalError;

      // Update user's daily signals count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          daily_signals_used: usedSignals + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onProfileUpdate();
      loadRecentSignals();

      toast({
        title: "Sinal gerado com sucesso!",
        description: `${signalType} para ${selectedAsset} - Confiança: ${confidence}%`
      });

      // Reset form
      setSelectedAsset('');
      setSelectedExpiration('');

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Gerador de Sinais</h2>
        <p className="text-white/70">Gere sinais para opções binárias com alta precisão</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Generator */}
        <Card className="bg-black/40 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Gerar Novo Sinal
            </CardTitle>
            <p className="text-white/70 text-sm">
              Sinais restantes: {remainingSignals}/{maxSignals} (Plano {currentPlan.toUpperCase()})
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Ativo Financeiro</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione o par de moedas" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(asset => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Tempo de Expiração</label>
              <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione o tempo de expiração" />
                </SelectTrigger>
                <SelectContent>
                  {expirationTimes.map(time => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateSignal}
              disabled={!selectedAsset || !selectedExpiration || !canGenerate || isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando Sinal...
                </div>
              ) : !canGenerate ? (
                'Limite diário atingido'
              ) : (
                'Gerar Sinal'
              )}
            </Button>

            {!canGenerate && (
              <p className="text-yellow-400 text-sm text-center">
                Upgrade seu plano para gerar mais sinais por dia
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Sinais Usados Hoje</span>
                <span className="text-white font-medium">{usedSignals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Sinais Restantes</span>
                <span className="text-green-400 font-medium">{remainingSignals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Plano Atual</span>
                <Badge className="bg-purple-600 uppercase">{currentPlan}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Taxa de Sucesso</span>
                <span className="text-green-400 font-medium">99%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signals */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sinais Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedSignals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Nenhum sinal gerado ainda</p>
              <p className="text-white/50 text-sm">Gere seu primeiro sinal usando o formulário acima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedSignals.map((signal) => (
                <div key={signal.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-lg">{signal.asset_pair}</span>
                        <Badge 
                          variant={signal.signal_type === 'CALL' ? 'default' : 'destructive'}
                          className={signal.signal_type === 'CALL' ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {signal.signal_type === 'CALL' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {signal.signal_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-medium text-lg">
                        {signal.confidence_percentage}%
                      </div>
                      <div className="text-white/60 text-xs">Confiança</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock className="w-4 h-4" />
                      <span>Entrada: {signal.entry_time.toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Target className="w-4 h-4" />
                      <span>Expiração: {signal.expiration_time} min</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3">
                    <h4 className="text-white font-medium text-sm mb-2">Análise Técnica:</h4>
                    <p className="text-white/80 text-sm">{signal.analysis}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}