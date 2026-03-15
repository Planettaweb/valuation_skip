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
    // Read file as Base64 to bypass Storage API and send directly for processing
    const fileContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64String = result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })

    const { data, error } = await supabase
      .from('documents')
      .insert({
        org_id: orgId,
        user_id: userId,
        title: file.name,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_path: null, // Null to bypass storage limitation
        document_type: documentType,
        status: 'Processing', // Insert as Processing initially
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    if (data) {
      // Trigger the extraction edge function asynchronously with the file content
      supabase.functions
        .invoke('process-document', {
          body: {
            document_id: data.id,
            document_type: documentType,
            org_id: orgId,
            user_id: userId,
            file_content: fileContent,
          },
        })
        .then(async ({ error: funcError }) => {
          if (funcError) {
            console.error('Edge function error:', funcError)
            await supabase.from('documents').update({ status: 'Error' }).eq('id', data.id)
          }
        })
        .catch(async (err) => {
          console.error('Edge function invocation failed:', err)
          await supabase.from('documents').update({ status: 'Error' }).eq('id', data.id)
        })
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
    if (!filePath)
      return { data: null, error: new Error('Documento efêmero. Arquivo não armazenado.') }
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60)
    return { data, error }
  },

  async getExtractedData(documentId: string, documentType: string) {
    // 1. Try to fetch dynamic data from document_rows first
    const { data: rowsData, error: rowsError } = await supabase
      .from('document_rows')
      .select('*')
      .eq('document_id', documentId)
      .order('row_index', { ascending: true })

    if (rowsData && rowsData.length > 0) {
      return { data: rowsData.map((r) => r.data), isDynamic: true, error: null }
    }

    // 2. Fallback to specific financial tables for legacy documents
    let tableName = ''
    if (documentType === 'Balanço Patrimonial') tableName = 'financial_balanco_patrimonial'
    else if (documentType === 'DRE') tableName = 'financial_dre'
    else if (documentType === 'Balancete') tableName = 'financial_balancete'
    else if (documentType === 'Fluxo de Caixa') tableName = 'financial_fluxo_caixa'

    if (!tableName) return { data: [], isDynamic: false, error: null }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    return { data, isDynamic: false, error }
  },
}
