import { useState, useEffect } from "react"
import { Home, User, Network, TrendingUp, Settings, Users, Package, DollarSign, CreditCard, MessageCircle } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import supportAgent from "@/assets/support-agent.png"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const getItems = (t: (key: string) => string) => [
  { title: t('nav.dashboard'), url: "/dashboard", icon: Home },
  { title: t('nav.profile'), url: "/dashboard/profile", icon: User },
  { title: t('nav.network'), url: "/dashboard/network", icon: Network },
  { title: t('nav.signals'), url: "/dashboard/signals", icon: TrendingUp },
  { title: "Área de Membros", url: "/dashboard/members", icon: Users },
  { title: "Materiais Extras", url: "/dashboard/materials", icon: Package },
  { title: t('nav.plans'), url: "/dashboard/plans", icon: CreditCard },
  { title: t('nav.withdrawal'), url: "/dashboard/withdrawals", icon: DollarSign },
]

export function AppSidebar() {
  const { t } = useI18n();
  const { open, setOpen } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const items = getItems(t);

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-purple-600/30 text-white border-purple-500/50" : "text-white hover:bg-purple-800/30 hover:text-black"

  return (
    <Sidebar
      className={open ? "w-72" : "w-16"}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl">
        {/* Logo Section */}
        {open && (
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <img 
                  src="/lovable-uploads/0f71c9c7-c3f5-4df5-acf4-814a81ec933b.png" 
                  alt="Oráculo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Oráculo</h2>
                <p className="text-slate-400 text-xs">Trading Platform</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 py-4">
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-slate-400 text-xs uppercase tracking-wider px-4 mb-2">Navegação</SidebarGroupLabel>}

            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2">
                {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center transition-all
                        ${isActive ? 'bg-white/10' : 'bg-slate-800/50 group-hover:bg-slate-700/50'}
                      `}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {open && (
                        <span className="font-medium text-sm truncate flex-1">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Modern Support Agent Section */}
        {open && (
          <div className="p-4 border-t border-white/5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 p-4 backdrop-blur-sm border border-white/10">
              {/* Decorative gradient orb */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>
              
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={supportAgent} 
                      alt="Damarys - Atendente" 
                      className="w-12 h-12 rounded-xl object-cover border-2 border-purple-400/50 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Damarys</p>
                    <p className="text-slate-300 text-xs">Atendente Online</p>
                  </div>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Precisa de ajuda? Estou disponível no WhatsApp!
                </p>
                <Button 
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-500/30 transition-all rounded-xl"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chamar no WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}