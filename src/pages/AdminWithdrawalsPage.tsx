import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Download, Eye, CheckCircle, XCircle, Clock, LogOut, Calendar as CalendarIcon, TrendingUp, Users, Coins } from "lucide-react";
import * as XLSX from 'xlsx';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string;
  pix_key_type: string;
  full_name: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  secretpay_transfer_id: string | null;
  processed_by: string | null;
  withdrawal_type?: string;
  usdt_wallet?: string | null;
  profile?: {
    full_name: string | null;
    phone: string | null;
    plan: string | null;
    username: string | null;
  } | null;
  user_email?: string;
}

interface UserEarningsHistory {
  referralCommissions: {
    level1: number;
    level2: number; 
    level3: number;
    total: number;
  };
  operationEarnings: number;
  availableBalance: number;
  totalEarnings: number;
  dailyEarnings: number;
}

interface UserEarningsViewProps {
  userId: string;
}

function UserEarningsView({ userId }: UserEarningsViewProps) {
  const [earnings, setEarnings] = useState<UserEarningsHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserEarnings = async () => {
      try {
        setLoading(true);
        console.log('Buscando dados para userId:', userId);
        
        // Buscar comissões de rede por nível na tabela referral_commissions
        const { data: commissions, error: commissionsError } = await supabase
          .from('referral_commissions')
          .select('commission_amount, commission_level')
          .eq('referrer_id', userId);

        console.log('Comissões encontradas na tabela referral_commissions:', commissions);
        
        if (commissionsError) {
          console.error('Erro ao buscar comissões:', commissionsError);
        }

        // Calcular comissões por nível dos dados reais
        const level1 = commissions?.filter(c => c.commission_level === 1).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;
        const level2 = commissions?.filter(c => c.commission_level === 2).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;
        const level3 = commissions?.filter(c => c.commission_level === 3).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;

        console.log('Comissões por nível calculadas:', { level1, level2, level3 });

        // Buscar dados do perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('available_balance, daily_earnings, total_referral_commissions, daily_commissions')
          .eq('id', userId)
          .single();

        console.log('Dados do perfil:', profile);
        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        }

        // Buscar histórico de ganhos das operações
        const { data: dailyHistory, error: historyError } = await supabase
          .from('daily_earnings_history')
          .select('total_earnings')
          .eq('user_id', userId);

        console.log('Histórico diário:', dailyHistory);
        if (historyError) {
          console.error('Erro ao buscar histórico:', historyError);
        }

        // Buscar ganhos dos planos do usuário
        const { data: userPlans, error: plansError } = await supabase
          .from('user_plans')
          .select('daily_earnings')
          .eq('user_id', userId)
          .eq('is_active', true);

        console.log('Planos do usuário:', userPlans);
        if (plansError) {
          console.error('Erro ao buscar planos:', plansError);
        }

        const totalOperationEarnings = dailyHistory?.reduce((sum, h) => sum + (h.total_earnings || 0), 0) || 0;
        const currentDailyEarnings = profile?.daily_earnings || 0;
        const planEarnings = userPlans?.reduce((sum, p) => sum + (p.daily_earnings || 0), 0) || 0;
        const finalOperationEarnings = totalOperationEarnings + currentDailyEarnings + planEarnings;

        // Usar dados reais das comissões apenas
        const totalFromLevels = level1 + level2 + level3;
        const totalReferralCommissions = totalFromLevels;

        console.log('Cálculos finais:', {
          totalOperationEarnings,
          currentDailyEarnings,
          planEarnings,
          finalOperationEarnings,
          level1,
          level2,
          level3,
          totalReferralCommissions,
          availableBalance: profile?.available_balance
        });

        setEarnings({
          referralCommissions: {
            level1: level1,
            level2: level2,
            level3: level3,
            total: totalReferralCommissions
          },
          operationEarnings: finalOperationEarnings,
          availableBalance: profile?.available_balance || 0,
          totalEarnings: finalOperationEarnings + totalReferralCommissions,
          dailyEarnings: currentDailyEarnings + planEarnings
        });

      } catch (error) {
        console.error('Erro ao buscar histórico de ganhos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserEarnings();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return <div className="text-muted-foreground">Erro ao carregar dados de ganhos</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Saldo Disponível</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(earnings.availableBalance)}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total de Ganhos</div>
              <div className="text-lg font-bold">{formatCurrency(earnings.totalEarnings)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Comissões de Rede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Nível 1 (10%)</span>
              <span className="font-medium">{formatCurrency(earnings.referralCommissions.level1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Nível 2 (3%)</span>
              <span className="font-medium">{formatCurrency(earnings.referralCommissions.level2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Nível 3 (2%)</span>
              <span className="font-medium">{formatCurrency(earnings.referralCommissions.level3)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center font-bold">
              <span>Total Comissões</span>
              <span className="text-blue-600">{formatCurrency(earnings.referralCommissions.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Ganhos de Operações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Ganhos Hoje</span>
              <span className="font-medium">{formatCurrency(earnings.dailyEarnings)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Histórico</span>
              <span className="font-medium">{formatCurrency(earnings.operationEarnings)}</span>
            </div>
            <hr />
            <div className="flex justify-between items-center font-bold">
              <span>Total Operações</span>
              <span className="text-green-600">{formatCurrency(earnings.operationEarnings)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-4">
          <div className="text-sm text-orange-700">
            <strong>Verificação de Saldo:</strong> O saldo disponível deve ser a soma das comissões de rede 
            ({formatCurrency(earnings.referralCommissions.total)}) + ganhos das operações 
            ({formatCurrency(earnings.operationEarnings)}) = {formatCurrency(earnings.totalEarnings)}
            {Math.abs(earnings.availableBalance - earnings.totalEarnings) > 0.01 && (
              <span className="text-red-600 block mt-1">
                ⚠️ Divergência encontrada! Saldo atual: {formatCurrency(earnings.availableBalance)}
                <br />
                Diferença: {formatCurrency(earnings.availableBalance - earnings.totalEarnings)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq('status', filterStatus);
      }

      // Filtrar por data se uma data específica foi selecionada
      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data: withdrawalData, error } = await query;
      if (error) throw error;

      // Buscar dados do perfil e email dos usuários
      if (withdrawalData && withdrawalData.length > 0) {
        const userIds = withdrawalData.map(w => w.user_id);
        
        // Buscar perfis
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, plan, username')
          .in('id', userIds);

        if (profilesError) console.error('Erro ao buscar perfis:', profilesError);

        // Combinar dados
        const withdrawalsWithProfiles = withdrawalData.map(withdrawal => ({
          ...withdrawal,
          profile: profilesData?.find(p => p.id === withdrawal.user_id) || null
        }));

        setWithdrawals(withdrawalsWithProfiles);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de saque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus, selectedDate]);

  const updateWithdrawalStatus = async (id: string, status: string, notes?: string, rejection?: string) => {
    try {
      console.log('Atualizando status do saque:', { id, status, notes, rejection });

      // Se for rejeição, precisamos devolver o valor ao saldo do usuário
      if (status === 'rejected') {
        console.log('Saque sendo rejeitado, devolvendo saldo...');
        
        // Buscar o saque para obter o valor e user_id
        const { data: withdrawal, error: withdrawalError } = await supabase
          .from('withdrawal_requests')
          .select('amount, user_id')
          .eq('id', id)
          .single();

        if (withdrawalError) {
          console.error('Erro ao buscar dados do saque:', withdrawalError);
          throw withdrawalError;
        }

        console.log('Dados do saque encontrados:', withdrawal);

        // Buscar o saldo atual do usuário
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('available_balance')
          .eq('id', withdrawal.user_id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil do usuário:', profileError);
          throw profileError;
        }

        console.log('Saldo atual do usuário:', userProfile.available_balance);
        const newBalance = (userProfile.available_balance || 0) + withdrawal.amount;
        console.log('Novo saldo calculado:', newBalance);

        // Devolver o valor ao saldo disponível do usuário
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({
            available_balance: newBalance
          })
          .eq('id', withdrawal.user_id);

        if (balanceError) {
          console.error('Erro ao atualizar saldo:', balanceError);
          throw balanceError;
        }

        console.log('Saldo atualizado com sucesso');
      }

      const updateData: any = {
        status,
        processed_at: new Date().toISOString(),
      };

      if (notes) updateData.admin_notes = notes;
      if (rejection) updateData.rejection_reason = rejection;

      console.log('Atualizando withdrawal_requests com:', updateData);

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar withdrawal_requests:', error);
        throw error;
      }

      console.log('Status do saque atualizado com sucesso');

      toast({
        title: "Sucesso",
        description: `Saque ${status === 'completed' ? 'aprovado' : 'rejeitado'} com sucesso${status === 'rejected' ? '. Valor devolvido ao saldo do usuário.' : ''}`,
      });

      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setAdminNotes("");
      setRejectionReason("");
    } catch (error) {
      console.error('Erro ao atualizar saque:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do saque",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    // Filtrar dados para exportação baseado na data selecionada
    let dataToExport = withdrawals;
    
    if (selectedDate) {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      dataToExport = withdrawals.filter(withdrawal => {
        const withdrawalDate = format(new Date(withdrawal.created_at), 'yyyy-MM-dd');
        return withdrawalDate === selectedDateStr;
      });
    }

    const exportData = dataToExport.map(withdrawal => ({
      'ID Saque': withdrawal.id,
      'ID do Usuário': withdrawal.user_id,
      'Nome Completo': withdrawal.full_name || withdrawal.profile?.full_name || 'N/A',
      'Telefone': withdrawal.profile?.phone || 'N/A',
      'Plano': withdrawal.profile?.plan || 'N/A',
      'Valor (R$)': withdrawal.amount.toFixed(2),
      'Tipo Pagamento': withdrawal.withdrawal_type === 'usdt' ? 'USDT (TRC20)' : 'PIX',
      'Chave PIX': withdrawal.withdrawal_type === 'pix' ? withdrawal.pix_key : 'N/A',
      'Tipo PIX': withdrawal.withdrawal_type === 'pix' ? withdrawal.pix_key_type : 'N/A',
      'Carteira USDT': withdrawal.withdrawal_type === 'usdt' ? withdrawal.usdt_wallet || 'N/A' : 'N/A',
      'Status': withdrawal.status,
      'Data Solicitação': new Date(withdrawal.created_at).toLocaleString('pt-BR'),
      'Data Processamento': withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleString('pt-BR') : 'N/A',
      'Observações Admin': withdrawal.admin_notes || 'N/A',
      'Motivo Rejeição': withdrawal.rejection_reason || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Saques");
    
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
    const fileName = `saques_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerenciamento de Saques</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Filtrar por data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
                <div className="p-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    Limpar filtro
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel {selectedDate && `(${format(selectedDate, "dd/MM/yyyy")})`}
            </Button>

            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{withdrawals.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {withdrawals.filter(w => w.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {withdrawals.filter(w => w.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(withdrawals.reduce((acc, w) => acc + w.amount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de Saque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID do Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        {formatDate(withdrawal.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {withdrawal.full_name || withdrawal.profile?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {withdrawal.profile?.phone || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono bg-muted p-1 rounded">
                          {withdrawal.user_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {withdrawal.profile?.plan?.toUpperCase() || 'FREE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           {withdrawal.withdrawal_type === 'usdt' ? (
                             <>
                               <div className="font-medium text-blue-600">USDT (TRC20)</div>
                               <div className="text-muted-foreground font-mono text-xs">
                                 {withdrawal.usdt_wallet ? 
                                   `${withdrawal.usdt_wallet.slice(0, 8)}...${withdrawal.usdt_wallet.slice(-8)}` : 
                                   'N/A'
                                 }
                               </div>
                             </>
                           ) : (
                             <>
                               <div className="font-medium text-green-600">PIX</div>
                               <div className="text-muted-foreground">{withdrawal.pix_key}</div>
                               <div className="text-xs text-muted-foreground">{withdrawal.pix_key_type}</div>
                             </>
                           )}
                         </div>
                       </TableCell>
                      <TableCell>
                        {getStatusBadge(withdrawal.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setAdminNotes(withdrawal.admin_notes || "");
                                setRejectionReason(withdrawal.rejection_reason || "");
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Gerenciar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Gerenciar Saque{selectedWithdrawal ? ` - ${selectedWithdrawal.full_name || selectedWithdrawal.profile?.full_name || 'N/A'}` : ''}</DialogTitle>
                            </DialogHeader>
                            
                            {selectedWithdrawal && (
                              <Tabs defaultValue="withdrawal" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="withdrawal">Dados do Saque</TabsTrigger>
                                  <TabsTrigger value="earnings">Histórico de Ganhos</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="withdrawal" className="space-y-4">
                                  {/* Withdrawal Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <Label>Nome Completo</Label>
                                       <div className="text-sm p-2 bg-muted rounded">
                                         {selectedWithdrawal.full_name || selectedWithdrawal.profile?.full_name || 'N/A'}
                                       </div>
                                     </div>
                                     <div>
                                       <Label>Telefone</Label>
                                       <div className="text-sm p-2 bg-muted rounded">
                                         {selectedWithdrawal.profile?.phone || 'N/A'}
                                       </div>
                                     </div>
                                     <div>
                                       <Label>Username</Label>
                                       <div className="text-sm p-2 bg-muted rounded font-medium">
                                         @{selectedWithdrawal.profile?.username || 'N/A'}
                                       </div>
                                     </div>
                                   <div>
                                     <Label>Valor</Label>
                                     <div className="text-sm p-2 bg-muted rounded font-medium">
                                       {formatCurrency(selectedWithdrawal.amount)}
                                     </div>
                                   </div>
                                   <div>
                                     <Label>Status Atual</Label>
                                     <div className="text-sm p-2 bg-muted rounded">
                                       {getStatusBadge(selectedWithdrawal.status)}
                                     </div>
                                   </div>
                                    <div>
                                      <Label>Tipo de Pagamento</Label>
                                      <div className="text-sm p-2 bg-muted rounded">
                                        {selectedWithdrawal.withdrawal_type === 'usdt' ? 'USDT (TRC20)' : 'PIX'}
                                      </div>
                                    </div>
                                    {selectedWithdrawal.withdrawal_type === 'usdt' ? (
                                      <div>
                                        <Label>Carteira USDT</Label>
                                        <div className="text-sm p-2 bg-muted rounded font-mono">
                                          {selectedWithdrawal.usdt_wallet || 'N/A'}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div>
                                          <Label>Chave PIX</Label>
                                          <div className="text-sm p-2 bg-muted rounded">
                                            {selectedWithdrawal.pix_key}
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Tipo PIX</Label>
                                          <div className="text-sm p-2 bg-muted rounded">
                                            {selectedWithdrawal.pix_key_type}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                 </div>

                                 {/* Admin Notes */}
                                 <div>
                                   <Label htmlFor="admin-notes">Observações Administrativas</Label>
                                   <Textarea
                                     id="admin-notes"
                                     value={adminNotes}
                                     onChange={(e) => setAdminNotes(e.target.value)}
                                     placeholder="Adicione observações sobre este saque..."
                                     rows={3}
                                   />
                                 </div>

                                 {/* Rejection Reason */}
                                 <div>
                                   <Label htmlFor="rejection-reason">Motivo da Rejeição (opcional)</Label>
                                   <Textarea
                                     id="rejection-reason"
                                     value={rejectionReason}
                                     onChange={(e) => setRejectionReason(e.target.value)}
                                     placeholder="Motivo caso o saque seja rejeitado..."
                                     rows={2}
                                   />
                                 </div>

                                 {/* Action Buttons */}
                                 {selectedWithdrawal.status === 'pending' && (
                                   <div className="flex gap-2 pt-4">
                                     <Button
                                       onClick={() => updateWithdrawalStatus(
                                         selectedWithdrawal.id, 
                                         'completed', 
                                         adminNotes
                                       )}
                                       className="flex-1 bg-green-600 hover:bg-green-700"
                                     >
                                       <CheckCircle className="w-4 h-4 mr-1" />
                                       Aprovar Saque
                                     </Button>
                                     <Button
                                       onClick={() => updateWithdrawalStatus(
                                         selectedWithdrawal.id, 
                                         'rejected', 
                                         adminNotes, 
                                         rejectionReason
                                       )}
                                       variant="destructive"
                                       className="flex-1"
                                     >
                                       <XCircle className="w-4 h-4 mr-1" />
                                       Rejeitar Saque
                                     </Button>
                                   </div>
                                 )}

                                 {selectedWithdrawal.status !== 'pending' && (
                                   <div className="flex gap-2 pt-4">
                                     <Button
                                       onClick={() => updateWithdrawalStatus(
                                         selectedWithdrawal.id, 
                                         selectedWithdrawal.status, 
                                         adminNotes
                                       )}
                                       className="flex-1"
                                     >
                                       Atualizar Observações
                                     </Button>
                                   </div>
                                 )}
                                </TabsContent>
                                
                                <TabsContent value="earnings" className="space-y-4">
                                  <UserEarningsView userId={selectedWithdrawal.user_id} />
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {withdrawals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido de saque encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}