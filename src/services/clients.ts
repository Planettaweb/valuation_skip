import { supabase } from '@/lib/supabase/client'

export const clientService = {
  async getClients(orgId: string) {
    const { data, error } = await supabase
      .from('clients' as any)
      .select('*, valuations(*)')
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
    return await supabase
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

  async getValuations(clientId: string) {
    const { data, error } = await supabase
      .from('valuations' as any)
      .select('*, financial_documents(count)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createValuation(orgId: string, clientId: string, data: any) {
    return await supabase
      .from('valuations' as any)
      .insert({
        org_id: orgId,
        client_id: clientId,
        valuation_type: data.valuation_type,
        valuation_name: data.valuation_name,
        sharepoint_folder_path: data.sharepoint_folder_path,
        status: data.status,
      })
      .select()
      .single()
  },

  async updateValuation(id: string, data: any) {
    return await supabase
      .from('valuations' as any)
      .update({
        valuation_type: data.valuation_type,
        valuation_name: data.valuation_name,
        sharepoint_folder_path: data.sharepoint_folder_path,
        status: data.status,
      })
      .eq('id', id)
      .select()
      .single()
  },

  async deleteValuation(id: string) {
    return await supabase
      .from('valuations' as any)
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
}
