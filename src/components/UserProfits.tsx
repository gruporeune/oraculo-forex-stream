import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp } from "lucide-react";
import { UserProfit } from "./TradingDashboard";

interface UserProfitsProps {
  users: UserProfit[];
}

export const UserProfits = ({ users }: UserProfitsProps) => {
  const sortedUsers = [...users].sort((a, b) => b.profit - a.profit);

  return (
    <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d h-[600px] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gold">Top Traders</h2>
          <Trophy className="w-6 h-6 text-gold" />
        </div>

        <div className="space-y-4 overflow-y-auto h-[480px] pr-2">
          {sortedUsers.map((user, index) => (
            <div
              key={user.id}
              className="bg-secondary/50 backdrop-blur-sm border border-border/30 rounded-lg p-4 hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {index < 3 && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gold text-gold-foreground' :
                      index === 1 ? 'bg-muted text-muted-foreground' :
                      'bg-amber-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  
                  <Avatar className="w-10 h-10 border-2 border-gold/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gold/20 text-gold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.trades} trades
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-success flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    R$ {user.profit.toLocaleString('pt-BR')}
                  </p>
                  {index < 3 && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs mt-1 ${
                        index === 0 ? 'bg-gold/20 text-gold border-gold/30' :
                        index === 1 ? 'bg-muted/50 border-muted' :
                        'bg-amber-600/20 text-amber-600 border-amber-600/30'
                      }`}
                    >
                      {index === 0 ? '🥇 Ouro' : index === 1 ? '🥈 Prata' : '🥉 Bronze'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress bar for profit visualization */}
              <div className="mt-3">
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-gold to-gold-light h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((user.profit / Math.max(...sortedUsers.map(u => u.profit))) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Carregando dados dos traders...</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};