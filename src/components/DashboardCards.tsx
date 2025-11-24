import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Wallet, Package } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface DashboardCardsProps {
  profile: any;
  userPlans: any[];
  onWithdraw: () => void;
}

export function DashboardCards({ profile, userPlans, onWithdraw }: DashboardCardsProps) {
  const { t } = useI18n();
  const planLimits = {
    free: { signals: 5, dailyEarnings: 0 },
    partner: { signals: 20, dailyEarnings: 2.00 },
    master: { signals: 100, dailyEarnings: 6.00 },
    pro: { signals: 200, dailyEarnings: 10.00 },
    premium: { signals: 500, dailyEarnings: 41.25 },
    platinum: { signals: 1000, dailyEarnings: 100.00 }
  };

  // Calculate total signals from all active plans
  const totalSignals = userPlans?.reduce((total, plan) => {
    const planSignals = planLimits[plan.plan_name as keyof typeof planLimits]?.signals || 0;
    return total + planSignals;
  }, 0) || 5; // Default to 5 for free plan

  const totalUsedSignals = userPlans?.reduce((total, plan) => total + (plan.daily_signals_used || 0), 0) || 0;
  const remainingSignals = totalSignals - totalUsedSignals;

  // Get plan counts for display
  const getPlanCounts = () => {
    if (!userPlans || userPlans.length === 0) return 'FREE';
    
    const planCounts: { [key: string]: number } = {};
    userPlans.forEach(plan => {
      const planName = plan.plan_name;
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    
    return Object.entries(planCounts)
      .map(([plan, count]) => `${count} ${plan}`)
      .join(', ');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Estilo base para cards - COR AZUL
  const cardBaseClass = "relative overflow-hidden border shadow-sm rounded-lg transition-all duration-300 group";
  const cardBlueStyle = {
    background: 'linear-gradient(to bottom right, rgba(37, 99, 235, 0.2), rgba(59, 130, 246, 0.2))',
    borderColor: 'rgba(59, 130, 246, 0.5)'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
      {/* SEUS PLANOS */}
      <Card className={cardBaseClass} style={cardBlueStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <CardHeader className="pb-2 relative z-10 p-3 md:p-4 lg:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-white/70 flex items-center gap-2">
            <Package className="w-3 h-3 md:w-4 md:h-4" />
            {t('dashboard.your.plans')}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-3 md:p-4 lg:p-6 pt-0">
          <div className="text-base md:text-lg font-bold text-white">{getPlanCounts()}</div>
          <p className="text-xs text-white/70">{totalSignals} {t('dashboard.signals.per.day')}</p>
        </CardContent>
      </Card>

      {/* SEUS SINAIS */}
      <Card className={cardBaseClass} style={cardBlueStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <CardHeader className="pb-2 relative z-10 p-3 md:p-4 lg:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-white/70 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            {t('dashboard.your.signals')}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-3 md:p-4 lg:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-white">{remainingSignals}/{totalSignals}</div>
          <p className="text-xs text-white/70">{t('dashboard.available.today')}</p>
        </CardContent>
      </Card>

      {/* GANHO DO DIA */}
      <Card className={cardBaseClass} style={cardBlueStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <CardHeader className="pb-2 relative z-10 p-3 md:p-4 lg:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-white/70 flex items-center gap-2">
            <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
            {t('dashboard.daily.earnings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-3 md:p-4 lg:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-white">
            {formatCurrency(profile?.daily_earnings || 0)}
          </div>
          <p className="text-xs text-white/70">{t('dashboard.daily.profitability')}</p>
        </CardContent>
      </Card>

      {/* COMISSÕES DO DIA */}
      <Card className={cardBaseClass} style={cardBlueStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <CardHeader className="pb-2 relative z-10 p-3 md:p-4 lg:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-white/70 flex items-center gap-2">
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            {t('dashboard.today.commissions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-3 md:p-4 lg:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-white">
            {formatCurrency(profile?.daily_referral_commissions || 0)}
          </div>
          <p className="text-xs text-white/70">{t('dashboard.today.referrals')}</p>
        </CardContent>
      </Card>

      {/* SALDO DISPONÍVEL */}
      <Card className={cardBaseClass} style={cardBlueStyle}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <CardHeader className="pb-2 relative z-10 p-3 md:p-4 lg:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-white/70 flex items-center gap-2">
            <Wallet className="w-3 h-3 md:w-4 md:h-4" />
            {t('dashboard.available.balance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-3 md:p-4 lg:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-white">
            {formatCurrency(profile?.available_balance || 0)}
          </div>
          <Button 
            size="sm" 
            onClick={onWithdraw}
            className="mt-2 w-full text-white text-xs md:text-sm"
            style={{ backgroundColor: 'rgb(37, 99, 235)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(29, 78, 216)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)'}
          >
            {t('dashboard.withdraw')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
