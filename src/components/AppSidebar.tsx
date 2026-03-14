import { LayoutDashboard, Folder, Users, Settings, LogOut, Rocket } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebar() {
  const location = useLocation()
  const { userProfile, signOut } = useAuth()

  const isAdmin = userProfile?.role === 'Admin'

  return (
    <Sidebar className="border-r-white/5 bg-sidebar/80 backdrop-blur-xl">
      <SidebarContent>
        <div className="flex items-center gap-3 p-6 mb-4">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Nearbound</h2>
            <p className="text-[10px] text-primary uppercase tracking-widest font-semibold">
              Platform 2.0
            </p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                  <Link to="/" className="hover:bg-primary/10 hover:text-primary transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> <span>Painel (Início)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/documents'}>
                  <Link
                    to="/documents"
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Folder className="w-4 h-4" /> <span>Documentos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/users'}>
                    <Link
                      to="/users"
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Users className="w-4 h-4" /> <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="#" className="hover:bg-primary/10 hover:text-primary transition-colors">
                    <Settings className="w-4 h-4" /> <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenuButton
          onClick={signOut}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> <span>Sair da Sessão</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
