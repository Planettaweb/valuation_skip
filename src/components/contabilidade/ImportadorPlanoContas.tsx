import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService } from '@/services/contabilidade'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCcw,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ImportadorProps {
  clientId: string | null
  onComplete: () => void
  onCancel: () => void
}

const DB_FIELDS = [
  { id: 'codigo', label: 'Código', required: true },
  { id: 'nome_conta', label: 'Nome da Conta', required: true },
  { id: 'descricao', label: 'Descrição', required: false },
  { id: 'tipo', label: 'Tipo', required: false },
  { id: 'grupo', label: 'Grupo', required: false },
  { id: 'natureza', label: 'Natureza', required: false },
]

export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (!lines.length) return []
  const separator = lines[0].includes(';') ? ';' : ','
  return lines.map((line) => {
    const row = []
    let cell = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === separator && !inQuotes) {
        row.push(cell.trim())
        cell = ''
      } else {
        cell += char
      }
    }
    row.push(cell.trim())
    return row
  })
}

export function ImportadorPlanoContas({ clientId, onComplete, onCancel }: ImportadorProps) {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [rawLines, setRawLines] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isValidated, setIsValidated] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(false)

  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    errors: [] as { line: number; reason: string; data: any }[],
    startTime: 0,
    elapsed: 0,
  })

  // Timer effect for real-time performance tracking
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 3 && progress.startTime > 0) {
      interval = setInterval(() => {
        setProgress((p) => ({ ...p, elapsed: Date.now() - p.startTime }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, progress.startTime])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoadingFile(true)

    const reader = new FileReader()
    reader.onload = (evt) => {
      setTimeout(() => {
        // Simulate slight delay for skeleton UX
        try {
          const text = evt.target?.result as string
          const parsed = parseCSV(text)
          if (parsed.length < 2) throw new Error('Arquivo vazio ou sem dados.')

          const fileHeaders = parsed[0]
          setRawLines(parsed)
          setHeaders(fileHeaders)

          // Auto-mapping
          const initialMapping: Record<string, string> = {}
          fileHeaders.forEach((h) => {
            const lower = h.toLowerCase()
            const match = DB_FIELDS.find(
              (db) => lower.includes(db.id) || lower.includes(db.label.toLowerCase()),
            )
            if (match) initialMapping[h] = match.id
          })

          setMapping(initialMapping)
          setStep(2)
        } catch (err: any) {
          toast({ title: 'Erro ao ler arquivo', description: err.message, variant: 'destructive' })
        } finally {
          setIsLoadingFile(false)
        }
      }, 500)
    }
    reader.readAsText(file)
  }

  const handleValidate = () => {
    const mappedValues = Object.values(mapping).filter(Boolean)
    const missing = DB_FIELDS.filter((f) => f.required && !mappedValues.includes(f.id))

    if (missing.length > 0) {
      toast({
        title: 'Validação Falhou',
        description: `Campos obrigatórios ausentes: ${missing.map((m) => m.label).join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    const duplicates = DB_FIELDS.filter((f) => mappedValues.filter((v) => v === f.id).length > 1)
    if (duplicates.length > 0) {
      toast({
        title: 'Validação Falhou',
        description: `Campos mapeados mais de uma vez: ${duplicates.map((m) => m.label).join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setIsValidated(true)
    toast({ title: 'Sucesso', description: 'Mapeamento validado! Pronto para executar.' })
  }

  const handleExecute = async () => {
    setStep(3)
    const dataLines = rawLines.slice(1)
    setProgress({
      processed: 0,
      total: dataLines.length,
      errors: [],
      startTime: Date.now(),
      elapsed: 0,
    })

    let successCount = 0
    const errs: typeof progress.errors = []

    for (let i = 0; i < dataLines.length; i++) {
      const row = dataLines[i]
      const payload: any = {
        org_id: userProfile!.org_id,
        client_id: clientId,
        ativo: true,
      }

      Object.entries(mapping).forEach(([fileHeader, dbField]) => {
        if (dbField) {
          const colIdx = headers.indexOf(fileHeader)
          if (colIdx >= 0) payload[dbField] = row[colIdx]
        }
      })

      try {
        if (!payload.codigo || !payload.nome_conta)
          throw new Error('Código e Nome são obrigatórios')
        await contabilidadeService.createPlanoConta(payload)
        successCount++
      } catch (err: any) {
        errs.push({ line: i + 2, reason: err.message, data: row })
      }

      setProgress((p) => ({ ...p, processed: i + 1, errors: errs }))
    }

    setStep(4)
    toast({
      title: 'Importação Concluída',
      description: `${successCount} registros importados com sucesso.`,
    })
  }

  const getStatusIcon = (header: string) => {
    const mappedTo = mapping[header]
    if (!mappedTo) return <XCircle className="w-5 h-5 text-muted-foreground" />
    const isDuplicate = Object.values(mapping).filter((v) => v === mappedTo).length > 1
    if (isDuplicate) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <CheckCircle2 className="w-5 h-5 text-green-500" />
  }

  const reset = () => {
    setStep(1)
    setRawLines([])
    setHeaders([])
    setMapping({})
    setIsValidated(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const elapsedSecs = Math.max(1, Math.floor(progress.elapsed / 1000))
  const speed = Math.round(progress.processed / elapsedSecs)

  return (
    <div className="flex flex-col space-y-6">
      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30">
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Selecione um arquivo CSV ou Excel</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            O arquivo deve conter cabeçalhos na primeira linha. Extrairemos as colunas
            automaticamente para o mapeamento.
          </p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoadingFile}>
            {isLoadingFile ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2" />
            )}
            {isLoadingFile ? 'Processando...' : 'Fazer Upload'}
          </Button>
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Validação de Campos</h3>
            <Button
              variant="outline"
              onClick={handleValidate}
              className={isValidated ? 'border-green-500 text-green-500' : ''}
            >
              {isValidated ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCcw className="w-4 h-4 mr-2" />
              )}
              Validar Mapeamento
            </Button>
          </div>

          <div className="hidden sm:block border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo do Arquivo</TableHead>
                  <TableHead>Campo da Tabela (Destino)</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header) => (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[header] || 'none'}
                        onValueChange={(val) => {
                          setMapping((prev) => ({ ...prev, [header]: val === 'none' ? '' : val }))
                          setIsValidated(false)
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Não mapear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não mapear</SelectItem>
                          {DB_FIELDS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.label} {f.required && '*'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center flex justify-center">
                      {getStatusIcon(header)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view for mapping */}
          <div className="sm:hidden flex flex-col space-y-3">
            {headers.map((header) => (
              <Card key={header}>
                <CardContent className="p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Arquivo: {header}</span>
                    {getStatusIcon(header)}
                  </div>
                  <Select
                    value={mapping[header] || 'none'}
                    onValueChange={(val) => {
                      setMapping((prev) => ({ ...prev, [header]: val === 'none' ? '' : val }))
                      setIsValidated(false)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não mapear</SelectItem>
                      {DB_FIELDS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label} {f.required && '*'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={reset}>
              Cancelar
            </Button>
            <Button onClick={handleExecute} disabled={!isValidated}>
              <Play className="w-4 h-4 mr-2" /> Executar Importação
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORTING */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-card border rounded-lg">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <h3 className="text-xl font-bold">Importando dados...</h3>
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progresso</span>
              <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
            </div>
            <Progress value={(progress.processed / progress.total) * 100} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground pt-2">
              <span>
                {progress.processed} / {progress.total} linhas
              </span>
              <span>Tempo: {elapsedSecs}s</span>
              <span>Velocidade: {speed} l/s</span>
            </div>
            {progress.errors.length > 0 && (
              <div className="text-center text-sm text-red-500 font-medium pt-2">
                ⚠ {progress.errors.length} erros encontrados
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: SUMMARY */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 border rounded-lg bg-card text-center flex flex-col items-center">
            {progress.errors.length === 0 ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-2">Resumo da Importação</h2>
            <p className="text-muted-foreground mb-6">
              {progress.processed - progress.errors.length} registros importados com sucesso.
              {progress.errors.length > 0 && ` ${progress.errors.length} erros encontrados.`}
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={reset}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Importar Novamente
              </Button>
              <Button onClick={onComplete}>Concluir e Sair</Button>
            </div>
          </div>

          {progress.errors.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-red-500">Detalhes dos Erros</h4>
              <Accordion type="single" collapsible className="w-full border rounded-md bg-card">
                {progress.errors.map((err, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-b last:border-0">
                    <AccordionTrigger className="px-4 text-sm font-medium hover:no-underline">
                      <span className="text-red-500 text-left">
                        Linha {err.line}: {err.reason}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono">
                        {JSON.stringify(err.data)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
