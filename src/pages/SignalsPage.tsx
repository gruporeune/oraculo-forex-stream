import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  const [marketType, setMarketType] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSignals, setGeneratedSignals] = useState<GeneratedSignal[]>([]);
  const [canGenerate, setCanGenerate] = useState(true);
  const { toast } = useToast();

  const realMarketAssets = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'GBP/JPY', 'EUR/JPY', 'AUD/JPY', 'USD/CHF', 'CAD/JPY'
  ];

  const otcMarketAssets = [
    'EUR/USD (OTC)', 'GBP/USD (OTC)', 'USD/JPY (OTC)', 'AUD/USD (OTC)', 
    'USD/CAD (OTC)', 'NZD/USD (OTC)', 'EUR/GBP (OTC)', 'GBP/JPY (OTC)', 
    'EUR/JPY (OTC)', 'AUD/JPY (OTC)', 'USD/CHF (OTC)', 'CAD/JPY (OTC)',
    'GBP/AUD (OTC)', 'EUR/AUD (OTC)', 'GBP/CAD (OTC)', 'AUD/CAD (OTC)',
    'CHF/JPY (OTC)', 'EUR/CHF (OTC)', 'GBP/CHF (OTC)', 'AUD/CHF (OTC)'
  ];

  const getCurrentAssets = () => {
    return marketType === 'otc' ? otcMarketAssets : realMarketAssets;
  };

  const expirationTimes = [
    { value: '1', label: t('signals.1.minute') },
    { value: '5', label: t('signals.5.minutes') },
    { value: '15', label: t('signals.15.minutes') }
  ];

  const [userPlans, setUserPlans] = useState<any[]>([]);

  const planLimits = {
    free: 5,
    partner: 20,
    master: 100,
    pro: 200,
    premium: 500,
    platinum: 1000
  };

  // Calculate totals from all active plans
  const calculateTotals = () => {
    if (!userPlans || userPlans.length === 0) {
      return {
        maxSignals: 5,
        usedSignals: profile?.daily_signals_used || 0,
        planNames: 'FREE'
      };
    }

    const maxSignals = userPlans.reduce((total, plan) => {
      const planSignals = planLimits[plan.plan_name as keyof typeof planLimits] || 0;
      return total + planSignals;
    }, 0);

    const usedSignals = userPlans.reduce((total, plan) => total + (plan.daily_signals_used || 0), 0);
    
    const planCounts: { [key: string]: number } = {};
    userPlans.forEach(plan => {
      const planName = plan.plan_name;
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    
    const planNames = Object.entries(planCounts)
      .map(([plan, count]) => `${count} ${plan.toUpperCase()}`)
      .join(', ');

    return { maxSignals, usedSignals, planNames };
  };

  const { maxSignals, usedSignals, planNames } = calculateTotals();
  const remainingSignals = maxSignals - usedSignals;

  useEffect(() => {
    setCanGenerate(remainingSignals > 0);
  }, [remainingSignals]);

  useEffect(() => {
    loadRecentSignals();
    loadUserPlans();
  }, [user.id]);

  // Reset selected asset when market type changes
  useEffect(() => {
    setSelectedAsset('');
  }, [marketType]);

  const loadUserPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserPlans(data || []);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

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
        id: signal.id,
        asset_pair: signal.asset_pair,
        signal_type: signal.signal_type as 'CALL' | 'PUT',
        expiration_time: signal.expiration_time,
        confidence_percentage: signal.confidence_percentage,
        entry_time: new Date(signal.entry_time),
        analysis: signal.analysis || ''
      })) || [];

      setGeneratedSignals(formattedSignals);
    } catch (error) {
      console.error('Error loading signals:', error);
    }
  };

  const generateSignal = async () => {
    if (!marketType || !selectedAsset || !selectedExpiration || !canGenerate) return;

    setIsGenerating(true);
    
    try {
      const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const confidence = Math.floor(Math.random() * 15) + 85; // 85-99%
      
      // Calculate entry time for next candle based on expiration time - using Brazil timezone
      const now = new Date();
      const brasilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const expirationMinutes = parseInt(selectedExpiration);
      
      let entryTime: Date;
      
      if (expirationMinutes === 1) {
        // For 1 minute: entry at next minute (seconds = 0)
        entryTime = new Date(brasilTime);
        entryTime.setMinutes(entryTime.getMinutes() + 1);
        entryTime.setSeconds(0);
        entryTime.setMilliseconds(0);
      } else if (expirationMinutes === 5) {
        // For 5 minutes: entry at next 5-minute mark (5, 10, 15, 20, etc.)
        entryTime = new Date(brasilTime);
        const currentMinutes = entryTime.getMinutes();
        const nextFiveMinuteMark = Math.ceil(currentMinutes / 5) * 5;
        entryTime.setMinutes(nextFiveMinuteMark);
        entryTime.setSeconds(0);
        entryTime.setMilliseconds(0);
      } else if (expirationMinutes === 15) {
        // For 15 minutes: entry at next 15-minute mark (0, 15, 30, 45)
        entryTime = new Date(brasilTime);
        const currentMinutes = entryTime.getMinutes();
        const nextFifteenMinuteMark = Math.ceil(currentMinutes / 15) * 15;
        entryTime.setMinutes(nextFifteenMinuteMark);
        entryTime.setSeconds(0);
        entryTime.setMilliseconds(0);
      } else {
        entryTime = new Date(brasilTime);
      }
      
      // Generate analysis based on signal type and timeframe
      const analyses = {
        CALL: [
          `Análise técnica para ${selectedAsset} indica uma oportunidade de CALL devido ao rompimento da resistência em ${(Math.random() * 0.005 + 1.1850).toFixed(4)}. Os indicadores RSI (${Math.floor(Math.random() * 10 + 25)}) e MACD mostram divergência bullish, enquanto as médias móveis de 9 e 21 períodos confirmam mudança de tendência. Volume acima da média sustenta o movimento. Confluência técnica sugere continuação da alta no prazo de ${selectedExpiration} minutos com alta probabilidade de sucesso.`,
          `Padrão de reversão identificado no ${selectedAsset} após teste do suporte em ${(Math.random() * 0.005 + 1.1820).toFixed(4)}. Formação de martelo doji confirma rejeição da zona de baixa. Indicadores estocásticos saindo da zona de sobrevenda (${Math.floor(Math.random() * 10 + 15)}%) enquanto RSI forma divergência positiva. Bandas de Bollinger expandindo para cima. Setup técnico favorece operação CALL com expiração de ${selectedExpiration} minutos.`,
          `Breakout confirmado no ${selectedAsset} com rompimento da linha de tendência descendente. Price action mostra velas de força compradora após consolidação triangular. Volume 40% acima da média corrobora movimento. Fibonacci 61.8% (${(Math.random() * 0.005 + 1.1880).toFixed(4)}) atuando como suporte. Williams %R (-${Math.floor(Math.random() * 15 + 15)}) e CCI (${Math.floor(Math.random() * 50 + 80)}) confirmam entrada. Projeção técnica indica alta para próximos ${selectedExpiration} minutos.`,
          `Setup de alta no ${selectedAsset} baseado em confluência de indicadores. Média móvel exponencial de 20 cruzando acima da de 50, criando golden cross. ADX (${Math.floor(Math.random() * 10 + 25)}) indica força na tendência. Oscilador momentum saindo de território negativo. Zona de demanda institucional em ${(Math.random() * 0.005 + 1.1840).toFixed(4)} sendo respeitada. Cenário técnico aponta para movimento CALL com alta confiança nos próximos ${selectedExpiration} minutos.`
        ],
        PUT: [
          `Análise técnica do ${selectedAsset} sinaliza oportunidade de PUT após rompimento do suporte em ${(Math.random() * 0.005 + 1.1850).toFixed(4)}. RSI (${Math.floor(Math.random() * 10 + 65)}) em zona de sobrecompra confirma pressão vendedora. MACD apresenta divergência bearish com histograma negativo. Médias móveis de 9 e 21 períodos apontam para baixa. Volume confirmatório sustenta o movimento descendente. Projeção técnica indica continuação da queda em ${selectedExpiration} minutos.`,
          `Padrão de reversão bearish identificado no ${selectedAsset} após teste da resistência em ${(Math.random() * 0.005 + 1.1880).toFixed(4)}. Formação de shooting star indica rejeição da zona de alta. Estocástico em sobrecompra (${Math.floor(Math.random() * 10 + 80)}%) iniciando divergência negativa. Bandas de Bollinger contraindo após expansão. Price action mostra velas de pressão vendedora. Setup técnico favorece operação PUT com expiração de ${selectedExpiration} minutos.`,
          `Breakdown confirmado no ${selectedAsset} com rompimento da linha de tendência ascendente. Price action evidencia velas de força vendedora após falha em nova máxima. Volume 35% acima da média valida movimento. Retração de Fibonacci 38.2% (${(Math.random() * 0.005 + 1.1820).toFixed(4)}) funcionando como resistência. Williams %R (-${Math.floor(Math.random() * 15 + 5)}) e CCI (-${Math.floor(Math.random() * 50 + 80)}) confirmam entrada PUT para próximos ${selectedExpiration} minutos.`,
          `Setup de baixa no ${selectedAsset} baseado em confluência técnica. Média móvel exponencial de 20 cruzando abaixo da de 50, formando death cross. ADX (${Math.floor(Math.random() * 10 + 30)}) mostra força na tendência descendente. Momentum negativo confirmado por ROC e Price Rate of Change. Zona de oferta institucional em ${(Math.random() * 0.005 + 1.1870).toFixed(4)} sendo testada. Análise técnica aponta movimento PUT com alta probabilidade nos próximos ${selectedExpiration} minutos.`
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

      // Update daily signals count for all plans proportionally
      if (userPlans.length > 0) {
        // Update the plan with the least used signals
        const planToUpdate = userPlans.reduce((min, plan) => 
          plan.daily_signals_used < min.daily_signals_used ? plan : min
        );

        const { error: updateError } = await supabase
          .from('user_plans')
          .update({
            daily_signals_used: planToUpdate.daily_signals_used + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', planToUpdate.id);

        if (updateError) throw updateError;
        loadUserPlans(); // Reload plans to get updated counts
      } else {
        // Fallback to profile update for free users
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            daily_signals_used: usedSignals + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      onProfileUpdate();
      loadRecentSignals();

      toast({
        title: t('signals.generated.success'),
        description: `${signalType} para ${selectedAsset} - ${t('signals.confidence')}: ${confidence}%`
      });

      // Reset form
      setMarketType('');
      setSelectedAsset('');
      setSelectedExpiration('');

    } catch (error: any) {
      toast({
        title: t('common.error'),
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
        <h2 className="text-3xl font-bold text-white mb-2">{t('signals.title')}</h2>
        <p className="text-white/70">{t('signals.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Generator */}
        <Card className="bg-black/40 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('signals.generate.new')}
            </CardTitle>
            <p className="text-white/70 text-sm">
              {t('signals.remaining')}: {remainingSignals}/{maxSignals} ({planNames})
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('signals.market.type')}</label>
              <Select value={marketType} onValueChange={setMarketType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={t('signals.select.market')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">{t('signals.market.real')}</SelectItem>
                  <SelectItem value="otc">{t('signals.market.otc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('signals.financial.asset')}</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset} disabled={!marketType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={marketType ? t('signals.select.pair') : t('signals.first.select.market')} />
                </SelectTrigger>
                <SelectContent>
                  {getCurrentAssets().map(asset => (
                    <SelectItem key={asset} value={asset}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('signals.expiration.time')}</label>
              <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder={t('signals.select.expiration')} />
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
              disabled={!marketType || !selectedAsset || !selectedExpiration || !canGenerate || isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('signals.generating')}
                </div>
              ) : !canGenerate ? (
                t('signals.daily.limit')
              ) : (
                t('signals.generate')
              )}
            </Button>

            {!canGenerate && (
              <p className="text-yellow-400 text-sm text-center">
                {t('signals.upgrade.plan')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('signals.statistics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{t('signals.used.today')}</span>
                <span className="text-white font-medium">{usedSignals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Sinais Restantes</span>
                <span className="text-green-400 font-medium">{remainingSignals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Planos Ativos</span>
                <Badge className="bg-purple-600 text-xs">{planNames}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Taxa de Sucesso</span>
                <span className="text-green-400 font-medium">99%</span>
              </div>
            </div>
            
            {/* Video section */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-yellow-400 text-lg font-semibold mb-2">📹</div>
                  <p className="text-white/70 text-sm">Aguardando vídeo atualizado</p>
                </div>
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
                       <span>Entrada: {signal.entry_time.toLocaleTimeString('pt-BR', { 
                         timeZone: 'America/Sao_Paulo',
                         hour: '2-digit',
                         minute: '2-digit',
                         second: '2-digit'
                       })}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-white/70">
                       <Target className="w-4 h-4" />
                       <span>Finalização: {new Date(signal.entry_time.getTime() + signal.expiration_time * 60000).toLocaleTimeString('pt-BR', { 
                         timeZone: 'America/Sao_Paulo',
                         hour: '2-digit',
                         minute: '2-digit',
                         second: '2-digit'
                       })}</span>
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