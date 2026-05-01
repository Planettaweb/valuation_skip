import {
  LayoutDashboard,
  Folder,
  Users,
  Settings,
  LogOut,
  Rocket,
  ChevronDown,
  ShieldCheck,
  Building2,
  Key,
  BookOpen,
  FileText,
  Network,
} from 'lucide-react'
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
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebar() {
  const location = useLocation()
  const { userProfile, signOut } = useAuth()

  const isAdmin = userProfile?.role === 'Admin'

  return (
    <Sidebar className="border-r-border bg-sidebar/80 backdrop-blur-xl">
      <SidebarContent>
        <div className="flex items-center gap-3 p-6 mb-2">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-sidebar-foreground">Nexus M&A</h2>
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
                <SidebarMenuButton asChild isActive={location.pathname.startsWith('/clients')}>
                  <Link
                    to="/clients"
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Users className="w-4 h-4" /> <span>Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/documents'}>
                  <Link
                    to="/documents"
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Folder className="w-4 h-4" /> <span>Repositório de Arquivos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible defaultOpen className="group/contabilidade">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center w-full hover:bg-sidebar-accent p-2 rounded-md transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground mt-2">
                Contabilidade
                <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/contabilidade:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2 px-2 mt-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/plano-contas'}>
                      <Link
                        to="/plano-contas"
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <BookOpen className="w-4 h-4" /> <span>Plano de Contas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/tipos-documentos'}>
                      <Link
                        to="/tipos-documentos"
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <FileText className="w-4 h-4" /> <span>Tipos de Documentos</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/matriz-relacionamento'}
                    >
                      <Link
                        to="/matriz-relacionamento"
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Network className="w-4 h-4" /> <span>Matriz de Relacionamento</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {isAdmin && (
          <Collapsible defaultOpen className="group/admin">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center w-full hover:bg-sidebar-accent p-2 rounded-md transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground mt-2">
                  Administração
                  <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/admin:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2 px-2 mt-2">
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
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname === '/organizations'}>
                        <Link
                          to="/organizations"
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Building2 className="w-4 h-4" /> <span>Organizações</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname === '/roles'}>
                        <Link
                          to="/roles"
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" /> <span>Perfis (RBAC)</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname === '/permissions'}>
                        <Link
                          to="/permissions"
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Key className="w-4 h-4" /> <span>Permissões</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
                  <Link
                    to="/settings"
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Settings className="w-4 h-4" /> <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenuButton
          onClick={signOut}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> <span>Sair da Sessão</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
