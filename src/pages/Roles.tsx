import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { usePermissions } from '@/hooks/use-permissions'
import { RoleDialog } from '@/components/admin/RoleDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function Roles() {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { toast } = useToast()

  const canCreate = hasPermission('roles', 'create')
  const canUpdate = hasPermission('roles', 'update')
  const canDelete = hasPermission('roles', 'delete')

  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const { data } = await adminService.getRoles()
    if (data) setRoles(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (data: any) => {
    if (editingRole) {
      const { error } = await adminService.updateRole(editingRole.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Perfil atualizado.' })
    } else {
      const { error } = await adminService.createRole(data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Perfil criado.' })
    }
    loadData()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await adminService.deleteRole(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Perfil removido.' })
    loadData()
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Perfis de Acesso (RBAC)</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os níveis de acesso e capacidades dos usuários.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Button
              onClick={() => {
                setEditingRole(null)
                setDialogOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Perfil
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Nome do Perfil</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  Nenhum perfil encontrado.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.description || 'Nenhuma descrição'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/permissions?roleId=${r.id}`)}
                      >
                        <Key className="w-3 h-3 mr-1" /> Permissões
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-primary"
                          onClick={() => {
                            setEditingRole(r)
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
                            setToDelete(r)
                            setConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={editingRole}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Perfil"
        description="Tem certeza que deseja excluir este perfil? Usuários associados a ele perderão seus acessos."
      />
    </div>
  )
}
