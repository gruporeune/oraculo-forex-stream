import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-auto-scroll";

interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Dados simulados realistas que atualizam dinamicamente
const initialAssets: MarketAsset[] = [
  { id: "1", symbol: "PETR4", name: "Petrobras", price: 38.45, change: 2.34 },
  { id: "2", symbol: "VALE3", name: "Vale", price: 65.82, change: -1.12 },
  { id: "3", symbol: "ITUB4", name: "Itaú", price: 28.90, change: 0.87 },
  { id: "4", symbol: "BBDC4", name: "Bradesco", price: 14.52, change: 1.45 },
  { id: "5", symbol: "ABEV3", name: "Ambev", price: 11.23, change: -0.65 },
  { id: "6", symbol: "WEGE3", name: "WEG", price: 42.18, change: 3.21 },
  { id: "7", symbol: "RENT3", name: "Localiza", price: 56.34, change: -2.08 },
  { id: "8", symbol: "MGLU3", name: "Magazine Luiza", price: 8.92, change: 4.12 },
  { id: "9", symbol: "BTCUSD", name: "Bitcoin", price: 67842.50, change: 5.67 },
  { id: "10", symbol: "ETHUSD", name: "Ethereum", price: 3421.80, change: 3.89 },
  { id: "11", symbol: "USDBRL", name: "Dólar", price: 5.12, change: -0.34 },
  { id: "12", symbol: "EURBRL", name: "Euro", price: 5.58, change: 0.12 },
];

export function BrazilianStocksCarousel() {
  const [assets, setAssets] = useState<MarketAsset[]>(initialAssets);

  useEffect(() => {
    // Atualiza os preços com variações realistas a cada 3 segundos
    const interval = setInterval(() => {
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          // Variação aleatória entre -0.5% e +0.5%
          const variation = (Math.random() - 0.5) * 0.01;
          const newPrice = asset.price * (1 + variation);
          // Atualiza a variação percentual acumulada
          const newChange = asset.change + (variation * 100);
          
          return {
            ...asset,
            price: newPrice,
            change: newChange,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">Mercado Financeiro - Tempo Real</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Dados atualizados dinamicamente • Cotações simuladas realistas
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
        className="w-full overflow-hidden"
      >
        <CarouselContent className="-ml-2 md:-ml-3">
          {assets.map((asset) => {
            const isPositive = asset.change >= 0;
            const isCrypto = asset.symbol.includes("USD");
            const formattedPrice = isCrypto && asset.price > 1000
              ? `$${asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : asset.price >= 100
              ? `R$ ${asset.price.toFixed(2)}`
              : `R$ ${asset.price.toFixed(2)}`;
            
            return (
              <CarouselItem
                key={asset.id}
                className="pl-2 md:pl-3 basis-1/2 md:basis-1/3 lg:basis-1/5"
              >
                <Card className="p-4 hover:shadow-lg transition-all hover:scale-105 duration-200 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-xs">
                      {asset.symbol.substring(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {asset.name}
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
                          {asset.change.toFixed(2)}%
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
