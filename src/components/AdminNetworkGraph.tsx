import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, User } from 'lucide-react';

interface NetworkNode {
  id: string;
  username: string;
  full_name: string;
  plan: string;
  level: number;
  referrals: NetworkNode[];
  commission_earned?: number;
}

interface AdminNetworkGraphProps {
  userId: string;
  userProfile: any;
}

export default function AdminNetworkGraph({ userId, userProfile }: AdminNetworkGraphProps) {
  const [networkData, setNetworkData] = useState<NetworkNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadNetworkData();
    
    // Set up real-time subscription to update network when new referrals are added
    const channel = supabase
      .channel('admin-network-updates')
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
      // Load the complete network hierarchy WITHOUT LIMITS
      const rootNode = await buildNetworkTree(userId, 1);
      setNetworkData(rootNode);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildNetworkTree = async (nodeId: string, level: number): Promise<NetworkNode | null> => {
    // NO LEVEL LIMIT for admin view - show complete network
    
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
      const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
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
      premium: 'bg-yellow-600',
      platinum: 'bg-orange-600'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  const renderNode = (node: NetworkNode, isRoot = false) => {
    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* User Node */}
        <div className={`relative ${isRoot ? 'mb-8' : 'mb-6'}`}>
          <div className={`
            w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-bold
            ${getPlanColor(node.plan)} 
            ${isRoot ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/30' : 'ring-2 ring-white/20'}
            transition-all duration-300 hover:scale-110 cursor-pointer
          `}>
            <User className="w-8 h-8 mb-1" />
            <span className="text-xs">{node.level}</span>
          </div>
          
          {/* User Info */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
            <p className="text-white text-sm font-medium max-w-24 truncate">
              {node.username || node.full_name.split(' ')[0]}
            </p>
            <p className="text-white/60 text-xs uppercase font-semibold">
              {node.plan}
            </p>
            <p className="text-white/40 text-xs">
              Nível {node.level}
            </p>
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
                     style={{ width: `${(node.referrals.length - 1) * 140}px` }}>
                </div>
                {/* Connection points */}
                {node.referrals.map((_, index) => (
                  <div 
                    key={index}
                    className="absolute top-0 w-0.5 h-8 bg-gradient-to-b from-purple-400 to-transparent"
                    style={{ left: `${index * 140}px` }}
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

  const countByLevel = (node: NetworkNode, targetLevel: number, currentLevel = 1): number => {
    if (!node || !node.referrals) return 0;
    
    if (currentLevel === targetLevel) {
      return node.referrals.length;
    }
    
    let count = 0;
    for (const child of node.referrals) {
      count += countByLevel(child, targetLevel, currentLevel + 1);
    }
    
    return count;
  };

  const getMaxLevel = (node: NetworkNode): number => {
    if (!node.referrals || node.referrals.length === 0) {
      return node.level;
    }
    
    return Math.max(...node.referrals.map(child => getMaxLevel(child)));
  };

  const generateLevelStats = (node: NetworkNode) => {
    if (!node) return [];
    
    const maxLevel = getMaxLevel(node);
    const stats = [];
    
    for (let level = 1; level <= maxLevel; level++) {
      const count = countByLevel(node, level);
      if (count > 0) {
        stats.push({ level, count });
      }
    }
    
    return stats;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Rede Completa - Todos os Níveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Carregando rede completa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelStats = networkData ? generateLevelStats(networkData) : [];
  const totalReferrals = networkData ? countTotalReferrals(networkData) : 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Rede Completa - {userProfile?.username || userProfile?.full_name} 
        </CardTitle>
        <div className="mt-4">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{totalReferrals}</p>
              <p className="text-white/60 text-sm">Total de Usuários</p>
            </div>
            {levelStats.map(stat => (
              <div key={stat.level} className="text-center">
                <p className="text-white text-lg font-bold">{stat.count}</p>
                <p className="text-white/60 text-sm">Nível {stat.level}</p>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!networkData || (networkData.referrals?.length === 0) ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Este usuário ainda não possui rede</p>
            <p className="text-white/50 text-sm">Nenhum usuário foi indicado por este perfil</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full pb-8">
              <div className="flex justify-center">
                {/* Show complete tree starting from root */}
                {renderNode(networkData, true)}
              </div>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-medium mb-3">Visualização Administrativa:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-white/70">Ícone de usuário com <span className="text-purple-400 font-medium">número do nível</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span className="text-white/70">Sem limite de níveis - <span className="text-yellow-400 font-medium">rede completa</span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}