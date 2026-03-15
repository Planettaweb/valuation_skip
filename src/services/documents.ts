import { supabase } from '@/lib/supabase/client'
import { extractTextFromPDF, parseBalancoPatrimonialText } from '@/lib/pdf-parser'

export const documentService = {
  async getDocuments(orgId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*, users(full_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async uploadDocument(
    file: File,
    orgId: string,
    userId: string,
    documentType: string,
    onProgress?: (msg: string) => void,
  ) {
    onProgress?.('Criando registro do documento...')

    const { data: doc, error: insertError } = await supabase
      .from('documents')
      .insert({
        org_id: orgId,
        user_id: userId,
        title: file.name,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_path: null, // Null for ephemeral extraction
        document_type: documentType,
        status: 'Processing',
      })
      .select()
      .single()

    if (insertError || !doc) {
      return { data: null, error: insertError || new Error('Falha ao criar o documento.') }
    }

    try {
      let rowsData: any[] = []
      let metadataObj: any = null

      if (documentType === 'Balanço Patrimonial') {
        if (file.type !== 'application/pdf') {
          throw new Error('A extração de Balanço Patrimonial requer um arquivo PDF.')
        }

        onProgress?.('Lendo arquivo PDF localmente (todas as páginas)...')
        const extractedText = await extractTextFromPDF(file)

        onProgress?.('Analisando texto estruturado (Engine de NLP/Regex)...')
        metadataObj = parseBalancoPatrimonialText(extractedText)

        if (
          !metadataObj.balanco_patrimonial.contas ||
          metadataObj.balanco_patrimonial.contas.length === 0
        ) {
          throw new Error(
            'Falha na extração: Nenhuma conta contábil encontrada. Verifique se o PDF está legível e contém dados de Balanço.',
          )
        }

        rowsData = metadataObj.balanco_patrimonial.contas.map((c: any) => ({
          classification_code: c.classificacao,
          description: c.descricao,
          value_year_n: c.valor_exercicio_atual,
          value_year_n_minus_1: c.valor_exercicio_anterior,
        }))
      } else if (documentType === 'DRE') {
        onProgress?.('Simulando extração de DRE...')
        await new Promise((r) => setTimeout(r, 1000))
        rowsData = [
          { description: 'Receita Líquida', balance: null, sum: null, total: 28135234.77 },
        ]
      } else if (documentType === 'Balancete') {
        onProgress?.('Simulando extração de Balancete...')
        await new Promise((r) => setTimeout(r, 1000))
        rowsData = [
          {
            classification_code: '1',
            account_description: 'ATIVO',
            previous_balance: 2850024.56,
            debit: 111694961.01,
            credit: 90634464.63,
            current_balance: 23910520.94,
          },
        ]
      } else if (documentType === 'Fluxo de Caixa') {
        onProgress?.('Simulando extração de Fluxo de Caixa...')
        await new Promise((r) => setTimeout(r, 1000))
        rowsData = [{ description: 'Saldo Final de Caixa', value: 23314302.5, period: '2025' }]
      }

      onProgress?.('Salvando metadados estruturados e concluindo...')

      const finalMetadata = metadataObj ? metadataObj : rowsData

      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'Completed',
          metadata: finalMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id)
        .select()
        .single()

      if (updateError) throw updateError

      if (rowsData.length > 0) {
        onProgress?.('Persistindo em tabelas analíticas secundárias...')
        await supabase.from('document_rows').insert(
          rowsData.map((d, index) => ({
            org_id: orgId,
            document_id: doc.id,
            row_index: index,
            data: d,
          })),
        )

        if (documentType === 'Balanço Patrimonial') {
          await supabase
            .from('financial_balanco_patrimonial')
            .insert(rowsData.map((r) => ({ org_id: orgId, document_id: doc.id, ...r })))
        } else if (documentType === 'DRE') {
          await supabase
            .from('financial_dre')
            .insert(rowsData.map((r) => ({ org_id: orgId, document_id: doc.id, ...r })))
        } else if (documentType === 'Balancete') {
          await supabase
            .from('financial_balancete')
            .insert(rowsData.map((r) => ({ org_id: orgId, document_id: doc.id, ...r })))
        } else if (documentType === 'Fluxo de Caixa') {
          await supabase
            .from('financial_fluxo_caixa')
            .insert(rowsData.map((r) => ({ org_id: orgId, document_id: doc.id, ...r })))
        }
      }

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
        .from('documents')
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', doc.id)

      return { data: null, error: new Error(error.message || 'Erro durante a extração local.') }
    }
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
    const { data: rowsData, error: rowsError } = await supabase
      .from('document_rows')
      .select('*')
      .eq('document_id', documentId)
      .order('row_index', { ascending: true })

    if (rowsData && rowsData.length > 0) {
      return { data: rowsData.map((r) => r.data), isDynamic: true, error: null }
    }

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
