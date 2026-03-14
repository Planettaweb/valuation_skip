import { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Upload, Search, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'

export default function Documents() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Analyst'

  const fetchDocs = async () => {
    if (!userProfile) return
    const { data } = await documentService.getDocuments(userProfile.org_id)
    if (data) setDocuments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchDocs()
  }, [userProfile])

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpload = async () => {
    if (!file || !userProfile) return
    setUploading(true)
    const { error } = await documentService.uploadDocument(file, userProfile.org_id, userProfile.id)
    if (error) {
      toast({ title: 'Erro no Upload', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso.' })
      setIsUploadOpen(false)
      setFile(null)
      fetchDocs()
    }
    setUploading(false)
  }

  const handleDelete = async (id: string, filePath: string) => {
    const { error } = await documentService.deleteDocument(id, filePath)
    if (error) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Deletado', description: 'Documento removido.' })
      fetchDocs()
    }
  }

  const handleDownload = async (filePath: string) => {
    const { data, error } = await documentService.getDownloadUrl(filePath)
    if (error) {
      toast({ title: 'Erro no Download', description: error.message, variant: 'destructive' })
    } else if (data) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositório de Documentos</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie arquivos confidenciais de forma segura.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documento..."
              className="pl-9 bg-card/50 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canEdit && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-white/10 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Fazer Upload de Documento</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex flex-col items-center gap-4">
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="bg-card/50 border-white/10"
                  />
                  <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                      </>
                    ) : (
                      'Confirmar Upload'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Data</TableHead>
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
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {doc.filename}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatBytes(doc.file_size)}
                  </TableCell>
                  <TableCell>{doc.users?.full_name || 'Desconhecido'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                        onClick={() => handleDownload(doc.file_path)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => handleDelete(doc.id, doc.file_path)}
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
    </div>
  )
}
