import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Wallet, Package } from 'lucide-react';

interface DashboardCardsProps {
  profile: any;
  onWithdraw: () => void;
}

export function DashboardCards({ profile, onWithdraw }: DashboardCardsProps) {
  const planLimits = {
    free: { signals: 5, dailyEarnings: 0 },
    partner: { signals: 20, dailyEarnings: 0.10 },
    master: { signals: 100, dailyEarnings: 1.00 },
    premium: { signals: 500, dailyEarnings: 7.50 },
    platinum: { signals: 1000, dailyEarnings: 20.00 }
  };

  const currentPlan = profile?.plan || 'free';
  const limits = planLimits[currentPlan as keyof typeof planLimits];
  const usedSignals = profile?.daily_signals_used || 0;
  const remainingSignals = limits.signals - usedSignals;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'from-gray-600/20 to-gray-400/20 border-gray-500/50',
      partner: 'from-blue-600/20 to-blue-400/20 border-blue-500/50',
      master: 'from-purple-600/20 to-purple-400/20 border-purple-500/50',
      premium: 'from-yellow-600/20 to-yellow-400/20 border-yellow-500/50',
      platinum: 'from-orange-600/20 to-orange-400/20 border-orange-500/50'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {/* SEU PLANO */}
      <Card className={`bg-gradient-to-br ${getPlanColor(currentPlan)}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Package className="w-4 h-4" />
            SEU PLANO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white uppercase">{currentPlan}</div>
          <p className="text-xs text-white/70">{limits.signals} sinais/dia</p>
        </CardContent>
      </Card>

      {/* SEUS SINAIS */}
      <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border-blue-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            SEUS SINAIS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{remainingSignals}/{limits.signals}</div>
          <p className="text-xs text-white/70">Disponíveis hoje</p>
        </CardContent>
      </Card>

      {/* GANHO DO DIA */}
      <Card className="bg-gradient-to-br from-green-600/20 to-green-400/20 border-green-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            GANHO DO DIA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(profile?.daily_earnings || 0)}
          </div>
          <p className="text-xs text-white/70">Rentabilidade diária</p>
        </CardContent>
      </Card>

      {/* COMISSÕES TOTAIS */}
      <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/20 border-purple-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Users className="w-4 h-4" />
            COMISSÕES TOTAIS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(profile?.total_referral_commissions || 0)}
          </div>
          <p className="text-xs text-white/70">Indicações do dia</p>
        </CardContent>
      </Card>

      {/* SALDO DISPONÍVEL */}
      <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/20 border-yellow-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            SALDO DISPONÍVEL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(profile?.available_balance || 0)}
          </div>
          <Button 
            size="sm" 
            onClick={onWithdraw}
            className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            Sacar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}