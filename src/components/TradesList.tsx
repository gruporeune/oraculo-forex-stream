import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Trade } from "./TradingDashboard";

interface TradesListProps {
  trades: Trade[];
}

export const TradesList = ({ trades }: TradesListProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d h-[600px] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gold">Operações em Tempo Real</h2>
          <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">
            <Clock className="w-4 h-4 mr-1" />
            Live
          </Badge>
        </div>

        <div className="space-y-3 overflow-y-auto h-[480px] pr-2">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-secondary/50 backdrop-blur-sm border border-border/30 rounded-lg p-4 hover:border-gold/30 transition-all duration-300 animate-slide-up"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    trade.type === 'BUY' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {trade.type === 'BUY' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground">{trade.pair}</p>
                    <p className="text-sm text-muted-foreground">
                      ${trade.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold ${
                    trade.profit >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {trade.profit >= 0 ? '+' : ''}R$ {Math.abs(trade.profit).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(trade.timestamp)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Badge 
                  variant={trade.type === 'BUY' ? 'default' : 'destructive'}
                  className={`${
                    trade.type === 'BUY' 
                      ? 'bg-success/20 text-success border-success/30' 
                      : 'bg-destructive/20 text-destructive border-destructive/30'
                  }`}
                >
                  {trade.type}
                </Badge>

                <Badge variant="outline" className="border-gold/30 text-gold">
                  {trade.status === 'active' ? 'Ativo' : 'Fechado'}
                </Badge>
              </div>
            </div>
          ))}

          {trades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aguardando próximas operações...</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};