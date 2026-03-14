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

  async uploadDocument(file: File, orgId: string, userId: string) {
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
        status: 'processed',
      })
      .select()
      .single()

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
}
