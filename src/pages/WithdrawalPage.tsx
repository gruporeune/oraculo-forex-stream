import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, DollarSign, Info, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalPageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

const WithdrawalPage = ({ user, profile, onProfileUpdate }: WithdrawalPageProps) => {
  const { toast } = useToast();
  const [saqueData, setSaqueData] = useState({ amount: '', pixKey: '' });
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

    try {
      // Create withdrawal request
      const { error: requestError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          pix_key: saqueData.pixKey,
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Update user's available balance
      const newBalance = availableBalance - amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ available_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Solicitação enviada!", 
        description: "Sua solicitação de saque foi enviada com sucesso e será processada em até 48 horas úteis." 
      });
      
      setSaqueData({ amount: '', pixKey: '' });
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
      case 'approved': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
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
                  type="number" 
                  placeholder="Valor do saque" 
                  value={saqueData.amount} 
                  onChange={e => setSaqueData({...saqueData, amount: e.target.value})} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                  required
                  min="50"
                  step="0.01"
                />
                <Input 
                  placeholder="Chave PIX" 
                  value={saqueData.pixKey} 
                  onChange={e => setSaqueData({...saqueData, pixKey: e.target.value})} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                  required
                />
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
            <p>• Taxa de saque: <span className="font-bold">R$ 4,90</span> por transação.</p>
            <p>• Prazo de pagamento: <span className="font-bold">Até 48 horas úteis</span>.</p>
            <p>• Saques disponíveis de <span className="font-bold">Segunda a Sexta</span>.</p>
            <p>• Valor mínimo para saque: <span className="font-bold">R$ 50,00</span>.</p>
            <p>• Certifique-se de que sua chave PIX está correta.</p>
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