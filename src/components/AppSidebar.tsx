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
    isActive ? "bg-purple-600/30 text-white border-purple-500/50" : "text-white hover:bg-purple-800/50 hover:text-purple-400"

  return (
    <Sidebar
      className={open ? "w-60" : "w-14"}
      collapsible="icon"
    >
      <SidebarContent className="bg-purple-900 backdrop-blur-xl border-r border-purple-500/20 flex flex-col">
        <div className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-purple-200/80">Menu Principal</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${getNavCls({ isActive })}`}
                      >
                        <item.icon className="w-4 h-4 text-white" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Support Agent Section */}
        {open && (
          <div className="p-4 border-t border-purple-500/20">
            <div className="bg-purple-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src={supportAgent} 
                  alt="Damarys - Atendente" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Olá eu me chamo Damarys</p>
                  <p className="text-purple-200/70 text-xs">Sua atendente particular</p>
                </div>
              </div>
              <p className="text-white/80 text-xs">
                Qualquer dúvida me chame no whatsapp.
              </p>
              <Button 
                onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}