import { useState } from 'react'
import { FileText, Download, Trash2, Upload, Search } from 'lucide-react'
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
import useDataStore from '@/stores/useDataStore'
import useAuthStore from '@/stores/useAuthStore'

export default function Documents() {
  const { user } = useAuthStore()
  const { documents, addDocument, removeDocument } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const orgDocs = documents
    .filter((d) => d.orgId === user?.orgId)
    .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const canEdit = user?.role === 'Administrador' || user?.role === 'Analista'

  const handleMockUpload = () => {
    addDocument({
      id: `doc-${Date.now()}`,
      name: `Novo_Documento_${Math.floor(Math.random() * 100)}.pdf`,
      size: '1.5 MB',
      uploadedBy: user?.name || 'Desconhecido',
      date: new Date().toISOString().split('T')[0],
      orgId: user?.orgId || '',
    })
    setIsUploadOpen(false)
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
                <div className="mt-4 border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Arraste e solte seu arquivo aqui</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX até 50MB</p>
                  <Button onClick={handleMockUpload} variant="secondary" className="mt-6">
                    Selecionar Arquivo
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
            {orgDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              orgDocs.map((doc) => (
                <TableRow key={doc.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {doc.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                  <TableCell>{doc.uploadedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                        <Download className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => removeDocument(doc.id)}
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
