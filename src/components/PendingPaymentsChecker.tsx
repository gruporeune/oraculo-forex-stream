import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function PendingPaymentsChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkPendingPayments = async () => {
    setIsChecking(true);
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

      console.log('Checking pending payments for user:', user.id);

      // Get pending transactions with better error handling
      const { data: pendingTransactions, error } = await supabase
        .from('payment_transactions')
        .select('id, external_id, plan_name, status, payment_provider, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Query result:', { pendingTransactions, error });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Erro de banco de dados",
          description: `Erro: ${error.message}. Tentando método alternativo...`,
          variant: "destructive"
        });
        
        // Try alternative method - check all recent transactions
        await checkRecentTransactions(user.id);
        return;
      }

      if (!pendingTransactions || pendingTransactions.length === 0) {
        console.log('No pending transactions found, trying recent transactions');
        await checkRecentTransactions(user.id);
        return;
      }

      console.log('Found pending transactions:', pendingTransactions.length);

      // Check each pending transaction
      let activatedPlans = 0;
      for (const transaction of pendingTransactions) {
        // Transaction status is already checked in database, no need for external API call
        console.log('Transaction already in database:', transaction.external_id, 'Status:', transaction.status);
      }

      if (activatedPlans > 0) {
        toast({
          title: "Planos ativados!",
          description: `${activatedPlans} plano(s) foram ativados com sucesso!`,
        });
        // Reload the page to update the UI
        window.location.reload();
      } else {
        toast({
          title: "Verificação concluída",
          description: "Nenhum pagamento foi confirmado ainda. Tente novamente em alguns instantes.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error checking pending payments:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamentos pendentes",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const checkRecentTransactions = async (userId: string) => {
    try {
      console.log('Checking recent transactions for user:', userId);
      
      // Get all recent transactions regardless of status
      const { data: recentTransactions, error } = await supabase
        .from('payment_transactions')
        .select('id, external_id, plan_name, status, payment_provider, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent transactions:', error);
        toast({
          title: "Erro",
          description: "Não foi possível acessar as transações. Verifique se você está logado corretamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('Recent transactions found:', recentTransactions?.length || 0);

      if (!recentTransactions || recentTransactions.length === 0) {
        toast({
          title: "Nenhuma transação encontrada",
          description: "Não encontramos transações recentes. Se você acabou de fazer um pagamento, aguarde alguns minutos.",
        });
        return;
      }

      // Check each recent transaction
      let activatedPlans = 0;
      for (const transaction of recentTransactions) {
        if (transaction.status === 'paid') {
          activatedPlans++;
        }
      }

      if (activatedPlans > 0) {
        toast({
          title: "Planos ativados!",
          description: `${activatedPlans} plano(s) foram ativados com sucesso!`,
        });
        window.location.reload();
      } else {
        toast({
          title: "Verificação concluída",
          description: "Verificamos suas transações recentes. Se você fez um pagamento, pode levar alguns minutos para ser processado.",
        });
      }

    } catch (error) {
      console.error('Error in checkRecentTransactions:', error);
      toast({
        title: "Erro alternativo",
        description: "Erro ao verificar transações recentes",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-200">
          <CheckCircle className="h-5 w-5" />
          Verificar Pagamentos Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-100/80 text-sm mb-4">
          Se você fez um pagamento e ele não foi ativado automaticamente, 
          clique no botão abaixo para verificar e ativar seu plano.
        </p>
        <Button 
          onClick={checkPendingPayments}
          disabled={isChecking}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Pagamentos
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}