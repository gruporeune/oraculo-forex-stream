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
        
        <div className="flex-1 flex flex-col w-full">
          {/* Modern Glassmorphic Header */}
          <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-purple-900/80 via-purple-800/80 to-indigo-900/80 backdrop-blur-2xl shadow-lg">
            <div className="px-3 md:px-6 py-3 md:py-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left Section */}
                <div className="flex items-center gap-3 md:gap-4">
                  <SidebarTrigger className="text-white hover:bg-white/10 rounded-lg p-2 transition-all" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <img 
                        src="/lovable-uploads/0f71c9c7-c3f5-4df5-acf4-814a81ec933b.png" 
                        alt="Oráculo" 
                        className="w-6 h-6 md:w-7 md:h-7 object-contain"
                      />
                    </div>
                    <span className="hidden sm:block text-lg md:text-xl font-bold text-white">Oráculo</span>
                  </div>
                </div>
                
                {/* Right Section */}
                <div className="flex items-center gap-2 md:gap-3">
                  <LanguageSelector />
                  
                  {/* User Profile Dropdown */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">
                      {profile?.full_name || user.email}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-white hover:bg-red-500/20 hover:text-red-200 rounded-xl border border-transparent hover:border-red-500/30 transition-all"
                  >
                    <LogOut className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline font-medium">{t('nav.logout')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-2 md:p-4 lg:p-6 overflow-x-hidden">
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