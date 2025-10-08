import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import promocaoImage from "@/assets/promocao-2-leve-1.png";

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionModal = ({ isOpen, onClose }: PromotionModalProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Data final: 10/10/2025 às 18:00
    const endDate = new Date("2025-10-10T18:00:00").getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoToPlans = () => {
    navigate("/dashboard/plans");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4 text-white drop-shadow-lg" />
          <span className="sr-only">Fechar</span>
        </button>

        <div className="relative">
          <img
            src={promocaoImage}
            alt="Promoção Compre 2 Leve 1"
            className="w-full h-auto"
          />
        </div>

        <div className="p-4 space-y-4 bg-gradient-to-b from-background to-background/95">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
              🚀 PROMOÇÃO EXCLUSIVA! 🚀
            </DialogTitle>
            <p className="text-center text-base font-semibold text-foreground">
              Compre 2 Planos e Leve o 3º Totalmente GRÁTIS!
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Triplique seus ganhos com essa oportunidade imperdível!
            </p>
          </DialogHeader>

          <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 rounded-lg p-4 space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ⏰ Promoção encerra em:
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-background rounded-lg p-2 text-center shadow-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {timeLeft.days}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Dias
                </div>
              </div>
              <div className="bg-background rounded-lg p-2 text-center shadow-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Horas
                </div>
              </div>
              <div className="bg-background rounded-lg p-2 text-center shadow-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Min
                </div>
              </div>
              <div className="bg-background rounded-lg p-2 text-center shadow-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Seg
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Sexta-feira, 10 de Outubro de 2025 às 18:00
            </p>
          </div>

          <Button
            onClick={handleGoToPlans}
            size="lg"
            className="w-full text-base font-bold bg-gradient-to-r from-primary via-amber-500 to-primary hover:opacity-90 transition-opacity"
          >
            🎁 APROVEITAR PROMOÇÃO AGORA
          </Button>

          <p className="text-center text-[10px] text-muted-foreground">
            * Oferta válida apenas durante o período promocional
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
