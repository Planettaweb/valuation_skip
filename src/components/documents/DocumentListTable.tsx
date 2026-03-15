import { useState, useMemo, useEffect } from 'react'
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Inbox,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from './StatusBadge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface Props {
  documents: any[]
  loading: boolean
  canDelete: boolean
  onDownload: (path: string) => void
  onDelete: (id: string, path: string | null) => void
  onViewDetails: (doc: any) => void
}

const PAGE_SIZE = 10

export function DocumentListTable({
  documents,
  loading,
  canDelete,
  onDownload,
  onDelete,
  onViewDetails,
}: Props) {
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<'filename' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setPage(1)
  }, [documents.length])

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  const handleSort = (field: 'filename' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: 'filename' | 'created_at' }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    )
  }

  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      if (sortField === 'filename') {
        return sortOrder === 'asc'
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename)
      } else {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
    })
  }, [documents, sortField, sortOrder])

  const totalPages = Math.ceil(sortedDocs.length / PAGE_SIZE)
  const currentData = sortedDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('filename')}
              >
                <div className="flex items-center">
                  Arquivo <SortIcon field="filename" />
                </div>
              </TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Data <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-full max-w-[150px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <div className="p-3 rounded-full bg-white/5">
                      <Inbox className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-base font-medium">Nenhum documento encontrado.</p>
                    <p className="text-sm opacity-70">Os documentos enviados aparecerão aqui.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span
                        className="truncate max-w-[150px] sm:max-w-[250px]"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-white/5 text-muted-foreground border-white/10"
                    >
                      {doc.document_type || 'Desconhecido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {formatBytes(doc.file_size)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(doc.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={doc.status !== 'Completed' && doc.status !== 'Processed'}
                        className="h-8 text-xs border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        onClick={() => onViewDetails(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Visualizar Dados
                      </Button>

                      {doc.file_path && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onDownload(doc.file_path)}
                          title="Download Arquivo Físico"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => onDelete(doc.id, doc.file_path)}
                          title="Excluir"
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

      {!loading && totalPages > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground px-4">
                Página {page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
