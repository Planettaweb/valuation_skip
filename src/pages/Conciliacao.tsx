import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Inbox,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { clientService } from '@/services/clients'
import { conciliacaoService, ExtratoLancamento } from '@/services/conciliacao'
import { PlanoContaOption } from '@/lib/conciliacao-engine'
import { ConciliacaoUploadModal } from '@/components/conciliacao/ConciliacaoUploadModal'
import { InboxTriagemModal } from '@/components/conciliacao/InboxTriagemModal'
import { NovaContaModal } from '@/components/conciliacao/NovaContaModal'
import { toast } from '@/hooks/use-toast'

export default function Conciliacao() {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [lancamentos, setLancamentos] = useState<ExtratoLancamento[]>([])
  const [planoContas, setPlanoContas] = useState<PlanoContaOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [somenteForaDoPadrao, setSomenteForaDoPadrao] = useState(false)

  // Modais
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [inboxModalOpen, setInboxModalOpen] = useState(false)
  const [novaContaModalOpen, setNovaContaModalOpen] = useState(false)
  const [novaContaInitialNome, setNovaContaInitialNome] = useState('')

  // Carrega clientes da organização
  useEffect(() => {
    async function loadClients() {
      if (!userProfile?.org_id) return
      const res = await clientService.getClients(userProfile.org_id)
      if (res.data && res.data.length > 0) {
        setClients(res.data)
        setSelectedClientId(res.data[0].id)
      } else {
        setLoading(false)
      }
    }
    loadClients()
  }, [userProfile?.org_id])

  // Carrega lançamentos e plano de contas do cliente selecionado
  const carregarDados = async () => {
    if (!userProfile?.org_id || !selectedClientId) return
    setLoading(true)

    try {
      const [pcData, lancData] = await Promise.all([
        conciliacaoService.getPlanoContas(userProfile.org_id, selectedClientId),
        conciliacaoService.getLancamentos(userProfile.org_id, selectedClientId, {
          status: statusFilter,
          search: search || undefined,
          somenteForaDoPadrao,
        }),
      ])

      setPlanoContas(pcData)
      setLancamentos(lancData)
    } catch (err: any) {
      console.error('Erro ao carregar dados de conciliação:', err)
      toast({
        title: 'Erro ao carregar conciliação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClientId) {
      carregarDados()
    }
  }, [selectedClientId, statusFilter, somenteForaDoPadrao])

  // Confirmação com 1 clique de uma sugestão do motor
  const handleConfirmarSugestao = async (
    lancamento: ExtratoLancamento,
    contaId: string,
    contaNome: string,
  ) => {
    if (!userProfile?.org_id || !selectedClientId) return

    const res = await conciliacaoService.confirmarConciliacao({
      lancamentoId: lancamento.id,
      contaId,
      descricaoOriginal: lancamento.descricao_original,
      orgId: userProfile.org_id,
      clientId: selectedClientId,
      reconciliarSimilaresAgora: true,
    })

    if (res.sucesso) {
      const extraMsg =
        res.similaresAtualizados && res.similaresAtualizados > 0
          ? ` e +${res.similaresAtualizados} lançamentos similares foram conciliados automaticamente`
          : ''
      toast({
        title: 'Lançamento Conciliado com Sucesso',
        description: `Vinculado à conta "${contaNome}". Regra gravada no Dicionário${extraMsg}!`,
      })
      carregarDados()
    } else {
      toast({
        title: 'Erro na confirmação',
        description: res.error,
        variant: 'destructive',
      })
    }
  }

  // Marcar como Fora do Padrão
  const handleMarcarForaDoPadrao = async (lancamento: ExtratoLancamento) => {
    if (!userProfile?.org_id || !selectedClientId) return

    const res = await conciliacaoService.confirmarConciliacao({
      lancamentoId: lancamento.id,
      descricaoOriginal: lancamento.descricao_original,
      orgId: userProfile.org_id,
      clientId: selectedClientId,
      foraDoPadrao: true,
      reconciliarSimilaresAgora: false,
    })

    if (res.sucesso) {
      toast({
        title: 'Lançamento marcado como Fora do Padrão',
        description:
          'Não bloqueia o fluxo financeiro nem cai em conta genérica. Disponível para auditoria.',
      })
      carregarDados()
    }
  }

  // Estatísticas do topo
  const stats = useMemo(() => {
    const total = lancamentos.length
    const conciliados = lancamentos.filter((l) => l.status === 'conciliado').length
    const sugeridos = lancamentos.filter((l) => l.status === 'sugerido').length
    const pendentes = lancamentos.filter(
      (l) => l.status === 'nao_classificado' || l.status === 'divergente',
    ).length
    const foraPadrao = lancamentos.filter((l) => l.fora_do_padrao).length

    const taxa = total > 0 ? Math.round((conciliados / total) * 100) : 0

    return { total, conciliados, sugeridos, pendentes, foraPadrao, taxa }
  }, [lancamentos])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Conciliação Financeira</h1>
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary font-medium"
            >
              Fase 1 • Motor 3 Camadas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dicionário de autoaprendizado com confirmações humanas, sugestões automáticas e triagem
            em lote.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Cliente */}
          <div className="w-64">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => setInboxModalOpen(true)}
            disabled={!selectedClientId}
            className="border-white/10 hover:bg-white/5"
          >
            <Inbox className="w-4 h-4 mr-2 text-amber-400" />
            Inbox de Triagem ({stats.sugeridos + stats.pendentes})
          </Button>

          <Button
            onClick={() => setUploadModalOpen(true)}
            disabled={!selectedClientId}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Extrato (OFX / CSV / Sispag)
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Taxa de Conciliação</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">{stats.taxa}%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {stats.conciliados} de {stats.total} itens
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Conciliados
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">{stats.conciliados}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Camada 1 & Confirmados
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Sugeridos (Camada 2)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">{stats.sugeridos}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Aguardando 1 clique
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Triagem / Não Classificados
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-400">{stats.pendentes}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Inbox de classificação
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
              Fora do Padrão
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-400">{stats.foraPadrao}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Auditoria (sem bloqueio)
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar lançamento ou histórico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && carregarDados()}
              className="pl-9 h-9 bg-background/50 border-white/10 text-xs"
            />
          </div>

          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 bg-background/50 border-white/10 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="conciliado">Apenas Conciliados</SelectItem>
                <SelectItem value="sugerido">Apenas Sugeridos</SelectItem>
                <SelectItem value="nao_classificado">Não Classificados</SelectItem>
                <SelectItem value="divergente">Divergentes / Sem Par</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant={somenteForaDoPadrao ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSomenteForaDoPadrao(!somenteForaDoPadrao)}
            className="text-xs h-9 border-white/10"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-purple-400" />
            Somente Fora do Padrão
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={carregarDados}
            className="text-xs text-muted-foreground hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNovaContaInitialNome('')
              setNovaContaModalOpen(true)
            }}
            className="text-xs border-white/10 hover:bg-white/5"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1 text-primary" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <Card className="bg-card/30 border-white/5 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-24">Data</TableHead>
              <TableHead>Histórico / Descrição Original</TableHead>
              <TableHead className="w-32 text-right">Valor</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="min-w-[320px]">Conta Associada / Sugestões do Motor</TableHead>
              <TableHead className="w-24 text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Carregando lançamentos e executando motor em 3 camadas...
                </TableCell>
              </TableRow>
            ) : lancamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-white mb-1">Nenhum lançamento encontrado.</p>
                  <p className="text-xs max-w-md mx-auto">
                    Importe um arquivo de extrato bancário (OFX/CSV) ou Sispag acima para que o
                    motor de conciliação comece a classificar automaticamente.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              lancamentos.map((item) => {
                const isConciliado = item.status === 'conciliado'
                const isSugerido = item.status === 'sugerido'
                const sugestoes = item.sugestoes || []
                const topSugestao = sugestoes[0]

                return (
                  <TableRow
                    key={item.id}
                    className="border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* Data */}
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {item.data}
                    </TableCell>

                    {/* Descrição */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-white text-xs leading-snug">
                          {item.descricao_original}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {item.banco && <span>{item.banco}</span>}
                          {item.tipo_arquivo && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 border-white/10"
                            >
                              {item.tipo_arquivo}
                            </Badge>
                          )}
                          {item.documento_ref && <span>Doc: {item.documento_ref}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Valor */}
                    <TableCell
                      className={`text-right font-semibold text-xs whitespace-nowrap ${
                        item.valor < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.valor)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isConciliado ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conciliado
                        </Badge>
                      ) : isSugerido ? (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px]">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Sugerido ({Math.round(item.score_sugestao || topSugestao?.score || 0)}%)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[11px]"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Triagem
                        </Badge>
                      )}

                      {item.fora_do_padrao && (
                        <Badge className="mt-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] block w-fit">
                          Fora do Padrão
                        </Badge>
                      )}
                    </TableCell>

                    {/* Conta Associada ou Sugestões */}
                    <TableCell>
                      {isConciliado && item.plano_contas ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                            {item.plano_contas.codigo}
                          </span>
                          <span className="font-medium text-white">
                            {item.plano_contas.nome_conta}
                          </span>
                        </div>
                      ) : isConciliado && item.fora_do_padrao ? (
                        <span className="text-xs text-purple-300 italic">
                          Classificação provisória / Fora do Padrão
                        </span>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          {sugestoes.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sugestoes.slice(0, 2).map((sug) => (
                                <button
                                  key={sug.conta_id}
                                  type="button"
                                  onClick={() =>
                                    handleConfirmarSugestao(item, sug.conta_id, sug.nome_conta)
                                  }
                                  title={`Motivo: ${sug.motivo} (Confiança: ${sug.score}%)`}
                                  className="group inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-foreground transition-all cursor-pointer"
                                >
                                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-primary">
                                    {sug.codigo}
                                  </span>
                                  <span className="font-medium truncate max-w-[170px]">
                                    {sug.nome_conta}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] py-0 px-1 border-primary/30 text-primary ml-1 group-hover:bg-primary group-hover:text-primary-foreground"
                                  >
                                    {Math.round(sug.score)}%
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Sem match automático. Requer classificação manual.
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isConciliado && (
                          <>
                            {topSugestao && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleConfirmarSugestao(
                                    item,
                                    topSugestao.conta_id,
                                    topSugestao.nome_conta,
                                  )
                                }
                                className="h-7 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                title="Confirmar 1ª sugestão com 1 clique"
                              >
                                Confirmar
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarcarForaDoPadrao(item)}
                              className="h-7 text-[11px] text-muted-foreground hover:text-purple-300"
                              title="Marca fora do padrão (não bloqueia DFC e relatórios)"
                            >
                              Sem Encaixe
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modais */}
      {userProfile && selectedClientId && (
        <>
          <ConciliacaoUploadModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            orgId={userProfile.org_id}
            clientId={selectedClientId}
            onSuccess={carregarDados}
          />

          <InboxTriagemModal
            open={inboxModalOpen}
            onOpenChange={setInboxModalOpen}
            lancamentos={lancamentos}
            planoContas={planoContas}
            orgId={userProfile.org_id}
            clientId={selectedClientId}
            onAtualizado={carregarDados}
            onAbrirNovaConta={(nome) => {
              setNovaContaInitialNome(nome)
              setNovaContaModalOpen(true)
            }}
          />

          <NovaContaModal
            open={novaContaModalOpen}
            onOpenChange={setNovaContaModalOpen}
            orgId={userProfile.org_id}
            clientId={selectedClientId}
            initialNome={novaContaInitialNome}
            onContaCriada={(novaConta) => {
              setPlanoContas((prev) => [novaConta, ...prev])
              carregarDados()
            }}
          />
        </>
      )}
    </div>
  )
}
