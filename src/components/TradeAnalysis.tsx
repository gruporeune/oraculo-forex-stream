import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Zap, Target, Clock } from "lucide-react";

export interface AnalysisData {
  id: string;
  asset: string;
  expiration: string;
  betAmount: number;
  prediction: "CALL" | "PUT";
  confidence: number;
}

export interface TradeResult {
  id: string;
  asset: string;
  betAmount: number;
  result: "WIN" | "LOSS";
  profit: number;
  timestamp: Date;
}

interface TradeAnalysisProps {
  onTradeComplete: (result: TradeResult) => void;
}

const BINARY_ASSETS = [
  "USD/EUR", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", 
  "EUR/GBP", "NZD/USD", "USD/CHF", "EUR/JPY", "GBP/JPY",
  "BTC/USD", "ETH/USD", "LTC/USD", "XRP/USD", "ADA/USD"
];

const EXPIRATIONS = ["1 min"];

const generateAnalysis = (): AnalysisData => {
  const asset = BINARY_ASSETS[Math.floor(Math.random() * BINARY_ASSETS.length)];
  const expiration = EXPIRATIONS[Math.floor(Math.random() * EXPIRATIONS.length)];
  const betAmount = Math.floor(Math.random() * 598) + 2; // R$2 to R$600
  const prediction = Math.random() > 0.5 ? "CALL" : "PUT";
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-99% confidence
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    asset,
    expiration,
    betAmount,
    prediction,
    confidence
  };
};

export const TradeAnalysis = ({ onTradeComplete }: TradeAnalysisProps) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  const startNewAnalysis = () => {
    const analysis = generateAnalysis();
    setCurrentAnalysis(analysis);
    setProgress(0);
    setIsAnalyzing(true);
    setShowResult(false);
    setTradeResult(null);

    // Start progress animation
    const startTime = Date.now();
    const duration = 60000; // 1 minute

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Analysis complete, execute trade
        executeTradeResult(analysis);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  const executeTradeResult = (analysis: AnalysisData) => {
    // 75% win rate, 25% loss rate
    const isWin = Math.random() < 0.75;
    const profitLoss = isWin 
      ? Math.floor(analysis.betAmount * 0.85) // 85% profit
      : -analysis.betAmount; // Total loss

    const result: TradeResult = {
      id: analysis.id,
      asset: analysis.asset,
      betAmount: analysis.betAmount,
      result: isWin ? "WIN" : "LOSS",
      profit: profitLoss,
      timestamp: new Date()
    };

    setTradeResult(result);
    setIsAnalyzing(false);
    setShowResult(true);
    onTradeComplete(result);

    // Auto start next analysis after 5 seconds
    setTimeout(() => {
      startNewAnalysis();
    }, 5000);
  };

  useEffect(() => {
    // Start first analysis after component mounts
    const timer = setTimeout(startNewAnalysis, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!currentAnalysis) {
    return (
      <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d animate-neon-pulse">
        <div className="p-6 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-gold animate-pulse" />
          <p className="text-muted-foreground">Iniciando análise IA...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-glass-3d to-glass-bg backdrop-blur-xl border border-glass-border shadow-shadow-3d overflow-hidden">
      <div className="p-6">
        {/* Analysis Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gold/20 text-gold">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Análise IA</h3>
              <p className="text-sm text-muted-foreground">Sistema O ORÁCULO</p>
            </div>
          </div>
          <Badge variant="outline" className="border-cyber-green text-cyber-green animate-cyber-glow">
            <Zap className="w-4 h-4 mr-1" />
            {currentAnalysis.confidence}% Precisão
          </Badge>
        </div>

        {/* Asset Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border border-border/30">
            <p className="text-sm text-muted-foreground mb-1">Ativo</p>
            <p className="text-lg font-bold text-gold">{currentAnalysis.asset}</p>
          </div>
          <div className="bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border border-border/30">
            <p className="text-sm text-muted-foreground mb-1">Expiração</p>
            <p className="text-lg font-bold text-foreground flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {currentAnalysis.expiration}
            </p>
          </div>
        </div>

        {/* Bet Amount & Prediction */}
        <div className="bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border border-border/30 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor da Operação</p>
              <p className="text-2xl font-bold text-gold">
                R$ {currentAnalysis.betAmount.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Predição</p>
              <Badge 
                variant={currentAnalysis.prediction === 'CALL' ? 'default' : 'destructive'}
                className={`text-lg px-4 py-2 ${
                  currentAnalysis.prediction === 'CALL' 
                    ? 'bg-success/20 text-success border-success/30' 
                    : 'bg-destructive/20 text-destructive border-destructive/30'
                }`}
              >
                {currentAnalysis.prediction === 'CALL' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {currentAnalysis.prediction}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Analisando mercado...</p>
              <p className="text-sm font-bold text-gold">{Math.round(progress)}%</p>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-secondary/50 [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-cyber-green [&>div]:animate-pulse" 
            />
          </div>
        )}

        {/* Trade Result */}
        {showResult && tradeResult && (
          <div className={`bg-secondary/30 backdrop-blur-sm rounded-lg p-4 border ${
            tradeResult.result === 'WIN' 
              ? 'border-success/50 bg-success/10' 
              : 'border-destructive/50 bg-destructive/10'
          } animate-slide-up`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  tradeResult.result === 'WIN' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {tradeResult.result === 'WIN' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {tradeResult.result === 'WIN' ? 'OPERAÇÃO VENCEDORA!' : 'OPERAÇÃO PERDEDORA'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tradeResult.asset} • {tradeResult.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  tradeResult.result === 'WIN' ? 'text-success' : 'text-destructive'
                }`}>
                  {tradeResult.profit > 0 ? '+' : ''}R$ {Math.abs(tradeResult.profit).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};