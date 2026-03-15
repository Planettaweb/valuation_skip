import { supabase } from '@/lib/supabase/client'

export const documentService = {
  async getDocuments(orgId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*, users(full_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async uploadDocument(file: File, orgId: string, userId: string, documentType: string) {
    const filePath = `${orgId}/${crypto.randomUUID()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)

    if (uploadError) return { error: uploadError }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        org_id: orgId,
        user_id: userId,
        title: file.name,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_path: filePath,
        document_type: documentType,
        status: 'Uploaded',
      })
      .select()
      .single()

    if (data) {
      // Trigger the extraction edge function asynchronously
      supabase.functions
        .invoke('process-document', {
          body: { document_id: data.id, document_type: documentType, org_id: orgId },
        })
        .catch(console.error)
    }

    return { data, error }
  },

  async deleteDocument(id: string, filePath: string | null) {
    if (filePath) {
      await supabase.storage.from('documents').remove([filePath])
    }
    const { error } = await supabase.from('documents').delete().eq('id', id)
    return { error }
  },

  async getDownloadUrl(filePath: string) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60)
    return { data, error }
  },

  async getExtractedData(documentId: string, documentType: string) {
    let tableName = ''
    if (documentType === 'Balanço Patrimonial') tableName = 'financial_balanco_patrimonial'
    else if (documentType === 'DRE') tableName = 'financial_dre'
    else if (documentType === 'Balancete') tableName = 'financial_balancete'
    else if (documentType === 'Fluxo de Caixa') tableName = 'financial_fluxo_caixa'

    if (!tableName) return { data: [], error: null }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    return { data, error }
  },
}
