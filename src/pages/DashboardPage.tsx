import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useDailySignalsReset } from '@/hooks/useDailySignalsReset';
import DashboardHomePage from './DashboardHomePage';
import ProfilePage from './ProfilePage';
import NetworkPage from './NetworkPage';
import SignalsPage from './SignalsPage';
import MembersAreaPage from './MembersAreaPage';
import MaterialsPage from './MaterialsPage';
import WithdrawalPage from './WithdrawalPage';
import PlansPage from './PlansPage';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Use the daily signals reset hook
  useDailySignalsReset(user?.id);

  // Auto-refresh profile data every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      loadProfile(user.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (!session?.user) {
          navigate('/login');
        } else {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      }
    );

    // Initial session check with timeout
    const initSession = async () => {
      try {
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 5000)
          )
        ]) as any;

        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
          navigate('/login');
          return;
        }

        if (!session?.user) {
          navigate('/login');
        } else {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        if (mounted) {
          navigate('/login');
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile load timeout')), 8000)
        )
      ]) as any;

      if (error) {
        console.error('Profile load error:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setLoading(false);
      // Try to reload profile after a delay if still no data
      if (!profile) {
        setTimeout(() => loadProfile(userId), 2000);
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Force logout with timeout
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        )
      ]);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout by clearing localStorage and redirecting
      localStorage.clear();
    } finally {
      // Always navigate regardless of logout success
      navigate('/');
      window.location.reload();
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <div className="text-white">
            {!user ? 'Verificando autenticação...' : 'Carregando dados do usuário...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger className="text-white" />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                      ORÁCULO
                    </h1>
                  </div>
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
          <main className="flex-1 p-6">
            <Routes>
              <Route 
                path="/" 
                element={
                  <DashboardHomePage 
                    user={user} 
                    profile={profile} 
                    onProfileUpdate={() => loadProfile(user.id)} 
                  />
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProfilePage 
                    user={user} 
                    profile={profile} 
                    onProfileUpdate={() => loadProfile(user.id)} 
                  />
                } 
              />
              <Route 
                path="/network" 
                element={
                  <NetworkPage 
                    user={user} 
                    profile={profile} 
                  />
                } 
              />
              <Route 
                path="/signals" 
                element={
                  <SignalsPage 
                    user={user} 
                    profile={profile} 
                    onProfileUpdate={() => loadProfile(user.id)} 
                  />
                } 
              />
              <Route 
                path="/members" 
                element={
                  <MembersAreaPage 
                    user={user} 
                    profile={profile} 
                  />
                } 
              />
              <Route 
                path="/materials" 
                element={
                  <MaterialsPage 
                    user={user} 
                    profile={profile} 
                  />
                } 
              />
              <Route 
                path="/plans" 
                element={
                  <PlansPage />
                } 
              />
              <Route 
                path="/withdrawals" 
                element={
                  <WithdrawalPage 
                    user={user} 
                    profile={profile} 
                    onProfileUpdate={() => loadProfile(user.id)} 
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}