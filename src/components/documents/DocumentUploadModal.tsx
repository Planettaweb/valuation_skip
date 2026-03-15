import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { documentService } from '@/services/documents'
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
  const [docType, setDocType] = useState('Balanço Patrimonial')
  const [uploading, setUploading] = useState(false)

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
    if (!file) return
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
        description: 'O documento efêmero está sendo processado diretamente.',
      })
      setIsOpen(false)
      setFile(null)
      onSuccess()
    }
    setUploading(false)
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
                'w-8 h-8 mx-auto mb-4 transition-colors',
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
                  Ou clique para buscar no computador
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-white/5 inline-block px-2 py-1 rounded">
                  .pdf, .xls, .csv
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="w-full space-y-2 mt-2 animate-fade-in">
              <Progress value={undefined} className="h-2 bg-primary/20" />
              <p className="text-xs text-center text-primary animate-pulse">
                Processando conteúdo diretamente na memória...
              </p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-2">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
              </>
            ) : (
              'Extrair Dados (Sem Armazenar)'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
