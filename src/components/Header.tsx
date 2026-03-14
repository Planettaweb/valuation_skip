import { Bell, UserCircle } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import useAuthStore from '@/stores/useAuthStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-background/60 px-6 backdrop-blur-xl">
      <SidebarTrigger className="md:hidden" />

      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          <h1 className="text-sm font-medium text-muted-foreground hidden md:block">
            Organização: <span className="text-white ml-1">{user?.orgName || 'Desconhecida'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${user?.id}`} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium text-white">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.role}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-panel border-white/10">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer">Perfil</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
                onClick={logout}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
