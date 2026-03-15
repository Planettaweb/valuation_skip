import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, Folder, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { clientService } from '@/services/clients'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ValuationDialog } from '@/components/valuations/ValuationDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>()
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [client, setClient] = useState<any>(null)
  const [valuations, setValuations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVal, setEditingVal] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const fetchData = async () => {
    if (!clientId) return
    setLoading(true)
    const [clientRes, valRes] = await Promise.all([
      clientService.getClient(clientId),
      clientService.getValuations(clientId),
    ])
    if (clientRes.data) setClient(clientRes.data)
    if (valRes.data) setValuations(valRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  const handleSave = async (data: any) => {
    if (!userProfile || !clientId) return
    if (editingVal) {
      const { error } = await clientService.updateValuation(editingVal.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Projeto atualizado.' })
    } else {
      const { error } = await clientService.createValuation(userProfile.org_id, clientId, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Projeto criado com sucesso.' })
    }
    fetchData()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await clientService.deleteValuation(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Projeto removido.' })
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-medium">Cliente não encontrado.</h2>
        <Link to="/clients" className="text-primary hover:underline mt-4 inline-block">
          Voltar para Clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <Link
        to="/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/30 p-6 rounded-xl border border-white/5 backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{client.client_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {client.cnpj && <span>CNPJ: {client.cnpj}</span>}
            {client.industry && <span>Setor: {client.industry}</span>}
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingVal(null)
            setDialogOpen(true)
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Projeto
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Nome do Projeto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SharePoint</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {valuations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum projeto encontrado para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              valuations.map((v) => (
                <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{v.valuation_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white/5">
                      {v.valuation_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        v.status === 'Concluído'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                      }
                    >
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.sharepoint_folder_path ? (
                      <a
                        href={v.sharepoint_folder_path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Acessar Pasta
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não configurado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link to={`/documents?valuationId=${v.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Folder className="w-4 h-4 mr-2" /> Documentos
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                        onClick={() => {
                          setEditingVal(v)
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
                          setToDelete(v)
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

      <ValuationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingVal}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Todos os documentos financeiros vinculados serão perdidos."
      />
    </div>
  )
}
