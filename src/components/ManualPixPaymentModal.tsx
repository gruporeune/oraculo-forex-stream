import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ManualPixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    priceInReals?: string;
    description: string;
  };
}

const QR_CODES = {
  partner: '/lovable-uploads/1ccbf7f1-eac6-46d3-a4dc-403f590aad0a.png',
  master: '/lovable-uploads/25468596-0f52-4bd2-8dbc-f3add9160763.png',
  premium: '/lovable-uploads/09fc3329-e5fe-4db7-9aff-7c2061295767.png',
  platinum: '/lovable-uploads/cf927098-2bad-40c7-9525-8c427eeab00c.png',
} as const;

const PLAN_VALUES = {
  partner: 200,
  master: 600,
  premium: 2750,
  platinum: 5000,
} as const;

export const ManualPixPaymentModal = ({ isOpen, onClose, plan }: ManualPixPaymentModalProps) => {
  const [email, setEmail] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const { toast } = useToast();

  const planKey = plan.name.toLowerCase() as keyof typeof QR_CODES;
  const qrCodeUrl = QR_CODES[planKey];
  const planValue = PLAN_VALUES[planKey];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O comprovante deve ter menos de 5MB",
          variant: "destructive"
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const uploadProofImage = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('pix-proofs')
      .upload(fileName, file);

    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email cadastrado",
        variant: "destructive"
      });
      return;
    }

    if (!uploadedFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "Por favor, envie o comprovante de pagamento",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Upload proof image
      const proofImagePath = await uploadProofImage(uploadedFile, user.id);

      // Save payment record
      const { error } = await supabase
        .from('manual_pix_payments')
        .insert({
          user_id: user.id,
          email: email.trim(),
          plan_name: plan.name.toLowerCase(),
          amount_brl: planValue,
          proof_image_path: proofImagePath,
          status: 'pending'
        });

      if (error) throw error;

      setPaymentSubmitted(true);
      toast({
        title: "Pagamento enviado!",
        description: "Seu comprovante foi recebido. Em breve o plano será ativado.",
      });

    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setUploadedFile(null);
    setPaymentSubmitted(false);
    onClose();
  };

  if (paymentSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] bg-black/95 border border-green-500/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-green-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Pagamento Enviado!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-6">
                <h3 className="font-bold text-lg text-green-400 mb-2">Comprovante Recebido!</h3>
                <p className="text-white/80">
                  Seu pagamento está sendo analisado. O plano será ativado em até 24 horas.
                </p>
              </div>

              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-white/70 mb-3">
                  Precisa de ajuda ou quer agilizar a ativação?
                </p>
                <Button
                  onClick={() => window.open('https://api.whatsapp.com/send?phone=5521975101827&text=Oi%2C%20acabei%20de%20fazer%20o%20pagamento', '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar com Suporte
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 border border-purple-500/50 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            PIX Manual - Plano {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4 text-center"
          >
            <h3 className="font-bold text-lg text-blue-400">Plano {plan.name}</h3>
            <p className="text-2xl font-bold text-white">R$ {planValue.toLocaleString('pt-BR')}</p>
            <p className="text-white/70 text-sm">{plan.description}</p>
          </motion.div>

          {/* QR Code */}
          <div className="text-center space-y-3">
            <h4 className="text-lg font-semibold text-yellow-400">QR Code para Pagamento</h4>
            <div className="bg-white p-4 rounded-lg inline-block">
              <img 
                src={qrCodeUrl} 
                alt={`QR Code para pagamento do plano ${plan.name}`}
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-white/60">
              Escaneie o QR code acima para fazer o pagamento de R$ {planValue.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email Cadastrado *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email cadastrado"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="proof" className="text-white">Comprovante de Pagamento *</Label>
            <div className="relative">
              <Input
                id="proof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="bg-gray-800 border-gray-600 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
              />
              {uploadedFile && (
                <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Arquivo selecionado: {uploadedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">Instruções:</h4>
            <ol className="text-sm text-white/80 space-y-1 list-decimal list-inside">
              <li>Faça o pagamento via PIX usando o QR code acima</li>
              <li>Digite seu email cadastrado</li>
              <li>Envie o comprovante de pagamento</li>
              <li>Se precisar de ajuda, clique no botão do WhatsApp abaixo</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !email.trim() || !uploadedFile}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar Comprovante'}
            </Button>

            <Button
              onClick={() => window.open('https://api.whatsapp.com/send?phone=5521975101827&text=Oi%2C%20acabei%20de%20fazer%20o%20pagamento', '_blank')}
              variant="outline"
              className="w-full border-green-500 text-green-400 hover:bg-green-600/20 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Suporte WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};