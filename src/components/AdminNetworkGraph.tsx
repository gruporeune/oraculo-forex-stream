import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, User, Home, ZoomIn, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [focusedUserId, setFocusedUserId] = useState<string>(userId);
  const [focusedUserData, setFocusedUserData] = useState<NetworkNode | null>(null);
  const [allUsers, setAllUsers] = useState<NetworkNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<NetworkNode[]>([]);

  useEffect(() => {
    loadNetworkData();
    
    const channel = supabase
      .channel('admin-network-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        loadNetworkData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (networkData) {
      loadFocusedUserData(focusedUserId);
    }
  }, [focusedUserId, networkData]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, allUsers]);

  const loadNetworkData = async () => {
    try {
      const rootNode = await buildNetworkTree(userId, 1);
      setNetworkData(rootNode);
      
      if (rootNode) {
        const flatUsers = flattenNetworkTree(rootNode);
        setAllUsers(flatUsers);
      }
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFocusedUserData = async (targetUserId: string) => {
    try {
      const focusedNode = await buildNetworkTree(targetUserId, 1);
      setFocusedUserData(focusedNode);
      
      if (networkData) {
        const path = findPathToUser(networkData, targetUserId);
        setBreadcrumb(path);
      }
    } catch (error) {
      console.error('Error loading focused user data:', error);
    }
  };

  const buildNetworkTree = async (nodeId: string, level: number): Promise<NetworkNode | null> => {
    // Limite de profundidade para melhorar performance
    if (level > 3) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, plan')
      .eq('id', nodeId)
      .maybeSingle();
      
    if (!profile) return null;

    // Buscar planos e referrals em paralelo para otimizar
    const [plansResult, referralsResult] = await Promise.all([
      supabase
        .from('user_plans')
        .select('plan_name')
        .eq('user_id', nodeId)
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('id, username, full_name, plan')
        .eq('referred_by', nodeId)
        .limit(10) // Limitar para melhorar performance
    ]);
    
    let displayPlan = profile.plan || 'free';
    if (plansResult.data && plansResult.data.length > 0) {
      const planPriority = { platinum: 4, premium: 3, master: 2, partner: 1 };
      const highestPlan = plansResult.data.reduce((highest, current) => {
        const currentPriority = planPriority[current.plan_name as keyof typeof planPriority] || 0;
        const highestPriority = planPriority[highest.plan_name as keyof typeof planPriority] || 0;
        return currentPriority > highestPriority ? current : highest;
      });
      displayPlan = highestPlan.plan_name;
    }

    const referrals: NetworkNode[] = [];
    
    if (referralsResult.data && referralsResult.data.length > 0) {
      // Processar apenas os primeiros referrals em paralelo
      const childPromises = referralsResult.data.slice(0, 5).map(async (referralProfile) => {
        return await buildNetworkTree(referralProfile.id, level + 1);
      });
      
      const childNodes = await Promise.all(childPromises);
      referrals.push(...childNodes.filter(node => node !== null) as NetworkNode[]);
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

  const flattenNetworkTree = (node: NetworkNode): NetworkNode[] => {
    const result = [node];
    if (node.referrals) {
      for (const child of node.referrals) {
        result.push(...flattenNetworkTree(child));
      }
    }
    return result;
  };

  const findPathToUser = (root: NetworkNode, targetId: string): { id: string; name: string }[] => {
    const path: { id: string; name: string }[] = [];
    
    const dfs = (node: NetworkNode, currentPath: { id: string; name: string }[]): boolean => {
      currentPath.push({ id: node.id, name: node.username || node.full_name });
      
      if (node.id === targetId) {
        path.push(...currentPath);
        return true;
      }
      
      if (node.referrals) {
        for (const child of node.referrals) {
          if (dfs(child, [...currentPath])) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    dfs(root, []);
    return path;
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

  const renderFocusedNode = (node: NetworkNode) => {
    const hasChildren = node.referrals && node.referrals.length > 0;
    const isRootUser = node.id === userId;
    
    return (
      <div className="flex flex-col items-center">
        {/* Main Focused User - Larger */}
        <div className="relative mb-8">
          <div 
            className={`
              relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-white font-bold
              ${getPlanColor(node.plan)} 
              ${isRootUser ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/30' : 'ring-4 ring-white/30'}
              transition-all duration-300
            `}
          >
            <User className="w-10 h-10 mb-2" />
            <span className="text-lg font-bold">{node.level}</span>
          </div>
          
          {/* User Info - Larger */}
          <div className="absolute top-36 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white text-lg font-bold mb-1">
              {node.username || node.full_name}
            </p>
            <p className="text-white/80 text-sm uppercase font-semibold mb-1">
              {node.plan}
            </p>
            <p className="text-white/60 text-sm">
              Nível {node.level}
            </p>
            {hasChildren && (
              <p className="text-purple-400 text-sm font-medium mt-2">
                {node.referrals.length} indicado{node.referrals.length > 1 ? 's' : ''} direto{node.referrals.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Direct Referrals Grid */}
        {hasChildren && (
          <div className="w-full">
            <div className="text-center mb-6">
              <h3 className="text-white text-lg font-semibold mb-2">Indicações Diretas</h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center max-w-6xl mx-auto">
              {node.referrals.map(child => (
                <div key={child.id} className="flex flex-col items-center group">
                  <div className="relative mb-4">
                    <div 
                      className={`
                        relative w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-bold cursor-pointer
                        ${getPlanColor(child.plan)} 
                        ring-2 ring-white/20 hover:ring-white/40
                        transition-all duration-300 hover:scale-110
                      `}
                      onClick={() => setFocusedUserId(child.id)}
                    >
                      <User className="w-6 h-6 mb-1" />
                      <span className="text-xs">{child.level}</span>
                      
                      {/* Zoom indicator */}
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3 h-3 text-white" />
                      </div>
                      
                      {/* Children count badge */}
                      {child.referrals && child.referrals.length > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                          {child.referrals.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Child Info */}
                    <div className="text-center">
                      <p className="text-white text-sm font-medium truncate max-w-24">
                        {child.username || child.full_name.split(' ')[0]}
                      </p>
                      <p className="text-white/60 text-xs uppercase font-semibold">
                        {child.plan}
                      </p>
                      <p className="text-white/40 text-xs">
                        Nível {child.level}
                      </p>
                      {child.referrals && child.referrals.length > 0 && (
                        <p className="text-orange-400 text-xs mt-1">
                          {child.referrals.length} indicação{child.referrals.length > 1 ? 'ões' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const countTotalReferrals = (node: NetworkNode): number => {
    if (!node.referrals) return 0;
    return node.referrals.length + node.referrals.reduce((sum, child) => sum + countTotalReferrals(child), 0);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Rede Completa - Visualização Focada
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

  const totalReferrals = networkData ? countTotalReferrals(networkData) : 0;
  const focusedUser = focusedUserData || networkData;

  return (
    <div className="space-y-6">
      {/* Navigation and Search Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            Rede Completa - {userProfile?.username || userProfile?.full_name} 
            <span className="text-purple-400 text-base font-normal">
              ({totalReferrals} usuários totais)
            </span>
          </CardTitle>
          
          {/* Navigation Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFocusedUserId(userId)}
                className="shrink-0"
              >
                <Home className="w-4 h-4 mr-1" />
                Raiz
              </Button>
              
              {breadcrumb.length > 1 && (
                <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                  {breadcrumb.slice(1).map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                      <span className="text-white/40">→</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFocusedUserId(crumb.id)}
                        className="text-white/70 hover:text-white text-xs px-2 py-1 h-auto"
                      >
                        {crumb.name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back Button */}
            {focusedUserId !== userId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const parentIndex = breadcrumb.findIndex(b => b.id === focusedUserId) - 1;
                  if (parentIndex >= 0) {
                    setFocusedUserId(breadcrumb[parentIndex].id);
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar usuário na rede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
            
            {/* Search Results */}
            {filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                    onClick={() => {
                      setFocusedUserId(user.id);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPlanColor(user.plan)}`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.username || user.full_name}</p>
                        <p className="text-white/60 text-xs">{user.plan} • Nível {user.level}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Network View */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8">
          {!focusedUser ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/70 mb-2">Usuário não encontrado</p>
              <p className="text-white/50 text-sm">O usuário selecionado não existe ou não tem permissões para visualização</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {renderFocusedNode(focusedUser)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h4 className="text-white font-medium mb-3">Legenda e Controles:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold border border-white">3</div>
              <span className="text-white/70">Número de <span className="text-orange-400 font-medium">indicações diretas</span></span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-blue-400" />
              <span className="text-white/70"><span className="text-blue-400 font-medium">Clique para focar</span> no usuário</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-white/70">Número dentro indica o <span className="text-purple-400 font-medium">nível na rede</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full ring-2 ring-yellow-400"></div>
              <span className="text-white/70">Usuário <span className="text-yellow-400 font-medium">raiz da rede</span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}