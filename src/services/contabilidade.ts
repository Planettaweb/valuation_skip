import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type PlanoConta = Database['public']['Tables']['plano_contas']['Row']
export type TipoDocumento = Database['public']['Tables']['tipos_documentos']['Row']
export type DocumentoContaMapping = Database['public']['Tables']['documento_conta_mapping']['Row']

export type Taxonomia = {
  id: string
  org_id: string
  categoria: string
  descricao: string
  ativo: boolean
  created_at: string
}

export const contabilidadeService = {
  async getClients(orgId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('id, client_name')
      .eq('org_id', orgId)
      .order('client_name')
    if (error) throw error
    return data || []
  },

  async getPlanoContas(
    orgId: string,
    page: number,
    pageSize: number,
    search: string,
    tipo: string,
    grupo: string,
    natureza: string,
    client: string = 'Todos',
  ) {
    let query = supabase.from('plano_contas').select('*', { count: 'exact' }).eq('org_id', orgId)

    if (search) {
      query = query.or(`codigo.ilike.%${search}%,nome_conta.ilike.%${search}%`)
    }
    if (tipo && tipo !== 'Todos') query = query.eq('tipo', tipo)
    if (grupo && grupo !== 'Todos') query = query.eq('grupo', grupo)
    if (natureza && natureza !== 'Todos') query = query.eq('natureza', natureza)
    if (client && client !== 'Todos') query = query.eq('client_id', client)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query.order('codigo', { ascending: true }).range(from, to)
    if (error) throw error
    return { data, count }
  },

  async getAllPlanoContas(orgId: string) {
    const { data, error } = await supabase
      .from('plano_contas')
      .select('*')
      .eq('org_id', orgId)
      .order('codigo', { ascending: true })
    if (error) throw error
    return data
  },

  async createPlanoConta(
    conta: Omit<
      Database['public']['Tables']['plano_contas']['Insert'],
      'id' | 'created_at' | 'updated_at'
    >,
  ) {
    const { data, error } = await supabase.from('plano_contas').insert(conta).select().single()
    if (error) throw error
    return data
  },

  async updatePlanoConta(
    id: string,
    conta: Partial<Database['public']['Tables']['plano_contas']['Update']>,
  ) {
    const { data, error } = await supabase
      .from('plano_contas')
      .update(conta)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletePlanoConta(id: string) {
    const { count, error: errCount } = await supabase
      .from('documento_conta_mapping')
      .select('*', { count: 'exact', head: true })
      .eq('id_conta', id)
    if (errCount) throw errCount
    if (count && count > 0)
      throw new Error(
        'Não é possível excluir esta conta pois ela está vinculada a um ou mais documentos.',
      )

    const { error } = await supabase.from('plano_contas').delete().eq('id', id)
    if (error) throw error
  },

  async deleteAllPlanoContas(orgId: string, clientId: string = 'Todos') {
    let query = supabase.from('plano_contas').delete().eq('org_id', orgId)

    if (clientId === 'Sem Cliente') {
      query = query.is('client_id', null)
    } else if (clientId !== 'Todos') {
      query = query.eq('client_id', clientId)
    }

    const { error } = await query
    if (error) throw error
  },

  async getTaxonomias(orgId: string) {
    const { data, error } = await supabase
      .from('plano_contas_taxonomia' as any)
      .select('*')
      .eq('org_id', orgId)
      .eq('ativo', true)
      .order('descricao')

    // Ignore error if table doesn't exist yet
    if (error && error.code !== '42P01') throw error
    return (data || []) as Taxonomia[]
  },

  async createTaxonomia(orgId: string, categoria: string, descricao: string) {
    const { data, error } = await supabase
      .from('plano_contas_taxonomia' as any)
      .insert({ org_id: orgId, categoria, descricao, ativo: true })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTaxonomia(id: string) {
    const { error } = await supabase
      .from('plano_contas_taxonomia' as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getTiposDocumentos(orgId: string, page: number, pageSize: number, search: string) {
    let query = supabase
      .from('tipos_documentos')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    if (search) {
      query = query.ilike('descricao', `%${search}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query
      .order('descricao', { ascending: true })
      .range(from, to)
    if (error) throw error
    return { data, count }
  },

  async getAllTiposDocumentos(orgId: string) {
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .eq('org_id', orgId)
      .order('descricao', { ascending: true })
    if (error) throw error
    return data
  },

  async createTipoDocumento(
    tipo: Omit<
      Database['public']['Tables']['tipos_documentos']['Insert'],
      'id' | 'created_at' | 'updated_at'
    >,
  ) {
    const { data, error } = await supabase.from('tipos_documentos').insert(tipo).select().single()
    if (error) throw error
    return data
  },

  async updateTipoDocumento(
    id: string,
    tipo: Partial<Database['public']['Tables']['tipos_documentos']['Update']>,
  ) {
    const { data, error } = await supabase
      .from('tipos_documentos')
      .update(tipo)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTipoDocumento(id: string) {
    const { count, error: errCount } = await supabase
      .from('documento_conta_mapping')
      .select('*', { count: 'exact', head: true })
      .eq('id_documento', id)
    if (errCount) throw errCount
    if (count && count > 0)
      throw new Error(
        'Não é possível excluir este tipo de documento pois ele possui contas vinculadas.',
      )

    const { error } = await supabase.from('tipos_documentos').delete().eq('id', id)
    if (error) throw error
  },

  async getMappings(orgId: string) {
    const { data, error } = await supabase
      .from('documento_conta_mapping')
      .select('*')
      .eq('org_id', orgId)
    if (error) throw error
    return data
  },

  async addMapping(
    mapping: Omit<
      Database['public']['Tables']['documento_conta_mapping']['Insert'],
      'id' | 'created_at'
    >,
  ) {
    const { data, error } = await supabase
      .from('documento_conta_mapping')
      .insert(mapping)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeMapping(orgId: string, docId: string, contaId: string) {
    const { error } = await supabase
      .from('documento_conta_mapping')
      .delete()
      .match({ org_id: orgId, id_documento: docId, id_conta: contaId })
    if (error) throw error
  },

  async batchUpdateMappings(orgId: string, docId: string, contasIds: string[], isAdd: boolean) {
    if (isAdd) {
      const inserts = contasIds.map((id_conta) => ({
        org_id: orgId,
        id_documento: docId,
        id_conta,
      }))
      const { error } = await supabase
        .from('documento_conta_mapping')
        .upsert(inserts, { onConflict: 'org_id,id_documento,id_conta' })
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('documento_conta_mapping')
        .delete()
        .eq('org_id', orgId)
        .eq('id_documento', docId)
        .in('id_conta', contasIds)
      if (error) throw error
    }
  },
}
