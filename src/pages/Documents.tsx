import { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Upload, Search, Loader2, Eye } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Completed':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          Concluído
        </Badge>
      )
    case 'Processing':
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Processando</Badge>
    case 'Error':
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Erro</Badge>
    case 'Uploaded':
      return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Na Fila</Badge>
    default:
      return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">{status}</Badge>
  }
}

const ExtractedDataView = ({ data, type }: { data: any[]; type: string }) => {
  if (!data || data.length === 0)
    return <p className="text-center text-muted-foreground py-8">Nenhum dado extraído.</p>

  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  if (type === 'Balanço Patrimonial') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Ano N</TableHead>
            <TableHead className="text-right">Ano N-1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-muted-foreground">{r.classification_code}</TableCell>
              <TableCell className="font-medium">{r.description}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.value_year_n)}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.value_year_n_minus_1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (type === 'DRE') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Soma</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="font-medium">{r.description}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.balance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.sum)}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (type === 'Balancete') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Código</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Saldo Anterior</TableHead>
            <TableHead className="text-right">Débito</TableHead>
            <TableHead className="text-right">Crédito</TableHead>
            <TableHead className="text-right">Saldo Atual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-muted-foreground">{r.classification_code}</TableCell>
              <TableCell className="font-medium">{r.account_description}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.previous_balance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.debit)}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.credit)}</TableCell>
              <TableCell className="text-right font-medium text-emerald-400">
                {formatCurrency(r.current_balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (type === 'Fluxo de Caixa') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Período</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
              <TableCell className="text-muted-foreground">{r.period}</TableCell>
              <TableCell className="font-medium">{r.description}</TableCell>
              <TableCell
                className={cn('text-right', r.value < 0 ? 'text-red-400' : 'text-emerald-400')}
              >
                {formatCurrency(r.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return <p className="text-center text-muted-foreground py-8">Modelo de dados não reconhecido.</p>
}

export default function Documents() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('Balanço Patrimonial')
  const [uploading, setUploading] = useState(false)

  const [loading, setLoading] = useState(true)

  const [viewDoc, setViewDoc] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Analyst'

  const fetchDocs = async () => {
    if (!userProfile) return
    const { data } = await documentService.getDocuments(userProfile.org_id)
    if (data) setDocuments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchDocs()

    if (!userProfile) return
    const channel = supabase
      .channel('realtime_documents_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `org_id=eq.${userProfile.org_id}`,
        },
        () => fetchDocs(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const validateAndSetFile = (f?: File) => {
    if (!f) return
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ]
    if (
      !allowedTypes.includes(f.type) &&
      !f.name.endsWith('.csv') &&
      !f.name.endsWith('.xls') &&
      !f.name.endsWith('.xlsx')
    ) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas PDF, Excel e CSV são suportados.',
        variant: 'destructive',
      })
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O limite máximo é de 10MB.',
        variant: 'destructive',
      })
      return
    }
    setFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    validateAndSetFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file || !userProfile) return
    setUploading(true)
    const { error } = await documentService.uploadDocument(
      file,
      userProfile.org_id,
      userProfile.id,
      docType,
    )
    if (error) {
      toast({ title: 'Erro no Upload', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Upload Iniciado',
        description: 'O documento está sendo processado em background.',
      })
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
      toast({ title: 'Deletado', description: 'Documento e dados vinculados removidos.' })
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

  const handleViewDetails = async (doc: any) => {
    setViewDoc(doc)
    setLoadingData(true)
    const { data } = await documentService.getExtractedData(doc.id, doc.document_type)
    setExtractedData(data || [])
    setLoadingData(false)
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
          <h2 className="text-2xl font-bold tracking-tight">Repositório Financeiro</h2>
          <p className="text-muted-foreground text-sm">
            Faça upload e gerencie a extração automática de dados contábeis.
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
                  <Upload className="w-4 h-4 mr-2" /> Upload Inteligente
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-white/10 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Processar Documento Financeiro</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Modelo de Extração</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="bg-card/50 border-white/10">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Balanço Patrimonial">Balanço Patrimonial</SelectItem>
                        <SelectItem value="DRE">DRE</SelectItem>
                        <SelectItem value="Balancete">Balancete</SelectItem>
                        <SelectItem value="Fluxo de Caixa">Fluxo de Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-white/20 bg-card/30 hover:bg-white/5',
                      file ? 'border-primary/50' : '',
                    )}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                      accept=".pdf,.xls,.xlsx,.csv"
                    />
                    <Upload
                      className={cn(
                        'w-8 h-8 mx-auto mb-4',
                        file ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    {file ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-white">
                          Arraste e solte o documento aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ou clique para buscar no computador
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono bg-white/5 inline-block px-2 py-1 rounded">
                          .pdf, .xls, .csv
                        </p>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="w-full space-y-2 mt-2">
                      <Progress value={undefined} className="h-2 bg-primary/20" />
                      <p className="text-xs text-center text-primary animate-pulse">
                        Iniciando pipeline de extração...
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full mt-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando...
                      </>
                    ) : (
                      'Confirmar Upload e Extrair'
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
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]" title={doc.filename}>
                          {doc.filename}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatBytes(doc.file_size)}
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
                    <div className="flex justify-end gap-1">
                      {doc.status === 'Completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-400"
                          onClick={() => handleViewDetails(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleDownload(doc.file_path)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
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

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Extrato Estruturado - {viewDoc?.document_type}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{viewDoc?.filename}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-card/30 mt-2 p-1">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Carregando dados estruturados...
                </p>
              </div>
            ) : (
              <ExtractedDataView data={extractedData} type={viewDoc?.document_type} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
