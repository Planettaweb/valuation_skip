import { useState, useEffect } from 'react'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { documentService } from '@/services/documents'
import { clientService } from '@/services/clients'
import { UserProfile } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface Props {
  userProfile: UserProfile
  onSuccess: () => void
}

export function DocumentUploadModal({ userProfile, onSuccess }: Props) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const [docType, setDocType] = useState('Balanço')
  const [clients, setClients] = useState<any[]>([])
  const [valuations, setValuations] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedValuation, setSelectedValuation] = useState('')

  const [uploading, setUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      clientService.getClients(userProfile.org_id).then((res) => {
        if (res.data) setClients(res.data)
      })
    }
  }, [isOpen, userProfile.org_id])

  useEffect(() => {
    if (selectedClient) {
      clientService.getValuations(selectedClient).then((res) => {
        if (res.data) setValuations(res.data)
        setSelectedValuation('')
      })
    } else {
      setValuations([])
      setSelectedValuation('')
    }
  }, [selectedClient])

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
    if (!file || !selectedValuation) return
    setUploading(true)
    setStatusMessage('Iniciando processamento...')

    const { error } = await documentService.uploadDocument(
      file,
      userProfile.org_id,
      userProfile.id,
      selectedValuation,
      docType,
      (msg) => setStatusMessage(msg),
    )

    if (error) {
      toast({ title: 'Erro de Processamento', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Extração Concluída',
        description: 'Os dados estruturados foram extraídos e salvos com sucesso.',
      })
      setIsOpen(false)
      setFile(null)
      onSuccess()
    }
    setUploading(false)
    setStatusMessage('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <Upload className="w-4 h-4 mr-2" /> Upload Inteligente
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Documento Financeiro</DialogTitle>
          <DialogDescription>
            Faça o upload e associe o documento a um projeto para extração estruturada.
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground px-4">
              Você precisa cadastrar um cliente e um projeto antes de fazer o upload de documentos.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/clients" onClick={() => setIsOpen(false)}>
                Cadastrar Cliente
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
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
                <Label className="text-muted-foreground">Projeto</Label>
                <Select
                  value={selectedValuation}
                  onValueChange={setSelectedValuation}
                  disabled={!selectedClient || valuations.length === 0}
                >
                  <SelectTrigger className="bg-card/50 border-white/10">
                    <SelectValue
                      placeholder={
                        valuations.length === 0 && selectedClient ? 'Sem projetos' : 'Selecione...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {valuations.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.valuation_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                accept=".pdf,.xls,.xlsx,.csv"
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
                  <p className="text-sm font-medium text-white">Arraste e solte o documento aqui</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou clique para buscar no computador (.pdf, .xls, .csv)
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="w-full animate-fade-in p-4 bg-primary/10 rounded-lg border border-primary/20 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Processando Documento...</span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full animate-[pulse_2s_ease-in-out_infinite] w-full" />
                </div>
                <p className="text-xs text-primary/70 animate-pulse">{statusMessage}</p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || !selectedValuation || uploading}
              className="w-full mt-2"
            >
              {uploading ? 'Aguarde...' : 'Processar no Navegador'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
