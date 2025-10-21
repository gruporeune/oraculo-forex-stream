import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';

interface NetworkNode {
  id: string;
  username: string;
  full_name: string;
  plan: string;
  level: number;
  referrals: NetworkNode[];
  commission_earned?: number;
}

interface NetworkGraphProps {
  userId: string;
  userProfile: any;
}

export default function NetworkGraph({ userId, userProfile }: NetworkGraphProps) {
  const [networkData, setNetworkData] = useState<NetworkNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
    
    // Set up real-time subscription to update network when new referrals are added
    const channel = supabase
      .channel('network-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_referrals'
      }, () => {
        // Reload network data when user_referrals table changes
        loadNetworkData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        // Reload network data when profiles table changes
        loadNetworkData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadNetworkData = async () => {
    try {
      // Load the complete network hierarchy
      const rootNode = await buildNetworkTree(userId, 1);
      setNetworkData(rootNode);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildNetworkTree = async (nodeId: string, level: number): Promise<NetworkNode | null> => {
    if (level > 4) return null; // Increase to 4 levels to properly show 3 levels under root

    // Get user profile 
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, plan')
      .eq('id', nodeId)
      .maybeSingle();
      
    if (!profile) return null;

    // Get the highest plan from active plans to display correct plan status
    const { data: allPlans } = await supabase
      .from('user_plans')
      .select('plan_name')
      .eq('user_id', nodeId)
      .eq('is_active', true);
    
    let displayPlan = profile.plan || 'free';
    if (allPlans && allPlans.length > 0) {
      const planPriority = { platinum: 5, premium: 4, pro: 3, master: 2, partner: 1 };
      const highestPlan = allPlans.reduce((highest, current) => {
        const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
        const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
        return currentPriority > highestPriority ? current : highest;
      });
      displayPlan = highestPlan.plan_name;
    }

    // Get direct referrals using referred_by column
    const { data: directReferrals } = await supabase
      .from('profiles')
      .select('id, username, full_name, plan')
      .eq('referred_by', nodeId);

    const referrals: NetworkNode[] = [];
    
    if (directReferrals && directReferrals.length > 0) {
      for (const referralProfile of directReferrals) {
        const childNode = await buildNetworkTree(referralProfile.id, level + 1);
        if (childNode) {
          // Get total commission for all plans of this referral from referral_commissions table
          const commissionLevel = level; // Level relative to the original user
          const { data: commissionData } = await supabase
            .from('referral_commissions')
            .select('commission_amount')
            .eq('referrer_id', userId) // Always use the original userId as referrer
            .eq('referred_id', referralProfile.id)
            .eq('commission_level', commissionLevel);
          
          childNode.commission_earned = commissionData?.reduce((sum, item) => sum + (item.commission_amount || 0), 0) || 0;
          referrals.push(childNode);
        }
      }
    }

    return {
      id: profile.id,
      username: profile.username || 'User',
      full_name: profile.full_name || 'Usuário',
      plan: displayPlan,
      level,
      referrals
    };
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'bg-gray-600',
      partner: 'bg-blue-600',
      master: 'bg-purple-600',
      pro: 'bg-amber-600',
      premium: 'bg-yellow-600',
      platinum: 'bg-pink-600'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  const renderNode = (node: NetworkNode, isRoot = false) => {
    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* User Node */}
        <div className={`relative ${isRoot ? 'mb-8' : 'mb-6'}`}>
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg
            ${getPlanColor(node.plan)} 
            ${isRoot ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/30' : 'ring-2 ring-white/20'}
            transition-all duration-300 hover:scale-110
          `}>
            {node.full_name.charAt(0)}
          </div>
          
          {/* User Info */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
            <p className="text-white text-sm font-medium">
              {node.username || node.full_name.split(' ')[0]}
            </p>
            <p className="text-white/60 text-xs uppercase font-semibold">
              {node.plan}
            </p>
            {node.commission_earned && node.commission_earned > 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs font-medium">
                  R$ {node.commission_earned.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Lines and Children */}
        {node.referrals && node.referrals.length > 0 && (
          <>
            {/* Vertical line down */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-purple-400 to-transparent"></div>
            
            {/* Horizontal line */}
            {node.referrals.length > 1 && (
              <div className="relative">
                <div className="h-0.5 bg-gradient-to-r from-purple-400 via-purple-400 to-purple-400" 
                     style={{ width: `${(node.referrals.length - 1) * 120}px` }}>
                </div>
                {/* Connection points */}
                {node.referrals.map((_, index) => (
                  <div 
                    key={index}
                    className="absolute top-0 w-0.5 h-8 bg-gradient-to-b from-purple-400 to-transparent"
                    style={{ left: `${index * 120}px` }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Children Nodes */}
            <div className="flex gap-8 mt-8">
              {node.referrals.map(child => renderNode(child))}
            </div>
          </>
        )}
      </div>
    );
  };

  const countTotalReferrals = (node: NetworkNode): number => {
    if (!node.referrals) return 0;
    return node.referrals.length + node.referrals.reduce((sum, child) => sum + countTotalReferrals(child), 0);
  };

  const countByLevel = (node: NetworkNode, targetLevel: number): number => {
    if (!node || !node.referrals) return 0;
    
    let count = 0;
    
    // Level 1: Direct referrals
    if (targetLevel === 1) {
      return node.referrals.length;
    }
    
    // Level 2: Children of direct referrals
    if (targetLevel === 2) {
      for (const child of node.referrals) {
        count += child.referrals?.length || 0;
      }
      return count;
    }
    
    // Level 3: Grandchildren of direct referrals
    if (targetLevel === 3) {
      for (const child of node.referrals) {
        if (child.referrals) {
          for (const grandchild of child.referrals) {
            count += grandchild.referrals?.length || 0;
          }
        }
      }
      return count;
    }
    
    return count;
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gráfico da Rede Multilevel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Carregando rede...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gráfico da Rede Multilevel (3 Níveis)
        </CardTitle>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-white text-lg font-bold">{networkData ? countByLevel(networkData, 1) : 0}</p>
            <p className="text-white/60 text-sm">Nível 1 (10%)</p>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-bold">{networkData ? countByLevel(networkData, 2) : 0}</p>
            <p className="text-white/60 text-sm">Nível 2 (3%)</p>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-bold">{networkData ? countByLevel(networkData, 3) : 0}</p>
            <p className="text-white/60 text-sm">Nível 3 (2%)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!networkData || (networkData.referrals?.length === 0) ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Sua rede ainda está vazia</p>
            <p className="text-white/50 text-sm">Compartilhe seu link de indicação para começar a construir sua rede</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full pb-8">
              <div className="flex justify-center">
                {/* Only render referrals, not the root user */}
                <div className="flex gap-8">
                  {networkData.referrals.map(child => renderNode(child))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-medium mb-3">Sistema de Comissões:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-white/70">Nível 1: <span className="text-green-400 font-medium">10%</span> de comissão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-white/70">Nível 2: <span className="text-blue-400 font-medium">3%</span> de comissão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-white/70">Nível 3: <span className="text-purple-400 font-medium">2%</span> de comissão</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}