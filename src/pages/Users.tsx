import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { usePermissions } from '@/hooks/use-permissions'
import { UserDialog } from '@/components/admin/UserDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Users() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()

  const canCreate = hasPermission('users', 'create')
  const canUpdate = hasPermission('users', 'update')
  const canDelete = hasPermission('users', 'delete')

  const [users, setUsers] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const [uRes, oRes, rRes] = await Promise.all([
      adminService.getUsers(),
      adminService.getOrgs(),
      adminService.getRoles(),
    ])
    if (uRes.data) setUsers(uRes.data)
    if (oRes.data) setOrgs(oRes.data)
    if (rRes.data) setRoles(rRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const handleSave = async (data: any) => {
    if (editingUser) {
      const { error } = await adminService.updateUser(editingUser.id, data, data.role_id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Usuário atualizado.' })
    } else {
      const { error } = await adminService.createUser(data, data.role_id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Usuário criado.' })
    }
    loadData()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await adminService.deleteUser(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Usuário removido.' })
    loadData()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await adminService.toggleUserActive(id, !current)
    if (!error) {
      toast({
        title: 'Status Atualizado',
        description: `Usuário agora está ${!current ? 'ativo' : 'inativo'}.`,
      })
      loadData()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground text-sm">
            Administre os acessos em toda a plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-9 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                setEditingUser(null)
                setDialogOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Usuário
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((u) => {
                const roleName = u.users_roles?.[0]?.roles?.name || 'Sem Perfil'
                const orgName = Array.isArray(u.organizations)
                  ? u.organizations[0]?.name
                  : u.organizations?.name || 'Desconhecida'
                return (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`}
                          />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {u.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {u.full_name || 'Sem Nome'}
                          </span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{orgName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5">
                        {roleName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.is_active}
                        onCheckedChange={() => handleToggleActive(u.id, u.is_active)}
                        disabled={!canUpdate}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            onClick={() => {
                              setEditingUser(u)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => {
                              setToDelete(u)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Mostrando {paginated.length} de {filtered.length}
        </span>
        <div className="flex gap-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent hover:bg-white/5"
          >
            Anterior
          </Button>
          <Button
            disabled={page * limit >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent hover:bg-white/5"
          >
            Próximo
          </Button>
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        orgs={orgs}
        roles={roles}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        description="Tem certeza que deseja excluir este usuário? O acesso será revogado permanentemente."
      />
    </div>
  )
}
