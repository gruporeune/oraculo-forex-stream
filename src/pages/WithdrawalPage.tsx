import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, DollarSign, Info, FileText, Loader2, CreditCard, Smartphone, Mail, FileCheck, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalPageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

const WithdrawalPage = ({ user, profile, onProfileUpdate }: WithdrawalPageProps) => {
  const { toast } = useToast();
  const [saqueData, setSaqueData] = useState({ amount: '', pixKey: '', fullName: '', pixKeyType: '' });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  
  const fetchWithdrawalRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error: any) {
      toast({ 
        title: "Erro ao carregar dados de saque", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [user]);

  const handleSaque = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const amount = parseFloat(saqueData.amount);
    const availableBalance = profile?.available_balance || 0;

    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: "Valor inválido", 
        description: "Por favor, insira um valor de saque válido.", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    if (amount < 50) {
      toast({ 
        title: "Valor muito baixo", 
        description: "O valor mínimo para saque é R$ 50,00.", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    if (amount > availableBalance) {
      toast({ 
        title: "Saldo insuficiente", 
        description: "Você não possui saldo suficiente para este saque.", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    if (!saqueData.pixKey) {
      toast({ 
        title: "Chave PIX ausente", 
        description: "Por favor, insira sua chave PIX.", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    if (!saqueData.fullName || saqueData.fullName.trim().length < 5) {
      toast({ 
        title: "Nome completo obrigatório", 
        description: "Por favor, insira seu nome completo (mínimo 5 caracteres).", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    if (!saqueData.pixKeyType) {
      toast({ 
        title: "Tipo de chave PIX obrigatório", 
        description: "Por favor, selecione o tipo da sua chave PIX.", 
        variant: "destructive" 
      });
      setFormLoading(false);
      return;
    }

    try {
      // Create withdrawal request in database first
      const { data: withdrawalData, error: requestError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          pix_key: saqueData.pixKey,
          pix_key_type: saqueData.pixKeyType,
          full_name: saqueData.fullName,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Process withdrawal via SecretPay
      const { data: transferResult, error: transferError } = await supabase.functions.invoke('create-secretpay-withdrawal', {
        body: {
          amount: amount,
          pixKey: saqueData.pixKey,
          fullName: saqueData.fullName,
          userId: user.id
        }
      });

      if (transferError) {
        // If SecretPay fails, remove the withdrawal request
        await supabase.from('withdrawal_requests').delete().eq('id', withdrawalData.id);
        throw new Error(transferError.message || 'Erro ao processar saque via SecretPay');
      }

      if (!transferResult.success) {
        // If SecretPay fails, remove the withdrawal request
        await supabase.from('withdrawal_requests').delete().eq('id', withdrawalData.id);
        throw new Error(transferResult.error || 'Erro ao processar saque');
      }

      toast({ 
        title: "Saque solicitado com sucesso!", 
        description: "Seu saque foi enviado para processamento via PIX. Você receberá em instantes!" 
      });
      
      setSaqueData({ amount: '', pixKey: '', fullName: '', pixKeyType: '' });
      fetchWithdrawalRequests();
      onProfileUpdate();
    } catch (error: any) {
      toast({ 
        title: "Erro ao solicitar saque", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (value: number) => `R$ ${Number(value).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'approved': return 'text-green-400';
      case 'completed': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'approved': return 'Aprovado';
      case 'completed': return 'Concluído';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-6">Saques</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/10 text-white bg-gradient-to-r from-orange-500/20 to-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="mr-2 text-orange-400" />
                Saldo Disponível para Saque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">
                {formatCurrency(profile?.available_balance || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
              <CardDescription className="text-white/80">
                Os saques são processados via PIX.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaque} className="space-y-4">
                <Input 
                  placeholder="Nome completo" 
                  value={saqueData.fullName} 
                  onChange={e => setSaqueData({...saqueData, fullName: e.target.value})} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                  required
                  minLength={5}
                />
                
                <div className="space-y-2">
                  <label className="text-sm text-white/80">Tipo de Chave PIX</label>
                  <Select 
                    value={saqueData.pixKeyType} 
                    onValueChange={value => setSaqueData({...saqueData, pixKeyType: value})}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Selecione o tipo da chave PIX" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      <SelectItem value="cpf" className="text-white hover:bg-white/10">
                        <div className="flex items-center">
                          <FileCheck className="mr-2 h-4 w-4" />
                          CPF
                        </div>
                      </SelectItem>
                      <SelectItem value="cnpj" className="text-white hover:bg-white/10">
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          CNPJ
                        </div>
                      </SelectItem>
                      <SelectItem value="phone" className="text-white hover:bg-white/10">
                        <div className="flex items-center">
                          <Smartphone className="mr-2 h-4 w-4" />
                          Celular
                        </div>
                      </SelectItem>
                      <SelectItem value="email" className="text-white hover:bg-white/10">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          E-mail
                        </div>
                      </SelectItem>
                      <SelectItem value="random" className="text-white hover:bg-white/10">
                        <div className="flex items-center">
                          <Hash className="mr-2 h-4 w-4" />
                          Chave Aleatória
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input 
                  placeholder="Chave PIX" 
                  value={saqueData.pixKey} 
                  onChange={e => setSaqueData({...saqueData, pixKey: e.target.value})} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                  required
                />
                
                <div className="space-y-2">
                  <Input 
                    type="number" 
                    placeholder="Valor do saque" 
                    value={saqueData.amount} 
                    onChange={e => setSaqueData({...saqueData, amount: e.target.value})} 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                    required
                    min="50"
                    step="0.01"
                  />
                  <div className="text-xs text-orange-400 flex items-center">
                    <Info className="mr-1 h-3 w-3" />
                    Taxa de 5% sobre o valor do saque
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600" 
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Enviando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Solicitar Saque
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-black/40 border-white/10 text-white lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2" />
              Regras e Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/90">
            <p>• Saques via <span className="font-bold">PIX instantâneo</span> pela SecretPay.</p>
            <p>• Processamento: <span className="font-bold">Imediato (24/7)</span>.</p>
            <p>• Valor mínimo para saque: <span className="font-bold">R$ 50,00</span>.</p>
            <p>• <span className="font-bold text-orange-400">Taxa de 5%</span> sobre o valor do saque.</p>
            <p>• Certifique-se de que seu nome e chave PIX estão corretos.</p>
            <p>• Em caso de erro nos dados, o valor será estornado automaticamente.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" />
            Histórico de Saques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : withdrawalRequests.length === 0 ? (
            <p className="text-white/70">Nenhuma solicitação de saque encontrada.</p>
          ) : (
            <div className="space-y-2">
              {withdrawalRequests.map((request, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b border-white/10 text-sm">
                  <div>
                    <p className="font-medium">{formatDate(request.created_at)}</p>
                    <p className="text-white/70 text-xs">PIX: {request.pix_key}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(request.amount)}</p>
                    <p className={`text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalPage;