import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { clientService } from '@/services/clients'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentListTable } from '@/components/documents/DocumentListTable'
import { DocumentDataModal } from '@/components/documents/DocumentDataModal'

const FIN_PAGE_SIZE = 50

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>()
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [client, setClient] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDoc, setViewDoc] = useState<any>(null)

  const canDelete = userProfile?.role === 'Admin' || userProfile?.role === 'Analyst'
  const canReprocess = userProfile?.role === 'Admin'

  const [finDocTypeFilter, setFinDocTypeFilter] = useState('all')
  const [finPeriodFilter, setFinPeriodFilter] = useState('')
  const [finPage, setFinPage] = useState(1)

  const fetchData = async () => {
    if (!clientId || !userProfile) return
    setLoading(true)
    const [clientRes, finRes, docsRes] = await Promise.all([
      clientService.getClient(clientId),
      clientService.getFinancialData(clientId),
      documentService.getDocuments(userProfile.org_id, { clientId }),
    ])
    if (clientRes.data) setClient(clientRes.data)
    if (finRes.data) {
      setFinancialData(
        finRes.data.map((d: any) => ({
          ...d,
          document_type: d.financial_documents?.document_type,
          valuation_id: d.financial_documents?.valuation_id,
        })),
      )
    }
    if (docsRes.data) setDocuments(docsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    if (!userProfile || !clientId) return
    const channel = supabase
      .channel(`realtime_client_docs_${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_documents',
          filter: `org_id=eq.${userProfile.org_id}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId, userProfile])

  const handleDeleteDoc = async (id: string, filePath: string | null) => {
    const { error } = await documentService.deleteDocument(id, filePath)
    if (error) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Deletado', description: 'Documento e dados vinculados removidos.' })
      fetchData()
    }
  }

  const handleDownloadDoc = async (filePath: string) => {
    const { data, error } = await documentService.getDownloadUrl(filePath)
    if (error) {
      toast({ title: 'Erro no Download', description: error.message, variant: 'destructive' })
    } else if (data && data.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleReprocessDoc = async (doc: any) => {
    if (!userProfile) return
    toast({ title: 'Iniciando', description: 'Reprocessando documento no servidor...' })
    const { error } = await documentService.reprocessDocument(
      doc.id,
      userProfile.org_id,
      userProfile.id,
    )
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Documento reprocessado com sucesso.' })
      fetchData()
    }
  }

  const filteredFinData = useMemo(() => {
    return financialData.filter((d) => {
      if (finDocTypeFilter !== 'all' && d.document_type !== finDocTypeFilter) return false
      if (
        finPeriodFilter &&
        !String(d.period || '')
          .toLowerCase()
          .includes(finPeriodFilter.toLowerCase())
      )
        return false
      return true
    })
  }, [financialData, finDocTypeFilter, finPeriodFilter])

  const paginatedFinData = filteredFinData.slice(
    (finPage - 1) * FIN_PAGE_SIZE,
    finPage * FIN_PAGE_SIZE,
  )
  const totalFinPages = Math.ceil(filteredFinData.length / FIN_PAGE_SIZE)

  const handleExportCSV = () => {
    if (!filteredFinData.length) return
    const headers = ['Conta / Descrição', 'Valor', 'Período', 'Documento', 'Data de Extração']
    const csvContent = [
      headers.join(';'),
      ...filteredFinData.map((d) =>
        [
          `"${(d.account_name || '').replace(/"/g, '""')}"`,
          d.value || 0,
          `"${d.period || ''}"`,
          `"${d.document_type || ''}"`,
          `"${new Date(d.created_at).toLocaleDateString('pt-BR')}"`,
        ].join(';'),
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dados_extraidos_${client?.client_name}_${new Date().getTime()}.csv`
    link.click()
  }

  const handleExportXLSX = () => {
    if (!filteredFinData.length) return
    let xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n<Worksheet ss:Name="Dados Extraidos">\n<Table>\n`

    const headers = [
      'Conta / Descrição',
      'Valor',
      'Período',
      'Documento Origem',
      'Data de Extração',
    ]
    xml += `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>\n`

    filteredFinData.forEach((d) => {
      xml += `<Row>`
      xml += `<Cell><Data ss:Type="String">${(d.account_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`
      xml += `<Cell><Data ss:Type="Number">${d.value || 0}</Data></Cell>`
      xml += `<Cell><Data ss:Type="String">${(d.period || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`
      xml += `<Cell><Data ss:Type="String">${d.document_type || ''}</Data></Cell>`
      xml += `<Cell><Data ss:Type="String">${new Date(d.created_at).toLocaleDateString('pt-BR')}</Data></Cell>`
      xml += `</Row>\n`
    })

    xml += `</Table>\n</Worksheet>\n</Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dados_extraidos_${client?.client_name}_${new Date().getTime()}.xls`
    link.click()
  }

  if (loading && !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-medium">Cliente não encontrado.</h2>
        <Link to="/clients" className="text-primary hover:underline mt-4 inline-block">
          Voltar para Clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <Link
        to="/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/30 p-6 rounded-xl border border-white/5 backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{client.client_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {client.cnpj && <span>CNPJ: {client.cnpj}</span>}
            {client.industry && <span>Setor: {client.industry}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-4 bg-card/50 border border-white/5">
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="data">Dados Financeiros Extraídos</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end items-center mb-4">
            {userProfile && (
              <DocumentUploadModal
                userProfile={userProfile}
                defaultClientId={clientId}
                onSuccess={fetchData}
              />
            )}
          </div>
          <DocumentListTable
            documents={documents}
            loading={loading}
            canDelete={canDelete}
            onDownload={handleDownloadDoc}
            onDelete={handleDeleteDoc}
            onViewDetails={setViewDoc}
            onReprocess={canReprocess ? handleReprocessDoc : undefined}
          />
        </TabsContent>

        <TabsContent value="data" className="space-y-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Select
                  value={finDocTypeFilter}
                  onValueChange={(v) => {
                    setFinDocTypeFilter(v)
                    setFinPage(1)
                  }}
                >
                  <SelectTrigger className="pl-9 bg-card/50">
                    <SelectValue placeholder="Tipo de Documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="Balanço Patrimonial">Balanço Patrimonial</SelectItem>
                    <SelectItem value="Balanço">Balanço (Legado)</SelectItem>
                    <SelectItem value="Balancete">Balancete</SelectItem>
                    <SelectItem value="DRE">DRE</SelectItem>
                    <SelectItem value="Fluxo de Caixa">Fluxo de Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Filtrar por período..."
                value={finPeriodFilter}
                onChange={(e) => {
                  setFinPeriodFilter(e.target.value)
                  setFinPage(1)
                }}
                className="w-full sm:w-48 bg-card/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" /> Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportXLSX}>
                <Download className="w-4 h-4 mr-2" /> Exportar XLSX
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Conta / Descrição</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Documento Origem</TableHead>
                  <TableHead>Data de Extração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFinData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum dado encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFinData.map((d: any) => (
                    <TableRow key={d.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{d.account_name}</TableCell>
                      <TableCell>{d.period || 'N/A'}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(d.value || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white/5 text-muted-foreground">
                          {d.document_type || 'Desconhecido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalFinPages > 1 && (
            <div className="flex justify-end pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={finPage === 1}
                  onClick={() => setFinPage((p) => Math.max(1, p - 1))}
                  className="bg-card/50"
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Página {finPage} de {totalFinPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={finPage === totalFinPages}
                  onClick={() => setFinPage((p) => Math.min(totalFinPages, p + 1))}
                  className="bg-card/50"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DocumentDataModal doc={viewDoc} onClose={() => setViewDoc(null)} />
    </div>
  )
}
