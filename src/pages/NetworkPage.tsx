import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Link, Copy, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export default function NetworkPage({ user, profile }: NetworkPageProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;

  useEffect(() => {
    loadReferrals();
  }, [user.id]);

  const loadReferrals = async () => {
    try {
      // First get the user_referrals
      const { data: referralData, error: referralError } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralError) {
        console.error('Error loading referrals:', referralError);
        return;
      }

      if (!referralData || referralData.length === 0) {
        setReferrals([]);
        return;
      }

      // Then get the profile information for each referred user
      const referredIds = referralData.map(ref => ref.referred_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, plan, updated_at, username, phone')
        .in('id', referredIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Combine the data
      const formattedReferrals = referralData.map(ref => {
        const profile = profilesData?.find(p => p.id === ref.referred_id);
        return {
          id: ref.id,
          full_name: profile?.full_name || 'Usuário',
          plan: profile?.plan || 'free',
          created_at: ref.created_at,
          commission_earned: ref.commission_earned || 0,
          username: profile?.username || '',
          phone: profile?.phone || ''
        };
      });

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "Seu link de indicação foi copiado para a área de transferência"
    });
  };

  const totalCommissions = referrals.reduce((sum, ref) => sum + ref.commission_earned, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
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
              {formatCurrency(profile?.daily_commissions || 0)}
            </div>
            <p className="text-xs text-white/70">Ganhos do dia</p>
          </CardContent>
        </Card>
      </div>

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
            Compartilhe este link e ganhe 10% de comissão sobre os planos adquiridos pelos seus indicados.
          </p>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seus Indicados Diretos
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
              <p className="text-white/70 mb-2">Nenhum indicado ainda</p>
              <p className="text-white/50 text-sm">Compartilhe seu link para começar a ganhar comissões</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
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