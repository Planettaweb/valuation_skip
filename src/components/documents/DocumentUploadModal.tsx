import { useState, useEffect } from 'react'
import { Upload, Loader2, AlertCircle, Check, Trash2, Plus, Info, ListTree } from 'lucide-react'
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
import { parseValueStr } from '@/lib/extraction-utils'

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
  const [clientPlanoContas, setClientPlanoContas] = useState<any[]>([])

  const [step, setStep] = useState<'form' | 'mapping' | 'processing' | 'preview' | 'saving'>('form')
  const [statusMessage, setStatusMessage] = useState('')
  const [diagnosticMsg, setDiagnosticMsg] = useState('')
  const [mappingMode, setMappingMode] = useState<'none' | 'similarity' | 'generate'>('none')

  const [fileHeaders, setFileHeaders] = useState<{ name: string; index: number }[]>([])
  const [expectedFields, setExpectedFields] = useState<
    { key: string; label: string; required: boolean }[]
  >([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, number>>({})

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

  useEffect(() => {
    if (selectedClient && userProfile) {
      clientService.getPlanoContas(selectedClient).then((res) => {
        if (res.data) setClientPlanoContas(res.data)
      })
    }
  }, [selectedClient, userProfile])

  const validateAndSetFile = async (f?: File) => {
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

    if (nameLower.endsWith('.csv')) {
      try {
        const buffer = await f.arrayBuffer()
        let text = new TextDecoder('utf-8').decode(buffer)

        // Se encontrou o caractere de substituição do UTF-8, o arquivo provavelmente é ISO-8859-1 (Latin1)
        if (text.includes('\uFFFD')) {
          text = new TextDecoder('iso-8859-1').decode(buffer)
        }

        // Limpeza de caracteres de controle (BOM e não imprimíveis)
        text = text.replace(/^\uFEFF/, '')
        // eslint-disable-next-line no-control-regex
        text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')

        const newFile = new File([text], f.name, { type: 'text/csv;charset=utf-8' })
        setFile(newFile)
      } catch (err) {
        console.error('Erro ao converter codificação do CSV:', err)
        setFile(f)
      }
    } else {
      setFile(f)
    }
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

  const handleAnalyzeFile = async () => {
    if (!file || !selectedClient) return

    const nameLower = file.name.toLowerCase()
    const isStructured = nameLower.endsWith('.csv') || nameLower.endsWith('.xlsx')

    if (isStructured) {
      setStep('mapping')
      try {
        const rawData = await documentService.extractRawStructuredData(file)

        // Padrão Plano de Contas: sempre usar a primeira linha (índice 0) como cabeçalho
        const bestRow: any[] = rawData.length > 0 ? rawData[0] : []

        const headers = bestRow.map((c, i) => ({
          name: c ? String(c).trim() : `Coluna ${i + 1}`,
          index: i,
        }))
        setFileHeaders(headers)

        let expected: any[] = []
        if (docType === 'Balancete') {
          expected = [
            { key: 'account_code', label: 'Código da Conta', required: false },
            { key: 'classification_code', label: 'Classificação', required: false },
            { key: 'description', label: 'Descrição da Conta', required: true },
            { key: 'previous_balance', label: 'Saldo Anterior', required: false },
            { key: 'debit', label: 'Débito', required: false },
            { key: 'credit', label: 'Crédito', required: false },
            { key: 'current_balance', label: 'Saldo Atual', required: true },
          ]
        } else if (docType === 'Balanço' || docType === 'Balanço Patrimonial') {
          expected = [
            { key: 'account_code', label: 'Código', required: false },
            { key: 'classification_code', label: 'Classificação', required: false },
            { key: 'description', label: 'Descrição', required: true },
            { key: 'value_year_n', label: 'Ano Atual', required: true },
            { key: 'value_year_n_minus_1', label: 'Ano Anterior', required: false },
          ]
        } else if (docType === 'DRE') {
          expected = [
            { key: 'description', label: 'Descrição', required: true },
            { key: 'balance', label: 'Saldo', required: true },
            { key: 'sum', label: 'Soma', required: false },
            { key: 'total', label: 'Total', required: false },
          ]
        } else if (docType === 'Fluxo de Caixa') {
          expected = [
            { key: 'description', label: 'Descrição', required: true },
            { key: 'period', label: 'Mês/Período', required: false },
            { key: 'planned_value', label: 'Valor Planejado', required: false },
            { key: 'realized_value', label: 'Valor Realizado', required: true },
          ]
        }
        setExpectedFields(expected)

        const initialMapping: Record<string, number> = {}
        expected.forEach((f) => {
          const exact = headers.find((h) => h.name.toLowerCase() === f.label.toLowerCase())
          if (exact) initialMapping[f.key] = exact.index
          else {
            const partial = headers.find((h) =>
              h.name.toLowerCase().includes(f.label.toLowerCase().split(' ')[0]),
            )
            if (partial) initialMapping[f.key] = partial.index
          }
        })
        setFieldMapping(initialMapping)
      } catch (err: any) {
        toast({ title: 'Erro ao ler arquivo', description: err.message, variant: 'destructive' })
        setStep('form')
      }
    } else {
      handleProcessPreview()
    }
  }

  const handleProcessPreview = async (mappingData?: Record<string, number>) => {
    if (!file || !selectedClient) return
    setStep('processing')
    setStatusMessage('Iniciando processamento e validação...')
    setDiagnosticMsg('')
    setShowNoise(false)
    setMappingMode('none')

    try {
      const parsed = await documentService.parseDocumentLocal(
        file,
        docType,
        setStatusMessage,
        mappingData,
      )
      const rowsWithMapping = (parsed.rowsData || []).map((r: any) => ({
        ...r,
        mapped_codigo: r.account_code || '',
        mapped_descricao: r.description || '',
      }))
      setParsedPreview(parsed)
      setPreviewRows(rowsWithMapping)
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

    const finalRows = previewRows.map((r) => {
      if (mappingMode === 'similarity' || mappingMode === 'generate') {
        return {
          ...r,
          account_code: r.mapped_codigo || r.account_code,
          description: r.mapped_descricao || r.description,
        }
      }
      return r
    })

    let newPlanoContas: any[] = []
    if (mappingMode === 'generate') {
      const mapUnique = new Map()
      finalRows.forEach((r) => {
        const cod = r.account_code || ''
        const desc = r.description || ''
        if (desc && desc !== 'Sem Descrição') {
          mapUnique.set(`${cod}-${desc}`, { codigo: cod, descricao: desc })
        }
      })
      newPlanoContas = Array.from(mapUnique.values())
    }

    const payload = {
      metadataObj: parsedPreview?.metadataObj || {},
      rowsData: finalRows,
      newPlanoContas,
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
    setMappingMode('none')
    setFileHeaders([])
    setExpectedFields([])
    setFieldMapping({})
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
        mapped_codigo: '',
        mapped_descricao: '',
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

  const handlePaste = (
    e: React.ClipboardEvent<HTMLDivElement>,
    step: string,
    previewRows: any[],
    setPreviewRows: (rows: any[]) => void,
    toast: (opts: any) => void,
  ): void => {
    if (step !== 'preview') return
    const text = e.clipboardData.getData('Text')
    if (!text) return
    const lines = text.split('\n')
    const newRows: any[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // 🔥 RECONSTRUÇÃO DE DECIMAIS (igual à heurística do parseCSV)
      const rawCols = line
        .split('\t')
        .map((c: string) => c.trim())
        .filter(Boolean)

      const cols: string[] = []
      for (let i = 0; i < rawCols.length; i++) {
        const curr = rawCols[i]
        const prev = cols.length > 0 ? cols[cols.length - 1] : ''

        const cleanCurr = curr.replace(/['"]/g, '').trim()
        const cleanPrev = prev.replace(/['"]/g, '').trim()

        const isCents = /^\d{1,2}\)?$/.test(cleanCurr)
        const isMain = /^-?\(?[\d.]+\)?$/.test(cleanPrev) && !/^0\d+$/.test(cleanPrev)

        if (i > 0 && isCents && isMain) {
          cols[cols.length - 1] = prev + ',' + curr
        } else {
          cols.push(curr)
        }
      }

      if (cols.length < 2) continue

      const valueStr = cols[cols.length - 1]
      let account_code: string | null = null
      let description: string

      if (cols.length >= 3) {
        account_code = cols[0]
        description = cols.slice(1, -1).join(' ')
      } else {
        description = cols[0]
      }

      const value = parseValueStr(valueStr)

      newRows.push({
        account_code: account_code,
        classification_code: null,
        description: description,
        mapped_codigo: account_code,
        mapped_descricao: description,
        value: value || 0,
        raw: {},
      })
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

  const MappingHeaders = () => (
    <>
      {mappingMode === 'similarity' && (
        <TableHead className="w-[250px] border-x border-white/5 bg-primary/5 text-primary">
          Mapear com Conta do Cliente
        </TableHead>
      )}
      {mappingMode === 'generate' && (
        <>
          <TableHead className="w-[120px] border-l border-white/5 bg-emerald-500/5 text-emerald-500">
            Novo Cód.
          </TableHead>
          <TableHead className="w-[200px] border-r border-white/5 bg-emerald-500/5 text-emerald-500">
            Nova Descrição
          </TableHead>
        </>
      )}
    </>
  )

  const MappingCells = ({ row, i }: { row: any; i: number }) => (
    <>
      {mappingMode === 'similarity' && (
        <TableCell className="p-2 border-x border-white/5 bg-primary/5">
          <Select
            value={row.mapped_plano_id || 'none'}
            onValueChange={(val) => {
              if (val === 'none') {
                handleUpdateRow(i, 'mapped_plano_id', '')
                handleUpdateRow(i, 'mapped_codigo', '')
                handleUpdateRow(i, 'mapped_descricao', '')
                return
              }
              const pc = clientPlanoContas.find((p) => p.id === val)
              if (pc) {
                handleUpdateRow(i, 'mapped_plano_id', pc.id)
                handleUpdateRow(i, 'mapped_codigo', pc.codigo)
                handleUpdateRow(i, 'mapped_descricao', pc.descricao)
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background/50 border-white/10 w-full">
              <SelectValue placeholder="Selecione a conta..." />
            </SelectTrigger>
            <SelectContent className="max-w-[300px]">
              <SelectItem value="none" className="text-muted-foreground italic">
                Nenhuma / Limpar
              </SelectItem>
              {clientPlanoContas.map((pc) => (
                <SelectItem key={pc.id} value={pc.id} className="text-xs truncate">
                  {pc.codigo ? `${pc.codigo} - ` : ''}
                  {pc.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {mappingMode === 'generate' && (
        <>
          <TableCell className="p-2 border-l border-white/5 bg-emerald-500/5">
            <Input
              value={row.mapped_codigo ?? ''}
              onChange={(e) => handleUpdateRow(i, 'mapped_codigo', e.target.value)}
              placeholder="Cód."
              className="h-8 text-xs bg-background/80 border-emerald-500/20"
            />
          </TableCell>
          <TableCell className="p-2 border-r border-white/5 bg-emerald-500/5">
            <Input
              value={row.mapped_descricao ?? ''}
              onChange={(e) => handleUpdateRow(i, 'mapped_descricao', e.target.value)}
              placeholder="Nova descrição..."
              className="h-8 text-xs bg-background/80 border-emerald-500/20"
            />
          </TableCell>
        </>
      )}
    </>
  )

  const renderTableHeaders = () => {
    if (docType === 'Balancete') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[100px]">Código</TableHead>
          <TableHead className="w-[120px]">Classificação</TableHead>
          <TableHead>Descrição da conta</TableHead>
          <MappingHeaders />
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
          <TableHead className="w-[100px]">Código</TableHead>
          <TableHead className="w-[120px]">Classificação</TableHead>
          <TableHead>Descrição</TableHead>
          <MappingHeaders />
          <TableHead className="text-right w-[140px]">Ano Atual</TableHead>
          <TableHead className="text-right w-[140px]">Ano Anterior</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    if (docType === 'DRE') {
      return (
        <TableRow className="hover:bg-transparent">
          <TableHead>Descrição</TableHead>
          <MappingHeaders />
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
          <TableHead>Descrição</TableHead>
          <MappingHeaders />
          <TableHead className="w-[120px]">Mês</TableHead>
          <TableHead className="text-right w-[140px]">Valor Planejado</TableHead>
          <TableHead className="text-right w-[140px]">Valor Realizado</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      )
    }
    return (
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-[140px]">Código Conta</TableHead>
        <TableHead>Descrição da Conta</TableHead>
        <MappingHeaders />
        <TableHead className="text-right w-[160px]">Valor Atual</TableHead>
        <TableHead className="text-right w-[160px]">Valor Anterior</TableHead>
        <TableHead className="w-[50px]"></TableHead>
      </TableRow>
    )
  }

  const getColSpan = () => {
    let base = 5
    if (docType === 'Balancete') base = 8
    if (docType === 'Balanço' || docType === 'Balanço Patrimonial') base = 6
    if (mappingMode === 'similarity') base += 1
    if (mappingMode === 'generate') base += 2
    return base
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
                  onClick={handleAnalyzeFile}
                  disabled={!file || !selectedClient}
                  className="w-full mt-2"
                >
                  Extrair e Validar Dados
                </Button>
              </div>
            )}

            {step === 'mapping' && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95">
                <Alert className="bg-primary/10 border-primary/20 text-primary">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Mapeamento de Colunas</AlertTitle>
                  <AlertDescription>
                    Identificamos as colunas do seu arquivo. Vincule-as aos campos esperados para{' '}
                    {docType}.
                  </AlertDescription>
                </Alert>

                <div className="border border-white/10 rounded-md overflow-hidden bg-card/50">
                  <Table>
                    <TableHeader className="bg-background/95">
                      <TableRow>
                        <TableHead>Campo Esperado</TableHead>
                        <TableHead>Coluna do Arquivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expectedFields.map((field) => (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={fieldMapping[field.key]?.toString() || 'none'}
                              onValueChange={(val) => {
                                setFieldMapping((prev) => ({
                                  ...prev,
                                  [field.key]: val === 'none' ? -1 : parseInt(val),
                                }))
                              }}
                            >
                              <SelectTrigger className="h-8 bg-background/50 border-white/10">
                                <SelectValue placeholder="Selecione a coluna..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-muted-foreground italic">
                                  Ignorar / Não Mapear
                                </SelectItem>
                                {fileHeaders.map((h) => (
                                  <SelectItem key={h.index} value={h.index.toString()}>
                                    {h.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <Button variant="outline" onClick={() => setStep('form')}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => handleProcessPreview(fieldMapping)}
                    disabled={expectedFields.some(
                      (f) =>
                        f.required &&
                        (fieldMapping[f.key] === undefined || fieldMapping[f.key] === -1),
                    )}
                  >
                    Extrair Valores
                  </Button>
                </div>
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

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-4 bg-card/50 p-3 rounded-lg border border-white/5">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ListTree className="w-4 h-4 text-primary" />
                      Ação de Plano de Contas
                    </h3>
                    <div className="flex bg-background rounded-md border border-white/10 p-1 w-fit">
                      <Button
                        variant={mappingMode === 'none' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMappingMode('none')}
                        className="h-7 text-xs"
                      >
                        Manter Original
                      </Button>
                      <Button
                        variant={mappingMode === 'similarity' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMappingMode('similarity')}
                        className="h-7 text-xs text-primary"
                      >
                        Ativar Similaridade
                      </Button>
                      <Button
                        variant={mappingMode === 'generate' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setMappingMode('generate')}
                        className="h-7 text-xs text-emerald-400"
                      >
                        Gerar Novo Plano
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center space-x-2 bg-background px-3 py-1 rounded-md border border-white/5">
                      <Switch id="noise-mode" checked={showNoise} onCheckedChange={setShowNoise} />
                      <Label htmlFor="noise-mode" className="text-xs cursor-pointer">
                        Exibir {noiseRows.length} Ruídos
                      </Label>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddRow}
                        className="h-7 px-2"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Nova Linha
                      </Button>
                    </div>
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
                                <MappingCells row={row} i={i} />
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
                                <MappingCells row={row} i={i} />
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
                                    placeholder="Descrição"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <MappingCells row={row} i={i} />
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
                                    placeholder="Descrição"
                                    className="h-8 text-xs bg-background/50 border-white/10"
                                  />
                                </TableCell>
                                <MappingCells row={row} i={i} />
                                <TableCell className="p-2">
                                  <Input
                                    value={row.period || ''}
                                    onChange={(e) => handleUpdateRow(i, 'period', e.target.value)}
                                    placeholder="Mês"
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
