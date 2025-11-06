import { useEffect, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

export function BrazilianStocksCarousel() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptos();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchCryptos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch(
        'https://api.coincap.io/v2/assets?limit=15'
      );
      const data = await response.json();
      
      if (data.data) {
        setCryptos(data.data);
      }
    } catch (error) {
      console.error('Error fetching cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4">
          Mercado de Criptomoedas ao Vivo
        </h3>
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4">
        Mercado de Criptomoedas ao Vivo
      </h3>
      <div className="relative mx-auto flex items-center justify-center">
        <Carousel
          opts={{ loop: true }}
          plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
        >
          <CarouselContent className="ml-0">
            {cryptos.map((crypto) => {
              const price = parseFloat(crypto.priceUsd);
              const change = parseFloat(crypto.changePercent24Hr);
              
              return (
                <CarouselItem
                  key={crypto.id}
                  className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <div className="mx-4 flex shrink-0 items-center justify-center">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {crypto.symbol.substring(0, 3)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">
                            {crypto.symbol}
                          </h4>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">
                            {crypto.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          ${price >= 1 ? price.toFixed(2) : price.toFixed(6)}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          change >= 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-semibold">
                            {change >= 0 ? '+' : ''}
                            {change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}
