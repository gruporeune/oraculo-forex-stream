import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Link, Copy, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NetworkGraph from '@/components/NetworkGraph';
import ReferralsList from '@/components/ReferralsList';
import { useLanguage } from '@/contexts/LanguageContext';

interface NetworkPageProps {
  user: any;
  profile: any;
}

interface CommissionByPlan {
  plan_name: string;
  commission_amount: number;
  created_at: string;
  commission_level: number;
}

interface Referral {
  id: string;
  full_name: string;
  plan: string;
  created_at: string;
  commission_earned: number;
  username?: string;
  level?: number;
  referrer_name?: string;
  commissions_by_plan?: CommissionByPlan[];
}

export default function NetworkPage({ user, profile }: NetworkPageProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [indirectReferrals, setIndirectReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadReferrals();
      await loadIndirectReferrals();
      setIsLoading(false);
    };
    
    loadData();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('network-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_referrals'
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'referral_commissions'
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_plans'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadReferrals = async () => {
    try {
      // Get direct referrals using referred_by column
      const { data: directReferralsData, error: referralError } = await supabase
        .from('profiles')
        .select('id, full_name, plan, updated_at, username')
        .eq('referred_by', user.id)
        .order('updated_at', { ascending: false });

      if (referralError) {
        console.error('Error loading referrals:', referralError);
        return;
      }

      if (!directReferralsData || directReferralsData.length === 0) {
        setReferrals([]);
        return;
      }

      // Get detailed commission data for each referral
      const formattedReferrals = [];
      for (const profile of directReferralsData) {
        // Get detailed commission history by plan (ordered by date desc to show latest first)
        const { data: detailedCommissions } = await supabase
          .from('referral_commissions')
          .select('plan_name, commission_amount, created_at, commission_level')
          .eq('referrer_id', user.id)
          .eq('referred_id', profile.id)
          .eq('commission_level', 1) // Level 1 for direct referrals
          .order('created_at', { ascending: false });

        const totalCommission = detailedCommissions?.reduce((sum, comm) => sum + comm.commission_amount, 0) || 0;
        const latestCommissionDate = detailedCommissions?.[0]?.created_at || profile.updated_at;

        // Get the current highest active plan from user_plans table
        const { data: activePlans } = await supabase
          .from('user_plans')
          .select('plan_name')
          .eq('user_id', profile.id)
          .eq('is_active', true);

        let currentPlan = profile.plan || 'free';
        if (activePlans && activePlans.length > 0) {
          const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
          const highestPlan = activePlans.reduce((highest, current) => {
            const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
            const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
            return currentPriority > highestPriority ? current : highest;
          });
          currentPlan = highestPlan.plan_name;
        }

        formattedReferrals.push({
          id: profile.id,
          full_name: profile.full_name || 'Usuário',
          plan: currentPlan, // Use the highest active plan
          created_at: latestCommissionDate,
          commission_earned: totalCommission,
          username: profile.username || '',
          commissions_by_plan: detailedCommissions || []
        });
      }

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    }
  };

  const loadIndirectReferrals = async () => {
    try {
      // Get direct referrals first
      const { data: directReferralData } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', user.id);

      const directIds = directReferralData?.map(d => d.id) || [];

      if (directIds.length === 0) {
        setIndirectReferrals([]);
        return;
      }

      // Get level 2 referrals (people referred by my direct referrals)
      const { data: level2Profiles } = await supabase
        .from('profiles')
        .select('id, full_name, plan, username, referred_by, updated_at')
        .in('referred_by', directIds);

      const formattedIndirectReferrals = [];
      
      if (level2Profiles) {
        for (const profile of level2Profiles) {
          // Get referrer name
          const { data: referrerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', profile.referred_by)
            .maybeSingle();

          // Get commission data if it exists (ordered by date desc)
          const { data: commissionData } = await supabase
            .from('referral_commissions')
            .select('plan_name, commission_amount, created_at, commission_level')
            .eq('referrer_id', user.id)
            .eq('referred_id', profile.id)
            .eq('commission_level', 2)
            .order('created_at', { ascending: false });

          const totalCommission = commissionData?.reduce((sum, comm) => sum + comm.commission_amount, 0) || 0;

          // Get the current highest active plan from user_plans table
          const { data: activePlans } = await supabase
            .from('user_plans')
            .select('plan_name')
            .eq('user_id', profile.id)
            .eq('is_active', true);

          let currentPlan = profile.plan || 'free';
          if (activePlans && activePlans.length > 0) {
            const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
            const highestPlan = activePlans.reduce((highest, current) => {
              const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
              const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
              return currentPriority > highestPriority ? current : highest;
            });
            currentPlan = highestPlan.plan_name;
          }

          formattedIndirectReferrals.push({
            id: profile.id,
            full_name: profile.full_name || 'Usuário',
            plan: currentPlan, // Use the highest active plan
            created_at: commissionData?.[0]?.created_at || profile.updated_at,
            commission_earned: totalCommission,
            username: profile.username || '',
            level: 2,
            referrer_name: referrerData?.full_name || 'Indicador',
            commissions_by_plan: commissionData || []
          });
        }
      }

      // Get level 3 referrals (people referred by level 2 referrals)
      const level2Ids = level2Profiles?.map(p => p.id) || [];
      if (level2Ids.length > 0) {
        const { data: level3Profiles } = await supabase
          .from('profiles')
          .select('id, full_name, plan, username, referred_by, updated_at')
          .in('referred_by', level2Ids);

        if (level3Profiles) {
          for (const profile of level3Profiles) {
            // Get referrer name
            const { data: referrerData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', profile.referred_by)
              .maybeSingle();

            // Get commission data if it exists (ordered by date desc)
            const { data: commissionData } = await supabase
              .from('referral_commissions')
              .select('plan_name, commission_amount, created_at, commission_level')
              .eq('referrer_id', user.id)
              .eq('referred_id', profile.id)
              .eq('commission_level', 3)
              .order('created_at', { ascending: false });

            const totalCommission = commissionData?.reduce((sum, comm) => sum + comm.commission_amount, 0) || 0;

            // Get the current highest active plan from user_plans table
            const { data: activePlans } = await supabase
              .from('user_plans')
              .select('plan_name')
              .eq('user_id', profile.id)
              .eq('is_active', true);

            let currentPlan = profile.plan || 'free';
            if (activePlans && activePlans.length > 0) {
              const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
              const highestPlan = activePlans.reduce((highest, current) => {
                const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
                const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
                return currentPriority > highestPriority ? current : highest;
              });
              currentPlan = highestPlan.plan_name;
            }

            formattedIndirectReferrals.push({
              id: profile.id,
              full_name: profile.full_name || 'Usuário',
              plan: currentPlan, // Use the highest active plan
              created_at: commissionData?.[0]?.created_at || profile.updated_at,
              commission_earned: totalCommission,
              username: profile.username || '',
              level: 3,
              referrer_name: referrerData?.full_name || 'Indicador',
              commissions_by_plan: commissionData || []
            });
          }
        }
      }

      setIndirectReferrals(formattedIndirectReferrals);
    } catch (error) {
      console.error('Error loading indirect referrals:', error);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: t('network.linkCopied'),
      description: t('network.linkCopiedDescription')
    });
  };

  const totalCommissions = profile?.total_referral_commissions || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-600',
      partner: 'bg-blue-600',
      master: 'bg-purple-600',
      premium: 'bg-yellow-600',
      platinum: 'bg-orange-600'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{t('network.title')}</h2>
        <p className="text-white/70">{t('network.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('network.totalReferrals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{referrals.length}</div>
            <p className="text-xs text-white/70">{t('network.directReferrals')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/20 border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('network.totalCommissions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-white/70">{t('network.accumulatedEarnings')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/20 border-purple-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('network.dailyCommissions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(profile?.daily_referral_commissions || 0)}
            </div>
            <p className="text-xs text-white/70">{t('network.dailyEarnings')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Graph */}
      <NetworkGraph userId={user.id} userProfile={profile} />

      {/* Referral Link */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Link className="w-5 h-5" />
            {t('network.referralLink')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-white/5 border-white/10 text-white flex-1"
            />
            <Button onClick={copyReferralLink} className="bg-purple-600 hover:bg-purple-700">
              <Copy className="w-4 h-4 mr-2" />
              {t('common.copy')}
            </Button>
          </div>
          <p className="text-white/70 text-sm mt-2">
            {t('network.commissionLevels')}
          </p>
        </CardContent>
      </Card>

      {/* Direct Referrals List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('network.directReferralsList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">{t('network.loadingReferrals')}</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">{t('network.noDirectReferrals')}</p>
              <p className="text-white/50 text-sm">{t('network.shareLink')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {referral.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{referral.full_name}</p>
                        {referral.username && (
                          <p className="text-white/50 text-xs">@{referral.username}</p>
                        )}
                       <p className="text-white/60 text-sm">
                         {referral.commissions_by_plan && referral.commissions_by_plan.length > 0 ? 
                           `Primeira comissão: ${new Date(referral.commissions_by_plan[referral.commissions_by_plan.length - 1].created_at).toLocaleDateString('pt-BR')}` :
                           `Indicado em ${new Date(referral.created_at).toLocaleDateString('pt-BR')}`
                         }
                       </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">
                        Nível 1 - 10%
                      </Badge>
                      <Badge className={`${getPlanColor(referral.plan)} text-white uppercase`}>
                        {referral.plan}
                      </Badge>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">
                          {formatCurrency(referral.commission_earned)}
                        </p>
                        <p className="text-white/60 text-xs">Comissão Total</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Commission History by Plan */}
                  {referral.commissions_by_plan && referral.commissions_by_plan.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/70 text-xs mb-2">Histórico de Comissões por Plano:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {referral.commissions_by_plan.map((commission, index) => (
                           <div key={index} className="bg-white/5 rounded p-2 flex justify-between items-center">
                             <div>
                               <Badge className={`${getPlanColor(commission.plan_name)} text-white uppercase text-xs`}>
                                 {commission.plan_name}
                               </Badge>
                               <p className="text-white/50 text-xs mt-1">
                                 {new Date(commission.created_at).toLocaleDateString('pt-BR')} às{' '}
                                 {new Date(commission.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                               </p>
                             </div>
                             <p className="text-green-400 font-medium text-sm">
                               {formatCurrency(commission.commission_amount)}
                             </p>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indirect Referrals List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seus Indicados Indiretos (Níveis 2 e 3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Carregando indicados indiretos...</p>
            </div>
          ) : indirectReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Nenhum indicado indireto ainda</p>
              <p className="text-white/50 text-sm">Seus indicados diretos ainda não trouxeram novas pessoas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {indirectReferrals.map((referral) => (
                <div key={referral.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        referral.level === 2 ? 'bg-blue-600' : 'bg-purple-600'
                      }`}>
                        <span className="text-white font-medium">
                          {referral.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{referral.full_name}</p>
                        {referral.username && (
                          <p className="text-white/50 text-xs">@{referral.username}</p>
                        )}
                         <p className="text-white/60 text-sm">
                           Indicado por: {referral.referrer_name} {referral.commissions_by_plan && referral.commissions_by_plan.length > 0 ? 
                             `• Primeira comissão: ${new Date(referral.commissions_by_plan[referral.commissions_by_plan.length - 1].created_at).toLocaleDateString('pt-BR')}` :
                             `• Sem comissões ainda`
                           }
                         </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white ${
                        referral.level === 2 ? 'bg-blue-600' : 'bg-purple-600'
                      }`}>
                        Nível {referral.level} - {referral.level === 2 ? '3%' : '2%'}
                      </Badge>
                      <Badge className={`${getPlanColor(referral.plan)} text-white uppercase`}>
                        {referral.plan}
                      </Badge>
                      <div className="text-right">
                         <p className="text-blue-400 font-medium">
                           {formatCurrency(referral.commission_earned)}
                         </p>
                        <p className="text-white/60 text-xs">Comissão Total</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Commission History by Plan */}
                  {referral.commissions_by_plan && referral.commissions_by_plan.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/70 text-xs mb-2">Histórico de Comissões por Plano:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {referral.commissions_by_plan.map((commission, index) => (
                          <div key={index} className="bg-white/5 rounded p-2 flex justify-between items-center">
                            <div>
                              <Badge className={`${getPlanColor(commission.plan_name)} text-white uppercase text-xs`}>
                                {commission.plan_name}
                              </Badge>
                               <p className="text-white/50 text-xs mt-1">
                                 {new Date(commission.created_at).toLocaleDateString('pt-BR')} às{' '}
                                 {new Date(commission.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                               </p>
                             </div>
                             <p className="text-blue-400 font-medium text-sm">
                               {formatCurrency(commission.commission_amount)}
                             </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}