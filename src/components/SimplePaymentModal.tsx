import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
  };
}

interface PaymentData {
  qr_code: string;
  qr_code_text: string;
  amount: number;
  external_id: string;
}

export function SimplePaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: ''
  });
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const getPlanAmount = () => {
    const planAmounts: Record<string, number> = {
      'PARTNER': 200,
      'MASTER': 600,
      'PREMIUM': 2750,
      'PLATINUM': 5000
    };
    return planAmounts[plan.name] || 0;
  };

  const handleCreatePayment = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.cpf) {
      toast({
        title: 'Erro',
        description: 'Todos os campos são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          plan: plan.name.toLowerCase(),
          userEmail: formData.email,
          userName: formData.fullName,
          userDocument: formData.cpf.replace(/\D/g, ''),
          userPhone: formData.phone.replace(/\D/g, '')
        }
      });

      if (error) throw error;

      if (data?.success) {
        setPaymentData({
          qr_code: data.data.qr_code,
          qr_code_text: data.data.qr_code_text,
          amount: data.data.amount,
          external_id: data.data.external_id
        });
        toast({
          title: 'PIX gerado com sucesso!',
          description: 'Escaneie o QR Code para pagar'
        });
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar PIX. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.qr_code_text) {
      await navigator.clipboard.writeText(paymentData.qr_code_text);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para área de transferência'
      });
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setFormData({ fullName: '', email: '', phone: '', cpf: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-black/95 border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            Pagamento - {plan.name}
          </DialogTitle>
        </DialogHeader>

        {!paymentData ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-white">
                {plan.price}
              </p>
              <p className="text-white/70 text-sm">
                Pagamento via PIX
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-white">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div>
                <Label htmlFor="cpf" className="text-white">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            <Button
              onClick={handleCreatePayment}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Gerar PIX'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mb-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">PIX Gerado!</h3>
              <p className="text-white/70">
                Escaneie o QR Code ou copie o código PIX
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg">
              {paymentData.qr_code && (
                <div 
                  dangerouslySetInnerHTML={{ __html: paymentData.qr_code }}
                  className="flex justify-center"
                />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/70">Código PIX:</p>
              <div className="flex items-center space-x-2">
                <Input
                  value={paymentData.qr_code_text}
                  readOnly
                  className="bg-black/50 border-white/20 text-white text-xs"
                />
                <Button
                  onClick={copyPixCode}
                  size="sm"
                  variant="outline"
                  className="border-white/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-white/50">
              Após o pagamento, seu plano será ativado automaticamente
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}