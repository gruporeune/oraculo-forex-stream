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

interface NetworkPageProps {
  user: any;
  profile: any;
}

interface Referral {
  id: string;
  full_name: string;
  plan: string;
  created_at: string;
  commission_earned: number;
  username?: string;
  phone?: string;
  level?: number;
  referrer_name?: string;
}

export default function NetworkPage({ user, profile }: NetworkPageProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [indirectReferrals, setIndirectReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        .select('id, full_name, plan, updated_at, username, phone')
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

      // Get commission data for each referral
      const formattedReferrals = [];
      for (const profile of directReferralsData) {
        const { data: commissionData } = await supabase
          .from('user_referrals')
          .select('commission_earned, created_at')
          .eq('referrer_id', user.id)
          .eq('referred_id', profile.id)
          .maybeSingle();

        formattedReferrals.push({
          id: profile.id,
          full_name: profile.full_name || 'Usuário',
          plan: profile.plan || 'free',
          created_at: commissionData?.created_at || profile.updated_at,
          commission_earned: commissionData?.commission_earned || 0,
          username: profile.username || '',
          phone: profile.phone || ''
        });
      }

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    }
  };

  const loadIndirectReferrals = async () => {
    try {
      // Get direct referrals IDs first using referred_by
      const { data: directReferralData } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', user.id);

      const directIds = directReferralData?.map(d => d.id) || [];

      if (directIds.length === 0) {
        setIndirectReferrals([]);
        return;
      }

      // Buscar indicados de 2º nível (pessoas que foram indicadas pelos meus indicados diretos)
      const { data: level2Profiles } = await supabase
        .from('profiles')
        .select('id, full_name, plan, username, phone, referred_by, updated_at')
        .in('referred_by', directIds);

      // Get commission data for level 2 referrals
      const level2WithCommissions = [];
      if (level2Profiles) {
        for (const profile of level2Profiles) {
          const { data: commissionData } = await supabase
            .from('user_referrals')
            .select('commission_earned, created_at')
            .eq('referrer_id', profile.referred_by)
            .eq('referred_id', profile.id)
            .maybeSingle();

          // Get referrer name
          const { data: referrerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', profile.referred_by)
            .maybeSingle();

          // Calculate level 2 commission for me (current user gets 3% of level 2 referrals)
          const level2Commission = profile.plan !== 'free' ? 
            (profile.plan === 'partner' ? 6.0 :
             profile.plan === 'master' ? 18.0 :
             profile.plan === 'premium' ? 82.5 :
             profile.plan === 'platinum' ? 150.0 : 0) : 0;

          level2WithCommissions.push({
            id: profile.id,
            full_name: profile.full_name || 'Usuário',
            plan: profile.plan || 'free',
            created_at: commissionData?.created_at || profile.updated_at,
            commission_earned: level2Commission,
            username: profile.username || '',
            phone: profile.phone || '',
            level: 2,
            referrer_name: referrerData?.full_name || 'Indicador'
          });
        }
      }

      // Buscar indicados de 3º nível (pessoas indicadas pelos de 2º nível)
      const level2Ids = level2Profiles?.map(p => p.id) || [];
      const { data: level3Profiles } = await supabase
        .from('profiles')
        .select('id, full_name, plan, username, phone, referred_by, updated_at')
        .in('referred_by', level2Ids);

      // Get commission data for level 3 referrals
      const level3WithCommissions = [];
      if (level3Profiles) {
        for (const profile of level3Profiles) {
          const { data: commissionData } = await supabase
            .from('user_referrals')
            .select('commission_earned, created_at')
            .eq('referrer_id', profile.referred_by)
            .eq('referred_id', profile.id)
            .maybeSingle();

          // Get referrer name
          const { data: referrerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', profile.referred_by)
            .maybeSingle();

          // Calculate level 3 commission for me (current user gets 2% of level 3 referrals)
          const level3Commission = profile.plan !== 'free' ? 
            (profile.plan === 'partner' ? 4.0 :
             profile.plan === 'master' ? 12.0 :
             profile.plan === 'premium' ? 55.0 :
             profile.plan === 'platinum' ? 100.0 : 0) : 0;

          level3WithCommissions.push({
            id: profile.id,
            full_name: profile.full_name || 'Usuário',
            plan: profile.plan || 'free',
            created_at: commissionData?.created_at || profile.updated_at,
            commission_earned: level3Commission,
            username: profile.username || '',
            phone: profile.phone || '',
            level: 3,
            referrer_name: referrerData?.full_name || 'Indicador'
          });
        }
      }

      // Combine level 2 and 3 referrals
      const allIndirectReferrals = [...level2WithCommissions, ...level3WithCommissions];
      setIndirectReferrals(allIndirectReferrals);
    } catch (error) {
      console.error('Error loading indirect referrals:', error);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "Seu link de indicação foi copiado para a área de transferência"
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
        <h2 className="text-3xl font-bold text-white mb-2">Rede de Indicações</h2>
        <p className="text-white/70">Gerencie sua rede e acompanhe suas comissões</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Indicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{referrals.length}</div>
            <p className="text-xs text-white/70">Pessoas indicadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-400/20 border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Comissões Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-white/70">Ganhos acumulados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/20 border-purple-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Comissões Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(profile?.daily_referral_commissions || 0)}
            </div>
            <p className="text-xs text-white/70">Ganhos do dia</p>
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
            Seu Link de Indicação
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
              Copiar
            </Button>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Compartilhe este link e ganhe comissões de até 3 níveis: <strong>10%</strong> no 1º nível, <strong>3%</strong> no 2º nível e <strong>2%</strong> no 3º nível.
          </p>
        </CardContent>
      </Card>

      {/* Direct Referrals List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seus Indicados Diretos (Nível 1)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Carregando indicados...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Nenhum indicado direto ainda</p>
              <p className="text-white/50 text-sm">Compartilhe seu link para começar a ganhar comissões</p>
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
                        {referral.phone && (
                          <p className="text-white/50 text-xs">{referral.phone}</p>
                        )}
                        <p className="text-white/60 text-sm">
                          Indicado em {new Date(referral.created_at).toLocaleDateString('pt-BR')} às {new Date(referral.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                        <p className="text-white/60 text-xs">Comissão</p>
                      </div>
                    </div>
                  </div>
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
                        {referral.phone && (
                          <p className="text-white/50 text-xs">{referral.phone}</p>
                        )}
                        <p className="text-white/50 text-xs">
                          Indicado por: {referral.referrer_name}
                        </p>
                        <p className="text-white/60 text-sm">
                          Indicado em {new Date(referral.created_at).toLocaleDateString('pt-BR')} às {new Date(referral.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                        <p className="text-green-400 font-medium">
                          {formatCurrency(referral.commission_earned)}
                        </p>
                        <p className="text-white/60 text-xs">Comissão</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}