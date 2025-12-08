import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Users } from "lucide-react";
import { AnimatedCandlesticks } from "./AnimatedCandlesticks";
import { TradesList } from "./TradesList";
import { UserProfits } from "./UserProfits";
import { TradeAnalysis, TradeResult } from "./TradeAnalysis";

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

  const handleTradeComplete = (result: TradeResult) => {
    // Convert TradeResult to Trade format
    const newTrade: Trade = {
      id: result.id,
      pair: result.asset,
      type: result.result === "WIN" ? "BUY" : "SELL",
      amount: result.betAmount,
      profit: result.profit,
      timestamp: result.timestamp,
      status: "closed"
    };

    setTrades(prev => [newTrade, ...prev].slice(0, 20));
    setTotalProfit(prev => prev + result.profit);
    setActiveTrades(prev => prev + 1);

    // Update user profits occasionally
    if (Math.random() > 0.7 && result.result === "WIN") {
      setUsers(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const randomIndex = Math.floor(Math.random() * updated.length);
        if (!updated[randomIndex]) return prev;
        updated[randomIndex] = {
          ...updated[randomIndex],
          profit: (updated[randomIndex].profit || 0) + Math.abs(result.profit),
          trades: (updated[randomIndex].trades || 0) + 1
        };
        return updated;
      });
    }
  };

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
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const randomIndex = Math.floor(Math.random() * updated.length);
          if (!updated[randomIndex]) return prev;
          updated[randomIndex] = {
            ...updated[randomIndex],
            profit: (updated[randomIndex].profit || 0) + Math.floor(Math.random() * 1000) + 100,
            trades: (updated[randomIndex].trades || 0) + 1
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
            IA vencedora para Opções Binarias
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d hover:shadow-shadow-neon transition-all duration-300 animate-neon-pulse">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
                  <p className="text-3xl font-bold text-success">
                    R$ {totalProfit.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-success/20 text-success shadow-shadow-cyber">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d hover:shadow-shadow-gold transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trades Ativos</p>
                  <p className="text-3xl font-bold text-gold">
                    {activeTrades}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gold/20 text-gold shadow-shadow-gold">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d hover:shadow-shadow-neon transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-neon-blue">
                    {users.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-neon-blue/20 text-neon-blue shadow-shadow-neon">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis Section */}
        <div className="mb-8">
          <TradeAnalysis onTradeComplete={handleTradeComplete} />
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