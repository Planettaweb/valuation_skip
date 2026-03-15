import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { documentService } from '@/services/documents'
import { ExtractedDataView } from './ExtractedDataView'

interface Props {
  doc: any | null
  onClose: () => void
}

export function DocumentDataModal({ doc, onClose }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDynamic, setIsDynamic] = useState(false)

  useEffect(() => {
    if (!doc) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: extracted,
          isDynamic,
          error: fetchError,
        } = await documentService.getExtractedData(doc.id, doc.document_type)
        if (fetchError) throw fetchError
        setData(extracted || [])
        setIsDynamic(!!isDynamic)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do documento.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [doc])

  if (!doc) return null

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-5xl max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Extrato Estruturado - {doc.document_type}
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{doc.filename}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-card/30 p-2 sm:p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Carregando dados estruturados...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <ExtractedDataView data={data} type={doc.document_type} isDynamic={isDynamic} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
