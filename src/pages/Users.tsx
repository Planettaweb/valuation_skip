import { useState, useEffect } from 'react'
import { ShieldAlert, UserPlus, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { userService } from '@/services/users'
import { useToast } from '@/hooks/use-toast'

export default function Users() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [rolesList, setRolesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    if (!userProfile) return
    const [uRes, rRes] = await Promise.all([
      userService.getUsers(userProfile.org_id),
      userService.getRoles(),
    ])
    if (uRes.data) setUsers(uRes.data)
    if (rRes.data) setRolesList(rRes.data)
    setLoading(false)
  }

  useEffect(() => {
    if (userProfile?.role === 'Admin') {
      fetchUsers()
    }
  }, [userProfile])

  if (userProfile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores podem visualizar e gerenciar usuários.
        </p>
      </div>
    )
  }

  const handleToggleActive = async (userId: string, current: boolean) => {
    await userService.toggleActive(userId, !current)
    toast({
      title: 'Status Atualizado',
      description: `Usuário agora está ${!current ? 'ativo' : 'inativo'}.`,
    })
    fetchUsers()
  }

  const handleRoleChange = async (userId: string, roleName: string) => {
    const roleId = rolesList.find((r) => r.name === roleName)?.id
    if (!roleId) return
    await userService.updateRole(userId, roleId)
    toast({ title: 'Acesso Atualizado', description: `Nível de acesso alterado para ${roleName}.` })
    fetchUsers()
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-none hover:bg-red-500/30">
            Admin
          </Badge>
        )
      case 'Analyst':
        return (
          <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30">
            Analista
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-white/10 text-white/70 border-none hover:bg-white/20"
          >
            Visualizador
          </Badge>
        )
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground text-sm">
            Controle de acesso da organização {userProfile.org_name}.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() =>
            toast({
              title: 'Aviso',
              description: 'Para novos membros, peça que registrem-se na tela inicial.',
            })
          }
        >
          <UserPlus className="w-4 h-4 mr-2" /> Orientações
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nível de Acesso</TableHead>
              <TableHead className="text-right">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const currentRole = u.users_roles?.[0]?.roles?.name || 'Viewer'
                return (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage
                          src={`https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {u.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {u.full_name || 'Sem Nome'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.id === userProfile.id ? (
                        getRoleBadge(currentRole)
                      ) : (
                        <Select
                          value={currentRole}
                          onValueChange={(val) => handleRoleChange(u.id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8 bg-card/50 border-white/10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/10">
                            {rolesList.map((r) => (
                              <SelectItem key={r.id} value={r.name}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center">
                        <Switch
                          checked={u.is_active}
                          onCheckedChange={() => handleToggleActive(u.id, u.is_active)}
                          disabled={u.id === userProfile.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
