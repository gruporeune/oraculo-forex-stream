import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

interface AutomaticSignalsProps {
  userPlan: string;
  onEarningsGenerated: (amount: number) => void;
  userId?: string;
}

interface Signal {
  id: string;
  asset: string;
  direction: 'CALL' | 'PUT';
  entryPrice: number;
  currentPrice: number;
  progress: number;
  profit: number;
  status: 'active' | 'completed';
  startTime: Date;
}

export function AutomaticSignals({ userPlan, onEarningsGenerated, userId }: AutomaticSignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [dailyTargetReached, setDailyTargetReached] = useState(false);
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);

  const planConfig = {
    free: { maxSignals: 0, targetProfit: 0 },
    partner: { maxSignals: 1, targetProfit: 1.00 },
    master: { maxSignals: 3, targetProfit: 6.00 },
    premium: { maxSignals: 4, targetProfit: 41.25 },
    platinum: { maxSignals: 5, targetProfit: 100.00 }
  };

  const config = planConfig[userPlan as keyof typeof planConfig] || planConfig.free;

  const assets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
  
  // Check if signals were already generated today and load them
  useEffect(() => {
    const loadTodaysSignals = async () => {
      if (!userId) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_automatic', true)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);
      
      if (!error && data && data.length > 0) {
        // Convert database signals to component format
        const loadedSignals: Signal[] = data.map((dbSignal, index) => ({
          id: dbSignal.id,
          asset: dbSignal.asset_pair,
          direction: dbSignal.signal_type as 'CALL' | 'PUT',
          entryPrice: Math.random() * 1.5 + 1.0, // Simulated entry price
          currentPrice: Math.random() * 1.5 + 1.0, // Simulated current price
          progress: 100, // All loaded signals are completed
          profit: dbSignal.profit || 0,
          status: 'completed', // Keep as completed for UI display
          startTime: new Date(dbSignal.entry_time)
        }));
        
        setSignals(loadedSignals);
        setHasGeneratedToday(loadedSignals.length > 0);
        // Only mark as reached if ALL operations for the plan are completed
        setDailyTargetReached(loadedSignals.length >= config.maxSignals);
      }
    };
    
    loadTodaysSignals();
  }, [userId]);
  
  useEffect(() => {
    if (config.maxSignals === 0 || dailyTargetReached || hasGeneratedToday) return;

    const generateSignal = () => {
      if (signals.length >= config.maxSignals) return;

      const asset = assets[Math.floor(Math.random() * assets.length)];
      const direction = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const entryPrice = Math.random() * 1.5 + 1.0;
      
      const newSignal: Signal = {
        id: Math.random().toString(36).substr(2, 9),
        asset,
        direction,
        entryPrice,
        currentPrice: entryPrice,
        progress: 0,
        profit: 0,
        status: 'active',
        startTime: new Date()
      };

      setSignals(prev => [...prev, newSignal]);
    };

    // Generate first signal immediately if none exist
    if (signals.length === 0) {
      generateSignal();
    }

    const interval = setInterval(() => {
      generateSignal();
    }, 120000); // Generate new signal every 2 minutes

    return () => clearInterval(interval);
  }, [signals.length, config.maxSignals, dailyTargetReached, hasGeneratedToday]);

  useEffect(() => {
    const updateSignals = () => {
      setSignals(prev => prev.map(signal => {
        if (signal.status === 'completed') return signal;

        const newProgress = Math.min(signal.progress + Math.random() * 5, 100);
        const priceChange = (Math.random() - 0.5) * 0.001;
        const newPrice = signal.currentPrice + priceChange;
        
        if (newProgress >= 100) {
          // For partner plan, generate exactly the target profit
          // For other plans, distribute profit across signals with some variation
          let finalProfit;
          if (userPlan === 'partner') {
            finalProfit = config.targetProfit;
          } else {
            // For master plan, make 1 losing trade and 2 winning
            // For premium and platinum, distribute across multiple trades
            const completedSignalsCount = prev.filter(s => s.status === 'completed').length;
            
            if (userPlan === 'master') {
              if (completedSignalsCount === 0) {
                // First trade loses small amount
                finalProfit = -1.5;
              } else {
                // Remaining trades win to reach target
                const remainingProfit = config.targetProfit + 1.5; // Compensate for loss
                const remainingTrades = config.maxSignals - completedSignalsCount;
                finalProfit = remainingProfit / remainingTrades;
              }
            } else {
              // For premium and platinum, some losses and wins
              const shouldLose = Math.random() < 0.2 && completedSignalsCount < config.maxSignals - 1;
              if (shouldLose) {
                finalProfit = -(Math.random() * 3 + 1); // Small loss
              } else {
                const totalCompleted = completedSignalsCount + 1;
                const profitPerSignal = config.targetProfit / config.maxSignals;
                finalProfit = profitPerSignal + (Math.random() - 0.5) * 2;
              }
            }
          }
          
          // Save signal to database
          const saveSignalToDb = async () => {
            if (!userId) return;
            
            try {
              await supabase.from('signals').insert({
                user_id: userId,
                asset_pair: signal.asset,
                signal_type: signal.direction,
                entry_time: signal.startTime.toISOString(),
                expiration_time: 60, // 1 minute expiration
                confidence_percentage: 85,
                is_automatic: true,
                profit: finalProfit,
                status: finalProfit > 0 ? 'won' : 'lost',
                analysis: `Operação automática do plano ${userPlan.toUpperCase()}`
              });
            } catch (error) {
              console.error('Error saving signal to database:', error);
            }
          };
          
          saveSignalToDb();
          onEarningsGenerated(finalProfit);
          
          // Check if we've reached the daily target
          const completedSignals = prev.filter(s => s.status === 'completed').length + 1;
          if (completedSignals >= config.maxSignals) {
            setDailyTargetReached(true);
            setHasGeneratedToday(true);
          }
          
          return {
            ...signal,
            progress: 100,
            currentPrice: newPrice,
            profit: finalProfit,
            status: 'completed' as const
          };
        }

        return {
          ...signal,
          progress: newProgress,
          currentPrice: newPrice,
          profit: signal.profit
        };
      }));
    };

    const interval = setInterval(updateSignals, 1000);
    return () => clearInterval(interval);
  }, [config.targetProfit, config.maxSignals, onEarningsGenerated]);

  if (userPlan === 'free') {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Operações Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-white/70 mb-4">
              Operações automáticas disponíveis apenas para planos pagos
            </p>
            <Badge variant="outline" className="text-gray-400 border-gray-600">
              Plano FREE
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Operações Automáticas - Plano {userPlan.toUpperCase()}
        </CardTitle>
        <p className="text-white/70 text-sm">
          Meta diária: R$ {config.targetProfit.toFixed(2)} | Sinais: {signals.filter(s => s.status === 'completed').length}/{config.maxSignals}
        </p>
      </CardHeader>
      <CardContent>
        {dailyTargetReached && (
          <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 mb-4">
            <p className="text-green-400 font-medium">🎉 Meta diária atingida!</p>
            <p className="text-green-300 text-sm">Lucro gerado: R$ {config.targetProfit.toFixed(2)}</p>
          </div>
        )}
        
        <div className="space-y-4">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{signal.asset}</span>
                  <Badge 
                    variant={signal.direction === 'CALL' ? 'default' : 'destructive'}
                    className={signal.direction === 'CALL' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {signal.direction === 'CALL' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {signal.direction}
                  </Badge>
                  {signal.status === 'completed' && (
                    <Badge className="bg-yellow-600">
                      Finalizada
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">
                    ${signal.currentPrice.toFixed(5)}
                  </div>
                  {signal.status === 'completed' && (
                    <div className={signal.profit >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                      {signal.profit >= 0 ? '+' : ''}R$ {signal.profit.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Progresso da operação</span>
                  <span>{signal.progress.toFixed(1)}%</span>
                </div>
                <Progress value={signal.progress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {signal.startTime.toLocaleTimeString()}
                </div>
                <div>
                  Entrada: ${signal.entryPrice.toFixed(5)}
                </div>
              </div>
            </div>
          ))}
          
          {signals.length === 0 && !dailyTargetReached && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Gerando primeiro sinal automático...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}