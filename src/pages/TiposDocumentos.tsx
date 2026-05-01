import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService, TipoDocumento } from '@/services/contabilidade'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TipoDocumentoForm } from '@/components/contabilidade/TipoDocumentoForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'

export default function TiposDocumentos() {
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<TipoDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TipoDocumento | undefined>()

  const loadData = async () => {
    if (!userProfile?.org_id) return
    try {
      setLoading(true)
      const res = await contabilidadeService.getTiposDocumentos(
        userProfile.org_id,
        page,
        pageSize,
        search,
      )
      setData(res.data || [])
      setTotalPages(Math.ceil((res.count || 0) / pageSize) || 1)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userProfile?.org_id, page, search])

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  const handleSubmit = async (formData: any) => {
    try {
      const slug = generateSlug(formData.descricao)
      if (editingItem) {
        await contabilidadeService.updateTipoDocumento(editingItem.id, { ...formData, slug })
        toast({ title: 'Tipo atualizado com sucesso' })
      } else {
        await contabilidadeService.createTipoDocumento({
          ...formData,
          slug,
          org_id: userProfile!.org_id,
        })
        toast({ title: 'Tipo criado com sucesso' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este tipo de documento?')) return
    try {
      await contabilidadeService.deleteTipoDocumento(id)
      toast({ title: 'Tipo excluído' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tipos de Documentos</h1>
        <Button
          onClick={() => {
            setEditingItem(undefined)
            setIsModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Tipo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center p-12 text-red-500 bg-red-500/10 rounded-lg">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p className="mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>
            Tentar Novamente
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center p-12 border border-dashed rounded-lg text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-4 text-primary" />
          <p className="text-lg font-medium text-foreground mb-1">Nenhum tipo cadastrado</p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditingItem(undefined)
              setIsModalOpen(true)
            }}
          >
            Adicionar Tipo
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="animate-fade-in-up">
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                    <TableCell>
                      <Badge variant={item.ativo ? 'default' : 'secondary'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
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
                        className="text-red-500"
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
            <DialogTitle>{editingItem ? 'Editar Tipo' : 'Novo Tipo'}</DialogTitle>
          </DialogHeader>
          <TipoDocumentoForm initialData={editingItem} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
