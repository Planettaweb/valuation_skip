import { supabase } from '@/lib/supabase/client'

export interface EmbeddedReport {
  id: string
  org_id: string
  client_id: string
  title: string
  description?: string | null
  report_type: 'dashboard' | 'question'
  resource_id: number
  is_active: boolean
  clients?: { client_name: string } | null
}

export async function fetchReports(orgId?: string) {
  let query = (supabase as any)
    .from('embedded_reports')
    .select('*, clients(client_name)')
    .order('title')

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as EmbeddedReport[]
}

export async function fetchMetabaseUrl(reportId: string) {
  const { data, error } = await supabase.functions.invoke('metabase-token', {
    body: { reportId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data?.url as string
}

export async function createReport(payload: Partial<EmbeddedReport>, orgId: string) {
  const { clients, ...safePayload } = payload
  const { data, error } = await (supabase as any)
    .from('embedded_reports')
    .insert([{ ...safePayload, org_id: orgId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReport(id: string, payload: Partial<EmbeddedReport>) {
  const { clients, ...safePayload } = payload
  const { data, error } = await (supabase as any)
    .from('embedded_reports')
    .update(safePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteReport(id: string) {
  const { error } = await (supabase as any).from('embedded_reports').delete().eq('id', id)

  if (error) throw error
  return true
}
