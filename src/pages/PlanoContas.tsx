import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService, PlanoConta, Taxonomia } from '@/services/contabilidade'
import { TaxonomiaManager } from '@/components/contabilidade/TaxonomiaManager'
import { Settings2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlanoContaForm } from '@/components/contabilidade/PlanoContaForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Upload, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ImportadorPlanoContas } from '@/components/contabilidade/ImportadorPlanoContas'

export default function PlanoContas() {
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<PlanoConta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20

  const [search, setSearch] = useState('')
  const [client, setClient] = useState('Todos')
  const [tipo, setTipo] = useState('Todos')
  const [grupo, setGrupo] = useState('Todos')
  const [natureza, setNatureza] = useState('Todos')

  const [clients, setClients] = useState<{ id: string; client_name: string }[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTaxonomiaModalOpen, setIsTaxonomiaModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PlanoConta | undefined>()

  const [taxonomias, setTaxonomias] = useState<Taxonomia[]>([])

  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [isClearing, setIsClearing] = useState(false)

  const loadData = async () => {
    if (!userProfile?.org_id) return
    try {
      setLoading(true)
      setError(null)

      const [taxRes, clientsRes] = await Promise.all([
        contabilidadeService.getTaxonomias(userProfile.org_id),
        contabilidadeService.getClients(userProfile.org_id),
      ])

      setTaxonomias(taxRes)
      setClients(clientsRes)

      const res = await contabilidadeService.getPlanoContas(
        userProfile.org_id,
        page,
        pageSize,
        search,
        tipo,
        grupo,
        natureza,
        client,
      )
      setData(res.data || [])
      setTotalPages(Math.ceil((res.count || 0) / pageSize) || 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userProfile?.org_id, page, search, tipo, grupo, natureza, client])

  const handleSubmit = async (formData: any) => {
    try {
      if (editingItem) {
        await contabilidadeService.updatePlanoConta(editingItem.id, formData)
        toast({ title: 'Conta atualizada com sucesso' })
      } else {
        await contabilidadeService.createPlanoConta({
          ...formData,
          org_id: userProfile!.org_id,
          ativo: true,
          client_id: formData.client_id || (client !== 'Todos' ? client : null),
        })
        toast({ title: 'Conta criada com sucesso' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta?')) return
    try {
      await contabilidadeService.deletePlanoConta(id)
      toast({ title: 'Conta excluída' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteAll = async () => {
    if (!userProfile?.org_id) return
    try {
      setIsClearing(true)
      await contabilidadeService.deleteAllPlanoContas(userProfile.org_id)
      toast({ title: 'Plano de Contas excluído com sucesso' })
      setIsClearAllModalOpen(false)
      setClearConfirmText('')
      setPage(1)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="destructive" onClick={() => setIsClearAllModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Tudo
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar CSV
          </Button>
          <Button variant="outline" onClick={() => setIsTaxonomiaModalOpen(true)}>
            <Settings2 className="w-4 h-4 mr-2" /> Categorias
          </Button>
          <Button
            onClick={() => {
              setEditingItem(undefined)
              setIsModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger>
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Tipos</SelectItem>
            {taxonomias
              .filter((t) => t.categoria === 'TIPO')
              .map((t) => (
                <SelectItem key={t.id} value={t.descricao}>
                  {t.descricao}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger>
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Grupos</SelectItem>
            {taxonomias
              .filter((t) => t.categoria === 'GRUPO')
              .map((t) => (
                <SelectItem key={t.id} value={t.descricao}>
                  {t.descricao}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={natureza} onValueChange={setNatureza}>
          <SelectTrigger>
            <SelectValue placeholder="Natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as Naturezas</SelectItem>
            {taxonomias
              .filter((t) => t.categoria === 'NATUREZA')
              .map((t) => (
                <SelectItem key={t.id} value={t.descricao}>
                  {t.descricao}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 bg-red-500/10 rounded-lg">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p className="mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>
            Tentar Novamente
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg text-muted-foreground">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">Nenhuma conta cadastrada</p>
          <p className="mb-4">Comece adicionando uma nova conta ou importando um CSV.</p>
          <Button
            onClick={() => {
              setEditingItem(undefined)
              setIsModalOpen(true)
            }}
          >
            Adicionar Conta
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Natureza</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="animate-fade-in-up">
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell>{item.nome_conta}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-muted-foreground"
                      title={item.descricao || ''}
                    >
                      {item.descricao || '-'}
                    </TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.grupo}</TableCell>
                    <TableCell>{item.natureza}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Clear All Modal */}
      <Dialog
        open={isClearAllModalOpen}
        onOpenChange={(open) => {
          setIsClearAllModalOpen(open)
          if (!open) setClearConfirmText('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Limpar Plano de Contas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação é <strong>irreversível</strong>. Todas as contas serão excluídas e os
              vínculos existentes na Matriz de Relacionamento serão removidos em cascata.
            </p>
            <div className="space-y-2">
              <Label>Digite EXCLUIR para confirmar</Label>
              <Input
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="EXCLUIR"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsClearAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={clearConfirmText !== 'EXCLUIR' || isClearing}
              onClick={handleDeleteAll}
            >
              {isClearing ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <PlanoContaForm
            initialData={editingItem}
            onSubmit={handleSubmit}
            taxonomias={taxonomias}
            clients={clients}
            defaultClientId={client !== 'Todos' ? client : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Taxonomia Modal */}
      <Dialog open={isTaxonomiaModalOpen} onOpenChange={setIsTaxonomiaModalOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias (Tipos, Grupos, Natureza)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <TaxonomiaManager taxonomias={taxonomias} onUpdate={loadData} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Import Modal */}
      <Dialog
        open={isImportModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsImportModalOpen(false)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importação Avançada de Plano de Contas</DialogTitle>
          </DialogHeader>
          <ImportadorPlanoContas
            clientId={client !== 'Todos' ? client : null}
            onComplete={() => {
              setIsImportModalOpen(false)
              loadData()
            }}
            onCancel={() => setIsImportModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
