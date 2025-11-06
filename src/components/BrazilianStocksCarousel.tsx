import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-auto-scroll";

interface CryptoAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

interface CoinCapResponse {
  data: CryptoAsset[];
}

export function BrazilianStocksCarousel() {
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      setError(null);
      // API TOTALMENTE GRATUITA E SEM AUTENTICAÇÃO
      const response = await fetch("https://api.coincap.io/v2/assets?limit=12");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CoinCapResponse = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setCryptos(data.data);
        console.log("✅ Dados carregados com sucesso:", data.data.length, "criptomoedas");
      } else {
        throw new Error("Formato de dados inválido");
      }
      setLoading(false);
    } catch (error) {
      console.error("❌ Erro ao buscar criptomoedas:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>Carregando dados do mercado...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50">
        <div className="text-center text-destructive">
          <p className="font-semibold">Erro ao carregar dados</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  if (cryptos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Nenhum dado disponível no momento
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Mercado de Criptomoedas - Tempo Real</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Dados atualizados a cada 30 segundos via CoinCap API
      </p>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            speed: 1,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {cryptos.map((crypto) => {
            const changePercent = parseFloat(crypto.changePercent24Hr);
            const isPositive = changePercent >= 0;
            const price = parseFloat(crypto.priceUsd);
            const formattedPrice = price >= 1 
              ? `$${price.toFixed(2)}` 
              : `$${price.toFixed(6)}`;
            
            return (
              <CarouselItem
                key={crypto.id}
                className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Card className="p-4 hover:shadow-lg transition-all hover:scale-105 duration-200 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {crypto.symbol.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{crypto.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {crypto.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold tracking-tight">
                      {formattedPrice}
                    </p>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">24h</span>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </Card>
  );
}
