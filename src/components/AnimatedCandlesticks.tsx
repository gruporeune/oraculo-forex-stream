import { useEffect, useState } from "react";

interface Candlestick {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export const AnimatedCandlesticks = () => {
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);

  useEffect(() => {
    // Generate initial candlesticks
    const initialCandlesticks: Candlestick[] = Array.from({ length: 15 }, (_, i) => ({
      id: `candle-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 20,
      opacity: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 20 + 10,
    }));

    setCandlesticks(initialCandlesticks);

    // Animate candlesticks
    const interval = setInterval(() => {
      setCandlesticks(prev => 
        prev.map(candle => ({
          ...candle,
          y: candle.y - 0.1,
          x: candle.x + (Math.sin(Date.now() * 0.001 + candle.id.length) * 0.02),
          opacity: candle.opacity * 0.998,
        })).filter(candle => candle.y > -10 && candle.opacity > 0.05)
      );
    }, 50);

    // Add new candlesticks periodically
    const addInterval = setInterval(() => {
      setCandlesticks(prev => [
        ...prev,
        {
          id: `candle-${Date.now()}`,
          x: Math.random() * 100,
          y: 110,
          size: Math.random() * 30 + 20,
          opacity: Math.random() * 0.3 + 0.1,
          speed: Math.random() * 20 + 10,
        }
      ].slice(0, 25)); // Limit to 25 candlesticks
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(addInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {candlesticks.map((candle) => (
        <div
          key={candle.id}
          className="absolute animate-float"
          style={{
            left: `${candle.x}%`,
            top: `${candle.y}%`,
            opacity: candle.opacity,
            animationDelay: `${candle.id.length * 0.1}s`,
            animationDuration: `${candle.speed}s`,
          }}
        >
          {/* Candlestick Body */}
          <div
            className="bg-gradient-to-b from-gold to-gold-dark rounded-sm relative"
            style={{
              width: `${candle.size * 0.6}px`,
              height: `${candle.size}px`,
            }}
          >
            {/* Candlestick Wick */}
            <div
              className="absolute bg-gold left-1/2 transform -translate-x-1/2"
              style={{
                width: '2px',
                height: `${candle.size * 0.3}px`,
                top: `-${candle.size * 0.15}px`,
              }}
            />
            <div
              className="absolute bg-gold left-1/2 transform -translate-x-1/2"
              style={{
                width: '2px',
                height: `${candle.size * 0.3}px`,
                bottom: `-${candle.size * 0.15}px`,
              }}
            />
          </div>
        </div>
      ))}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
    </div>
  );
};