import { supabase } from '@/lib/supabase/client'

export const clientService = {
  async getClients(orgId: string) {
    const { data, error } = await supabase
      .from('clients' as any)
      .select('*')
      .eq('org_id', orgId)
      .order('client_name', { ascending: true })
    return { data, error }
  },

  async getClient(id: string) {
    const { data, error } = await supabase
      .from('clients' as any)
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async createClient(orgId: string, userId: string, data: any) {
    const { data: client, error } = await supabase
      .from('clients' as any)
      .insert({
        org_id: orgId,
        user_id: userId,
        client_name: data.client_name,
        cnpj: data.cnpj,
        industry: data.industry,
      })
      .select()
      .single()

    if (client && !error) {
      // Auto-create a default valuation to satisfy database hierarchy relationships transparently
      await supabase.from('valuations' as any).insert({
        org_id: orgId,
        client_id: client.id,
        valuation_type: 'Valuation',
        valuation_name: 'Projeto Padrão',
        status: 'Em Andamento',
      })
    }

    return { data: client, error }
  },

  async updateClient(id: string, data: any) {
    return await supabase
      .from('clients' as any)
      .update({
        client_name: data.client_name,
        cnpj: data.cnpj,
        industry: data.industry,
      })
      .eq('id', id)
      .select()
      .single()
  },

  async deleteClient(id: string) {
    return await supabase
      .from('clients' as any)
      .delete()
      .eq('id', id)
  },

  async getFinancialData(clientId: string) {
    // Busca dados analíticos agregados das tabelas financeiras existentes (BP, Balancete, DRE, Fluxo de Caixa)
    try {
      const [bpRes, balanceteRes, dreRes, fcRes] = await Promise.all([
        supabase
          .from('financial_balanco_patrimonial' as any)
          .select('id, description, value_year_n, year_n, created_at, client_id, document_id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('financial_balancete' as any)
          .select('id, account_description, current_balance, created_at, client_id, document_id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('financial_dre' as any)
          .select('id, description, balance, total, created_at, client_id, document_id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('financial_fluxo_caixa' as any)
          .select('id, description, value, period, created_at, client_id, document_id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      const list: any[] = []

      bpRes.data?.forEach((r: any) => {
        list.push({
          id: r.id,
          account_name: r.description,
          value: r.value_year_n,
          period: r.year_n ? String(r.year_n) : null,
          document_type: 'Balanço Patrimonial',
          created_at: r.created_at,
        })
      })

      balanceteRes.data?.forEach((r: any) => {
        list.push({
          id: r.id,
          account_name: r.account_description,
          value: r.current_balance,
          period: null,
          document_type: 'Balancete',
          created_at: r.created_at,
        })
      })

      dreRes.data?.forEach((r: any) => {
        list.push({
          id: r.id,
          account_name: r.description,
          value: r.total ?? r.balance,
          period: null,
          document_type: 'DRE',
          created_at: r.created_at,
        })
      })

      fcRes.data?.forEach((r: any) => {
        list.push({
          id: r.id,
          account_name: r.description,
          value: r.value,
          period: r.period,
          document_type: 'Fluxo de Caixa',
          created_at: r.created_at,
        })
      })

      return { data: list, error: null }
    } catch (err: any) {
      return { data: [], error: err }
    }
  },

  async getPlanoContas(clientId: string) {
    const { data, error } = await supabase
      .from('plano_contas' as any)
      .select('*')
      .eq('client_id', clientId)
      .eq('ativo_inativo', true)
      .order('codigo', { ascending: true })
    return { data, error }
  },
}
