import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface MultiPlanAutomaticSignalsProps {
  user: any;
  userPlans: PlanOperation[];
  onPlansUpdate: () => void;
}

export default function MultiPlanAutomaticSignals({ user, userPlans, onPlansUpdate }: MultiPlanAutomaticSignalsProps) {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});
  const [lastOperationTimes, setLastOperationTimes] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  const planLimits = {
    partner: { dailyTarget: 1.00, maxOperations: 50 },
    master: { dailyTarget: 6.00, maxOperations: 100 },
    premium: { dailyTarget: 41.25, maxOperations: 250 },
    platinum: { dailyTarget: 100.00, maxOperations: 500 }
  };

  // Automatic operations effect
  useEffect(() => {
    const interval = setInterval(async () => {
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
        
        // Generate operation every 30-60 seconds
        const minInterval = 30000; // 30 seconds
        const maxInterval = 60000; // 60 seconds
        const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

        if (now - lastOperation >= randomInterval) {
          await generateOperation(plan);
          setLastOperationTimes(prev => ({ ...prev, [plan.id]: now }));
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userPlans, lastOperationTimes]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: {[key: string]: string} = {};
      
      userPlans.forEach(plan => {
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
            newCountdowns[plan.id] = '00:00:00';
          }
        }
      });
      
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [userPlans]);

  const generateOperation = async (plan: PlanOperation) => {
    const limits = planLimits[plan.plan_name as keyof typeof planLimits];
    if (!limits || hasReachedTarget(plan)) return;

    // Calculate earning per operation to reach daily target
    const remainingTarget = limits.dailyTarget - plan.daily_earnings;
    const remainingOperations = limits.maxOperations - plan.auto_operations_completed_today;
    
    if (remainingOperations <= 0) return;

    // Generate random profit between 80% and 95% success rate
    const successRate = Math.random() * 0.15 + 0.80; // 80-95%
    const isWin = Math.random() < successRate;
    
    // Calculate profit amount - more realistic distribution
    const baseProfit = remainingTarget / Math.max(remainingOperations, 20); // Distribute over remaining operations
    const profitMultiplier = isWin ? (0.8 + Math.random() * 0.4) : 0; // 80-120% of base or 0
    const operationProfit = Math.max(baseProfit * profitMultiplier, 0);

    console.log(`[${plan.plan_name.toUpperCase()}] Operação automática:`, {
      isWin,
      profit: operationProfit,
      remaining: remainingTarget,
      operations: remainingOperations
    });

    try {
      const { error } = await supabase
        .from('user_plans')
        .update({
          daily_earnings: Math.min(plan.daily_earnings + operationProfit, limits.dailyTarget),
          auto_operations_completed_today: plan.auto_operations_completed_today + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);

      if (error) throw error;

      // Also update user's total earnings and balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          daily_earnings: (user.daily_earnings || 0) + operationProfit,
          available_balance: (user.available_balance || 0) + operationProfit,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

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
      premium: 'from-yellow-600/20 to-yellow-400/20 border-yellow-500/50',
      platinum: 'from-orange-600/20 to-orange-400/20 border-orange-500/50'
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