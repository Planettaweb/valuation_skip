import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService, PlanoConta, TipoDocumento } from '@/services/contabilidade'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, AlertCircle, Loader2, CheckSquare, Square } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function MatrizRelacionamento() {
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [contas, setContas] = useState<PlanoConta[]>([])
  const [docs, setDocs] = useState<TipoDocumento[]>([])
  const [mappings, setMappings] = useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!userProfile?.org_id) return
    try {
      setLoading(true)
      const [contasData, docsData, mapsData] = await Promise.all([
        contabilidadeService.getAllPlanoContas(userProfile.org_id),
        contabilidadeService.getAllTiposDocumentos(userProfile.org_id),
        contabilidadeService.getMappings(userProfile.org_id),
      ])

      setContas(contasData || [])
      setDocs(docsData || [])

      const initialMap: Record<string, boolean> = {}
      mapsData?.forEach((m) => {
        initialMap[`${m.id_documento}_${m.id_conta}`] = true
      })
      setMappings(initialMap)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userProfile?.org_id])

  const filteredContas = contas.filter(
    (c) =>
      search === '' ||
      c.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      c.nome_conta?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleToggle = async (docId: string, contaId: string, checked: boolean) => {
    const key = `${docId}_${contaId}`
    const prev = { ...mappings }

    setMappings((m) => ({ ...m, [key]: checked }))

    try {
      if (checked) {
        await contabilidadeService.addMapping({
          org_id: userProfile!.org_id,
          id_documento: docId,
          id_conta: contaId,
          ordem: 0,
        })
      } else {
        await contabilidadeService.removeMapping(userProfile!.org_id, docId, contaId)
      }
    } catch (err: any) {
      setMappings(prev)
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleColumnToggle = async (docId: string, checked: boolean) => {
    if (!userProfile?.org_id) return
    try {
      setSaving(true)
      const contasIds = filteredContas.map((c) => c.id)

      const newMappings = { ...mappings }
      filteredContas.forEach((c) => {
        newMappings[`${docId}_${c.id}`] = checked
      })
      setMappings(newMappings)

      await contabilidadeService.batchUpdateMappings(userProfile.org_id, docId, contasIds, checked)
      toast({ title: `Coluna ${checked ? 'marcada' : 'desmarcada'} com sucesso` })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar coluna', description: err.message, variant: 'destructive' })
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleBatch = async (isAdd: boolean) => {
    if (!userProfile?.org_id) return
    if (
      !confirm(
        `Deseja realmente ${isAdd ? 'marcar' : 'desmarcar'} todas as contas visíveis para todos os documentos?`,
      )
    )
      return

    try {
      setSaving(true)
      const contasIds = filteredContas.map((c) => c.id)

      const newMappings = { ...mappings }
      docs.forEach((d) => {
        filteredContas.forEach((c) => {
          newMappings[`${d.id}_${c.id}`] = isAdd
        })
      })
      setMappings(newMappings)

      for (const d of docs) {
        await contabilidadeService.batchUpdateMappings(userProfile.org_id, d.id, contasIds, isAdd)
      }
      toast({ title: 'Alterações salvas com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro na operação em lote', description: err.message, variant: 'destructive' })
      loadData()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Matriz de Relacionamento</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleBatch(false)} disabled={loading || saving}>
            <Square className="w-4 h-4 mr-2" /> Desmarcar Tudo
          </Button>
          <Button onClick={() => handleBatch(true)} disabled={loading || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4 mr-2" />
            )}
            Marcar Tudo
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar conta por código ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center p-12 text-red-500 bg-red-500/10 rounded-lg">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p className="mb-4">{error}</p>
          <Button variant="outline" onClick={loadData}>
            Tentar Novamente
          </Button>
        </div>
      ) : contas.length === 0 || docs.length === 0 ? (
        <div className="flex flex-col items-center p-12 border border-dashed rounded-lg text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-4 text-primary" />
          <p className="text-lg font-medium text-foreground mb-1">Dados insuficientes</p>
          <p>Você precisa cadastrar planos de contas e tipos de documentos para usar a matriz.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto bg-card shadow-sm">
          <Table className="relative w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-r min-w-[300px]">
                  Conta
                </TableHead>
                {docs.map((d) => {
                  const isAllChecked =
                    filteredContas.length > 0 &&
                    filteredContas.every((c) => mappings[`${d.id}_${c.id}`])
                  const isSomeChecked = filteredContas.some((c) => mappings[`${d.id}_${c.id}`])
                  return (
                    <TableHead
                      key={d.id}
                      className="text-center min-w-[120px] bg-muted/80 backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center gap-2 justify-center py-2">
                        <span>{d.descricao}</span>
                        <Checkbox
                          checked={isAllChecked ? true : isSomeChecked ? 'indeterminate' : false}
                          onCheckedChange={(checked) => {
                            if (checked === 'indeterminate') return
                            handleColumnToggle(d.id, checked as boolean)
                          }}
                          disabled={loading || saving || filteredContas.length === 0}
                          title="Selecionar toda a coluna"
                        />
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContas.map((c) => (
                <TableRow
                  key={c.id}
                  className="animate-fade-in-up hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="sticky left-0 z-10 bg-card border-r font-medium">
                    <div className="flex flex-col">
                      <span>{c.codigo}</span>
                      <span className="text-xs text-muted-foreground">{c.nome_conta}</span>
                    </div>
                  </TableCell>
                  {docs.map((d) => {
                    const key = `${d.id}_${c.id}`
                    const isChecked = !!mappings[key]
                    return (
                      <TableCell key={key} className="text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleToggle(d.id, c.id, checked as boolean)
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
