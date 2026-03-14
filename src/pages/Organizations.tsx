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
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { usePermissions } from '@/hooks/use-permissions'
import { OrgDialog } from '@/components/admin/OrgDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function Organizations() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()

  const canCreate = hasPermission('organizations', 'create')
  const canUpdate = hasPermission('organizations', 'update')
  const canDelete = hasPermission('organizations', 'delete')

  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const { data } = await adminService.getOrgs()
    if (data) setOrgs(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const handleSave = async (data: any) => {
    if (editingOrg) {
      const { error } = await adminService.updateOrg(editingOrg.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Organização atualizada.' })
    } else {
      const { error } = await adminService.createOrg(data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Organização criada.' })
    }
    loadData()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await adminService.deleteOrg(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Organização removida.' })
    loadData()
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizações</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os inquilinos (tenants) da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
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
                setEditingOrg(null)
                setDialogOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Org
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Nenhuma organização encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((o) => (
                <TableRow key={o.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        o.is_active
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-red-500/30 text-red-400 bg-red-500/10'
                      }
                    >
                      {o.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-primary"
                          onClick={() => {
                            setEditingOrg(o)
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
                            setToDelete(o)
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

      <OrgDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        org={editingOrg}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Organização"
        description="Tem certeza que deseja excluir? Esta ação removerá também todos os usuários e dados vinculados permanentemente."
      />
    </div>
  )
}
