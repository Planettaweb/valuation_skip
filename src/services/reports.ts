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

export async function fetchReports() {
  const { data, error } = await (supabase as any)
    .from('embedded_reports')
    .select('*, clients(client_name)')
    .order('title')

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

export async function createReport(payload: Partial<EmbeddedReport>) {
  const user = (await supabase.auth.getUser()).data.user
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user?.id)
    .single()

  const { data, error } = await (supabase as any)
    .from('embedded_reports')
    .insert([{ ...payload, org_id: userData?.org_id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReport(id: string, payload: Partial<EmbeddedReport>) {
  const { data, error } = await (supabase as any)
    .from('embedded_reports')
    .update(payload)
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
