import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, DollarSign, Zap, Target, Users, Star, AlertTriangle, Bot, Signal, ArrowUp, ArrowDown } from "lucide-react";
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

interface Signal {
  id: string;
  asset: string;
  direction: "CALL" | "PUT";
  time: string;
  expirationTime: string;
  confidence: number;
}

export default function ConversionLandingPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [balance, setBalance] = useState(100);
  const [showRegisterCTA, setShowRegisterCTA] = useState(false);
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);

  const assets = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"];
  
  const generateSignal = (): Signal => {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction: "CALL" | "PUT" = Math.random() > 0.5 ? "CALL" : "PUT";
    const confidence = Math.floor(Math.random() * 15) + 80; // 80-95% confidence
    const now = new Date();
    const expiration = new Date(now.getTime() + 5 * 60000); // 5 minutes
    
    return {
      id: Date.now().toString(),
      asset,
      direction,
      time: now.toLocaleTimeString(),
      expirationTime: expiration.toLocaleTimeString(),
      confidence
    };
  };
  
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
    setShowRegisterCTA(false);

    let operationCount = 0;
    const interval = setInterval(() => {
      if (operationCount >= 15) {
        clearInterval(interval);
        setIsSimulating(false);
        setShowRegisterCTA(true);
        return;
      }

      const operation = generateOperation();
      setOperations(prev => [operation, ...prev.slice(0, 7)]);
      setTotalProfit(prev => prev + operation.profit);
      setBalance(prev => prev + operation.profit);
      operationCount++;
    }, 1500);
  };

  const generateNewSignal = () => {
    setIsGeneratingSignal(true);
    setCurrentSignal(null);
    
    setTimeout(() => {
      const signal = generateSignal();
      setCurrentSignal(signal);
      setIsGeneratingSignal(false);
    }, 2000);
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
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-8 leading-tight px-4">
              <span className="text-red-400">CANSADO DE PERDER</span>
              <br />
              <span className="text-white">DINHEIRO NO TRADE?</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-12 px-4">
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-4 md:p-6">
                <div className="text-red-400 text-3xl md:text-5xl font-bold mb-4">87%</div>
                <p className="text-gray-300 text-sm md:text-base">dos traders iniciantes perdem todo o dinheiro em 6 meses</p>
              </div>
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-4 md:p-6">
                <div className="text-red-400 text-3xl md:text-5xl font-bold mb-4">R$ 0</div>
                <p className="text-gray-300 text-sm md:text-base">é o que sobra na conta depois de operações emocionais</p>
              </div>
              <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-4 md:p-6">
                <div className="text-red-400 text-3xl md:text-5xl font-bold mb-4">24/7</div>
                <p className="text-gray-300 text-sm md:text-base">você fica grudado no gráfico tentando recuperar perdas</p>
              </div>
            </div>

            <p className="text-lg md:text-xl text-gray-300 mb-8 px-4">
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
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-8 leading-tight px-4">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  OPERAÇÕES 100%
                </span>
                <br />
                <span className="text-white">AUTOMÁTICAS</span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto px-4">
                Nossa IA analisa milhares de dados em tempo real e executa operações com 
                <span className="text-green-400 font-bold"> 80% de precisão</span>, 
                24 horas por dia, sem emoções ou erros humanos.
              </p>
            </div>

            {/* Demo Section */}
            <Card className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm mb-16 mx-4">
              <CardContent className="p-4 md:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                    ⚠️ CUIDADO!
                  </h3>
                  <p className="text-red-400 text-sm md:text-base font-bold">
                    O que você está prestes a experimentar, poderá te fazer ganhar dinheiro de verdade!
                  </p>
                </div>

                <div className="flex justify-center mb-8">
                  <Button
                    onClick={startSimulation}
                    disabled={isSimulating}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 md:px-8 py-3 md:py-4 text-sm md:text-lg font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    {isSimulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                        <span className="hidden sm:inline">IA OPERANDO...</span>
                        <span className="sm:hidden">OPERANDO...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="hidden sm:inline">ATIVAR ORÁCULO IA AGORA</span>
                        <span className="sm:hidden">ATIVAR ORÁCULO</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30">
                    <CardContent className="p-2 md:p-4 text-center">
                      <DollarSign className="w-4 h-4 md:w-8 md:h-8 text-green-400 mx-auto mb-1 md:mb-2" />
                      <div className="text-sm md:text-2xl font-bold text-green-400">
                        R$ {totalProfit.toFixed(2)}
                      </div>
                      <div className="text-xs md:text-sm text-green-300">Lucro Gerado</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30">
                    <CardContent className="p-2 md:p-4 text-center">
                      <TrendingUp className="w-4 h-4 md:w-8 md:h-8 text-purple-400 mx-auto mb-1 md:mb-2" />
                      <div className="text-sm md:text-2xl font-bold text-purple-400">
                        R$ {balance.toFixed(2)}
                      </div>
                      <div className="text-xs md:text-sm text-purple-300">Saldo Total</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-500/30">
                    <CardContent className="p-2 md:p-4 text-center">
                      <Target className="w-4 h-4 md:w-8 md:h-8 text-cyan-400 mx-auto mb-1 md:mb-2" />
                      <div className="text-sm md:text-2xl font-bold text-cyan-400">
                        {operations.length}
                      </div>
                      <div className="text-xs md:text-sm text-cyan-300">Operações IA</div>
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
                        <div className="flex justify-between items-center flex-wrap sm:flex-nowrap gap-2">
                          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <Badge 
                              className={`text-xs ${
                                operation.result === "WIN" 
                                  ? "bg-green-500/20 text-green-300 border-green-500/30" 
                                  : "bg-red-500/20 text-red-300 border-red-500/30"
                              }`}
                            >
                              {operation.result}
                            </Badge>
                            <span className="font-semibold text-white text-sm md:text-base">{operation.asset}</span>
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                              {operation.direction}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-sm md:text-lg ${
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
                  <div className="mt-6 p-3 md:p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-400 font-semibold text-sm md:text-base">
                      🤖 IA operando automaticamente • {Math.round((operations.filter(op => op.result === "WIN").length / operations.length) * 100)}% taxa de acerto
                    </p>
                  </div>
                )}

                {/* Register CTA after simulation */}
                <AnimatePresence>
                  {showRegisterCTA && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mt-8 p-6 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-2xl text-center"
                    >
                      <div className="mb-4">
                        <h4 className="text-xl md:text-2xl font-bold text-white mb-2">
                          🎉 IMPRESSIONANTE!
                        </h4>
                        <p className="text-green-300 text-lg md:text-xl font-bold">
                          Você ganhou: <span className="text-3xl md:text-4xl font-black text-green-400 drop-shadow-lg animate-pulse">R$ {totalProfit.toFixed(2)}</span>!!
                        </p>
                        <p className="text-green-300 text-sm md:text-base mt-2">
                          Agora imagine isso funcionando 24/7 na sua conta real!
                        </p>
                      </div>
                      
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 md:py-6 text-lg md:text-xl font-bold rounded-xl shadow-2xl transform transition-all hover:scale-105 animate-pulse"
                      >
                        <a href="/register" className="flex items-center justify-center">
                          <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                          <span className="hidden sm:inline">CADASTRAR GRÁTIS NO PLANO FREE AGORA</span>
                          <span className="sm:hidden">CADASTRAR GRÁTIS</span>
                        </a>
                      </Button>
                      
                      <p className="text-xs md:text-sm text-green-200 mt-3 opacity-80">
                        ✅ Sem cartão de crédito • ✅ Ativação imediata • ✅ Comece a operar hoje
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Social Proof */}
      <section className="relative z-10 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-purple-950/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 px-4">
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
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6 px-4">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    PARE DE PERDER
                  </span>
                  <br />
                  <span className="text-white">COMECE A GANHAR</span>
                </h2>
                
                <p className="text-lg md:text-xl text-gray-300 mb-8 px-4">
                  Junte-se a mais de <span className="text-cyan-400 font-bold">800 usuários</span> que transformaram suas vidas financeiras com o ORÁCULO
                </p>
                
                <div className="space-y-6">
                  <Button 
                    asChild
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 md:py-6 text-lg md:text-xl font-bold rounded-xl shadow-2xl transform transition-all hover:scale-105"
                  >
                    <a href="/register" className="flex items-center justify-center">
                      <Users className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                      <span className="hidden sm:inline">QUERO ACESSO IMEDIATO - GRÁTIS</span>
                      <span className="sm:hidden">ACESSO GRÁTIS</span>
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