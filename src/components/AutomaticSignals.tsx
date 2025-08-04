import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, Activity, Play, Brain, Zap, Bot } from 'lucide-react';

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

// AI Analysis Component
const AIAnalysisIndicators = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;
  
  return (
    <div className="flex justify-center items-center gap-6 py-4 mb-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/20">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        </div>
        <span className="text-xs text-blue-300 font-medium">ChatGPT 4.0</span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Zap className="w-8 h-8 text-purple-400 animate-bounce" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping delay-150"></div>
        </div>
        <span className="text-xs text-purple-300 font-medium">DeepSeek</span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Bot className="w-8 h-8 text-cyan-400 animate-pulse delay-300" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping delay-300"></div>
        </div>
        <span className="text-xs text-cyan-300 font-medium">Manus AI</span>
      </div>
      
      <div className="ml-4 text-center">
        <p className="text-white/80 text-sm font-medium">Analisando mercado...</p>
        <p className="text-white/60 text-xs">IAs trabalhando em conjunto</p>
      </div>
    </div>
  );
};

export function AutomaticSignals({ userPlan, onEarningsGenerated, userId }: AutomaticSignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [dailyTargetReached, setDailyTargetReached] = useState(false);
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalProfitToday, setTotalProfitToday] = useState(0);
  const [targetAchievedTime, setTargetAchievedTime] = useState<Date | null>(null);
  const [cycleStartTime, setCycleStartTime] = useState<Date | null>(null);
  const [operationsState, setOperationsState] = useState({
    started: false,
    paused: false,
    completedToday: 0,
    cycleStartTime: null as string | null
  });

  const planConfig = {
    free: { maxSignals: 0, targetProfit: 0 },
    partner: { maxSignals: 1, targetProfit: 1.00 },
    master: { maxSignals: 3, targetProfit: 6.00 },
    premium: { maxSignals: 4, targetProfit: 41.25 },
    platinum: { maxSignals: 5, targetProfit: 100.00 }
  };

  const config = planConfig[userPlan as keyof typeof planConfig] || planConfig.free;

  const assets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

  // Function to update operations state in database
  const updateOperationsState = async (updates: Partial<typeof operationsState>) => {
    if (!userId) return;
    
    const newState = { ...operationsState, ...updates };
    setOperationsState(newState);
    
    await supabase
      .from('profiles')
      .update({
        auto_operations_started: newState.started,
        auto_operations_paused: newState.paused,
        auto_operations_completed_today: newState.completedToday
      })
      .eq('id', userId);
  };

  // Check if 24 hours have passed since cycle start
  const checkCycleReset = () => {
    if (!cycleStartTime) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - cycleStartTime.getTime();
    const hoursElapsed = timeDiff / (1000 * 60 * 60);
    
    return hoursElapsed >= 24;
  };

  // Reset cycle after 24 hours
  const resetCycle = async () => {
    setDailyTargetReached(false);
    setTargetAchievedTime(null);
    setTotalProfitToday(0);
    setSignals([]);
    setCycleStartTime(new Date());
    
    await updateOperationsState({ 
      started: true,
      paused: false,
      completedToday: 0,
      cycleStartTime: new Date().toISOString()
    });
  };

  // Load today's signals and operations state
  useEffect(() => {
    const loadTodaysData = async () => {
      if (!userId) return;
      
      // Load user profile to get operations state
      const { data: profile } = await supabase
        .from('profiles')
        .select('auto_operations_started, auto_operations_paused, auto_operations_completed_today')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setOperationsState({
          started: profile.auto_operations_started || false,
          paused: profile.auto_operations_paused || false,
          completedToday: profile.auto_operations_completed_today || 0,
          cycleStartTime: null
        });
        
        setIsStarted(profile.auto_operations_started || false);
        setIsPaused(profile.auto_operations_paused || false);
        
        // Check if daily target is reached based on database state
        const targetReached = profile.auto_operations_completed_today >= config.maxSignals;
        setDailyTargetReached(targetReached);
        setHasGeneratedToday(profile.auto_operations_completed_today > 0);
      }
      
      // Load today's signals
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
        
        // Calculate total profit from loaded signals
        const totalProfit = data.reduce((sum, signal) => sum + (signal.profit || 0), 0);
        setTotalProfitToday(totalProfit);
        
        // Check if profit target is reached
        const targetReached = totalProfit >= config.targetProfit;
        setDailyTargetReached(targetReached);
        if (targetReached && !targetAchievedTime) {
          setTargetAchievedTime(new Date());
        }
        setHasGeneratedToday(data.length > 0);
      }
    };
    
    loadTodaysData();
  }, [userId, config.maxSignals, config.targetProfit]);

  // Check for cycle reset every minute
  useEffect(() => {
    if (!operationsState.started || !cycleStartTime) return;

    const interval = setInterval(() => {
      if (checkCycleReset()) {
        resetCycle();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [operationsState.started, cycleStartTime]);
  
  useEffect(() => {
    if (config.maxSignals === 0 || totalProfitToday >= config.targetProfit || !operationsState.started || operationsState.paused) return;

    const generateSignal = () => {
      const activeSignals = signals.filter(s => s.status === 'active');
      if (activeSignals.length >= 1) return; // Only allow 1 active signal at a time

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

    // Generate first signal immediately if no active signals exist
    const activeSignals = signals.filter(s => s.status === 'active');
    if (activeSignals.length === 0) {
      generateSignal();
    }

    const interval = setInterval(() => {
      generateSignal();
    }, 120000); // Generate new signal every 2 minutes

    return () => clearInterval(interval);
  }, [signals.length, config.maxSignals, operationsState.completedToday, operationsState.started, operationsState.paused, totalProfitToday]);

  useEffect(() => {
    if (!operationsState.started || operationsState.paused) return;
    
    const updateSignals = () => {
      setSignals(prev => prev.map(signal => {
        if (signal.status === 'completed') return signal;

        const newProgress = Math.min(signal.progress + Math.random() * 5, 100);
        const priceChange = (Math.random() - 0.5) * 0.001;
        const newPrice = signal.currentPrice + priceChange;
        
        if (newProgress >= 100) {
          // Calculate remaining profit needed to reach target
          const remainingProfitNeeded = config.targetProfit - totalProfitToday;
          let finalProfit;
          
          if (userPlan === 'partner') {
            finalProfit = remainingProfitNeeded; // Exactly what's needed
          } else {
            // For other plans, calculate profit needed considering this might not be the last signal
            const completedSignalsCount = prev.filter(s => s.status === 'completed').length;
            
            if (remainingProfitNeeded <= 0) {
              // Target already reached, this should stop generation
              finalProfit = 0;
            } else if (remainingProfitNeeded <= 2) {
              // Close to target, give the remaining amount
              finalProfit = remainingProfitNeeded;
            } else {
              // Still need significant profit, distribute it
              const shouldLose = Math.random() < 0.15; // 15% chance of loss
              if (shouldLose) {
                finalProfit = -(Math.random() * 2 + 0.5); // Small loss
              } else {
                // Give a portion of remaining profit needed
                const minProfit = Math.min(remainingProfitNeeded * 0.3, 5);
                const maxProfit = Math.min(remainingProfitNeeded * 0.7, 15);
                finalProfit = Math.random() * (maxProfit - minProfit) + minProfit;
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
          // Só gerar earnings se realmente iniciado e não pausado
          if (operationsState.started && !operationsState.paused) {
            onEarningsGenerated(finalProfit);
          }
          
          // Update total profit and completed operations count
          const newTotalProfit = totalProfitToday + finalProfit;
          setTotalProfitToday(newTotalProfit);
          
          const newCompletedCount = operationsState.completedToday + 1;
          updateOperationsState({ completedToday: newCompletedCount });
          
          // Check if we've reached the profit target
          if (newTotalProfit >= config.targetProfit) {
            setDailyTargetReached(true);
            setHasGeneratedToday(true);
            if (!targetAchievedTime) {
              setTargetAchievedTime(new Date());
              
              // Save earnings to history immediately when target is reached - individual entry
              const saveEarningsHistory = async () => {
                if (!userId) return;
                
                try {
                  const now = new Date();
                  const historyDate = now.toISOString().split('T')[0];
                  
                  // Create individual entry for this cycle's earnings
                  await supabase.from('daily_earnings_history').insert({
                    user_id: userId,
                    date: historyDate,
                    total_earnings: config.targetProfit, // Exact target amount for this cycle
                    total_commissions: 0,
                    operations_count: newCompletedCount
                  });
                } catch (error) {
                  console.error('Error saving earnings history:', error);
                }
              };
              
              saveEarningsHistory();
            }
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
  }, [config.targetProfit, config.maxSignals, onEarningsGenerated, operationsState.started, operationsState.paused, totalProfitToday]);

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

  const handleStartOperations = async () => {
    const startTime = new Date();
    setCycleStartTime(startTime);
    setIsStarted(true);
    await updateOperationsState({ 
      started: true, 
      cycleStartTime: startTime.toISOString() 
    });
  };

  const isOperationActive = operationsState.started && !operationsState.paused && !dailyTargetReached;

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Operações Automáticas - Plano {userPlan.toUpperCase()}
        </CardTitle>
        <p className="text-white/70 text-sm">
          Meta diária: R$ {config.targetProfit.toFixed(2)} | Progresso: R$ {totalProfitToday.toFixed(2)} | Sinais: {signals.filter(s => s.status === 'completed').length}
        </p>
      </CardHeader>
      <CardContent>
        {/* AI Analysis Indicators */}
        <AIAnalysisIndicators isActive={isOperationActive} />

        {!operationsState.started && operationsState.completedToday === 0 && (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Pronto para começar!</h3>
              <p className="text-white/70 text-sm mb-4">
                Clique no botão abaixo para iniciar suas operações automáticas do dia
              </p>
              <Button 
                onClick={handleStartOperations}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-3 font-semibold"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Operações Automáticas
              </Button>
            </div>
          </div>
        )}

        {operationsState.started && !dailyTargetReached && (
          <div className="flex justify-center mb-4">
            <Button 
              onClick={() => {
                const newPausedState = !operationsState.paused;
                setIsPaused(newPausedState);
                updateOperationsState({ paused: newPausedState });
              }}
              className={`px-6 py-2 font-semibold ${
                operationsState.paused 
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600' 
                  : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600'
              } text-white`}
            >
              {operationsState.paused ? 'Retomar Operações' : 'Pausar Operações'}
            </Button>
          </div>
        )}

        {dailyTargetReached && targetAchievedTime && (
          (() => {
            const now = new Date();
            const timeDiff = now.getTime() - targetAchievedTime.getTime();
            const hoursElapsed = timeDiff / (1000 * 60 * 60);
            
            // Hide message 1 hour before 24h (23 hours after achievement)
            if (hoursElapsed < 23) {
              return (
                <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 mb-4">
                  <p className="text-green-400 font-medium">🎉 Meta diária atingida!</p>
                  <p className="text-green-300 text-sm">Lucro gerado: R$ {config.targetProfit.toFixed(2)}</p>
                  <p className="text-green-200 text-xs mt-1">
                    Próximo ciclo inicia em: {Math.ceil(24 - hoursElapsed)} horas
                  </p>
                </div>
              );
            }
            return null;
          })()
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
          
          {signals.length === 0 && !dailyTargetReached && operationsState.started && !operationsState.paused && (
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