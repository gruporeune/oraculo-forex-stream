import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EarningsHistoryProps {
  userId: string;
}

interface DailyEarning {
  id: string;
  date: string;
  total_earnings: number;
  total_commissions: number;
  operations_count: number;
}

export function EarningsHistory({ userId }: EarningsHistoryProps) {
  const [history, setHistory] = useState<DailyEarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarningsHistory();
  }, [userId]);

  const loadEarningsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_earnings_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error loading earnings history:', error);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error loading earnings history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalEarnings = history.reduce((sum, item) => sum + item.total_earnings, 0);
  const totalCommissions = history.reduce((sum, item) => sum + item.total_commissions, 0);
  const totalOperations = history.reduce((sum, item) => sum + item.operations_count, 0);

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico de Ganhos (Últimos 30 dias)
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Ganhos</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(totalEarnings)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total Comissões</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(totalCommissions)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Total Operações</span>
            </div>
            <div className="text-lg font-bold text-white">
              {totalOperations}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Nenhum histórico ainda</p>
            <p className="text-white/50 text-sm">Os ganhos diários aparecerão aqui após completar operações</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{formatDate(item.date)}</p>
                      <p className="text-white/60 text-sm">
                        {item.operations_count} operações realizadas
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {item.total_earnings > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600/20 text-green-400 border-green-500/50">
                          Ganhos
                        </Badge>
                        <span className="text-green-400 font-medium">
                          {formatCurrency(item.total_earnings)}
                        </span>
                      </div>
                    )}
                    {item.total_commissions > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50">
                          Comissões
                        </Badge>
                        <span className="text-purple-400 font-medium">
                          {formatCurrency(item.total_commissions)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}