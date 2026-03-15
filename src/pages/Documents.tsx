import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentListTable } from '@/components/documents/DocumentListTable'
import { ExtractedDataView } from '@/components/documents/ExtractedDataView'

export default function Documents() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [viewDoc, setViewDoc] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<any[]>([])
  const [isDynamicData, setIsDynamicData] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const canUpload = true // Any authenticated user can upload
  const canDelete = userProfile?.role === 'Admin' || userProfile?.role === 'Analyst'

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

  const handleDelete = async (id: string, filePath: string | null) => {
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
    } else if (data && data.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleViewDetails = async (doc: any) => {
    setViewDoc(doc)
    setLoadingData(true)
    const { data, isDynamic } = await documentService.getExtractedData(doc.id, doc.document_type)
    setExtractedData(data || [])
    setIsDynamicData(!!isDynamic)
    setLoadingData(false)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositório Financeiro</h2>
          <p className="text-muted-foreground text-sm">
            Faça upload e gerencie a extração automática de dados contábeis (processamento efêmero).
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

          {canUpload && userProfile && (
            <DocumentUploadModal userProfile={userProfile} onSuccess={fetchDocs} />
          )}
        </div>
      </div>

      <DocumentListTable
        documents={filteredDocs}
        loading={loading}
        canDelete={canDelete}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-5xl max-h-[85vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Extrato Estruturado - {viewDoc?.document_type}
            </DialogTitle>
            <p className="text-sm text-muted-foreground truncate">{viewDoc?.filename}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-card/30 p-2 sm:p-4">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Carregando dados estruturados...
                </p>
              </div>
            ) : (
              <ExtractedDataView
                data={extractedData}
                type={viewDoc?.document_type}
                isDynamic={isDynamicData}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
