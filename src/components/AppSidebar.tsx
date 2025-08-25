import { useState, useEffect } from "react"
import { Home, User, Network, TrendingUp, Settings, Users, Package, DollarSign, CreditCard } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"

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

export function AppSidebar() {
  const { open, setOpen } = useSidebar()
  const location = useLocation()
  const { t } = useLanguage()
  const currentPath = location.pathname

  const items = [
    { title: t('navigation.dashboard'), url: "/dashboard", icon: Home },
    { title: t('navigation.profile'), url: "/dashboard/profile", icon: User },
    { title: t('navigation.network'), url: "/dashboard/network", icon: Network },
    { title: t('navigation.signals'), url: "/dashboard/signals", icon: TrendingUp },
    { title: t('navigation.members'), url: "/dashboard/members", icon: Users },
    { title: t('navigation.materials'), url: "/dashboard/materials", icon: Package },
    { title: t('navigation.plans'), url: "/dashboard/plans", icon: CreditCard },
    { title: t('navigation.withdrawals'), url: "/dashboard/withdrawals", icon: DollarSign },
  ]

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-purple-600/30 text-purple-300 border-purple-500/50" : "hover:bg-purple-900/30 hover:text-purple-200"

  return (
    <Sidebar
      className={open ? "w-60" : "w-14"}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-b from-purple-900 via-black to-orange-600 backdrop-blur-xl border-r border-purple-500/20">
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-200/80">{t('navigation.dashboard')}</SidebarGroupLabel>

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
                      <item.icon className="w-4 h-4" />
                      {open && <span className="text-white group-hover:text-purple-200 transition-colors">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}