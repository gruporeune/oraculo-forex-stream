
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    priceInReals?: string;
    gradient: string;
  };
}

interface PaymentData {
  success: boolean;
  transaction_id: string;
  qr_code: string;
  qr_code_image?: string;
  amount: number;
  expires_at?: string;
  request_number: string;
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const createPayment = async () => {
    // Validar campos obrigatórios
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.cpf.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive"
      });
      return;
    }

    // Validar formato do CPF (básico)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast({
        title: "Erro",
        description: "CPF deve ter 11 dígitos",
        variant: "destructive"
      });
      return;
    }

    // Validar formato do telefone
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast({
        title: "Erro",
        description: "Telefone inválido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      // Check current user plans to enforce purchase limits
      const { data: userPlans, error: plansError } = await supabase
        .from('user_plans')
        .select('plan_name')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (plansError) {
        console.error('Error fetching user plans:', plansError);
        toast({
          title: "Erro",
          description: "Erro ao verificar planos existentes",
          variant: "destructive"
        });
        return;
      }

      // Count existing plans of the same type
      const planName = plan.name.toLowerCase();
      const existingPlanCount = userPlans?.filter(p => p.plan_name === planName).length || 0;

      // Check if user has reached the limit of 5 plans of the same type
      if (existingPlanCount >= 5) {
        toast({
          title: "Limite atingido",
          description: `Você já possui o limite máximo de 5 planos ${plan.name}. Não é possível comprar mais deste plano.`,
          variant: "destructive"
        });
        return;
      }

      // Correct amount conversion - handle different price formats
      let amountValue;
      const priceText = plan.price.replace('R$ ', '');
      
      // Map plan names to their actual values to avoid conversion errors
      const planValues = {
        'PARTNER': 200,
        'MASTER': 600, 
        'PREMIUM': 2750,
        'PLATINUM': 5000
      };
      
      amountValue = planValues[plan.name.toUpperCase()] || parseFloat(priceText.replace('.', '').replace(',', '.'));

      console.log('=== PAYMENT MODAL DEBUG ===')
      console.log('Plan selected:', plan.name, 'Price:', plan.price)
      console.log('Processing payment for plan:', plan.name, 'with amount:', amountValue)

      const { data, error } = await supabase.functions.invoke('create-faturefy-payment', {
        body: {
          user_id: user.id,
          plan_name: plan.name,
          amount: amountValue,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_document: formData.cpf.replace(/\D/g, ''),
          customer_phone: formData.phone.replace(/\D/g, '')
        }
      });

      if (error) {
        console.error('Error creating payment:', error);
        throw new Error('Falha ao criar pagamento. Tente novamente.');
      }

      if (!data?.success) {
        throw new Error('Falha ao criar pagamento. Tente novamente.');
      }

      console.log('Payment created successfully:', data);

      // Use the data directly from Faturefy
      const adaptedData = {
        success: data.success,
        transaction_id: data.transaction_id,
        qr_code: data.qr_code,
        qr_code_image: data.qr_code_image,
        amount: data.amount,
        expires_at: data.expires_at,
        request_number: data.request_number
      };

      setPaymentData(adaptedData);
      toast({
        title: "Pagamento criado!",
        description: "Escaneie o QR Code para pagar via PIX",
      });

    } catch (error) {
      console.error('Payment creation error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.qr_code) {
      await navigator.clipboard.writeText(paymentData.qr_code);
      setIsCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para área de transferência",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.request_number) return;

    setIsCheckingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call our edge function to check payment status via Faturefy API
      const { data, error } = await supabase.functions.invoke('check-faturefy-payment', {
        body: {
          payment_id: paymentData.request_number, // Use request_number as payment_id
          user_id: user.id
        }
      });

      if (error) {
        console.error('Error checking payment:', error);
        throw new Error('Falha ao verificar pagamento');
      }

      console.log('Payment status check result:', data);

      if (data?.status === 'paid') {
        setIsPaymentConfirmed(true);
        toast({
          title: "Pagamento confirmado!",
          description: "Seu plano foi ativado com sucesso!",
        });
      } else if (data?.status === 'failed') {
        toast({
          title: "Pagamento falhou",
          description: "O pagamento não foi processado. Tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Pagamento pendente",
          description: "O pagamento ainda não foi confirmado. Aguarde ou tente novamente em alguns instantes.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Payment check error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao verificar pagamento',
        variant: "destructive"
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setFormData({ name: '', phone: '', email: '', cpf: '' });
    setIsLoading(false);
    setIsCopied(false);
    setIsCheckingPayment(false);
    setIsPaymentConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/95 border border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Finalizar Pagamento
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Complete o pagamento via PIX para ativar seu plano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <motion.div 
            className={`bg-gradient-to-r ${plan.gradient} text-white p-6 rounded-lg bg-opacity-20 border border-purple-500/30`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-2xl font-bold">
              {plan.priceInReals ? plan.priceInReals : plan.price}
            </p>
            <p className="text-sm opacity-90">Pagamento único • Acesso imediato</p>
          </motion.div>

          {!paymentData ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-white/80">
                Dados para o pagamento PIX:
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-white">Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white">Telefone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white">CPF *</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <p className="text-xs text-white/60">
                * Campos obrigatórios para gerar o PIX
              </p>

              <Button 
                onClick={createPayment} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </div>
          ) : isPaymentConfirmed ? (
            <div className="text-center space-y-6">
              {/* Success State */}
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h3 className="text-2xl font-bold text-white mb-2">Seu plano foi ativado com sucesso!</h3>
                <p className="text-white/70">
                  O pagamento foi confirmado e seu plano {plan.name} está ativo.
                </p>
              </div>
              
              <Button 
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Continuar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Created State */}
              <div className="text-center">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-4">
                  <p className="text-lg font-bold text-white">Valor: R$ {paymentData.amount.toFixed(2).replace('.', ',')}</p>
                  {paymentData.expires_at && (
                    <p className="text-sm text-white/70">
                      Expira em: {new Date(paymentData.expires_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code Image */}
              {paymentData.qr_code_image && (
                <div className="text-center">
                  <img 
                    src={paymentData.qr_code_image} 
                    alt="QR Code PIX" 
                    className="mx-auto max-w-[200px] h-auto border border-purple-500/30 rounded"
                  />
                </div>
              )}

              {/* PIX Code */}
              {paymentData.qr_code && (
                <div className="space-y-2">
                  <p className="text-sm text-white/80">Código PIX:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-black/50 rounded border border-purple-500/30 text-xs font-mono break-all text-white max-h-20 overflow-y-auto">
                      {paymentData.qr_code}
                    </div>
                    <Button
                      onClick={copyPixCode}
                      size="sm"
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/20 text-white"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Check Button */}
              <Button 
                onClick={checkPaymentStatus}
                disabled={isCheckingPayment}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando pagamento...
                  </>
                ) : (
                  'Já efetuei o pagamento!'
                )}
              </Button>

              {/* Payment Info */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-300">Instruções:</p>
                <ul className="list-disc list-inside text-blue-200 space-y-1 mt-1">
                  <li>Abra seu banco ou carteira digital</li>
                  <li>Escolha a opção PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Clique em "Já efetuei o pagamento!" após pagar</li>
                </ul>
                <p className="text-blue-300 mt-2 font-medium">
                  ⚡ Ativação automática após confirmação
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
