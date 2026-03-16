import { useState, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, Check, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { documentService } from '@/services/documents'
import { clientService } from '@/services/clients'
import { UserProfile } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface Props {
  userProfile: UserProfile
  defaultClientId?: string
  onSuccess: () => void
}

export function DocumentUploadModal({ userProfile, defaultClientId, onSuccess }: Props) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [docType, setDocType] = useState('Balanço')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState(defaultClientId || '')

  const [step, setStep] = useState<'form' | 'processing' | 'preview' | 'saving'>('form')
  const [statusMessage, setStatusMessage] = useState('')
  const [parsedPreview, setParsedPreview] = useState<{
    metadataObj: any
    rowsData: any[]
    rawText?: string
  } | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      clientService.getClients(userProfile.org_id).then((res) => {
        if (res.data) {
          setClients(res.data)
          if (defaultClientId && res.data.some((c) => c.id === defaultClientId)) {
            setSelectedClient(defaultClientId)
          }
        }
      })
    }
  }, [isOpen, userProfile.org_id, defaultClientId])

  const validateAndSetFile = (f?: File) => {
    if (!f) return
    const nameLower = f.name.toLowerCase()
    if (
      !nameLower.endsWith('.pdf') &&
      !nameLower.endsWith('.csv') &&
      !nameLower.endsWith('.xlsx')
    ) {
      toast({
        title: 'Formato inválido',
        description: 'A extração suporta apenas PDF, CSV e XLSX.',
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

  const handleProcessPreview = async () => {
    if (!file || !selectedClient) return
    setStep('processing')
    setStatusMessage('Iniciando processamento local e validação...')

    try {
      const parsed = await documentService.parseDocumentLocal(file, docType, setStatusMessage)
      setParsedPreview(parsed)
      setPreviewRows(parsed.rowsData || [])
      setStep('preview')
    } catch (err: any) {
      toast({ title: 'Erro de Processamento', description: err.message, variant: 'destructive' })
      setStep('form')
    }
  }

  const handleConfirmSave = async () => {
    if (!file || !selectedClient || !parsedPreview) return
    setStep('saving')
    setStatusMessage('Iniciando gravação no SharePoint e Banco de Dados...')

    const payload = {
      metadataObj: parsedPreview.metadataObj,
      rowsData: previewRows,
    }

    const { error } = await documentService.saveParsedDocument(
      file,
      userProfile.org_id,
      userProfile.id,
      selectedClient,
      docType,
      payload,
      setStatusMessage,
    )

    if (error) {
      toast({ title: 'Erro de Gravação', description: error.message, variant: 'destructive' })
      setStep('preview')
    } else {
      toast({
        title: 'Documento Salvo',
        description: 'Os dados extraídos foram validados e persistidos com sucesso.',
      })
      setIsOpen(false)
      resetState()
      onSuccess()
    }
  }

  const resetState = () => {
    setFile(null)
    setStep('form')
    setParsedPreview(null)
    setPreviewRows([])
    setStatusMessage('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetState()
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const calculatedSum = previewRows.reduce((acc, row) => acc + (row.value || 0), 0)
  const extractedTotal = parsedPreview?.metadataObj?.extractedTotal || 0
  const hasDiscrepancy = parsedPreview && Math.abs(calculatedSum - extractedTotal) > 0.01

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <Upload className="w-4 h-4 mr-2" /> Upload Inteligente
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'glass-panel border-white/10 transition-all duration-300',
          step === 'preview' ? 'sm:max-w-4xl max-h-[95vh]' : 'sm:max-w-md',
        )}
      >
        <DialogHeader>
          <DialogTitle>Processar Documento Financeiro</DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Faça o upload e selecione o cliente e o modelo de extração.'
              : 'Revise os dados estruturados extraídos antes de persistir.'}
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground px-4">
              Você precisa cadastrar um cliente antes de fazer o upload de documentos.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/clients" onClick={() => setIsOpen(false)}>
                Cadastrar Cliente
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {step === 'form' && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cliente</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                      disabled={!!defaultClientId}
                    >
                      <SelectTrigger className="bg-card/50 border-white/10">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Modelo de Extração</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="bg-card/50 border-white/10">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Balanço">Balanço</SelectItem>
                        <SelectItem value="DRE">DRE</SelectItem>
                        <SelectItem value="Balancete">Balancete</SelectItem>
                        <SelectItem value="Fluxo de Caixa">Fluxo de Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
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
                    accept=".pdf,.csv,.xlsx"
                  />
                  <Upload
                    className={cn(
                      'w-8 h-8 mx-auto mb-3 transition-colors',
                      file ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  {file ? (
                    <div className="space-y-1 animate-fade-in">
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <p className="text-sm font-medium text-white">
                        Arraste e solte o documento aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ou clique para buscar no computador (.pdf, .csv, .xlsx)
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleProcessPreview}
                  disabled={!file || !selectedClient}
                  className="w-full mt-2"
                >
                  Extrair e Validar Dados
                </Button>
              </div>
            )}

            {(step === 'processing' || step === 'saving') && (
              <div className="w-full py-12 flex flex-col items-center justify-center gap-4 animate-in fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <h4 className="font-medium text-lg text-foreground">
                    {step === 'processing' ? 'Analisando Documento' : 'Salvando Dados'}
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-[280px] animate-pulse">
                    {statusMessage}
                  </p>
                </div>
              </div>
            )}

            {step === 'preview' && parsedPreview && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">Revisão Tabular</h3>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded">
                      {previewRows.length} registros extraídos
                    </span>
                    {!hasDiscrepancy && previewRows.length > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Soma Validada: {formatCurrency(calculatedSum)}
                      </Badge>
                    ) : previewRows.length > 0 ? (
                      <Badge
                        variant="destructive"
                        className="bg-destructive/10 text-destructive border-destructive/20"
                      >
                        Divergência: {formatCurrency(calculatedSum)} vs{' '}
                        {formatCurrency(extractedTotal)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {hasDiscrepancy && previewRows.length > 0 && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Discrepância Detectada na Validação</AlertTitle>
                    <AlertDescription>
                      Aviso: A soma dos registros diverge do total informado no documento.
                    </AlertDescription>
                  </Alert>
                )}

                {previewRows.length === 0 ? (
                  <div className="border border-white/10 rounded-md bg-card/50 p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-base font-medium text-white">
                      Nenhum dado contábil encontrado.
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Por favor, verifique se o arquivo possui dados legíveis. Documentos
                      digitalizados como imagens não são suportados atualmente.
                    </p>
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-md flex-1 overflow-hidden flex flex-col bg-card/50 max-h-[50vh]">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[120px]">Código de Classificação</TableHead>
                            <TableHead>Descrição da Conta</TableHead>
                            <TableHead className="text-right w-[150px]">
                              Valor Período Atual
                            </TableHead>
                            <TableHead className="text-right w-[150px]">
                              Valor Período Anterior
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row: any, i: number) => (
                            <TableRow key={i} className="border-white/5">
                              <TableCell className="font-medium text-xs text-white/90">
                                {row.classification_code || '-'}
                              </TableCell>
                              <TableCell className="text-xs text-white/80">
                                {row.description}
                              </TableCell>
                              <TableCell className="text-right text-xs">
                                {row.value != null ? formatCurrency(row.value) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs">
                                {row.raw?.valor_exercicio_anterior != null
                                  ? formatCurrency(row.raw.valor_exercicio_anterior)
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                  onClick={() => {
                                    const newRows = [...previewRows]
                                    newRows.splice(i, 1)
                                    setPreviewRows(newRows)
                                  }}
                                  title="Remover linha"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-white/5">
                  <Button
                    variant="outline"
                    onClick={() => setStep('form')}
                    disabled={step === 'saving'}
                    className="border-white/10"
                  >
                    Voltar e Descartar
                  </Button>
                  <Button
                    onClick={handleConfirmSave}
                    disabled={step === 'saving' || previewRows.length === 0}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" /> Confirmar e Gravar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
