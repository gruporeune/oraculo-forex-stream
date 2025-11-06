import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
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
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  // Use the daily signals reset hook
  useDailySignalsReset(user?.id);

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
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-purple-500/20 bg-purple-900 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger className="text-white" />
                  <div className="flex items-center">
                    <img 
                      src="/lovable-uploads/0f71c9c7-c3f5-4df5-acf4-814a81ec933b.png" 
                      alt="Oráculo Logo" 
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <LanguageSelector />
                  <div className="flex items-center space-x-2 text-white">
                    <User className="w-5 h-5" />
                    <span>{profile?.full_name || user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-purple-200 hover:text-white hover:bg-purple-800"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
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