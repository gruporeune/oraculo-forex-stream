import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Users } from "lucide-react";
import { AnimatedCandlesticks } from "./AnimatedCandlesticks";
import { TradesList } from "./TradesList";
import { UserProfits } from "./UserProfits";

export interface Trade {
  id: string;
  pair: string;
  type: "BUY" | "SELL";
  amount: number;
  profit: number;
  timestamp: Date;
  status: "active" | "closed";
}

export interface UserProfit {
  id: string;
  name: string;
  profit: number;
  trades: number;
  avatar: string;
}

const FOREX_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", 
  "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"
];

const USER_NAMES = [
  "Carlos Silva", "Ana Santos", "João Pedro", "Mariana Costa", "Rafael Lima",
  "Fernanda Oliveira", "Diego Souza", "Camila Ferreira", "Lucas Pereira", "Isabella Rocha",
  "Thiago Alves", "Gabriela Martins", "André Rodrigues", "Larissa Barbosa", "Bruno Castro"
];

const generateRandomTrade = (): Trade => {
  const pair = FOREX_PAIRS[Math.floor(Math.random() * FOREX_PAIRS.length)];
  const type = Math.random() > 0.5 ? "BUY" : "SELL";
  const amount = Math.floor(Math.random() * 50000) + 10000; // 10k to 60k
  const profit = Math.floor(Math.random() * 598) + 2; // R$2 to R$600
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    pair,
    type,
    amount,
    profit,
    timestamp: new Date(),
    status: "active"
  };
};

const generateRandomUser = (): UserProfit => {
  const name = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
  const profit = Math.floor(Math.random() * 25000) + 5000; // R$5k to R$30k
  const trades = Math.floor(Math.random() * 150) + 50; // 50 to 200 trades
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    profit,
    trades,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
  };
};

export const TradingDashboard = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [users, setUsers] = useState<UserProfit[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [activeTrades, setActiveTrades] = useState(0);

  // Initialize with some data
  useEffect(() => {
    const initialTrades = Array.from({ length: 5 }, generateRandomTrade);
    const initialUsers = Array.from({ length: 8 }, generateRandomUser);
    
    setTrades(initialTrades);
    setUsers(initialUsers);
    
    // Calculate initial stats
    const initialProfit = initialTrades.reduce((sum, trade) => sum + trade.profit, 0);
    setTotalProfit(initialProfit);
    setActiveTrades(initialTrades.length);
  }, []);

  // Generate new trade every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newTrade = generateRandomTrade();
      
      setTrades(prev => {
        const updated = [newTrade, ...prev].slice(0, 20); // Keep last 20 trades
        return updated;
      });
      
      setTotalProfit(prev => prev + newTrade.profit);
      setActiveTrades(prev => prev + 1);
      
      // Occasionally update user profits
      if (Math.random() > 0.7) {
        setUsers(prev => {
          const updated = [...prev];
          const randomIndex = Math.floor(Math.random() * updated.length);
          updated[randomIndex] = {
            ...updated[randomIndex],
            profit: updated[randomIndex].profit + Math.floor(Math.random() * 1000) + 100,
            trades: updated[randomIndex].trades + 1
          };
          return updated;
        });
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedCandlesticks />
      
      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent mb-4 animate-glow">
            O ORÁCULO
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema Avançado de Trading Forex
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-md border border-border/50 hover:border-gold/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {totalProfit.toLocaleString('pt-BR')}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </div>
          </Card>

          <Card className="bg-card/80 backdrop-blur-md border border-border/50 hover:border-gold/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trades Ativos</p>
                  <p className="text-2xl font-bold text-gold">
                    {activeTrades}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-gold" />
              </div>
            </div>
          </Card>

          <Card className="bg-card/80 backdrop-blur-md border border-border/50 hover:border-gold/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-gold">
                    {users.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gold" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trades List - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TradesList trades={trades} />
          </div>

          {/* User Profits - Takes 1 column */}
          <div className="lg:col-span-1">
            <UserProfits users={users} />
          </div>
        </div>
      </div>
    </div>
  );
};