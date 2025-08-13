import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, DollarSign, Zap, Target, Users, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TradeOperation {
  id: string;
  asset: string;
  direction: "CALL" | "PUT";
  entry: number;
  result: "WIN" | "LOSS";
  profit: number;
  time: string;
}

export default function ConversionLandingPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [balance, setBalance] = useState(1000);

  const assets = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"];
  
  const generateOperation = (): TradeOperation => {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction: "CALL" | "PUT" = Math.random() > 0.5 ? "CALL" : "PUT";
    const isWin = Math.random() > 0.25; // 75% win rate
    const profit = isWin ? Math.floor(Math.random() * 50) + 20 : -(Math.floor(Math.random() * 30) + 10);
    const result: "WIN" | "LOSS" = isWin ? "WIN" : "LOSS";
    
    return {
      id: Date.now().toString(),
      asset,
      direction,
      entry: 1 + Math.random() * 0.5,
      result,
      profit,
      time: new Date().toLocaleTimeString()
    };
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setOperations([]);
    setTotalProfit(0);
    setBalance(1000);

    let operationCount = 0;
    const interval = setInterval(() => {
      if (operationCount >= 12) {
        clearInterval(interval);
        setIsSimulating(false);
        return;
      }

      const operation = generateOperation();
      setOperations(prev => [operation, ...prev.slice(0, 6)]);
      setTotalProfit(prev => prev + operation.profit);
      setBalance(prev => prev + operation.profit);
      operationCount++;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              ORÁCULO
            </span>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-purple-300 border-purple-500/30 mb-6">
            IA Revolucionária • 87% Taxa de Acerto
          </Badge>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              GANHE R$ 500
            </span>
            <br />
            <span className="text-white">POR DIA</span>
            <br />
            <span className="text-2xl md:text-3xl text-purple-300">
              com Operações 100% Automáticas
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Nossa IA opera 24/7 no mercado financeiro enquanto você dorme. 
            <span className="text-cyan-400 font-semibold"> Sem conhecimento necessário.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-300">75% Win Rate</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300">Operações Automáticas</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-500/20 px-4 py-2 rounded-full border border-cyan-500/30">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-300">R$ 0,50 - R$ 500/dia</span>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  🎯 DEMONSTRAÇÃO: Veja as Operações em Ação
                </h2>
                <p className="text-gray-300">
                  Clique no botão abaixo e veja como nossa IA gera lucros automaticamente
                </p>
              </div>

              {/* Controls */}
              <div className="flex justify-center mb-8">
                <Button
                  onClick={startSimulation}
                  disabled={isSimulating}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                >
                  {isSimulating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Operações em Andamento...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      INICIAR OPERAÇÕES AUTOMÁTICAS
                    </>
                  )}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">
                      R$ {totalProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-300">Lucro Total</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-400">
                      R$ {balance.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-300">Saldo Disponível</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-500/30">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-cyan-400">
                      {operations.length}
                    </div>
                    <div className="text-sm text-cyan-300">Operações</div>
                  </CardContent>
                </Card>
              </div>

              {/* Operations List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {operations.map((operation, index) => (
                    <motion.div
                      key={operation.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className={`p-4 rounded-lg border ${
                        operation.result === "WIN"
                          ? "bg-green-900/30 border-green-500/30"
                          : "bg-red-900/30 border-red-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={`${
                              operation.result === "WIN" 
                                ? "bg-green-500/20 text-green-300 border-green-500/30" 
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                            }`}
                          >
                            {operation.result}
                          </Badge>
                          <span className="font-semibold">{operation.asset}</span>
                          <Badge variant="outline" className="text-xs">
                            {operation.direction}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            operation.result === "WIN" ? "text-green-400" : "text-red-400"
                          }`}>
                            {operation.profit > 0 ? "+" : ""}R$ {operation.profit.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">{operation.time}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Proof Placeholder */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            🎥 Veja o que nossos usuários estão dizendo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-purple-500/30">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-purple-300">Vídeo de Prova Social #{i}</p>
                      <p className="text-xs text-gray-400">(A ser adicionado)</p>
                    </div>
                  </div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">
                    "Resultados incríveis com o Oráculo!"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Card className="bg-gradient-to-br from-purple-900/60 to-cyan-900/60 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                🚀 Comece a Lucrar HOJE!
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Junte-se a mais de <span className="text-cyan-400 font-semibold">10.000 usuários</span> que já estão lucrando com o ORÁCULO
              </p>
              
              <div className="space-y-4">
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                >
                  <a href="/register">
                    <Users className="w-5 h-5 mr-2" />
                    QUERO COMEÇAR AGORA - GRÁTIS
                  </a>
                </Button>
                
                <p className="text-sm text-gray-400">
                  ✅ Sem taxa de adesão • ✅ Cancele quando quiser • ✅ Suporte 24/7
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-purple-500/20">
          <p className="text-gray-400 text-sm">
            © 2024 ORÁCULO. Tecnologia de IA para o mercado financeiro.
          </p>
        </footer>
      </div>
    </div>
  );
}