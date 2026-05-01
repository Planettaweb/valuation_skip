import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService, PlanoConta } from '@/services/contabilidade'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

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
  const [tipo, setTipo] = useState('Todos')
  const [grupo, setGrupo] = useState('Todos')
  const [natureza, setNatureza] = useState('Todos')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PlanoConta | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!userProfile?.org_id) return
    try {
      setLoading(true)
      setError(null)
      const res = await contabilidadeService.getPlanoContas(
        userProfile.org_id,
        page,
        pageSize,
        search,
        tipo,
        grupo,
        natureza,
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
  }, [userProfile?.org_id, page, search, tipo, grupo, natureza])

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim())
        let imported = 0
        for (const row of lines.slice(1)) {
          const [codigo, nome, t, g, nat] = row
            .split(';')
            .map((s) => s.trim().replace(/^"|"$/g, ''))
          if (codigo && nome) {
            await contabilidadeService.createPlanoConta({
              org_id: userProfile!.org_id,
              codigo,
              nome_conta: nome,
              tipo: t,
              grupo: g,
              natureza: nat,
              ativo: true,
            })
            imported++
          }
        }
        toast({ title: 'Sucesso', description: `${imported} contas importadas.` })
        loadData()
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: 'Falha ao importar: ' + err.message,
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Importar CSV
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Tipos</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Passivo">Passivo</SelectItem>
            <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
            <SelectItem value="Receita">Receita</SelectItem>
            <SelectItem value="Despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger>
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Grupos</SelectItem>
            <SelectItem value="Circulante">Circulante</SelectItem>
            <SelectItem value="Não Circulante">Não Circulante</SelectItem>
            <SelectItem value="Operacional">Operacional</SelectItem>
            <SelectItem value="Não Operacional">Não Operacional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={natureza} onValueChange={setNatureza}>
          <SelectTrigger>
            <SelectValue placeholder="Natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as Naturezas</SelectItem>
            <SelectItem value="Devedora">Devedora</SelectItem>
            <SelectItem value="Credora">Credora</SelectItem>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <PlanoContaForm initialData={editingItem} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
