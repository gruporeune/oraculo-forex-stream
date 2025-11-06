import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-auto-scroll";

interface Stock {
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  logourl?: string;
}

export function BrazilianStocksCarousel() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(
        "https://brapi.dev/api/quote/PETR4,VALE3,ITUB4,BBDC4,ABEV3,MGLU3,WEGE3,RENT3,SUZB3,GGBR4"
      );
      const data = await response.json();
      
      if (data.results) {
        setStocks(data.results);
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar ações:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Carregando ações...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Principais Ações Brasileiras</h3>
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
          {stocks.map((stock) => {
            const isPositive = stock.regularMarketChangePercent >= 0;
            return (
              <CarouselItem
                key={stock.symbol}
                className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    {stock.logourl && (
                      <img
                        src={stock.logourl}
                        alt={stock.symbol}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stock.longName}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">
                      R$ {stock.regularMarketPrice.toFixed(2)}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {stock.regularMarketChangePercent.toFixed(2)}%
                      </span>
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
