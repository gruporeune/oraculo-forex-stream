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
      if (!user) return;

      // Get pending SuitPay transactions
      const { data: pendingTransactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_provider', 'suitpay')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending transactions:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar transações pendentes",
          variant: "destructive"
        });
        return;
      }

      if (!pendingTransactions || pendingTransactions.length === 0) {
        toast({
          title: "Nenhum pagamento pendente",
          description: "Não há pagamentos pendentes para verificar",
        });
        return;
      }

      // Check each pending transaction
      let activatedPlans = 0;
      for (const transaction of pendingTransactions) {
        try {
          const { data, error } = await supabase.functions.invoke('check-suitpay-payment', {
            body: {
              payment_id: transaction.external_id,
              user_id: user.id
            }
          });

          if (!error && data?.status === 'paid') {
            activatedPlans++;
          }
        } catch (error) {
          console.error('Error checking transaction:', transaction.external_id, error);
        }
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