import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

interface AutomaticSignalsProps {
  userPlan: string;
  onEarningsGenerated: (amount: number) => void;
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

export function AutomaticSignals({ userPlan, onEarningsGenerated }: AutomaticSignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [dailyTargetReached, setDailyTargetReached] = useState(false);

  const planConfig = {
    free: { maxSignals: 0, targetProfit: 0 },
    partner: { maxSignals: 1, targetProfit: 0.10 },
    master: { maxSignals: 2, targetProfit: 1.00 },
    premium: { maxSignals: 3, targetProfit: 7.50 },
    platinum: { maxSignals: 5, targetProfit: 20.00 }
  };

  const config = planConfig[userPlan as keyof typeof planConfig] || planConfig.free;

  const assets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
  
  useEffect(() => {
    if (config.maxSignals === 0 || dailyTargetReached) return;

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
    }, 15000); // Generate new signal every 15 seconds

    return () => clearInterval(interval);
  }, [signals.length, config.maxSignals, dailyTargetReached]);

  useEffect(() => {
    const updateSignals = () => {
      setSignals(prev => prev.map(signal => {
        if (signal.status === 'completed') return signal;

        const newProgress = Math.min(signal.progress + Math.random() * 5, 100);
        const priceChange = (Math.random() - 0.5) * 0.001;
        const newPrice = signal.currentPrice + priceChange;
        
        if (newProgress >= 100) {
          const profitPerSignal = config.targetProfit / config.maxSignals;
          const finalProfit = profitPerSignal + (Math.random() - 0.5) * 0.02;
          
          onEarningsGenerated(finalProfit);
          
          // Check if we've reached the daily target
          const completedSignals = prev.filter(s => s.status === 'completed').length + 1;
          if (completedSignals >= config.maxSignals) {
            setDailyTargetReached(true);
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
          Meta diária: ${config.targetProfit.toFixed(2)} | Sinais: {signals.filter(s => s.status === 'completed').length}/{config.maxSignals}
        </p>
      </CardHeader>
      <CardContent>
        {dailyTargetReached && (
          <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 mb-4">
            <p className="text-green-400 font-medium">🎉 Meta diária atingida!</p>
            <p className="text-green-300 text-sm">Lucro gerado: ${config.targetProfit.toFixed(2)}</p>
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
                    <div className="text-green-400 text-xs">
                      +${signal.profit.toFixed(2)}
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