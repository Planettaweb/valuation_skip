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

  async parseDocumentLocal(file: File, documentType: string, onProgress?: (msg: string) => void) {
    if (!['Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa'].includes(documentType)) {
      throw new Error(`Tipo de documento não suportado: ${documentType}`)
    }

    if (file.type !== 'application/pdf') {
      throw new Error('A extração atual suporta apenas arquivos PDF.')
    }

    onProgress?.('Lendo arquivo PDF...')
    let extractedText = await extractTextFromPDF(file)

    onProgress?.('Isolando escopo tabular...')
    extractedText = extractTableOnly(extractedText)

    onProgress?.('Aplicando extração avançada e checagem de soma...')
    const { metadataObj, rowsData } = processExtractedData(extractedText, documentType)

    return { metadataObj, rowsData }
  },

  async saveParsedDocument(
    file: File,
    orgId: string,
    userId: string,
    clientId: string,
    documentType: string,
    parsedData: { metadataObj: any; rowsData: any[] },
    onProgress?: (msg: string) => void,
  ) {
    let sharepointPath: string | null = null
    let valuationId: string | null = null

    try {
      onProgress?.('Acessando configurações do cliente...')

      const { data: clientData } = await supabase
        .from('clients' as any)
        .select('client_name')
        .eq('id', clientId)
        .eq('org_id', orgId)
        .single()

      const clientName = clientData?.client_name || 'Cliente_Desconhecido'

      let { data: valData } = await supabase
        .from('valuations' as any)
        .select('id')
        .eq('client_id', clientId)
        .eq('org_id', orgId)
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

      onProgress?.('Fazendo upload de produção para o SharePoint...')

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
      return { data: null, error: new Error(`Falha de infraestrutura: ${err.message}`) }
    }

    onProgress?.('Criando registro do documento no banco...')

    // Database Integrity Sequence
    const { data: mainDoc, error: mainDocError } = await supabase
      .from('documents')
      .insert({
        org_id: orgId,
        user_id: userId,
        title: file.name,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        document_type: documentType,
        status: 'Processing',
      })
      .select('id')
      .single()

    if (mainDocError || !mainDoc) {
      return {
        data: null,
        error: mainDocError || new Error('Falha ao criar o documento principal.'),
      }
    }

    const { data: doc, error: insertError } = await supabase
      .from('financial_documents' as any)
      .insert({
        id: mainDoc.id, // Guarantee FK integrity
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
      await supabase.from('documents').delete().eq('id', mainDoc.id)
      return {
        data: null,
        error: insertError || new Error('Falha ao criar o documento financeiro.'),
      }
    }

    try {
      onProgress?.('Salvando dados estruturados no Supabase...')
      const finalMetadata = parsedData.metadataObj ? parsedData.metadataObj : parsedData.rowsData

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

      await supabase
        .from('documents')
        .update({
          status: 'Processed',
          metadata: finalMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)

      onProgress?.('Mapeando tabelas analíticas secundárias...')
      await persistStructuredData(orgId, doc.id, documentType, parsedData.rowsData)

      await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'process_document_production',
        resource_type: 'document',
        resource_id: doc.id,
        details: 'Document processed successfully and mapped to real financial tables',
      })

      onProgress?.('Processamento concluído com sucesso!')
      return { data: updatedDoc, error: null }
    } catch (error: any) {
      console.error('Production persistence failed:', error)
      await supabase
        .from('financial_documents' as any)
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', doc.id)
      await supabase
        .from('documents')
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', doc.id)

      return {
        data: null,
        error: new Error(error.message || 'Erro ao persistir os dados do documento.'),
      }
    }
  },

  async reprocessDocument(
    docId: string,
    orgId: string,
    userId: string,
    onProgress?: (msg: string) => void,
  ) {
    try {
      onProgress?.('Buscando informações de produção do documento...')
      const { data: doc, error: docError } = await supabase
        .from('financial_documents' as any)
        .select('*')
        .eq('id', docId)
        .eq('org_id', orgId)
        .single()

      if (docError || !doc) throw new Error('Documento não encontrado na organização atual.')
      if (!doc.sharepoint_path)
        throw new Error('O documento não possui um caminho no SharePoint para ser baixado.')

      const { data: mainDocCheck } = await supabase
        .from('documents')
        .select('id')
        .eq('id', docId)
        .single()
      if (!mainDocCheck) {
        await supabase.from('documents').insert({
          id: docId,
          org_id: orgId,
          user_id: userId,
          title: doc.file_name,
          filename: doc.file_name,
          file_size: doc.file_size,
          document_type: doc.document_type,
          status: 'Processing',
        })
      } else {
        await supabase.from('documents').update({ status: 'Processing' }).eq('id', docId)
      }
      await supabase
        .from('financial_documents' as any)
        .update({ status: 'Processing' })
        .eq('id', docId)

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

      onProgress?.('Limpando registros analíticos antigos...')
      await supabase
        .from('financial_data' as any)
        .delete()
        .eq('document_id', docId)
        .eq('org_id', orgId)
      await supabase
        .from('financial_balanco_patrimonial' as any)
        .delete()
        .eq('document_id', docId)
        .eq('org_id', orgId)
      await supabase
        .from('financial_balancete' as any)
        .delete()
        .eq('document_id', docId)
        .eq('org_id', orgId)
      await supabase
        .from('financial_dre' as any)
        .delete()
        .eq('document_id', docId)
        .eq('org_id', orgId)
      await supabase
        .from('financial_fluxo_caixa' as any)
        .delete()
        .eq('document_id', docId)
        .eq('org_id', orgId)

      const supportedTypes = ['Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa']
      if (!supportedTypes.includes(doc.document_type)) {
        throw new Error(`Reprocessamento não suportado para: ${doc.document_type}`)
      }

      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        throw new Error('A extração requer um arquivo PDF.')
      }

      onProgress?.('Iniciando processamento analítico completo...')
      let extractedText = await extractTextFromPDF(file)

      onProgress?.('Isolando escopo tabular...')
      extractedText = extractTableOnly(extractedText)

      onProgress?.('Extraindo mapa de contas financeiras...')
      const { metadataObj, rowsData } = processExtractedData(extractedText, doc.document_type)

      onProgress?.('Persistindo resultados da nova extração...')
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

      await supabase
        .from('documents')
        .update({
          status: 'Processed',
          metadata: finalMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)

      onProgress?.('Validando integridade em tabelas secundárias...')
      await persistStructuredData(orgId, doc.id, doc.document_type, rowsData)

      await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'reprocess_document_production',
        resource_type: 'document',
        resource_id: doc.id,
        details: 'Document reprocessed securely into real databases',
      })

      onProgress?.('Reprocessamento finalizado.')
      return { data: updatedDoc, error: null }
    } catch (error: any) {
      console.error('Reprocessing failed:', error)
      await supabase
        .from('financial_documents' as any)
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', docId)
      await supabase
        .from('documents')
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

    await supabase.from('documents').delete().eq('id', id)

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
    let tableName = ''

    switch (documentType) {
      case 'Balanço':
      case 'Balanço Patrimonial':
        tableName = 'financial_balanco_patrimonial'
        break
      case 'Balancete':
        tableName = 'financial_balancete'
        break
      case 'DRE':
        tableName = 'financial_dre'
        break
      case 'Fluxo de Caixa':
        tableName = 'financial_fluxo_caixa'
        break
      default:
        return {
          data: [],
          isDynamic: true,
          error: new Error('Tipo de documento não suportado para visualização estruturada.'),
        }
    }

    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    return { data: data || [], isDynamic: false, error }
  },
}
