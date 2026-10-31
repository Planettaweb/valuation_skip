import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Search, Inbox, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { ExtratoLancamento, conciliacaoService } from '@/services/conciliacao'
import { PlanoContaOption } from '@/lib/conciliacao-engine'
import { toast } from '@/hooks/use-toast'

interface InboxTriagemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lancamentos: ExtratoLancamento[]
  planoContas: PlanoContaOption[]
  orgId: string
  clientId: string
  onAtualizado: () => void
  onAbrirNovaConta: (initialNome: string) => void
}

export function InboxTriagemModal({
  open,
  onOpenChange,
  lancamentos,
  planoContas,
  orgId,
  clientId,
  onAtualizado,
  onAbrirNovaConta,
}: InboxTriagemModalProps) {
  const [search, setSearch] = useState('')
  const [contaSelecionada, setContaSelecionada] = useState<string>('')
  const [buscaConta, setBuscaConta] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processando, setProcessando] = useState(false)

  // Filtrar apenas lançamentos não classificados ou divergentes
  const pendentes = useMemo(() => {
    return lancamentos.filter(
      (l) =>
        l.status === 'nao_classificado' || l.status === 'divergente' || l.status === 'sugerido',
    )
  }, [lancamentos])

  const pendentesFiltrados = useMemo(() => {
    if (!search.trim()) return pendentes
    const s = search.toLowerCase()
    return pendentes.filter(
      (l) =>
        l.descricao_original.toLowerCase().includes(s) ||
        l.descricao_normalizada.toLowerCase().includes(s) ||
        (l.documento_ref && l.documento_ref.toLowerCase().includes(s)),
    )
  }, [pendentes, search])

  const contasFiltradas = useMemo(() => {
    if (!buscaConta.trim()) return planoContas.slice(0, 30)
    const b = buscaConta.toLowerCase()
    return planoContas
      .filter(
        (c) =>
          c.nome_conta.toLowerCase().includes(b) ||
          (c.codigo && c.codigo.toLowerCase().includes(b)) ||
          (c.descricao && c.descricao.toLowerCase().includes(b)),
      )
      .slice(0, 50)
  }, [planoContas, buscaConta])

  const toggleSelectAll = () => {
    if (selectedIds.length === pendentesFiltrados.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendentesFiltrados.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleConciliarLote = async () => {
    if (!selectedIds.length || !contaSelecionada) return

    setProcessando(true)
    try {
      const items = selectedIds
        .map((id) => {
          const lanc = pendentes.find((p) => p.id === id)
          if (!lanc) return null
          return {
            id: lanc.id,
            contaId: contaSelecionada,
            descricao: lanc.descricao_original,
          }
        })
        .filter(Boolean) as Array<{ id: string; contaId: string; descricao: string }>

      const res = await conciliacaoService.conciliarEmLote(items, orgId, clientId)

      toast({
        title: 'Triagem em Lote Concluída',
        description: `${res.sucesso} lançamentos foram conciliados e suas descrições registradas no Dicionário para automação futura!`,
      })

      setSelectedIds([])
      onAtualizado()
    } catch (err: any) {
      toast({
        title: 'Erro na triagem em lote',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
    }
  }

  const handleMarcarForaDoPadraoLote = async () => {
    if (!selectedIds.length) return

    setProcessando(true)
    try {
      await conciliacaoService.marcarComoForaDoPadrao(selectedIds)
      toast({
        title: 'Lançamentos Marcados Fora do Padrão',
        description: `${selectedIds.length} itens marcados como Fora do Padrão (disponíveis para auditoria, sem bloquear relatórios).`,
      })
      setSelectedIds([])
      onAtualizado()
    } catch (err: any) {
      toast({
        title: 'Erro ao marcar fora do padrão',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col bg-card border-white/10 p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" />
              Inbox de Triagem e Classificação Humana
            </DialogTitle>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
              {pendentes.length} pendentes de conciliação
            </Badge>
          </div>
          <DialogDescription>
            Selecione múltiplos lançamentos sem classificação para atribuir uma conta padrão em
            lote, ou marque-os como &quot;Fora do Padrão&quot;. Ao confirmar, as descrições
            alimentam o dicionário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 py-2">
          {/* Coluna 1 & 2: Lista de lançamentos pendentes com multiseleção */}
          <div className="md:col-span-2 flex flex-col space-y-3 min-h-0 border border-white/10 rounded-xl p-4 bg-background/30">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar lançamentos no inbox..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-background/50 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs h-9 shrink-0"
              >
                {selectedIds.length === pendentesFiltrados.length && pendentesFiltrados.length > 0
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {pendentesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                  <Inbox className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum lançamento pendente encontrado.</p>
                </div>
              ) : (
                pendentesFiltrados.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-white/5 bg-card/50 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-sm sm:max-w-md">
                            {item.descricao_original}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground mt-0.5 text-[11px]">
                            <span>{item.data}</span>
                            {item.documento_ref && <span>Doc: {item.documento_ref}</span>}
                            {item.score_sugestao ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 border-primary/30"
                              >
                                Match {Math.round(item.score_sugestao)}%
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-semibold ${
                            item.valor < 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.valor)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedIds.length} selecionados</span>
              <span>Total no inbox: {pendentesFiltrados.length}</span>
            </div>
          </div>

          {/* Coluna 3: Seletor de conta padrão para atribuir */}
          <div className="flex flex-col space-y-3 min-h-0 border border-white/10 rounded-xl p-4 bg-background/30">
            <h4 className="text-sm font-semibold text-white">Vincular à Conta do Plano</h4>
            <p className="text-xs text-muted-foreground">
              Escolha a conta contábil para aplicar nos {selectedIds.length} lançamentos marcados.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar contas..."
                value={buscaConta}
                onChange={(e) => setBuscaConta(e.target.value)}
                className="pl-8 h-8 text-xs bg-background/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0 border border-white/5 rounded-lg p-1">
              {contasFiltradas.map((c) => {
                const isSelected = contaSelecionada === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setContaSelecionada(c.id)}
                    className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-white/5 text-foreground'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-[10px] opacity-75 mr-1">{c.codigo}</span>
                      <span>{c.nome_conta}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const firstSelected = pendentes.find((p) => selectedIds.includes(p.id))
                  onAbrirNovaConta(firstSelected ? firstSelected.descricao_original : '')
                }}
              >
                + Criar Nova Conta Provisória
              </Button>

              <Button
                size="sm"
                className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!selectedIds.length || !contaSelecionada || processando}
                onClick={handleConciliarLote}
              >
                {processando ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  `Conciliar ${selectedIds.length} Itens Selecionados`
                )}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                disabled={!selectedIds.length || processando}
                onClick={handleMarcarForaDoPadraoLote}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Marcar como Fora do Padrão
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
