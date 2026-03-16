import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, FileJson, Table2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [rawMetadata, setRawMetadata] = useState<any>(null)

  useEffect(() => {
    if (!doc) return

    if (doc.metadata) {
      setRawMetadata(doc.metadata)
    } else {
      setRawMetadata(null)
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: extracted,
          isDynamic: fetchIsDynamic,
          error: fetchError,
        } = await documentService.getExtractedData(doc.id, doc.document_type)
        if (fetchError) throw fetchError
        setData(extracted || [])
        setIsDynamic(!!fetchIsDynamic)
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
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Extrato Estruturado - {doc.document_type || 'Documento'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{doc.filename}</p>
        </DialogHeader>

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
          <Tabs defaultValue="table" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="w-fit mb-4 bg-white/5 border border-white/10">
              <TabsTrigger
                value="table"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Table2 className="w-4 h-4 mr-2" />
                Estruturado
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Raw JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="table"
              className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-card/30 p-2 sm:p-4 mt-0"
            >
              <ExtractedDataView
                data={data}
                type={doc.document_type}
                isDynamic={isDynamic}
                rawMetadata={rawMetadata}
              />
            </TabsContent>

            <TabsContent
              value="json"
              className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-4 mt-0"
            >
              <pre className="text-xs text-emerald-400/90 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(rawMetadata || data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
