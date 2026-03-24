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
    const { data, error } = await supabase
      .from('financial_data' as any)
      .select(`
        *,
        financial_documents!inner (
          document_type,
          valuation_id,
          valuations!inner (
            client_id
          )
        )
      `)
      .eq('financial_documents.valuations.client_id', clientId)
      .order('created_at', { ascending: false })
    return { data, error }
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
