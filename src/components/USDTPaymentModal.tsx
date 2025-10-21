import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Copy, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface USDTPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    description: string;
  };
}

export const USDTPaymentModal = ({ isOpen, onClose, plan }: USDTPaymentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userWallet, setUserWallet] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const USDT_WALLET = "TVSQjGopxtp81AaNrrw8B25CWeAGVddLf4";
  const NETWORK = "TRC20 (TRON)";
  
  // Get plan amount based on plan name
  const getPlanAmount = () => {
    switch (plan.name.toLowerCase()) {
      case 'partner':
        return 33;
      case 'master':
        return 100;
      case 'pro':
        return 182;
      case 'premium':
        return 458;
      case 'platinum':
        return 913;
      default:
        return 100;
    }
  };
  
  const AMOUNT_USD = getPlanAmount();

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(USDT_WALLET);
      setCopySuccess(true);
      toast({
        title: "Carteira copiada!",
        description: "Endereço da carteira USDT copiado para a área de transferência."
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o endereço da carteira.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!userWallet || !transactionHash || !proofFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e faça upload do comprovante.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Upload proof image
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('usdt-payments')
        .upload(fileName, proofFile);

      if (uploadError) {
        throw new Error('Erro ao fazer upload do comprovante');
      }

      // Create USDT payment record
      const { error: insertError } = await supabase
        .from('usdt_payments')
        .insert({
          user_id: user.id,
          user_wallet: userWallet,
          transaction_hash: transactionHash,
          proof_image_path: fileName,
          plan_name: plan.name.toLowerCase(),
          amount_usd: AMOUNT_USD
        });

      if (insertError) {
        throw new Error('Erro ao registrar pagamento');
      }

      setSubmitted(true);
      toast({
        title: "Pagamento registrado!",
        description: "Seu pagamento foi registrado e será analisado por nossa equipe. Você será notificado sobre a aprovação."
      });

    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUserWallet('');
    setTransactionHash('');
    setProofFile(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black/95 border-white/20 text-white max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Pagamento USDT - Plano {plan.name}
          </DialogTitle>
        </DialogHeader>

        {!submitted ? (
          <div className="space-y-6">
            {/* Plan Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4 text-center"
            >
              <h3 className="font-bold text-lg text-blue-400">Plano {plan.name}</h3>
              <p className="text-2xl font-bold text-white">${AMOUNT_USD} USDT</p>
              <p className="text-white/70 text-sm">{plan.description}</p>
            </motion.div>

            {/* Important Notice */}
            {(plan.name.toLowerCase() === 'premium' || plan.name.toLowerCase() === 'pro') && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-4"
              >
                <h4 className="font-semibold mb-2 text-orange-400">⚠️ Importante:</h4>
                <p className="text-orange-100 text-sm mb-2">
                  Primeiro faça a transferência via USDT na rede TRON e depois preencha os campos abaixo corretamente para a comprovação. 
                  Após a verificação você será ativado com sucesso!
                </p>
                <p className="text-orange-200 text-xs font-medium">
                  🕐 Após o pagamento e envio do comprovante, aguarde até 30 minutos para ver sua conta ativada no sistema.
                </p>
              </motion.div>
            )}

            {/* Payment Instructions */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-yellow-400">Instruções de Pagamento:</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-white/80">Valor a transferir:</Label>
                    <div className="text-lg font-bold text-green-400">{AMOUNT_USD} USDT</div>
                  </div>

                  <div>
                    <Label className="text-sm text-white/80">Rede:</Label>
                    <div className="text-lg font-bold text-orange-400">{NETWORK}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-white/80">Carteira de destino:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-white/10 p-2 rounded text-sm font-mono break-all flex-1">
                        {USDT_WALLET}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyWallet}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userWallet">Sua carteira USDT (TRC20)</Label>
                  <Input
                    id="userWallet"
                    placeholder="Digite o endereço da sua carteira"
                    value={userWallet}
                    onChange={(e) => setUserWallet(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="transactionHash">Hash da transação</Label>
                  <Input
                    id="transactionHash"
                    placeholder="Cole o hash da transação"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="proofFile">Comprovante da transferência</Label>
                  <div className="mt-1">
                    <input
                      id="proofFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('proofFile')?.click()}
                      className="w-full text-white border-white/20 hover:bg-white/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {proofFile ? proofFile.name : 'Fazer upload do comprovante'}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <h3 className="text-xl font-bold text-green-400">Pagamento Registrado!</h3>
            <p className="text-white/80 mb-3">
              Seu pagamento foi registrado com sucesso. Nossa equipe irá analisar e ativar seu plano em breve.
            </p>
            <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-3">
              <p className="text-orange-300 text-sm font-medium">
                ⏱️ Após o pagamento e envio do comprovante, aguarde até 30 minutos para ver sua conta ativada no sistema.
              </p>
            </div>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Fechar
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};