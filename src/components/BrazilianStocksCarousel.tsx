import { useEffect, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Stock {
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  logourl: string;
}

const defaultStocks = [
  "MGLU3", "BEEF3", "SANB3", "GGBR4", "VALE3", "BBAS3", 
  "PETR4", "ITUB4", "ABEV3", "WEGE3"
];

export function BrazilianStocksCarousel() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const stockSymbols = defaultStocks.join(',');
      const response = await fetch(
        `https://brapi.dev/api/quote/${stockSymbols}?token=demo`
      );
      const data = await response.json();
      
      if (data.results) {
        setStocks(data.results);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4">
          Principais Ações Brasileiras
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
        Principais Ações Brasileiras
      </h3>
      <div className="relative mx-auto flex items-center justify-center">
        <Carousel
          opts={{ loop: true }}
          plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
        >
          <CarouselContent className="ml-0">
            {stocks.map((stock) => (
              <CarouselItem
                key={stock.symbol}
                className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <div className="mx-4 flex shrink-0 items-center justify-center">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      {stock.logourl ? (
                        <img
                          src={stock.logourl}
                          alt={stock.symbol}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {stock.symbol.substring(0, 2)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {stock.symbol}
                        </h4>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">
                          {stock.longName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        R$ {stock.regularMarketPrice?.toFixed(2) || '0.00'}
                      </span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        stock.regularMarketChangePercent >= 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stock.regularMarketChangePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {stock.regularMarketChangePercent >= 0 ? '+' : ''}
                          {stock.regularMarketChangePercent?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}
