import { useState, useEffect } from 'react'
import { Search, FilterX } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentListTable } from '@/components/documents/DocumentListTable'
import { DocumentDataModal } from '@/components/documents/DocumentDataModal'

export default function Documents() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')

  const [documents, setDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewDoc, setViewDoc] = useState<any>(null)

  const canUpload = true
  const canDelete = userProfile?.role === 'Admin' || userProfile?.role === 'Analyst'

  const fetchDocs = async () => {
    if (!userProfile) return
    setLoading(true)
    const { data, error } = await documentService.getDocuments(userProfile.org_id, {
      clientId: clientId || undefined,
    })
    if (error) {
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        variant: 'destructive',
      })
    } else if (data) {
      setDocuments(data)
    }
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
          table: 'financial_documents',
          filter: `org_id=eq.${userProfile.org_id}`,
        },
        () => {
          fetchDocs()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile, toast, clientId])

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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositório Financeiro</h2>
          <p className="text-muted-foreground text-sm">
            {clientId
              ? 'Visualizando documentos filtrados por cliente.'
              : 'Gerencie uploads e processe dados financeiros de seus clientes.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {clientId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                searchParams.delete('clientId')
                setSearchParams(searchParams)
              }}
              className="border-white/10"
            >
              <FilterX className="w-4 h-4 mr-2" /> Limpar Filtro
            </Button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por arquivo..."
              className="pl-9 bg-card/50 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canUpload && userProfile && (
            <DocumentUploadModal
              userProfile={userProfile}
              defaultClientId={clientId || undefined}
              onSuccess={fetchDocs}
            />
          )}
        </div>
      </div>

      <DocumentListTable
        documents={filteredDocs}
        loading={loading}
        canDelete={canDelete}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onViewDetails={setViewDoc}
      />

      <DocumentDataModal doc={viewDoc} onClose={() => setViewDoc(null)} />
    </div>
  )
}
