import { supabase } from '@/lib/supabase/client'
import { extractTextFromPDF } from '@/lib/pdf-parser'
import {
  extractTableOnly,
  processExtractedData,
  persistStructuredData,
} from '@/lib/extraction-utils'

export const documentService = {
  async getDocuments(orgId: string, filters?: { clientId?: string }) {
    let query = supabase
      .from('financial_documents' as any)
      .select('*, valuations!inner(client_id, valuation_name, clients!inner(client_name))')
      .eq('org_id', orgId)

    if (filters?.clientId) {
      query = query.eq('valuations.client_id', filters.clientId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    const mapped = data?.map((d: any) => ({
      ...d,
      filename: d.file_name,
      client_name: d.valuations?.clients?.client_name,
      valuation_name: d.valuations?.valuation_name,
      client_id: d.valuations?.client_id,
    }))

    return { data: mapped, error }
  },

  async uploadDocument(
    file: File,
    orgId: string,
    userId: string,
    clientId: string,
    documentType: string,
    onProgress?: (msg: string) => void,
  ) {
    let sharepointPath: string | null = null
    let valuationId: string | null = null

    try {
      onProgress?.('Acessando Microsoft Graph API...')

      const { data: clientData } = await supabase
        .from('clients' as any)
        .select('client_name')
        .eq('id', clientId)
        .single()

      const clientName = clientData?.client_name || 'Cliente_Desconhecido'

      let { data: valData } = await supabase
        .from('valuations' as any)
        .select('id')
        .eq('client_id', clientId)
        .limit(1)
        .single()

      if (!valData) {
        const res = await supabase
          .from('valuations' as any)
          .insert({
            org_id: orgId,
            client_id: clientId,
            valuation_type: 'Valuation',
            valuation_name: 'Projeto Padrão',
            status: 'Em Andamento',
          })
          .select('id')
          .single()
        valData = res.data
      }
      valuationId = valData!.id

      const subfolderMap: Record<string, string> = {
        Balanço: 'Balanço',
        Balancete: 'Balancete',
        DRE: 'DRE',
        'Fluxo de Caixa': 'Fluxo_Caixa',
      }
      const folderType = subfolderMap[documentType] || 'Outros'
      const folderPath = `${clientName.replace(/[^a-zA-Z0-9_\- ]/g, '_')}/${folderType}`

      onProgress?.('Fazendo upload para o SharePoint...')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folderPath', folderPath)
      formData.append('fileName', file.name.replace(/[^a-zA-Z0-9_\-.]/g, '_'))

      const { data: spData, error: spError } = await supabase.functions.invoke(
        'sharepoint-api?action=upload',
        {
          body: formData,
        },
      )

      if (spError || !spData?.success) {
        throw new Error(spData?.error || spError?.message || 'Erro ao integrar com SharePoint.')
      }

      sharepointPath = spData.path
    } catch (err: any) {
      console.error(err)
      return { data: null, error: new Error(`Falha no SharePoint: ${err.message}`) }
    }

    onProgress?.('Criando registro do documento no banco...')

    const { data: doc, error: insertError } = await supabase
      .from('financial_documents' as any)
      .insert({
        org_id: orgId,
        valuation_id: valuationId,
        file_name: file.name,
        file_size: file.size,
        document_type: documentType,
        status: 'Processing',
        sharepoint_path: sharepointPath,
      })
      .select()
      .single()

    if (insertError || !doc) {
      return { data: null, error: insertError || new Error('Falha ao criar o documento.') }
    }

    try {
      if (!['Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa'].includes(documentType)) {
        throw new Error(`Tipo de documento não suportado: ${documentType}`)
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Todos os documentos financeiros devem ser em formato PDF.')
      }

      onProgress?.('Lendo arquivo PDF localmente (todas as páginas)...')
      let extractedText = await extractTextFromPDF(file)

      onProgress?.('Removendo cabeçalho e rodapé...')
      extractedText = extractTableOnly(extractedText)

      onProgress?.('Analisando texto estruturado (Engine de NLP/Regex)...')
      const { metadataObj, rowsData } = processExtractedData(extractedText, documentType)

      onProgress?.('Salvando metadados estruturados e concluindo...')
      const finalMetadata = metadataObj ? metadataObj : rowsData

      const { data: updatedDoc, error: updateError } = await supabase
        .from('financial_documents' as any)
        .update({
          status: 'Processed',
          metadata: finalMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)
        .select()
        .single()

      if (updateError) throw updateError

      onProgress?.('Persistindo em tabelas analíticas secundárias...')
      await persistStructuredData(orgId, doc.id, documentType, rowsData)

      await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'process_document_client_side',
        resource_type: 'document',
        resource_id: doc.id,
        details: 'Document processed successfully via client-side PDF parser',
      })

      onProgress?.('Processamento concluído com sucesso!')
      return { data: updatedDoc, error: null }
    } catch (error: any) {
      console.error('Client-side extraction failed:', error)
      await supabase
        .from('financial_documents' as any)
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', doc.id)

      return { data: null, error: new Error(error.message || 'Erro durante a extração local.') }
    }
  },

  async reprocessDocument(
    docId: string,
    orgId: string,
    userId: string,
    onProgress?: (msg: string) => void,
  ) {
    try {
      onProgress?.('Buscando informações do documento...')
      const { data: doc, error: docError } = await supabase
        .from('financial_documents' as any)
        .select('*')
        .eq('id', docId)
        .single()

      if (docError || !doc) throw new Error('Documento não encontrado.')
      if (!doc.sharepoint_path)
        throw new Error('O documento não possui um caminho no SharePoint para ser baixado.')

      onProgress?.('Acessando Microsoft Graph API para baixar o arquivo...')
      const { data: sessionData } = await supabase.auth.getSession()

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sharepoint-api?action=download`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: doc.sharepoint_path }),
        },
      )

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Falha ao baixar arquivo: ${errText}`)
      }

      const blob = await res.blob()
      const file = new File([blob], doc.file_name, { type: blob.type || 'application/pdf' })

      onProgress?.('Removendo extração antiga...')
      await supabase
        .from('financial_data' as any)
        .delete()
        .eq('document_id', docId)
      await supabase
        .from('financial_balanco_patrimonial' as any)
        .delete()
        .eq('document_id', docId)
      await supabase
        .from('financial_balancete' as any)
        .delete()
        .eq('document_id', docId)
      await supabase
        .from('financial_dre' as any)
        .delete()
        .eq('document_id', docId)
      await supabase
        .from('financial_fluxo_caixa' as any)
        .delete()
        .eq('document_id', docId)

      const supportedTypes = ['Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa']
      if (!supportedTypes.includes(doc.document_type)) {
        throw new Error(`Reprocessamento não suportado para: ${doc.document_type}`)
      }

      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        throw new Error('A extração requer um arquivo PDF.')
      }

      onProgress?.('Lendo arquivo PDF localmente (todas as páginas)...')
      let extractedText = await extractTextFromPDF(file)

      onProgress?.('Removendo cabeçalho e rodapé...')
      extractedText = extractTableOnly(extractedText)

      onProgress?.('Analisando texto estruturado (Engine de NLP/Regex melhorada)...')
      const { metadataObj, rowsData } = processExtractedData(extractedText, doc.document_type)

      onProgress?.('Salvando metadados estruturados e atualizando status...')
      const finalMetadata = metadataObj ? metadataObj : rowsData

      const { data: updatedDoc, error: updateError } = await supabase
        .from('financial_documents' as any)
        .update({
          status: 'Processed',
          metadata: finalMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)
        .select()
        .single()

      if (updateError) throw updateError

      onProgress?.('Persistindo nas tabelas analíticas para os dashboards...')
      await persistStructuredData(orgId, doc.id, doc.document_type, rowsData)

      await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'reprocess_document',
        resource_type: 'document',
        resource_id: doc.id,
        details: 'Document reprocessed successfully from SharePoint',
      })

      onProgress?.('Reprocessamento concluído com sucesso!')
      return { data: updatedDoc, error: null }
    } catch (error: any) {
      console.error('Reprocessing failed:', error)
      await supabase
        .from('financial_documents' as any)
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', docId)

      return { data: null, error: new Error(error.message || 'Erro durante o reprocessamento.') }
    }
  },

  async deleteDocument(id: string, _legacyFilePath?: string | null) {
    let spErrorMsg = null

    const { data: doc } = await supabase
      .from('financial_documents' as any)
      .select('file_path, sharepoint_path')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('financial_documents' as any)
      .delete()
      .eq('id', id)

    if (error) return { error, spErrorMsg }

    if (doc?.sharepoint_path) {
      const { data, error: spError } = await supabase.functions.invoke(
        'sharepoint-api?action=delete',
        {
          body: { path: doc.sharepoint_path },
        },
      )
      if (spError || !data?.success) {
        console.error('SharePoint Delete Error:', spError || data?.error)
        spErrorMsg =
          'Aviso: Falha ao remover arquivo do SharePoint. O registro no banco foi excluído mantendo a integridade.'
      }
    } else if (doc?.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path])
    }

    return { error: null, spErrorMsg }
  },

  async getDownloadUrl(filePath: string) {
    if (!filePath)
      return {
        data: null,
        error: new Error('Documento efêmero. Arquivo não armazenado localmente.'),
      }
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60)
    return { data, error }
  },

  async getExtractedData(documentId: string, documentType: string) {
    const { data, error } = await supabase
      .from('financial_data' as any)
      .select('*')
      .eq('document_id', documentId)
      .order('row_number', { ascending: true })

    return { data: data || [], isDynamic: true, error }
  },
}
