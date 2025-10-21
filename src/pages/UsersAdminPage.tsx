import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Edit, Save, LogOut, Search, DollarSign, User, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import AdminNetworkGraph from "@/components/AdminNetworkGraph";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  plan: string;
  available_balance: number;
  daily_earnings: number;
  daily_commissions: number;
  updated_at: string;
  created_at: string;
  phone: string | null;
  referred_by: string | null;
  referrer_username?: string | null;
}

interface UserPlan {
  id: string;
  user_id: string;
  plan_name: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<{
    plan: string;
    available_balance: number;
    daily_earnings: number;
  } | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [mainNetworkUser, setMainNetworkUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
    loadUsers();
    loadUserPlans();
  }, []);

  useEffect(() => {
    // Filter users based on search term and date
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate.toDateString() === filterDate.toDateString();
      });
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, dateFilter, users]);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/users-admin/login');
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!adminData) {
      navigate('/users-admin/login');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          plan,
          available_balance,
          daily_earnings,
          daily_commissions,
          updated_at,
          phone,
          referred_by
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Get real creation dates using our secure function
      const usersWithCreatedAt = await Promise.all(
        (data || []).map(async (profile) => {
          try {
            const { data: creationDate, error: dateError } = await supabase
              .rpc('get_user_creation_date', { user_uuid: profile.id });
            
            return {
              ...profile,
              created_at: creationDate || profile.updated_at
            };
          } catch (error) {
            // Fallback to updated_at if function fails
            return {
              ...profile,
              created_at: profile.updated_at
            };
          }
        })
      );

      // Load referrer usernames
      const usersWithReferrers = await Promise.all(
        usersWithCreatedAt.map(async (user) => {
          if (user.referred_by) {
            try {
              const { data: referrerData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.referred_by)
                .maybeSingle();
              
              return {
                ...user,
                referrer_username: referrerData?.username || referrerData?.full_name || 'Usuário não encontrado'
              };
            } catch (error) {
              console.error('Erro ao buscar referrer:', error);
              return { ...user, referrer_username: 'Erro ao carregar' };
            }
          }
          return { ...user, referrer_username: null };
        })
      );

      // Sort by creation date (newest first)
      const sortedUsers = usersWithReferrers.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUsers(sortedUsers);
      
      // Load main network user - find the root user (without referrer)
      const { data: mainUserByEmail } = await supabase
        .from('profiles')
        .select('*')
        .is('referred_by', null)
        .eq('username', 'empresa')
        .limit(1)
        .maybeSingle();
      
      if (mainUserByEmail) {
        setMainNetworkUser({
          ...mainUserByEmail,
          created_at: mainUserByEmail.updated_at
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPlans(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar planos: " + error.message);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editingUser) return;

    try {
      console.log("Atualizando usuário:", selectedUser.id, editingUser);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: editingUser.plan,
          available_balance: editingUser.available_balance,
          daily_earnings: editingUser.daily_earnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error("Erro detalhado:", error);
        throw error;
      }

      toast.success("Usuário atualizado com sucesso!");
      setSelectedUser(null);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário: " + error.message);
    }
  };

  const handleAddPlan = async () => {
    if (!selectedUser || !newPlan) return;

    try {
      console.log("Adicionando plano:", newPlan, "para usuário:", selectedUser.id);
      
      // Check if user already has 5 plans of this type
      const existingPlans = userPlans.filter(
        plan => plan.user_id === selectedUser.id && 
        plan.plan_name === newPlan && 
        plan.is_active
      );

      if (existingPlans.length >= 5) {
        toast.error("Usuário já possui o máximo de 5 planos deste tipo");
        return;
      }

      const { data, error } = await supabase
        .from('user_plans')
        .insert({
          user_id: selectedUser.id,
          plan_name: newPlan,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error("Erro detalhado ao adicionar plano:", error);
        throw error;
      }

      // Se o usuário tem plano FREE e este é seu primeiro plano, atualizar o plano principal
      if (selectedUser.plan === 'free') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: newPlan,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedUser.id);

        if (updateError) {
          console.error("Erro ao atualizar plano principal:", updateError);
          // Não fazer throw aqui para não cancelar a operação do user_plans
        } else {
          console.log("Plano principal atualizado para:", newPlan);
          // Atualizar o estado local
          setSelectedUser(prev => prev ? {...prev, plan: newPlan} : null);
          setEditingUser(prev => prev ? {...prev, plan: newPlan} : null);
        }
      }

      console.log("Plano adicionado com sucesso:", data);
      toast.success("Plano adicionado com sucesso!");
      setNewPlan("");
      loadUserPlans();
      loadUsers(); // Recarregar para atualizar o plano principal na interface
    } catch (error: any) {
      console.error("Erro ao adicionar plano:", error);
      toast.error("Erro ao adicionar plano: " + error.message);
    }
  };

  const handleRemovePlan = async (planId: string) => {
    try {
      console.log("Removendo plano:", planId);
      
      const { error } = await supabase
        .from('user_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) {
        console.error("Erro detalhado ao remover plano:", error);
        throw error;
      }

      console.log("Plano removido com sucesso");
      toast.success("Plano removido com sucesso!");
      loadUserPlans();
    } catch (error: any) {
      console.error("Erro ao remover plano:", error);
      toast.error("Erro ao remover plano: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/users-admin/login');
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-500';
      case 'partner': return 'bg-blue-500';
      case 'master': return 'bg-purple-500';
      case 'pro': return 'bg-amber-500';
      case 'premium': return 'bg-gold-500';
      case 'platinum': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserPlansCount = (userId: string) => {
    return userPlans.filter(plan => plan.user_id === userId && plan.is_active);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold">Painel de Usuários</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => { loadUsers(); loadUserPlans(); }} 
              variant="outline" 
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Atualizar Dados
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {users.filter(u => u.plan !== 'free').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Planos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {userPlans.filter(p => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                R$ {users.reduce((sum, user) => sum + (user.available_balance || 0), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-purple-600">
              <User className="w-4 h-4 mr-2" />
              Rede Principal
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            {/* Search and Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, username, ID ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="Filtrar por data..."
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Users Table */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-gray-300">Nome/Username</TableHead>
                      <TableHead className="text-gray-300">Telefone</TableHead>
                      <TableHead className="text-gray-300">Indicado por</TableHead>
                      <TableHead className="text-gray-300">Plano Principal</TableHead>
                      <TableHead className="text-gray-300">Planos Extras</TableHead>
                      <TableHead className="text-gray-300">Saldo Disponível</TableHead>
                      <TableHead className="text-gray-300">Ganho Hoje</TableHead>
                      <TableHead className="text-gray-300">Comissões Hoje</TableHead>
                      <TableHead className="text-gray-300">Data de Cadastro</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const extraPlans = getUserPlansCount(user.id);
                      return (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                              <div className="text-sm text-blue-400">{user.username || 'Sem username'}</div>
                              <div className="text-xs text-gray-400">{user.id.substring(0, 8)}...</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="text-sm">
                              {user.phone || (
                                <span className="text-gray-400">Não informado</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="text-sm">
                              {user.referrer_username ? (
                                <span className="text-green-400">{user.referrer_username}</span>
                              ) : (
                                <span className="text-gray-400">Cadastro direto</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPlanBadgeColor(user.plan)} text-white`}>
                              {user.plan.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-300">
                              {extraPlans.length > 0 ? `${extraPlans.length} planos extras` : 'Nenhum'}
                            </div>
                          </TableCell>
                          <TableCell className="text-green-400 font-medium">
                            R$ {(user.available_balance || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-yellow-400 font-medium">
                            R$ {(user.daily_earnings || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-blue-400 font-medium">
                            R$ {(user.daily_commissions || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div>
                              <div>{new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(user.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditingUser({
                                      plan: user.plan,
                                      available_balance: user.available_balance || 0,
                                      daily_earnings: user.daily_earnings || 0
                                    });
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                                <DialogHeader>
                                  <DialogTitle>Gerenciar Usuário: {user.full_name || 'Sem nome'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Plano Principal</Label>
                                    <Select 
                                      value={editingUser?.plan || 'free'} 
                                      onValueChange={(value) => setEditingUser(prev => prev ? {...prev, plan: value} : null)}
                                    >
                                      <SelectTrigger className="bg-slate-700 border-slate-600">
                                        <SelectValue placeholder="Selecionar plano principal" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-700 border-slate-600">
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="partner">Partner</SelectItem>
                                        <SelectItem value="master">Master</SelectItem>
                                        <SelectItem value="pro">PRO</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                        <SelectItem value="platinum">Platinum</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Planos Extras do Usuário</Label>
                                    <div className="bg-slate-700 rounded-lg p-3 mb-4">
                                      {getUserPlansCount(selectedUser?.id || '').length > 0 ? (
                                        <div className="space-y-2">
                                          {getUserPlansCount(selectedUser?.id || '').map((plan) => (
                                            <div key={plan.id} className="flex items-center justify-between bg-slate-600 rounded-lg p-2">
                                              <span className="text-white font-medium">{plan.plan_name.toUpperCase()}</span>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRemovePlan(plan.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                              >
                                                Remover
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-gray-400 text-sm">Nenhum plano extra</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Saldo Disponível (R$)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingUser?.available_balance || 0}
                                      onChange={(e) => setEditingUser(prev => prev ? {...prev, available_balance: parseFloat(e.target.value) || 0} : null)}
                                      className="bg-slate-700 border-slate-600"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Ganho do Dia (R$)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingUser?.daily_earnings || 0}
                                      onChange={(e) => setEditingUser(prev => prev ? {...prev, daily_earnings: parseFloat(e.target.value) || 0} : null)}
                                      className="bg-slate-700 border-slate-600"
                                    />
                                  </div>

                                  <div className="border-t border-slate-600 pt-4">
                                    <Label>Adicionar Novo Plano</Label>
                                    <div className="flex gap-2 mt-2">
                                      <Select value={newPlan} onValueChange={setNewPlan}>
                                        <SelectTrigger className="bg-slate-700 border-slate-600">
                                          <SelectValue placeholder="Selecionar plano" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600">
                                          <SelectItem value="partner">Partner</SelectItem>
                                          <SelectItem value="master">Master</SelectItem>
                                          <SelectItem value="pro">PRO</SelectItem>
                                          <SelectItem value="premium">Premium</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button onClick={handleAddPlan} size="sm" className="bg-green-600 hover:bg-green-700">
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button onClick={handleUpdateUser} className="bg-purple-600 hover:bg-purple-700">
                                      <Save className="w-4 h-4 mr-2" />
                                      Salvar Alterações
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Rede Principal - oraculooption@gmail.com
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mainNetworkUser ? (
                  <AdminNetworkGraph 
                    userId={mainNetworkUser.id} 
                    userProfile={mainNetworkUser}
                  />
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Usuário principal não encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}