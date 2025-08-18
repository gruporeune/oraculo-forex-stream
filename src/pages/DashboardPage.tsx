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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Use the daily signals reset hook
  useDailySignalsReset(user?.id);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // First get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        if (isMounted) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        navigate('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (!session?.user) {
          navigate('/login');
          return;
        }

        setUser(session.user);
        // Defer profile loading to avoid blocking auth state changes
        setTimeout(() => {
          if (isMounted) {
            loadProfile(session.user.id);
          }
        }, 0);
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile loading error:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div className="text-white text-lg font-medium">Carregando sua conta...</div>
          <div className="text-white/60 text-sm mt-2">Aguarde enquanto carregamos seus dados</div>
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