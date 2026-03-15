import { FileText, Download, Trash2, Loader2, Eye } from 'lucide-react'
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
import { StatusBadge } from './StatusBadge'

interface Props {
  documents: any[]
  loading: boolean
  canDelete: boolean
  onDownload: (path: string) => void
  onDelete: (id: string, path: string | null) => void
  onViewDetails: (doc: any) => void
}

export function DocumentListTable({
  documents,
  loading,
  canDelete,
  onDownload,
  onDelete,
  onViewDetails,
}: Props) {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead>Arquivo</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </TableCell>
            </TableRow>
          ) : documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                      <span
                        className="truncate max-w-[150px] sm:max-w-[200px]"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatBytes(doc.file_size)}
                        {!doc.file_path && ' (Efêmero)'}
                      </span>
                    </div>
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
                <TableCell className="text-muted-foreground">
                  {doc.users?.full_name || 'Desconhecido'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={doc.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    {doc.status === 'Completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 mr-2"
                        onClick={() => onViewDetails(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Visualizar Dados
                      </Button>
                    )}
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
  )
}
