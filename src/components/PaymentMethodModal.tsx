import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (method: 'pix' | 'usdt') => void;
  plan: {
    name: string;
    price: string;
    priceInReals?: string;
    description: string;
  };
}

export const PaymentMethodModal = ({ isOpen, onClose, onSelectPaymentMethod, plan }: PaymentMethodModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-black/95 border border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Escolha o método de pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4 text-center"
          >
            <h3 className="font-bold text-lg text-blue-400">Plano {plan.name}</h3>
            <div className="space-y-1">
              <p className="text-xl font-bold text-white">{plan.price}</p>
              {plan.priceInReals && (
                <p className="text-lg font-semibold text-yellow-400">{plan.priceInReals}</p>
              )}
            </div>
            <p className="text-white/70 text-sm">{plan.description}</p>
          </motion.div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={() => onSelectPaymentMethod('pix')}
                className="w-full h-16 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-white flex items-center gap-4 justify-start px-6"
                variant="outline"
              >
                <div className="bg-green-600 p-2 rounded-full">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold">PIX</div>
                  <div className="text-sm text-white/70">
                    {plan.priceInReals || plan.price} - Pagamento instantâneo
                  </div>
                </div>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => onSelectPaymentMethod('usdt')}
                className="w-full h-16 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-white flex items-center gap-4 justify-start px-6"
                variant="outline"
              >
                <div className="bg-blue-600 p-2 rounded-full">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold">USDT (TRC20)</div>
                  <div className="text-sm text-white/70">
                    {plan.price} - Criptomoeda
                  </div>
                </div>
              </Button>
            </motion.div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-white/50">
              Escolha o método de pagamento de sua preferência
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};