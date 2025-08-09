import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    gradient: string;
  };
}

interface PaymentData {
  qr_code: string;
  qr_code_text: string;
  transaction_id: string;
  external_id: string;
  amount: number;
  plan: string;
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const createPayment = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      // Get user profile for additional data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      // Call payment creation function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          plan: plan.name.toLowerCase(),
          userEmail: user.email,
          userName: profile?.full_name || user.email,
          userDocument: profile?.phone || '00000000000' // Fallback document
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setPaymentData(data.data);
        toast({
          title: "Pagamento criado!",
          description: "Escaneie o QR Code para pagar via PIX",
        });
      } else {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.qr_code_text) {
      await navigator.clipboard.writeText(paymentData.qr_code_text);
      setIsCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para área de transferência",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setIsLoading(false);
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-black/95 border border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Finalizar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className={`p-4 rounded-lg bg-gradient-to-r ${plan.gradient} bg-opacity-20 border border-purple-500/30`}>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-sm text-white/70">Pagamento único • Acesso imediato</p>
          </div>

          {!paymentData ? (
            /* Initial State */
            <div className="text-center space-y-4">
              <p className="text-white/80">
                Clique em "Gerar PIX" para criar seu pagamento via PIX
              </p>
              <Button
                onClick={createPayment}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Payment Created State */
            <div className="space-y-4">
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={`data:image/png;base64,${paymentData.qr_code}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-white/70 mt-2">
                  Escaneie o QR Code com seu banco
                </p>
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <p className="text-sm text-white/80">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-black/50 rounded border border-purple-500/30 text-xs font-mono break-all">
                    {paymentData.qr_code_text}
                  </div>
                  <Button
                    onClick={copyPixCode}
                    size="sm"
                    variant="outline"
                    className="border-purple-500/50 hover:bg-purple-500/20"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-300">Instruções:</p>
                <ul className="list-disc list-inside text-blue-200 space-y-1 mt-1">
                  <li>Abra seu banco ou carteira digital</li>
                  <li>Escolha a opção PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ul>
                <p className="text-blue-300 mt-2 font-medium">
                  ⚡ Ativação automática em até 5 minutos
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}