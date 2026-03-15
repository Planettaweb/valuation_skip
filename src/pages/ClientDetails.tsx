import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Folder,
  ExternalLink,
  Download,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { clientService } from '@/services/clients'
import { useToast } from '@/hooks/use-toast'
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
import { ValuationDialog } from '@/components/valuations/ValuationDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

const FIN_PAGE_SIZE = 50

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>()
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [client, setClient] = useState<any>(null)
  const [valuations, setValuations] = useState<any[]>([])
  const [financialData, setFinancialData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVal, setEditingVal] = useState<any>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  // Filters and pagination for financial data
  const [finDocTypeFilter, setFinDocTypeFilter] = useState('all')
  const [finPeriodFilter, setFinPeriodFilter] = useState('')
  const [finPage, setFinPage] = useState(1)

  const fetchData = async () => {
    if (!clientId) return
    setLoading(true)
    const [clientRes, valRes, finRes] = await Promise.all([
      clientService.getClient(clientId),
      clientService.getValuations(clientId),
      clientService.getFinancialData(clientId),
    ])
    if (clientRes.data) setClient(clientRes.data)
    if (valRes.data) setValuations(valRes.data)
    if (finRes.data) {
      setFinancialData(
        finRes.data.map((d: any) => ({
          ...d,
          document_type: d.financial_documents?.document_type,
          valuation_id: d.financial_documents?.valuation_id,
        })),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  const handleSave = async (data: any) => {
    if (!userProfile || !clientId) return
    if (editingVal) {
      const { error } = await clientService.updateValuation(editingVal.id, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Projeto atualizado.' })
    } else {
      const { error } = await clientService.createValuation(userProfile.org_id, clientId, data)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Projeto criado com sucesso.' })
    }
    fetchData()
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await clientService.deleteValuation(toDelete.id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'Projeto removido.' })
    fetchData()
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

  if (loading) {
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
        <Button
          onClick={() => {
            setEditingVal(null)
            setDialogOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Projeto
        </Button>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-4 bg-card/50 border border-white/5">
          <TabsTrigger value="projects">Projetos de Valuation</TabsTrigger>
          <TabsTrigger value="data">Dados Financeiros Extraídos</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Nome do Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SharePoint</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum projeto encontrado para este cliente.
                    </TableCell>
                  </TableRow>
                ) : (
                  valuations.map((v) => (
                    <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{v.valuation_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white/5">
                          {v.valuation_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            v.status === 'Concluído'
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                          }
                        >
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {v.sharepoint_folder_path ? (
                          <a
                            href={v.sharepoint_folder_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Acessar Pasta
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não configurado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Link to={`/documents?valuationId=${v.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Folder className="w-4 h-4 mr-2" /> Documentos
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            onClick={() => {
                              setEditingVal(v)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => {
                              setToDelete(v)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                    <SelectItem value="Balanço">Balanço</SelectItem>
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

      <ValuationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingVal}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Todos os documentos financeiros vinculados serão perdidos."
      />
    </div>
  )
}
