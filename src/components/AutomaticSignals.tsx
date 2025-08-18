import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, Activity, Play, Brain, Zap, Bot, Timer } from 'lucide-react';

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

// Countdown Timer Component
const CountdownTimer = ({ targetTime }: { targetTime: Date }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const timeDiff = targetTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-center gap-3">
        <Timer className="w-5 h-5 text-blue-400" />
        <div className="text-center">
          <p className="text-blue-400 font-medium text-sm">Próximo ciclo inicia em:</p>
          <p className="text-white text-2xl font-bold font-mono">{timeLeft}</p>
        </div>
      </div>
    </div>
  );
};

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
        auto_operations_completed_today: newState.completedToday,
        cycle_start_time: newState.cycleStartTime
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
        .select('auto_operations_started, auto_operations_paused, auto_operations_completed_today, cycle_start_time, daily_earnings')
        .eq('id', userId)
        .single();
      
      if (profile) {
        const savedCycleTime = profile.cycle_start_time ? new Date(profile.cycle_start_time) : null;
        
        setOperationsState({
          started: profile.auto_operations_started || false,
          paused: profile.auto_operations_paused || false,
          completedToday: profile.auto_operations_completed_today || 0,
          cycleStartTime: savedCycleTime?.toISOString() || null
        });
        
        setIsStarted(profile.auto_operations_started || false);
        setIsPaused(profile.auto_operations_paused || false);
        setCycleStartTime(savedCycleTime);
        
        // Set total profit from database
        setTotalProfitToday(profile.daily_earnings || 0);
        
        // Check if target was already reached based on daily_earnings
        const targetAlreadyReached = (profile.daily_earnings || 0) >= config.targetProfit;
        setDailyTargetReached(targetAlreadyReached);
        
        // If target was reached and we have a cycle start time, calculate when it will reset (24h later)
        if (targetAlreadyReached && savedCycleTime) {
          const resetTime = new Date(savedCycleTime.getTime() + 24 * 60 * 60 * 1000);
          setTargetAchievedTime(resetTime);
        }
        
        // Prevent any new operations if target is already reached
        if (targetAlreadyReached) {
          setOperationsState(prev => ({
            ...prev,
            started: true,
            paused: true // Force pause to prevent new operations
          }));
        }
        
        // Check if we have a saved cycle and if 24 hours passed to reset
        if (savedCycleTime) {
          const now = new Date();
          const timeDiff = now.getTime() - savedCycleTime.getTime();
          const hoursElapsed = timeDiff / (1000 * 60 * 60);
          
          if (hoursElapsed >= 24) {
            // More than 24 hours passed, reset everything
            await resetCycle();
          }
        }
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
        
        // Check if profit target is reached - but only if operations are not in progress
        const targetReached = totalProfit >= config.targetProfit;
        setDailyTargetReached(targetReached);
        if (targetReached && !targetAchievedTime) {
          setTargetAchievedTime(new Date());
        }
        setHasGeneratedToday(data.length > 0);
      } else {
        // No signals loaded, reset state to allow fresh start
        setSignals([]);
        setTotalProfitToday(0);
        setDailyTargetReached(false);
        setTargetAchievedTime(null);
        setHasGeneratedToday(false);
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
    // Prevent signal generation if target is reached or operations are not active
    if (config.maxSignals === 0 || dailyTargetReached || !operationsState.started || operationsState.paused) return;
    
    // Extra safety check - if we already have the target profit, don't generate more signals
    if (totalProfitToday >= config.targetProfit) {
      setDailyTargetReached(true);
      return;
    }

    const generateSignal = () => {
      const activeSignals = signals.filter(s => s.status === 'active');
      if (activeSignals.length >= 1) return; // Only allow 1 active signal at a time
      
      // Triple check target before generating to prevent extra operations
      if (totalProfitToday >= config.targetProfit || dailyTargetReached) {
        setDailyTargetReached(true);
        return;
      }

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

    // Generate first signal immediately if no active signals exist and target not reached
    const activeSignals = signals.filter(s => s.status === 'active');
    if (activeSignals.length === 0 && !dailyTargetReached && operationsState.started && !operationsState.paused) {
      console.log('Generating initial signal...');
      generateSignal();
    }

    const interval = setInterval(() => {
      if (!dailyTargetReached) {
        generateSignal();
      }
    }, 120000); // Generate new signal every 2 minutes

    return () => clearInterval(interval);
  }, [signals.length, config.maxSignals, operationsState.completedToday, operationsState.started, operationsState.paused, totalProfitToday, dailyTargetReached]);

  useEffect(() => {
    if (!operationsState.started || operationsState.paused) return;
    
    const updateSignals = () => {
      setSignals(prev => prev.map(signal => {
        if (signal.status === 'completed') return signal;

        // Increase progress speed - range from 3 to 8 for more consistent progress
        const newProgress = Math.min(signal.progress + Math.random() * 5 + 3, 100);
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
          if (newTotalProfit >= config.targetProfit && !dailyTargetReached) {
            setDailyTargetReached(true);
            setHasGeneratedToday(true);
            
            // Immediately pause operations to prevent more signals
            updateOperationsState({ paused: true });
            
            if (!targetAchievedTime) {
              // Set target achieved time to 24 hours from now for countdown
              const resetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
              setTargetAchievedTime(resetTime);
              
               // Save earnings to history immediately when target is reached - use UPSERT to avoid duplicates
               const saveEarningsHistory = async () => {
                 if (!userId) return;
                 
                 try {
                   // Get current date in Brazil timezone
                   const now = new Date();
                   const brasilDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
                   const today = brasilDate.toISOString().split('T')[0];
                   
                   // Use UPSERT to avoid duplicate entries for the same day
                   await supabase.from('daily_earnings_history').upsert({
                     user_id: userId,
                     date: today,
                     total_earnings: config.targetProfit,
                     total_commissions: 0,
                     operations_count: newCompletedCount
                   }, {
                     onConflict: 'user_id,date'
                   });
                   
                   console.log('Earnings history saved successfully');
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

    // Update progress every 500ms for smoother animation
    const interval = setInterval(updateSignals, 500);
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
    console.log('Starting automatic operations...');
    const startTime = new Date();
    setCycleStartTime(startTime);
    setIsStarted(true);
    setIsPaused(false);
    
    await updateOperationsState({ 
      started: true, 
      paused: false,
      cycleStartTime: startTime.toISOString() 
    });
    
    // Also save cycle_start_time directly to database
    await supabase
      .from('profiles')
      .update({ 
        cycle_start_time: startTime.toISOString(),
        auto_operations_started: true,
        auto_operations_paused: false
      })
      .eq('id', userId);
      
    console.log('Operations started successfully!');
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
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-600 to-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-400/30">
                <Play className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Operações Prontas!</h3>
              <p className="text-white/70 text-base mb-6">
                Clique no botão START para iniciar suas operações automáticas do dia
              </p>
              
              {/* Botão START grande e destacado */}
              <Button 
                onClick={handleStartOperations}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-12 py-4 font-bold text-lg shadow-xl shadow-green-500/30 border-0 rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                <Play className="w-6 h-6 mr-3" />
                START
              </Button>
              
              <div className="mt-6 bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm font-medium text-center">
                  ⚡ As operações são feitas na categoria de BLITZ/5s
                </p>
                <p className="text-blue-200 text-xs text-center mt-1">
                  Meta: R$ {config.targetProfit.toFixed(2)} por dia
                </p>
              </div>
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

        {dailyTargetReached && cycleStartTime && (
          (() => {
            // Use the actual cycle start time from database to calculate next cycle
            const nextCycleTime = new Date(cycleStartTime.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();
            const timeDiff = nextCycleTime.getTime() - now.getTime();
            
            // Only show if there's still time left (more than 1 hour)
            if (timeDiff > 60 * 60 * 1000) {
              return (
                <>
                  <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 mb-4">
                    <p className="text-green-400 font-medium">🎉 Meta diária atingida!</p>
                    <p className="text-green-300 text-sm">Lucro gerado: R$ {config.targetProfit.toFixed(2)}</p>
                  </div>
                  <CountdownTimer targetTime={nextCycleTime} />
                </>
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