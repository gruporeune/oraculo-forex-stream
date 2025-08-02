import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Clock } from 'lucide-react';

interface EarningsRecord {
  id: string;
  date: string;
  total_earnings: number;
  total_commissions: number;
  operations_count: number;
  created_at: string;
}

interface EarningsHistoryProps {
  userId?: string;
}

export function EarningsHistory({ userId }: EarningsHistoryProps) {
  const [earningsHistory, setEarningsHistory] = useState<EarningsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarningsHistory = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('daily_earnings_history')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(30); // Últimos 30 dias

        if (error) {
          console.error('Error loading earnings history:', error);
        } else {
          setEarningsHistory(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEarningsHistory();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalEarnings = () => {
    return earningsHistory.reduce((sum, record) => sum + record.total_earnings + record.total_commissions, 0);
  };

  if (loading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico dos Ganhos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico dos Ganhos
        </CardTitle>
        <p className="text-white/70 text-sm">
          Total acumulado: R$ {getTotalEarnings().toFixed(2)} | Últimos 30 dias
        </p>
      </CardHeader>
      <CardContent>
        {earningsHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-600 to-gray-500 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/70">Nenhum histórico de ganhos ainda</p>
            <p className="text-white/50 text-sm mt-2">
              Seus ganhos diários aparecerão aqui após as operações
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {earningsHistory.map((record) => (
              <div 
                key={record.id} 
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-white">
                      {formatDate(record.date)}
                    </span>
                    <Badge variant="outline" className="text-xs text-purple-300 border-purple-500/50">
                      {record.operations_count} op{record.operations_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Clock className="w-3 h-3" />
                    {formatTime(record.created_at)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {record.total_earnings > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Lucro Operações:</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 font-medium">
                          +R$ {record.total_earnings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {record.total_commissions > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Comissões:</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-400 font-medium">
                          +R$ {record.total_commissions.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-medium">Total do Dia:</span>
                    <span className="text-white font-bold">
                      R$ {(record.total_earnings + record.total_commissions).toFixed(2)}
                    </span>
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