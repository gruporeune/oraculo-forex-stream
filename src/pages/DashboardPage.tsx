import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, TrendingUp, Package, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate('/login');
        } else {
          setUser(session.user);
          loadProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/login');
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                ORÁCULO
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>{profile?.full_name || user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-white/70 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo ao ORÁCULO! 🎉
          </h2>
          <p className="text-white/70 mb-8">
            Sua jornada para operar com inteligência artificial começa aqui.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/20 border-purple-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Plano Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">FREE</div>
                <p className="text-xs text-white/70">5 sinais por dia</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-green-400/20 border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">99%</div>
                <p className="text-xs text-white/70">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Sinais Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">0/5</div>
                <p className="text-xs text-white/70">Disponível agora</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-400/20 border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Lucro Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">R$ 0,00</div>
                <p className="text-xs text-white/70">Começar a operar</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-black/40 border-white/10 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  <span>Adquirir Planos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4">
                  Upgrade seu plano para mais sinais e recursos exclusivos.
                </p>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500">
                  Ver Planos
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Gerar Sinais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4">
                  Gere sinais para opções binárias com 1, 5 e 15 minutos.
                </p>
                <Button variant="outline" className="w-full border-blue-500 text-blue-400">
                  Gerar Sinal
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 hover:border-green-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span>Link de Indicação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4">
                  Compartilhe seu link e ganhe comissões por indicações.
                </p>
                <Button variant="outline" className="w-full border-green-500 text-green-400">
                  Copiar Link
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 hover:border-yellow-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                  <span>Operações Automáticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4">
                  Visualize as operações automáticas do ORÁCULO.
                </p>
                <Button variant="outline" className="w-full border-yellow-500 text-yellow-400">
                  Ver Operações
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}