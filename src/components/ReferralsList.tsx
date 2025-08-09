import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, UserPlus } from 'lucide-react';

interface ReferralUser {
  id: string;
  username: string;
  full_name: string;
  plan: string;
  commission_earned: number;
  user_plans: Array<{
    plan_name: string;
    is_active: boolean;
  }>;
}

interface ReferralsListProps {
  userId: string;
  title: string;
  level: 1 | 2 | 3;
}

export default function ReferralsList({ userId, title, level }: ReferralsListProps) {
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    loadReferrals();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`referrals-${level}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_referrals'
      }, () => {
        loadReferrals();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        loadReferrals();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_plans'
      }, () => {
        loadReferrals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, level]);

  const loadReferrals = async () => {
    try {
      if (level === 1) {
        // Direct referrals
        const { data: directReferrals } = await supabase
          .from('profiles')
          .select('id, username, full_name, plan')
          .eq('referred_by', userId);

        if (directReferrals) {
          const referralsWithCommissions = await Promise.all(
            directReferrals.map(async (referral) => {
              // Get total commission for this referral
              const { data: commissionData } = await supabase
                .from('user_referrals')
                .select('commission_earned')
                .eq('referrer_id', userId)
                .eq('referred_id', referral.id);

              const totalCommission = commissionData?.reduce((sum, item) => sum + (item.commission_earned || 0), 0) || 0;

              // Get highest plan from user_plans
              const { data: userPlans } = await supabase
                .from('user_plans')
                .select('plan_name, is_active')
                .eq('user_id', referral.id)
                .eq('is_active', true);

              let highestPlan = referral.plan || 'free';
              if (userPlans && userPlans.length > 0) {
                const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
                const highest = userPlans.reduce((highest, current) => {
                  const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
                  const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
                  return currentPriority > highestPriority ? current : highest;
                });
                highestPlan = highest.plan_name;
              }

              return {
                ...referral,
                plan: highestPlan,
                commission_earned: totalCommission,
                user_plans: userPlans || []
              };
            })
          );

          setReferrals(referralsWithCommissions);
          setTotalCommission(referralsWithCommissions.reduce((sum, r) => sum + r.commission_earned, 0));
        }
      } else if (level === 2) {
        // Level 2: referrals of direct referrals
        const { data: directReferrals } = await supabase
          .from('profiles')
          .select('id')
          .eq('referred_by', userId);

        if (directReferrals && directReferrals.length > 0) {
          const level2Referrals: ReferralUser[] = [];
          let totalLevel2Commission = 0;

          for (const directRef of directReferrals) {
            const { data: level2Data } = await supabase
              .from('profiles')
              .select('id, username, full_name, plan')
              .eq('referred_by', directRef.id);

            if (level2Data) {
              for (const l2User of level2Data) {
                // Get user plans
                const { data: userPlans } = await supabase
                  .from('user_plans')
                  .select('plan_name, is_active')
                  .eq('user_id', l2User.id)
                  .eq('is_active', true);

                let l2Commission = 0;
                if (userPlans) {
                  // Calculate level 2 commission based on plan values
                  l2Commission = userPlans.reduce((sum, plan) => {
                    const commissionValues = {
                      partner: 6.0,
                      master: 18.0,
                      premium: 82.5,
                      platinum: 150.0
                    };
                    return sum + (commissionValues[plan.plan_name as keyof typeof commissionValues] || 0);
                  }, 0);
                }

                // Get highest plan
                let highestPlan = l2User.plan || 'free';
                if (userPlans && userPlans.length > 0) {
                  const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
                  const highest = userPlans.reduce((highest, current) => {
                    const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
                    const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
                    return currentPriority > highestPriority ? current : highest;
                  });
                  highestPlan = highest.plan_name;
                }

                level2Referrals.push({
                  ...l2User,
                  plan: highestPlan,
                  commission_earned: l2Commission,
                  user_plans: userPlans || []
                });
                totalLevel2Commission += l2Commission;
              }
            }
          }

          setReferrals(level2Referrals);
          setTotalCommission(totalLevel2Commission);
        }
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      partner: 'bg-blue-100 text-blue-800',
      master: 'bg-purple-100 text-purple-800',
      premium: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-orange-100 text-orange-800'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  const getCommissionPercentage = () => {
    switch (level) {
      case 1: return '10%';
      case 2: return '3%';
      case 3: return '2%';
      default: return '0%';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600/20 text-green-400">
              {getCommissionPercentage()} comissão
            </Badge>
            {totalCommission > 0 && (
              <Badge className="bg-blue-600/20 text-blue-400">
                R$ {totalCommission.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-white/70 text-sm">
          Total de {referrals.length} usuário{referrals.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Nenhum indicado ainda</p>
            <p className="text-white/50 text-sm">
              Compartilhe seu link de indicação para começar a ganhar comissões
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div 
                key={referral.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                      {referral.full_name?.charAt(0) || referral.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {referral.username || referral.full_name || 'Usuário'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPlanColor(referral.plan)}>
                          {referral.plan.toUpperCase()}
                        </Badge>
                        {referral.user_plans && referral.user_plans.length > 1 && (
                          <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                            +{referral.user_plans.length - 1} planos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {referral.commission_earned > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold">
                          +R$ {referral.commission_earned.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">comissão total</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}