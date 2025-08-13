import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, DollarSign, Zap, Target, Users, Star, AlertTriangle, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OracleHero } from "@/components/ui/artificial-hero";

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
  const [balance, setBalance] = useState(100);

  const assets = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"];
  
  const generateOperation = (): TradeOperation => {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction: "CALL" | "PUT" = Math.random() > 0.5 ? "CALL" : "PUT";
    const isWin = Math.random() > 0.2; // 80% win rate
    const profit = isWin ? Math.floor(Math.random() * 25) + 15 : -(Math.floor(Math.random() * 15) + 5);
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
    setBalance(100);

    let operationCount = 0;
    const interval = setInterval(() => {
      if (operationCount >= 15) {
        clearInterval(interval);
        setIsSimulating(false);
        return;
      }

      const operation = generateOperation();
      setOperations(prev => [operation, ...prev.slice(0, 7)]);
      setTotalProfit(prev => prev + operation.profit);
      setBalance(prev => prev + operation.profit);
      operationCount++;
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with 3D Effect */}
      <section className="h-screen relative">
        <OracleHero />
      </section>

      {/* Pain Section */}
      <section className="relative z-10 min-h-screen bg-gradient-to-b from-black via-slate-950 to-purple-950/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="bg-red-900/30 border border-red-500/50 rounded-full p-4">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              <span className="text-red-400">CANSADO DE PERDER</span>
              <br />
              <span className="text-white">DINHEIRO NO TRADE?</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6">
                <div className="text-red-400 text-5xl font-bold mb-4">87%</div>
                <p className="text-gray-300">dos traders iniciantes perdem todo o dinheiro em 6 meses</p>
              </div>
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6">
                <div className="text-red-400 text-5xl font-bold mb-4">R$ 0</div>
                <p className="text-gray-300">é o que sobra na conta depois de operações emocionais</p>
              </div>
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6">
                <div className="text-red-400 text-5xl font-bold mb-4">24/7</div>
                <p className="text-gray-300">você fica grudado no gráfico tentando recuperar perdas</p>
              </div>
            </div>

            <p className="text-xl text-gray-300 mb-8">
              <span className="text-red-400 font-bold">A solução?</span> Deixe nossa IA fazer o trabalho pesado enquanto você vive sua vida.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative z-10 bg-gradient-to-b from-purple-950/20 via-slate-950 to-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full p-4">
                  <Bot className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  OPERAÇÕES 100%
                </span>
                <br />
                <span className="text-white">AUTOMÁTICAS</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Nossa IA analisa milhares de dados em tempo real e executa operações com 
                <span className="text-green-400 font-bold"> 80% de precisão</span>, 
                24 horas por dia, sem emoções ou erros humanos.
              </p>
            </div>

            {/* Demo Section */}
            <Card className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm mb-16">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    🎯 DEMONSTRAÇÃO: Veja o ORÁCULO em Ação
                  </h3>
                  <p className="text-gray-300">
                    Assista nossa IA gerando lucros automaticamente (Simulação realística)
                  </p>
                </div>

                <div className="flex justify-center mb-8">
                  <Button
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    {isSimulating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        IA OPERANDO...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        ATIVAR ORÁCULO IA AGORA
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
                      <div className="text-sm text-green-300">Lucro Gerado</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-400">
                        R$ {balance.toFixed(2)}
                      </div>
                      <div className="text-sm text-purple-300">Saldo Total</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-500/30">
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-cyan-400">
                        {operations.length}
                      </div>
                      <div className="text-sm text-cyan-300">Operações IA</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Operations List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  <AnimatePresence>
                    {operations.map((operation) => (
                      <motion.div
                        key={operation.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className={`p-4 rounded-lg border backdrop-blur-sm ${
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
                            <span className="font-semibold text-white">{operation.asset}</span>
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                              {operation.direction}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${
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

                {operations.length > 0 && (
                  <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-400 font-semibold">
                      🤖 IA operando automaticamente • {Math.round((operations.filter(op => op.result === "WIN").length / operations.length) * 100)}% taxa de acerto
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 bg-gradient-to-b from-black via-slate-950 to-purple-950/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              🎥 <span className="text-purple-400">Resultados Reais</span> dos Nossos Usuários
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-full h-48 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-purple-500/30">
                      <div className="text-center">
                        <Play className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-purple-300">Depoimento #{i}</p>
                        <p className="text-xs text-gray-400">(Em breve)</p>
                      </div>
                    </div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300">
                      "Finalmente um sistema que funciona de verdade!"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 bg-gradient-to-b from-purple-950/20 to-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-br from-purple-900/60 to-cyan-900/60 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <h2 className="text-3xl md:text-5xl font-black mb-6">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    PARE DE PERDER
                  </span>
                  <br />
                  <span className="text-white">COMECE A GANHAR</span>
                </h2>
                
                <p className="text-xl text-gray-300 mb-8">
                  Junte-se a mais de <span className="text-cyan-400 font-bold">800 usuários</span> que transformaram suas vidas financeiras com o ORÁCULO
                </p>
                
                <div className="space-y-6">
                  <Button 
                    asChild
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-xl font-bold rounded-xl shadow-2xl transform transition-all hover:scale-105"
                  >
                    <a href="/register">
                      <Users className="w-6 h-6 mr-3" />
                      QUERO ACESSO IMEDIATO - GRÁTIS
                    </a>
                  </Button>
                  
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-1">✅ Sem mensalidade</span>
                    <span className="flex items-center gap-1">✅ Suporte 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-purple-500/20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm font-mono">
            © 2024 ORÁCULO • Inteligência Artificial para o Mercado Financeiro
          </p>
        </div>
      </footer>
    </div>
  );
}