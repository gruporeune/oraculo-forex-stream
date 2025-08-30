import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCards } from '@/components/DashboardCards';
import MultiPlanAutomaticSignals from '@/components/MultiPlanAutomaticSignals';
import { EarningsHistory } from '@/components/EarningsHistory';
import { useI18n } from '@/lib/i18n';

import { useToast } from '@/hooks/use-toast';
import { Tilt } from '@/components/ui/tilt';
import { Spotlight } from '@/components/ui/spotlight';

interface DashboardHomePageProps {
  user: any;
  profile: any;
  onProfileUpdate: () => void;
}

export default function DashboardHomePage({ user, profile, onProfileUpdate }: DashboardHomePageProps) {
  const { t } = useI18n();
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadUserPlans();
    }
  }, [user?.id]);

  const loadUserPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserPlans(data || []);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

  const handleWithdraw = () => {
    window.location.href = '/dashboard/withdrawals';
  };

  const handleEarningsGenerated = async (amount: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_earnings: (profile?.daily_earnings || 0) + amount,
          available_balance: (profile?.available_balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      onProfileUpdate();
      
      toast({
        title: "Lucro gerado!",
        description: `+$${amount.toFixed(2)} adicionado ao seu saldo`,
      });
    } catch (error) {
      console.error('Error updating earnings:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {t('dashboard.welcome')} 🎉
        </h2>
        <p className="text-white/70">
          {t('dashboard.subtitle')}
        </p>
      </div>


      <DashboardCards 
        profile={profile} 
        userPlans={userPlans}
        onWithdraw={handleWithdraw}
      />

      {/* Video and Banners Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        {/* Video and Banners Row - Horizontally Aligned */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-7xl mx-auto px-4 mb-8">
          
          {/* YouTube Video Section - Left */}
          <div className="flex-shrink-0">
            <Tilt
              rotationFactor={6}
              isRevese
              style={{
                transformOrigin: 'center center',
              }}
              springOptions={{
                stiffness: 26.7,
                damping: 4.1,
                mass: 0.2,
              }}
              className="group relative rounded-2xl"
            >
              <Spotlight
                className="z-10 from-red-500/50 via-red-500/20 to-red-500/10 blur-2xl"
                size={300}
                springOptions={{
                  stiffness: 26.7,
                  damping: 4.1,
                  mass: 0.2,
                }}
              />
              <div className="relative bg-gradient-to-br from-red-900/80 via-red-800/80 to-red-700/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-3 hover:border-red-400/50 transition-all duration-500 cursor-pointer shadow-2xl shadow-red-500/20">
                <div className="aspect-video w-[280px] rounded-xl overflow-hidden bg-black">
                  <iframe
                    src="https://www.youtube.com/embed/tV-a0H0gw1g?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&modestbranding=1&cc_load_policy=0&iv_load_policy=3&fs=0&disablekb=1&start=0"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3 text-center">
                  <h4 className="text-sm font-bold text-white mb-1">
                    {t('dashboard.video.title')}
                  </h4>
                  <p className="text-red-200 text-xs">
                    {t('dashboard.video.subtitle')}
                  </p>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Tilt>
          </div>

          {/* Banner 1 - Center */}
          <div className="flex-shrink-0">
            <Tilt
              rotationFactor={4}
              isRevese
              style={{
                transformOrigin: 'center center',
              }}
              springOptions={{
                stiffness: 26.7,
                damping: 4.1,
                mass: 0.2,
              }}
              className="group relative rounded-2xl cursor-pointer"
            >
              <Spotlight
                className="z-10 from-purple-500/50 via-purple-500/20 to-purple-500/10 blur-2xl"
                size={200}
                springOptions={{
                  stiffness: 26.7,
                  damping: 4.1,
                  mass: 0.2,
                }}
              />
              <div className="relative bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-purple-700/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-2 hover:border-purple-400/50 transition-all duration-500 shadow-2xl shadow-purple-500/20">
                <img 
                  src="/lovable-uploads/e304badb-daf3-4b8b-9cc3-ffd1471be262.png"
                  alt="Oráculo - Apresentação de Negócios"
                  className="w-[240px] h-[268px] rounded-xl object-cover"
                />
              </div>
            </Tilt>
          </div>

          {/* Banner 2 - Right */}
          <div className="flex-shrink-0">
            <Tilt
              rotationFactor={4}
              isRevese
              style={{
                transformOrigin: 'center center',
              }}
              springOptions={{
                stiffness: 26.7,
                damping: 4.1,
                mass: 0.2,
              }}
              className="group relative rounded-2xl cursor-pointer"
            >
              <Spotlight
                className="z-10 from-yellow-500/50 via-yellow-500/20 to-yellow-500/10 blur-2xl"
                size={200}
                springOptions={{
                  stiffness: 26.7,
                  damping: 4.1,
                  mass: 0.2,
                }}
              />
              <div className="relative bg-gradient-to-br from-yellow-900/80 via-yellow-800/80 to-yellow-700/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-2 hover:border-yellow-400/50 transition-all duration-500 shadow-2xl shadow-yellow-500/20">
                <img 
                  src="/lovable-uploads/34604923-f4a1-4800-9966-0cd00b06bf77.png"
                  alt="Oráculo - Pré Lançamento IA Financeira"
                  className="w-[240px] h-[268px] rounded-xl object-cover"
                />
              </div>
            </Tilt>
          </div>
        </div>

        {/* Broker Cards Section - Moved below */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-row items-center justify-center gap-3 md:gap-6">
            {/* Logo Card with Tilt Effect */}
            <div className="flex-shrink-0">
              <Tilt
                rotationFactor={8}
                isRevese
                style={{
                  transformOrigin: 'center center',
                }}
                springOptions={{
                  stiffness: 26.7,
                  damping: 4.1,
                  mass: 0.2,
                }}
                className="group relative rounded-lg"
              >
                <Spotlight
                  className="z-10 from-white/50 via-white/20 to-white/10 blur-2xl"
                  size={200}
                  springOptions={{
                    stiffness: 26.7,
                    damping: 4.1,
                    mass: 0.2,
                  }}
                />
                <div className="relative bg-gradient-to-br from-purple-900/80 to-purple-700/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 hover:border-purple-400/50 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <img 
                      src="/lovable-uploads/bd5c3c52-6bcd-4d40-b489-1c9a7cb7ba3c.png" 
                      alt="BullTec" 
                      className="h-12 w-auto object-contain md:h-16"
                    />
                  </div>
                  <div className="space-y-1 text-center">
                    <h4 className="text-xs md:text-sm font-bold text-white">BullTec</h4>
                    <p className="text-purple-200 text-[10px] md:text-xs max-w-[100px]">
                      {t('dashboard.bulltec.official')}
                    </p>
                  </div>
                  <div className="absolute top-1 right-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </Tilt>
            </div>

            {/* Exnova Card */}
            <div className="flex-shrink-0">
              <a 
                href="https://exnova.com/lp/start-trading/?aff=206811&aff_model=revenue&afftrack="
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Tilt
                  rotationFactor={8}
                  isRevese
                  style={{
                    transformOrigin: 'center center',
                  }}
                  springOptions={{
                    stiffness: 26.7,
                    damping: 4.1,
                    mass: 0.2,
                  }}
                  className="group relative rounded-lg"
                >
                  <Spotlight
                    className="z-10 from-blue-500/50 via-blue-500/20 to-blue-500/10 blur-2xl"
                    size={200}
                    springOptions={{
                      stiffness: 26.7,
                      damping: 4.1,
                      mass: 0.2,
                    }}
                  />
                  <div className="relative bg-gradient-to-br from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400/30 rounded-xl p-3 hover:border-blue-300/50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg md:text-xl">EX</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="text-xs md:text-sm font-bold text-white">Exnova</h4>
                      <p className="text-blue-200 text-[10px] md:text-xs max-w-[100px]">
                        {t('dashboard.exnova.premium')}
                      </p>
                    </div>
                    <div className="absolute top-1 right-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </Tilt>
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="flex-shrink-0">
              <a 
                href="https://chat.whatsapp.com/Dils2U8F6kw37VHgv9RJ3H?mode=ems_wa_c"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Tilt
                  rotationFactor={8}
                  isRevese
                  style={{
                    transformOrigin: 'center center',
                  }}
                  springOptions={{
                    stiffness: 26.7,
                    damping: 4.1,
                    mass: 0.2,
                  }}
                  className="group relative rounded-lg"
                >
                  <Spotlight
                    className="z-10 from-green-500/50 via-green-500/20 to-green-500/10 blur-2xl"
                    size={200}
                    springOptions={{
                      stiffness: 26.7,
                      damping: 4.1,
                      mass: 0.2,
                    }}
                  />
                  <div className="relative bg-gradient-to-br from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-400/30 rounded-xl p-3 hover:border-green-300/50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.386z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="text-xs md:text-sm font-bold text-white">WhatsApp</h4>
                      <p className="text-green-200 text-[10px] md:text-xs max-w-[100px]">
                        {t('dashboard.whatsapp.vip')}
                      </p>
                    </div>
                    <div className="absolute top-1 right-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </Tilt>
              </a>
            </div>
          </div>

          {/* Texto explicativo - Moved below */}
          <div className="text-center">
            <h3 className="text-xl md:text-3xl font-black text-white mb-2 tracking-tight leading-tight">
              {t('dashboard.brokers.title').split(' ')[0]} {t('dashboard.brokers.title').split(' ')[1]} {t('dashboard.brokers.title').split(' ')[2]} {t('dashboard.brokers.title').split(' ')[3]} {t('dashboard.brokers.title').split(' ')[4]}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600 font-black">
                {t('dashboard.brokers.title').split(' ').slice(5).join(' ')}
              </span>
            </h3>
            <p className="text-white/70 text-sm md:text-base font-medium">
              {t('dashboard.brokers.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      <MultiPlanAutomaticSignals 
        user={user}
        userPlans={userPlans}
        onPlansUpdate={loadUserPlans}
      />

      <EarningsHistory userId={user?.id} />
    </motion.div>
  );
}