import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Building2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { clientService } from '@/services/clients'
import { useToast } from '@/hooks/use-toast'
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
import { ClientDialog } from '@/components/clients/ClientDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function Clients() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const fetchClients = async () => {
    if (!userProfile) return
    setLoading(true)
    const { data, error } = await clientService.getClients(userProfile.org_id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [userProfile])

  const filtered = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(search)),
  )

  const handleSave = async (data: any) => {
    if (!userProfile) return
    if (editingClient) {
      const { error } = await clientService.updateClient(editingClient.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Cliente atualizado.' })
    } else {
      const { error } = await clientService.createClient(userProfile.org_id, userProfile.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Cliente criado com sucesso.' })
    }
    fetchClients()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await clientService.deleteClient(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Cliente removido.' })
    fetchClients()
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie seu portfólio de clientes e seus documentos financeiros.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou CNPJ..."
              className="pl-9 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setEditingClient(null)
              setDialogOpen(true)
            }}
            className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Nome do Cliente</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-white">{c.client_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.cnpj || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.industry || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        Ver Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                        onClick={() => {
                          setEditingClient(c)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => {
                          setToDelete(c)
                          setConfirmOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingClient}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Todos os documentos vinculados serão perdidos permanentemente."
      />
    </div>
  )
}
