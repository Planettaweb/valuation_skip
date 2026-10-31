import { supabase } from '@/lib/supabase/client'
import {
  normalizarDescricao,
  sugerirConta,
  gerarHashLancamento,
  DicionarioMapping,
  PlanoContaOption,
  SugestaoConta,
} from '@/lib/conciliacao-engine'
import { LancamentoExtraido } from '@/lib/extrato-parser'

export interface ExtratoLancamento {
  id: string
  org_id: string
  client_id: string
  conta_bancaria?: string | null
  banco?: string | null
  data: string
  descricao_original: string
  descricao_normalizada: string
  documento_ref?: string | null
  valor: number
  tipo_movimento: 'debito' | 'credito'
  tipo_arquivo: string
  status: 'conciliado' | 'sugerido' | 'nao_classificado' | 'divergente'
  conta_id?: string | null
  fora_do_padrao: boolean
  score_sugestao?: number | null
  sugestoes?: SugestaoConta[] | null
  fitid?: string | null
  hash_dedup: string
  metadata?: any
  created_at: string
  updated_at: string
  // Relações
  plano_contas?: {
    id: string
    codigo: string
    nome_conta: string
    tipo?: string
    natureza?: string
  } | null
}

export const conciliacaoService = {
  /**
   * Carrega plano de contas padrão da organização (ou cliente)
   */
  async getPlanoContas(orgId: string, clientId?: string): Promise<PlanoContaOption[]> {
    let query = supabase
      .from('plano_contas')
      .select('id, codigo, nome_conta, descricao, tipo, grupo, natureza')
      .eq('org_id', orgId)
      .eq('ativo', true)

    if (clientId) {
      query = query.or(`client_id.eq.${clientId},client_id.is.null`)
    } else {
      query = query.is('client_id', null)
    }

    const { data, error } = await query.order('ordem', { ascending: true })
    if (error) {
      console.error('Erro ao buscar plano de contas:', error)
      return []
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      codigo: c.codigo,
      nome_conta: c.nome_conta || c.descricao || 'Conta',
      descricao: c.descricao,
      tipo: c.tipo,
      grupo: c.grupo,
      natureza: c.natureza,
    }))
  },

  /**
   * Carrega o dicionário de sinônimos/regras de mapeamento da organização
   */
  async getDicionario(orgId: string, clientId?: string): Promise<DicionarioMapping[]> {
    let query = supabase.from('plano_contas_mapping').select('*').eq('org_id', orgId)

    if (clientId) {
      query = query.or(`client_id.eq.${clientId},client_id.is.null`)
    }

    const { data, error } = await query.order('contador_uso', { ascending: false })
    if (error) {
      console.error('Erro ao buscar dicionario:', error)
      return []
    }
    return data || []
  },

  /**
   * Carrega lançamentos importados com filtros
   */
  async getLancamentos(
    orgId: string,
    clientId: string,
    filtros?: {
      status?: string
      search?: string
      somenteForaDoPadrao?: boolean
    },
  ): Promise<ExtratoLancamento[]> {
    let query = supabase
      .from('extrato_lancamentos')
      .select(`
        *,
        plano_contas (
          id,
          codigo,
          nome_conta,
          tipo,
          natureza
        )
      `)
      .eq('org_id', orgId)
      .eq('client_id', clientId)
      .order('data', { ascending: false })

    if (filtros?.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.somenteForaDoPadrao) {
      query = query.eq('fora_do_padrao', true)
    }

    if (filtros?.search) {
      query = query.ilike('descricao_original', `%${filtros.search}%`)
    }

    const { data, error } = await query.limit(500)
    if (error) {
      console.error('Erro ao buscar lancamentos:', error)
      return []
    }
    return (data || []) as ExtratoLancamento[]
  },

  /**
   * Importa lista de lançamentos de extrato aplicando o motor de 3 camadas imediatamente
   */
  async importarLancamentos(
    orgId: string,
    clientId: string,
    lancamentos: LancamentoExtraido[],
    tipoArquivo: 'OFX' | 'CSV' | 'SISPAG',
    onProgress?: (index: number, total: number) => void,
  ): Promise<{ inseridos: number; ignoradosDuplicados: number }> {
    const planoContas = await this.getPlanoContas(orgId, clientId)
    const dicionario = await this.getDicionario(orgId, clientId)

    let inseridos = 0
    let ignoradosDuplicados = 0

    const batchToInsert: any[] = []

    for (let i = 0; i < lancamentos.length; i++) {
      const lanc = lancamentos[i]
      const descNorm = normalizarDescricao(lanc.descricao_original)
      const hash = gerarHashLancamento(
        lanc.data,
        lanc.valor,
        lanc.descricao_original,
        lanc.documento_ref,
      )

      // Executa o motor em 3 camadas
      const sugestoes = sugerirConta(lanc.descricao_original, dicionario, planoContas)

      let status = 'nao_classificado'
      let contaId: string | null = null
      let score: number | null = null

      if (sugestoes.length > 0) {
        const melhor = sugestoes[0]
        if (melhor.camada === 1 && melhor.score >= 95) {
          // Camada 1: Dicionário exato -> concilia direto!
          status = 'conciliado'
          contaId = melhor.conta_id
          score = melhor.score
        } else if (melhor.camada === 2 && melhor.score >= 50) {
          // Camada 2: Similaridade consistente -> marca como sugerido
          status = 'sugerido'
          score = melhor.score
        } else {
          // Camada 3: Fica para triagem no inbox
          status = 'nao_classificado'
          score = melhor.score
        }
      }

      batchToInsert.push({
        org_id: orgId,
        client_id: clientId,
        banco: lanc.banco || null,
        conta_bancaria: lanc.conta_bancaria || null,
        data: lanc.data,
        descricao_original: lanc.descricao_original,
        descricao_normalizada: descNorm,
        documento_ref: lanc.documento_ref || null,
        valor: lanc.valor,
        tipo_movimento: lanc.tipo_movimento,
        tipo_arquivo: tipoArquivo,
        status,
        conta_id: contaId,
        fora_do_padrao: false,
        score_sugestao: score,
        sugestoes: sugestoes as any,
        fitid: lanc.fitid || null,
        hash_dedup: hash,
        metadata: {
          origem_importacao: tipoArquivo,
          timestamp: new Date().toISOString(),
        },
      })

      if (onProgress && i % 10 === 0) {
        onProgress(i, lancamentos.length)
      }
    }

    // Inserir com ON CONFLICT ignorando duplicados por hash_dedup
    const BATCH_SIZE = 100
    for (let i = 0; i < batchToInsert.length; i += BATCH_SIZE) {
      const slice = batchToInsert.slice(i, i + BATCH_SIZE)
      const { data, error } = await supabase
        .from('extrato_lancamentos')
        .upsert(slice, { onConflict: 'org_id,client_id,hash_dedup', ignoreDuplicates: true })
        .select('id')

      if (error) {
        console.error('Erro ao inserir lote de extrato:', error)
      } else {
        inseridos += data?.length || 0
      }
    }

    ignoradosDuplicados = Math.max(0, batchToInsert.length - inseridos)
    return { inseridos, ignoradosDuplicados }
  },

  /**
   * Confirmação humana de uma conta para um lançamento.
   * Regra Central:
   * 1. Atualiza o lançamento para status 'conciliado', gravando conta_id e fora_do_padrao.
   * 2. Grava regra definitiva no dicionário `plano_contas_mapping` para a organização/cliente.
   * 3. Garante que os próximos lançamentos com mesma descrição se conciliem automaticamente.
   */
  async confirmarConciliacao(params: {
    lancamentoId: string
    contaId?: string | null
    descricaoOriginal: string
    orgId: string
    clientId: string
    foraDoPadrao?: boolean
    reconciliarSimilaresAgora?: boolean
  }): Promise<{ sucesso: boolean; similaresAtualizados?: number; error?: string }> {
    try {
      const descNorm = normalizarDescricao(params.descricaoOriginal)
      const isFora = params.foraDoPadrao ?? false

      // 1. Atualizar o lançamento corrente
      const updateData: any = {
        status: isFora ? 'divergente' : 'conciliado',
        conta_id: params.contaId || null,
        fora_do_padrao: isFora,
        updated_at: new Date().toISOString(),
      }

      const { error: updErr } = await supabase
        .from('extrato_lancamentos')
        .update(updateData)
        .eq('id', params.lancamentoId)

      if (updErr) throw updErr

      // 2. Se houver conta_id associada, grava/atualiza no dicionário de sinônimos (plano_contas_mapping)
      if (params.contaId && !isFora) {
        // Tenta buscar regra existente para a mesma chave de texto normalizado na org
        const { data: regraExistente } = await supabase
          .from('plano_contas_mapping')
          .select('id, contador_uso')
          .eq('org_id', params.orgId)
          .eq('texto_normalizado', descNorm)
          .maybeSingle()

        if (regraExistente) {
          await supabase
            .from('plano_contas_mapping')
            .update({
              id_conta: params.contaId,
              confianca: 100.0,
              contador_uso: (regraExistente.contador_uso || 1) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', regraExistente.id)
        } else {
          await supabase.from('plano_contas_mapping').insert({
            org_id: params.orgId,
            client_id: params.clientId,
            texto_original: params.descricaoOriginal,
            texto_normalizado: descNorm,
            id_conta: params.contaId,
            origem: 'manual',
            confianca: 100.0,
            contador_uso: 1,
          })
        }

        // 3. Atualizar em lote lançamentos similares não classificados / sugeridos pendentes
        if (params.reconciliarSimilaresAgora !== false) {
          const { data: similares, error: simErr } = await supabase
            .from('extrato_lancamentos')
            .update({
              status: 'conciliado',
              conta_id: params.contaId,
              score_sugestao: 100,
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', params.orgId)
            .eq('client_id', params.clientId)
            .eq('descricao_normalizada', descNorm)
            .neq('status', 'conciliado')
            .select('id')

          if (!simErr && similares) {
            return { sucesso: true, similaresAtualizados: similares.length }
          }
        }
      }

      return { sucesso: true, similaresAtualizados: 0 }
    } catch (err: any) {
      console.error('Erro ao confirmar conciliacao:', err)
      return { sucesso: false, error: err.message || 'Erro ao confirmar conciliação' }
    }
  },

  /**
   * Conciliação em lote para o Inbox de Triagem
   */
  async conciliarEmLote(
    lancamentos: Array<{ id: string; contaId: string; descricao: string }>,
    orgId: string,
    clientId: string,
  ): Promise<{ sucesso: number; falhas: number }> {
    let sucesso = 0
    let falhas = 0

    for (const item of lancamentos) {
      const res = await this.confirmarConciliacao({
        lancamentoId: item.id,
        contaId: item.contaId,
        descricaoOriginal: item.descricao,
        orgId,
        clientId,
        reconciliarSimilaresAgora: false,
      })
      if (res.sucesso) sucesso++
      else falhas++
    }

    return { sucesso, falhas }
  },

  /**
   * Marca lançamentos selecionados como "Fora do Padrão" sem bloquear o fluxo
   */
  async marcarComoForaDoPadrao(
    lancamentoIds: string[],
  ): Promise<{ sucesso: boolean; error?: string }> {
    const { error } = await supabase
      .from('extrato_lancamentos')
      .update({
        fora_do_padrao: true,
        status: 'divergente',
        updated_at: new Date().toISOString(),
      })
      .in('id', lancamentoIds)

    if (error) return { sucesso: false, error: error.message }
    return { sucesso: true }
  },

  /**
   * Cria uma conta no plano de contas do cliente (ou padrão) em tempo real caso necessário
   */
  async criarContaProvisoria(params: {
    orgId: string
    clientId: string
    codigo?: string
    nomeConta: string
    tipo?: string
    grupo?: string
    natureza?: string
  }): Promise<{ data: PlanoContaOption | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('plano_contas')
        .insert({
          org_id: params.orgId,
          client_id: params.clientId,
          codigo: params.codigo || `PRV-${Date.now().toString().slice(-4)}`,
          nome_conta: params.nomeConta.toUpperCase(),
          descricao: params.nomeConta,
          tipo: params.tipo || 'Despesa',
          grupo: params.grupo || 'Geral',
          natureza: params.natureza || 'Devedora',
          ativo: true,
        })
        .select()
        .single()

      if (error) throw error
      return {
        data: {
          id: data.id,
          codigo: data.codigo,
          nome_conta: data.nome_conta,
          tipo: data.tipo,
          natureza: data.natureza,
        },
      }
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro ao criar conta' }
    }
  },
}
