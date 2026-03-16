import { useState, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, Check, Trash2, Plus, Info } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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

  const [docType, setDocType] = useState('Balanço Patrimonial')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState(defaultClientId || '')

  const [step, setStep] = useState<'form' | 'processing' | 'preview' | 'saving'>('form')
  const [statusMessage, setStatusMessage] = useState('')
  const [diagnosticMsg, setDiagnosticMsg] = useState('')
  const [parsedPreview, setParsedPreview] = useState<{
    metadataObj: any
    rowsData: any[]
    noise?: any[]
    rawText?: string
  } | null>(null)

  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [noiseRows, setNoiseRows] = useState<any[]>([])
  const [showNoise, setShowNoise] = useState(false)

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
    setStatusMessage('Iniciando processamento e validação...')
    setDiagnosticMsg('')
    setShowNoise(false)

    try {
      const parsed = await documentService.parseDocumentLocal(file, docType, setStatusMessage)
      setParsedPreview(parsed)
      setPreviewRows(parsed.rowsData || [])
      setNoiseRows(parsed.noise || [])
      if (parsed.diagnostic) setDiagnosticMsg(parsed.diagnostic)
      setStep('preview')
    } catch (err: any) {
      if (err.message?.includes('não suportado')) {
        toast({ title: 'Erro de Formato', description: err.message, variant: 'destructive' })
        setStep('form')
      } else {
        setDiagnosticMsg(err.message || 'Falha ao extrair dados. Entre no modo de Reparo Manual.')
        setParsedPreview({ metadataObj: {}, rowsData: [] })
        setPreviewRows([])
        setNoiseRows([])
        setStep('preview')
      }
    }
  }

  const handleConfirmSave = async () => {
    if (!file || !selectedClient) return
    setStep('saving')
    setStatusMessage('Iniciando gravação no SharePoint e Banco de Dados...')

    const payload = {
      metadataObj: parsedPreview?.metadataObj || {},
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
    setNoiseRows([])
    setDiagnosticMsg('')
    setShowNoise(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetState()
  }

  const handleUpdateRow = (index: number, field: string, value: any, isRaw = false) => {
    const newRows = [...previewRows]
    if (isRaw) {
      newRows[index] = {
        ...newRows[index],
        raw: { ...(newRows[index].raw || {}), [field]: value },
      }
    } else {
      newRows[index] = { ...newRows[index], [field]: value }
    }
    setPreviewRows(newRows)
  }

  const handleAddRow = () => {
    setPreviewRows([
      ...previewRows,
      {
        account_code: '',
        classification_code: '',
        description: '',
        value: 0,
        period: '',
        raw: {
          valor_exercicio_anterior: null,
          previous_balance: null,
          debit: null,
          credit: null,
          sum: null,
          total: null,
          planned_value: null,
        },
      },
    ])
  }

  const handleRemoveRow = (i: number) => {
    const newRows = [...previewRows]
    newRows.splice(i, 1)
    setPreviewRows(newRows)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (step !== 'preview') return
    const text = e.clipboardData.getData('Text')
    if (!text) return

    const lines = text.split('\n')
    const newRows = []
    for (const line of lines) {
      const cols = line
        .split('\t')
        .map((c) => c.trim())
        .filter(Boolean)
      if (cols.length >= 2) {
        let valStr = cols[cols.length - 1]
        let isNeg = valStr.includes('(') || valStr.startsWith('-')
        let parsed = parseFloat(valStr.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
        if (isNeg && parsed > 0) parsed = -parsed

        newRows.push({
          account_code: cols.length >= 3 ? cols[0] : null,
          classification_code: null,
          description: cols.length >= 3 ? cols.slice(1, -1).join(' ') : cols[0],
          value: parsed,
          raw: {},
        })
      }
    }
    if (newRows.length > 0) {
      e.preventDefault()
      setPreviewRows([...previewRows, ...newRows])
      toast({ title: 'Dados Colados', description: `${newRows.length} linhas adicionadas.` })
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const calculatedSum = previewRows.reduce((acc, row) => acc + (row.value || 0), 0)
  const extractedTotal = parsedPreview?.metadataObj?.extractedTotal || 0
  const hasDiscrepancy =
    parsedPreview?.metadataObj &&
    extractedTotal > 0 &&
    Math.abs(calculatedSum - extractedTotal) > 0.01

  const renderTableHeaders = () => {
    if (docType === 'Balancete') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[100px]">Código</TableHead>
          <TableHead className="w-[120px]">Classificação</TableHead>
          <TableHead>Descrição da conta</TableHead>
          <TableHead className="text-right w-[120px]">Saldo Anterior</TableHead>
          <TableHead className="text-right w-[100px]">Débito</TableHead>
          <TableHead className="text-right w-[100px]">Crédito</TableHead>
          <TableHead className="text-right w-[120px]">Saldo Atual</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    if (docType === 'Balanço' || docType === 'Balanço Patrimonial') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[100px]">Codigo</TableHead>
          <TableHead className="w-[120px]">Classificacao</TableHead>
          <TableHead>Descricao</TableHead>
          <TableHead className="text-right w-[140px]">Ano atual</TableHead>
          <TableHead className="text-right w-[140px]">Ano anterior</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    if (docType === 'DRE') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead>Descricao</TableHead>
          <TableHead className="text-right w-[140px]">Saldo</TableHead>
          <TableHead className="text-right w-[140px]">Soma</TableHead>
          <TableHead className="text-right w-[140px]">Total</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    if (docType === 'Fluxo de Caixa') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead>Descricao</TableHead>
          <TableHead className="w-[120px]">Mes</TableHead>
          <TableHead className="text-right w-[140px]">Valor planejado</TableHead>
          <TableHead className="text-right w-[140px]">Valor realizado</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    return (
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-[140px]">Código Conta</TableHead>
        <TableHead>Descrição da Conta</TableHead>
        <TableHead className="text-right w-[160px]">Valor Atual</TableHead>
        <TableHead className="text-right w-[160px]">Valor Anterior</TableHead>
        <TableHead className="w-[50px]"></TableHead>
      </TableRow>
    )
  }

  const getColSpan = () => {
    if (docType === 'Balancete') return 8
    if (docType === 'Balanço' || docType === 'Balanço Patrimonial') return 6
    return 5
  }

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
          step === 'preview' ? 'sm:max-w-[95vw] max-h-[95vh]' : 'sm:max-w-md',
        )}
      >
        <DialogHeader>
          <DialogTitle>Processar Documento Financeiro</DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Faça o upload e selecione o cliente e o modelo de extração.'
              : 'Revise os dados, edite ou adicione linhas manualmente antes de gravar.'}
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
                        <SelectItem value="Balanço Patrimonial">Balanço Patrimonial</SelectItem>
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

            {step === 'preview' && (
              <div
                className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
                onPaste={handlePaste}
              >
                {diagnosticMsg && (
                  <Alert
                    variant="default"
                    className="bg-yellow-500/10 border-yellow-500/50 text-yellow-200"
                  >
                    <Info className="h-4 w-4" />
                    <AlertTitle>Reparo Manual Recomendado</AlertTitle>
                    <AlertDescription className="text-yellow-200/80">
                      {diagnosticMsg} Você pode copiar e colar dados do Excel diretamente nesta
                      tabela.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-medium">Revisão Tabular - {docType}</h3>
                    <div className="flex items-center space-x-2 bg-card/50 px-3 py-1.5 rounded-md border border-white/5">
                      <Switch id="noise-mode" checked={showNoise} onCheckedChange={setShowNoise} />
                      <Label htmlFor="noise-mode" className="text-xs cursor-pointer">
                        Exibir {noiseRows.length} Linhas Filtradas (Ruído)
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-1 rounded">
                      {previewRows.length} registros úteis
                    </span>
                    {!hasDiscrepancy && previewRows.length > 0 && extractedTotal > 0 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Soma Validada: {formatCurrency(calculatedSum)}
                      </Badge>
                    ) : hasDiscrepancy && previewRows.length > 0 ? (
                      <Badge
                        variant="destructive"
                        className="bg-destructive/10 text-destructive border-destructive/20"
                      >
                        Divergência: {formatCurrency(calculatedSum)} vs{' '}
                        {formatCurrency(extractedTotal)}
                      </Badge>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={handleAddRow} className="h-7 px-2">
                      <Plus className="w-3 h-3 mr-1" /> Nova Linha
                    </Button>
                  </div>
                </div>

                <div className="border border-white/10 rounded-md flex-1 overflow-hidden flex flex-col bg-card/50 max-h-[50vh]">
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
                        {renderTableHeaders()}
                      </TableHeader>
                      <TableBody>
                        {previewRows.length === 0 && !showNoise && (
                          <TableRow>
                            <TableCell
                              colSpan={getColSpan()}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhum dado válido na tabela. Clique em "Nova Linha" ou cole dados do
                              Excel (Ctrl+V).
                            </TableCell>
                          </TableRow>
                        )}

                        {previewRows.map((row: any, i: number) => (
                          <TableRow key={`row-${i}`} className="border-white/5">
                            {docType === 'Balancete' && (
                              <>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.account_code || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'account_code', e.target.value)
                                    }
                                    placeholder="Código"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.classification_code || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'classification_code', e.target.value)
                                    }
                                    placeholder="Classificação"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.description || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'description', e.target.value)
                                    }
                                    placeholder="Descrição"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.previous_balance ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'previous_balance',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.debit ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'debit',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.credit ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'credit',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.value ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'value', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                              </>
                            )}
                            {(docType === 'Balanço' || docType === 'Balanço Patrimonial') && (
                              <>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.account_code || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'account_code', e.target.value)
                                    }
                                    placeholder="Codigo"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.classification_code || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'classification_code', e.target.value)
                                    }
                                    placeholder="Classificacao"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.description || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'description', e.target.value)
                                    }
                                    placeholder="Descricao"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.value ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'value', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.valor_exercicio_anterior ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'valor_exercicio_anterior',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                              </>
                            )}
                            {docType === 'DRE' && (
                              <>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.description || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'description', e.target.value)
                                    }
                                    placeholder="Descricao"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.value ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'value', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.sum ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'sum',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.total ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'total',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                              </>
                            )}
                            {docType === 'Fluxo de Caixa' && (
                              <>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.description || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'description', e.target.value)
                                    }
                                    placeholder="Descricao"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.period || ''}
                                    onChange={(e) => handleUpdateRow(i, 'period', e.target.value)}
                                    placeholder="Mes"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.raw?.planned_value ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(
                                        i,
                                        'planned_value',
                                        parseFloat(e.target.value) || 0,
                                        true,
                                      )
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="number"
                                    value={row.value ?? ''}
                                    onChange={(e) =>
                                      handleUpdateRow(i, 'value', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-8 text-xs text-right bg-background/50 border-white/10"
                                  />
                                </TableCell>
                              </>
                            )}
                            <TableCell className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                onClick={() => handleRemoveRow(i)}
                                title="Remover linha"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {showNoise &&
                          noiseRows.map((noise, i) => (
                            <TableRow
                              key={`noise-${i}`}
                              className="opacity-40 hover:opacity-100 transition-opacity bg-accent/20"
                            >
                              <TableCell colSpan={getColSpan()} className="text-xs font-mono p-2">
                                [Ruído] {noise.linha_original}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

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
