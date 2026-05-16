import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  LayoutDashboard,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchReports,
  fetchMetabaseUrl,
  createReport,
  updateReport,
  deleteReport,
  EmbeddedReport,
} from '@/services/reports'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Reports() {
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'Admin'

  const [reports, setReports] = useState<EmbeddedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])

  const [selectedReport, setSelectedReport] = useState<EmbeddedReport | null>(null)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [loadingIframe, setLoadingIframe] = useState(false)
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<EmbeddedReport>>({
    title: '',
    description: '',
    report_type: 'dashboard',
    resource_id: 0,
    client_id: 'none',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [reportsData, clientsData] = await Promise.all([
        fetchReports(),
        (supabase as any).from('clients').select('id, client_name').order('client_name'),
      ])
      setReports(reportsData)
      setClients(clientsData.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar relatórios', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReport = async (report: EmbeddedReport) => {
    setSelectedReport(report)
    setIframeUrl(null)
    setLoadingIframe(true)
    try {
      const url = await fetchMetabaseUrl(report.id)
      setIframeUrl(url)
    } catch (err: any) {
      toast.error('Erro ao gerar token do Metabase', { description: err.message })
    } finally {
      setLoadingIframe(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.resource_id) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        ...formData,
        client_id: formData.client_id === 'none' ? null : formData.client_id,
        resource_id: Number(formData.resource_id),
      }

      if (formData.id) {
        await updateReport(formData.id, payload)
        toast.success('Relatório atualizado')
      } else {
        await createReport(payload)
        toast.success('Relatório criado')
      }
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error('Erro ao salvar', { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir este relatório?')) return

    try {
      await deleteReport(id)
      toast.success('Relatório excluído')
      if (selectedReport?.id === id) {
        setSelectedReport(null)
        setIframeUrl(null)
      }
      loadData()
    } catch (err: any) {
      toast.error('Erro ao excluir', { description: err.message })
    }
  }

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-background">
      <div className="w-full md:w-80 border-r border-border bg-card/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Relatórios
          </h2>
          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  report_type: 'dashboard',
                  resource_id: 0,
                  client_id: 'none',
                })
                setIsModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar relatórios..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center p-8 text-sm text-muted-foreground">
              Nenhum relatório encontrado.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all border group',
                  selectedReport?.id === report.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-background border-transparent hover:border-border hover:bg-muted',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-md shrink-0',
                        report.report_type === 'dashboard'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-emerald-500/10 text-emerald-500',
                      )}
                    >
                      {report.report_type === 'dashboard' ? (
                        <LayoutDashboard className="w-4 h-4" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-tight">{report.title}</p>
                      {report.clients?.client_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {report.clients.client_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData({
                            ...report,
                            client_id: report.client_id || 'none',
                          })
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => handleDelete(report.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {selectedReport ? (
          <div className="flex-1 flex flex-col relative h-full">
            <div className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-6 shrink-0">
              <div>
                <h3 className="font-medium">{selectedReport.title}</h3>
                {selectedReport.description && (
                  <p className="text-xs text-muted-foreground">{selectedReport.description}</p>
                )}
              </div>
              {iframeUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    Abrir Externo <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>

            <div className="flex-1 w-full bg-muted/30 relative">
              {loadingIframe ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Autenticando com Metabase...
                  </p>
                </div>
              ) : iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0"
                  allow="fullscreen"
                  title={selectedReport.title}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Não foi possível carregar o relatório.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório selecionado</h3>
            <p className="text-sm text-center max-w-md">
              Selecione um relatório na lista ao lado para visualizá-lo. Os relatórios são gerados
              dinamicamente via Metabase.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Editar Relatório' : 'Novo Relatório Metabase'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Relatório *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((s) => ({ ...s, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.report_type}
                  onValueChange={(v: any) => setFormData((s) => ({ ...s, report_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="question">Question (Relatório)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID do Recurso (Metabase) *</Label>
                <Input
                  type="number"
                  value={formData.resource_id}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, resource_id: Number(e.target.value) }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vincular Cliente (Opcional)</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(v) => setFormData((s) => ({ ...s, client_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum / Global</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se selecionado, o ID do cliente será passado como{' '}
                <code className="bg-muted px-1 rounded">idEntidadeAplicacao</code>.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
