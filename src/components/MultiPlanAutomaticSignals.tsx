import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, BarChart3, TrendingUp, Clock, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import chatgptLogo from '@/assets/chatgpt-logo.svg';
import deepseekLogo from '@/assets/deepseek-logo.png';
import manusLogo from '@/assets/manus-logo.png';
import grokLogo from '@/assets/grok-logo.jpg';

interface PlanOperation {
  id: string;
  plan_name: string;
  daily_earnings: number;
  auto_operations_completed_today: number;
  auto_operations_started: boolean;
  auto_operations_paused: boolean;
  cycle_start_time: string | null;
  daily_signals_used: number;
}

interface RecentOperation {
  id: string;
  pair: string;
  direction: 'CALL' | 'PUT';
  result: 'WIN' | 'LOSS';
  profit: number;
  timestamp: number;
}

interface MultiPlanAutomaticSignalsProps {
  user: any;
  userPlans: PlanOperation[];
  onPlansUpdate: () => void;
}

export default function MultiPlanAutomaticSignals({ user, userPlans, onPlansUpdate }: MultiPlanAutomaticSignalsProps) {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});
  const [lastOperationTimes, setLastOperationTimes] = useState<{[key: string]: number}>({});
  const [recentOperations, setRecentOperations] = useState<{[key: string]: RecentOperation[]}>({});
  const { toast } = useToast();

  // Check if it's weekend in Brazil timezone
  const isWeekendInBrazil = () => {
    const now = new Date();
    // Convert to Brazil timezone (UTC-3)
    const brasilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const day = brasilTime.getUTCDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const planLimits = {
    partner: { dailyTarget: 2.00 },
    master: { dailyTarget: 6.00 },
    pro: { dailyTarget: 10.00 },
    premium: { dailyTarget: 41.25 },
    platinum: { dailyTarget: 100.00 }
  };

  // Automatic operations effect
  useEffect(() => {
    const interval = setInterval(async () => {
      // Don't generate operations on weekends
      if (isWeekendInBrazil()) {
        return;
      }

      const activePlans = userPlans.filter(plan => 
        plan.auto_operations_started && 
        !plan.auto_operations_paused && 
        !hasReachedTarget(plan)
      );

      for (const plan of activePlans) {
        const limits = planLimits[plan.plan_name as keyof typeof planLimits];
        if (!limits) continue;

        const now = Date.now();
        const lastOperation = lastOperationTimes[plan.id] || 0;
        
        // Generate operation every 5 seconds
        const operationInterval = 5000; // 5 seconds

        if (now - lastOperation >= operationInterval) {
          await generateOperation(plan);
          setLastOperationTimes(prev => ({ ...prev, [plan.id]: now }));
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userPlans, lastOperationTimes]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(async () => {
      const newCountdowns: {[key: string]: string} = {};
      
      for (const plan of userPlans) {
        if (plan.cycle_start_time && hasReachedTarget(plan)) {
          const cycleStart = new Date(plan.cycle_start_time);
          const nextCycle = new Date(cycleStart.getTime() + 24 * 60 * 60 * 1000);
          const now = new Date();
          const timeLeft = nextCycle.getTime() - now.getTime();

          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            newCountdowns[plan.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            // Countdown finished - reset the cycle automatically
            newCountdowns[plan.id] = '00:00:00';
            
            // Reset the plan for a new cycle
            try {
              await supabase
                .from('user_plans')
                .update({
                  daily_earnings: 0,
                  auto_operations_completed_today: 0,
                  auto_operations_started: false,
                  auto_operations_paused: false,
                  cycle_start_time: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', plan.id);
              
              // Also reset user's daily earnings to allow new cycle
              const { data: currentProfile } = await supabase
                .from('profiles')
                .select('daily_earnings')
                .eq('id', user.id)
                .single();
              
              if (currentProfile) {
                const limits = planLimits[plan.plan_name as keyof typeof planLimits];
                const planEarnings = limits?.dailyTarget || 0;
                
                await supabase
                  .from('profiles')
                  .update({
                    daily_earnings: Math.max((currentProfile.daily_earnings || 0) - planEarnings, 0),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', user.id);
              }

              // Trigger plans update to refresh UI
              onPlansUpdate();
              
              toast({
                title: "Novo ciclo disponível!",
                description: `O plano ${plan.plan_name.toUpperCase()} está pronto para novas operações.`
              });
            } catch (error) {
              console.error('Error resetting cycle:', error);
            }
          }
        }
      }
      
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [userPlans, user.id, onPlansUpdate, toast]);

  const generateOperation = async (plan: PlanOperation) => {
    const limits = planLimits[plan.plan_name as keyof typeof planLimits];
    if (!limits) return;

    // Check if target is already reached - stop operations immediately and trigger countdown
    if (plan.daily_earnings >= limits.dailyTarget) {
      console.log(`[${plan.plan_name.toUpperCase()}] Meta atingida exatamente: ${plan.daily_earnings}/${limits.dailyTarget}`);
      
      // Set cycle start time if not already set to trigger countdown
      if (!plan.cycle_start_time) {
        await supabase
          .from('user_plans')
          .update({
            cycle_start_time: new Date().toISOString(),
            auto_operations_started: false,
            auto_operations_paused: false
          })
          .eq('id', plan.id);
        onPlansUpdate();
      }
      return;
    }

    // Calculate remaining target
    const remainingTarget = limits.dailyTarget - plan.daily_earnings;

    // Generate random profit between 80% and 95% success rate
    const successRate = Math.random() * 0.15 + 0.80; // 80-95%
    const isWin = Math.random() < successRate;
    
    // Calculate operation profit - if close to target, make sure we hit it exactly
    let operationProfit;
    if (remainingTarget <= 2.0) {
      // Close to target - make sure we hit it exactly or get close
      operationProfit = isWin ? remainingTarget : Math.max(remainingTarget * -0.1, -1.0);
    } else {
      // Normal operation - reasonable profit amounts
      const baseProfit = Math.min(remainingTarget * (0.2 + Math.random() * 0.3), remainingTarget);
      operationProfit = isWin ? baseProfit : Math.max(baseProfit * -0.2, -remainingTarget * 0.1);
    }

    // Generate random currency pairs and direction
    const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP'];
    const selectedPair = currencyPairs[Math.floor(Math.random() * currencyPairs.length)];
    const direction = Math.random() > 0.5 ? 'CALL' : 'PUT';

    // Add to recent operations for display
    const newOperation: RecentOperation = {
      id: `${plan.id}-${Date.now()}`,
      pair: selectedPair,
      direction,
      result: isWin ? 'WIN' : 'LOSS',
      profit: operationProfit,
      timestamp: Date.now()
    };

    setRecentOperations(prev => ({
      ...prev,
      [plan.id]: [newOperation, ...(prev[plan.id] || [])].slice(0, 3) // Keep only last 3 operations
    }));

    console.log(`[${plan.plan_name.toUpperCase()}] Nova operação:`, {
      pair: selectedPair,
      direction,
      result: isWin ? 'WIN' : 'LOSS',
      profit: operationProfit,
      remaining: remainingTarget
    });

    try {
      // First, get fresh data from database to avoid race conditions
      const { data: freshPlan, error: fetchPlanError } = await supabase
        .from('user_plans')
        .select('daily_earnings, auto_operations_completed_today')
        .eq('id', plan.id)
        .single();

      if (fetchPlanError) throw fetchPlanError;

      // Calculate new earnings with fresh data, ensuring we don't exceed the target
      const currentEarnings = freshPlan.daily_earnings || 0;
      const newEarnings = Math.min(Math.max(currentEarnings + operationProfit, 0), limits.dailyTarget);
      
      // If already at or above target, stop here
      if (currentEarnings >= limits.dailyTarget) {
        console.log(`[${plan.plan_name.toUpperCase()}] Already at target, skipping operation`);
        
        // Set cycle start time if not already set
        await supabase
          .from('user_plans')
          .update({
            cycle_start_time: new Date().toISOString(),
            auto_operations_started: false,
            auto_operations_paused: false
          })
          .eq('id', plan.id);
        onPlansUpdate();
        return;
      }
      
      // Check if target will be reached with this operation
      const willReachTarget = newEarnings >= limits.dailyTarget;
      
      const updateData: any = {
        daily_earnings: newEarnings,
        auto_operations_completed_today: (freshPlan.auto_operations_completed_today || 0) + 1,
        updated_at: new Date().toISOString()
      };

      // If target reached, stop operations and set cycle start time
      if (willReachTarget) {
        updateData.auto_operations_started = false;
        updateData.auto_operations_paused = false;
        updateData.cycle_start_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_plans')
        .update(updateData)
        .eq('id', plan.id);

      if (error) throw error;

      // Use RPC function to atomically update profile earnings
      // This prevents race conditions when multiple operations update simultaneously
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('daily_earnings, available_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate total daily target from all ACTIVE plans
      const { data: allUserPlans, error: plansError } = await supabase
        .from('user_plans')
        .select('plan_name, daily_earnings')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (plansError) throw plansError;

      // Calculate what the total should be by summing all plan earnings
      const totalFromPlans = (allUserPlans || []).reduce((total, p) => {
        return total + (p.daily_earnings || 0);
      }, 0);

      // Calculate total daily target
      const totalDailyTarget = (allUserPlans || []).reduce((total, p) => {
        const planLimit = planLimits[p.plan_name as keyof typeof planLimits];
        return total + (planLimit?.dailyTarget || 0);
      }, 0);

      // The new daily earnings should match the sum from all plans, capped at total target
      const correctDailyEarnings = Math.min(totalFromPlans, totalDailyTarget);
      
      // Calculate new balance by adding only this operation's profit
      const newBalance = Math.max((currentProfile.available_balance || 0) + operationProfit, 0);

      // Only update if values are different to avoid unnecessary writes
      const needsUpdate = 
        Math.abs((currentProfile.daily_earnings || 0) - correctDailyEarnings) > 0.01 ||
        Math.abs((currentProfile.available_balance || 0) - newBalance) > 0.01;

      if (needsUpdate) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            daily_earnings: correctDailyEarnings,
            available_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update state immediately for instant UI feedback
      onPlansUpdate();
    } catch (error) {
      console.error('Error generating operation:', error);
    }
  };

  const hasReachedTarget = (plan: PlanOperation) => {
    const target = planLimits[plan.plan_name as keyof typeof planLimits]?.dailyTarget || 0;
    return plan.daily_earnings >= target;
  };

  const startOperations = async (planId: string) => {
    setIsLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      const { error } = await supabase
        .from('user_plans')
        .update({
          auto_operations_started: true,
          auto_operations_paused: false,
          cycle_start_time: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Operações iniciadas!",
        description: "As operações automáticas foram iniciadas para este plano."
      });

      onPlansUpdate();
    } catch (error) {
      console.error('Error starting operations:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar operações automáticas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const pauseOperations = async (planId: string) => {
    setIsLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      const { error } = await supabase
        .from('user_plans')
        .update({
          auto_operations_paused: true
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Operações pausadas",
        description: "As operações automáticas foram pausadas para este plano."
      });

      onPlansUpdate();
    } catch (error) {
      console.error('Error pausing operations:', error);
      toast({
        title: "Erro",
        description: "Erro ao pausar operações automáticas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const resumeOperations = async (planId: string) => {
    setIsLoading(prev => ({ ...prev, [planId]: true }));
    
    try {
      const { error } = await supabase
        .from('user_plans')
        .update({
          auto_operations_paused: false
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Operações retomadas",
        description: "As operações automáticas foram retomadas para este plano."
      });

      onPlansUpdate();
    } catch (error) {
      console.error('Error resuming operations:', error);
      toast({
        title: "Erro",
        description: "Erro ao retomar operações automáticas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPlanColor = (planName: string) => {
    const colors = {
      partner: 'from-blue-600/20 to-blue-400/20 border-blue-500/50',
      master: 'from-purple-600/20 to-purple-400/20 border-purple-500/50',
      pro: 'from-amber-600/20 to-amber-400/20 border-amber-500/50',
      premium: 'from-yellow-600/20 to-yellow-400/20 border-yellow-500/50',
      platinum: 'from-pink-600/20 to-pink-400/20 border-pink-500/50'
    };
    return colors[planName as keyof typeof colors] || colors.partner;
  };

  if (!userPlans || userPlans.length === 0) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Operações Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Nenhum plano ativo</p>
            <p className="text-white/50 text-sm">Compre um plano para começar as operações automáticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {userPlans.map((plan) => {
        const limits = planLimits[plan.plan_name as keyof typeof planLimits];
        const progress = limits ? (plan.daily_earnings / limits.dailyTarget) * 100 : 0;
        const targetReached = hasReachedTarget(plan);
        const countdown = countdowns[plan.id];

        return (
          <Card key={plan.id} className={`bg-gradient-to-br ${getPlanColor(plan.plan_name)}`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Operações Automáticas - {plan.plan_name.toUpperCase()}
                </div>
                <Badge className="bg-white/20 text-white">
                  {plan.auto_operations_completed_today} operações hoje
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Target Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Meta Diária</span>
                  <span className="text-white font-medium">
                    {formatCurrency(plan.daily_earnings)} / {formatCurrency(limits?.dailyTarget || 0)}
                  </span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/50 text-xs">0%</span>
                  <span className="text-white/50 text-xs">100%</span>
                </div>
              </div>

              {/* AI Analysis Effect */}
              {plan.auto_operations_started && !plan.auto_operations_paused && !targetReached && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <h4 className="text-white/80 text-sm font-medium">Buscando entradas nas IAs:</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all duration-300">
                      <img src={chatgptLogo} alt="ChatGPT" className="w-6 h-6 rounded-full bg-white p-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-white/80 text-xs font-medium">Chat GPT 4.0</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                          <div className="bg-green-400 h-1 rounded-full animate-pulse" style={{width: '75%'}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all duration-300">
                      <img src={deepseekLogo} alt="DeepSeek" className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          <span className="text-white/80 text-xs font-medium">Deep Seek</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                          <div className="bg-blue-400 h-1 rounded-full animate-pulse" style={{width: '60%', animationDelay: '0.5s'}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all duration-300">
                      <img src={manusLogo} alt="Manus" className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                          <span className="text-white/80 text-xs font-medium">Manus</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                          <div className="bg-purple-400 h-1 rounded-full animate-pulse" style={{width: '85%', animationDelay: '1s'}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all duration-300">
                      <img src={grokLogo} alt="Grok 4" className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                          <span className="text-white/80 text-xs font-medium">Grok 4</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                          <div className="bg-orange-400 h-1 rounded-full animate-pulse" style={{width: '70%', animationDelay: '1.5s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Operations */}
              {plan.auto_operations_started && !plan.auto_operations_paused && !targetReached && recentOperations[plan.id] && recentOperations[plan.id].length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white/80 text-sm font-medium">Operações Recentes:</h4>
                  {recentOperations[plan.id].slice(0, 2).map((operation) => (
                    <div key={operation.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{operation.pair}</span>
                          {operation.direction === 'CALL' ? (
                            <ArrowUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-white/70 text-xs">{operation.direction}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={operation.result === 'WIN' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}>
                            {operation.result}
                          </Badge>
                          <span className={`text-sm font-bold ${operation.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(operation.profit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status and Controls */}
              <div className="space-y-4">
                {targetReached && countdown ? (
                  <div className="text-center p-4 bg-green-600/20 rounded-lg border border-green-500/50">
                    <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-white font-medium mb-1">Meta Atingida!</p>
                    <p className="text-green-400 text-2xl font-bold mb-1">{countdown}</p>
                    <p className="text-white/70 text-sm">Próximo ciclo disponível em</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center p-3 bg-blue-600/20 rounded-lg border border-blue-500/50">
                      <p className="text-white/90 text-sm font-medium mb-2">
                        As operações são feitas na categoria de <span className="text-blue-400 font-bold">BLITZ/5s</span>
                      </p>
                    </div>

                    {isWeekendInBrazil() ? (
                      <div className="text-center p-4 bg-orange-600/20 rounded-lg border border-orange-500/50">
                        <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                        <p className="text-white font-medium mb-1">Operações Indisponíveis</p>
                        <p className="text-white/70 text-sm">As operações automáticas funcionam apenas de Segunda a Sexta-feira</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {!plan.auto_operations_started ? (
                          <Button
                            onClick={() => startOperations(plan.id)}
                            disabled={isLoading[plan.id]}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {isLoading[plan.id] ? 'Iniciando...' : 'INICIAR OPERAÇÕES'}
                          </Button>
                        ) : plan.auto_operations_paused ? (
                          <Button
                            onClick={() => resumeOperations(plan.id)}
                            disabled={isLoading[plan.id]}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {isLoading[plan.id] ? 'Retomando...' : 'RETOMAR OPERAÇÕES'}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => pauseOperations(plan.id)}
                            disabled={isLoading[plan.id]}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            {isLoading[plan.id] ? 'Pausando...' : 'PAUSAR OPERAÇÕES'}
                          </Button>
                        )}

                        {plan.auto_operations_started && (
                          <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            {plan.auto_operations_paused ? 'Operações pausadas' : 'Operações em andamento'}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">{formatCurrency(plan.daily_earnings)}</p>
                  <p className="text-white/60 text-xs">Lucro Hoje</p>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">{plan.auto_operations_completed_today}</p>
                  <p className="text-white/60 text-xs">Operações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}