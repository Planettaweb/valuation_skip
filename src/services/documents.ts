import { supabase } from '@/lib/supabase/client'
import { extractTextFromPDF, parseBalancoPatrimonialText } from '@/lib/pdf-parser'

export const documentService = {
  async getDocuments(orgId: string, valuationId?: string | null) {
    let query = supabase
      .from('financial_documents' as any)
      .select('*, valuations!inner(valuation_name, clients!inner(client_name))')
      .eq('org_id', orgId)

    if (valuationId) {
      query = query.eq('valuation_id', valuationId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    const mapped = data?.map((d: any) => ({
      ...d,
      filename: d.file_name,
      client_name: d.valuations?.clients?.client_name,
      valuation_name: d.valuations?.valuation_name,
    }))

    return { data: mapped, error }
  },

  async uploadDocument(
    file: File,
    orgId: string,
    userId: string,
    valuationId: string,
    documentType: string,
    onProgress?: (msg: string) => void,
  ) {
    onProgress?.('Criando registro do documento...')

    const { data: doc, error: insertError } = await supabase
      .from('financial_documents' as any)
      .insert({
        org_id: orgId,
        valuation_id: valuationId,
        file_name: file.name,
        file_size: file.size,
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

      if (documentType === 'Balanço') {
        if (file.type !== 'application/pdf') {
          throw new Error('A extração de Balanço requer um arquivo PDF.')
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

        rowsData = metadataObj.balanco_patrimonial.contas
          .filter((c: any) => c.descricao && c.descricao.trim().length > 0)
          .map((c: any) => ({
            classification_code: c.classificacao || null,
            description: c.descricao.trim(),
            value_year_n:
              typeof c.valor_exercicio_atual === 'number' ? c.valor_exercicio_atual : null,
            nature_year_n: c.natureza_exercicio_atual || null,
            value_year_n_minus_1:
              typeof c.valor_exercicio_anterior === 'number' ? c.valor_exercicio_anterior : null,
            nature_year_n_minus_1: c.natureza_exercicio_anterior || null,
            year_n: metadataObj.balanco_patrimonial.cabecalho.year_n || null,
            year_n_minus_1: metadataObj.balanco_patrimonial.cabecalho.year_n_minus_1 || null,
          }))

        if (rowsData.length === 0) {
          throw new Error(
            'Falha na extração: As linhas de conta contábil identificadas são inválidas ou vazias.',
          )
        }
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

      if (rowsData.length > 0) {
        onProgress?.('Persistindo em tabelas analíticas secundárias...')
        await supabase.from('financial_data' as any).insert(
          rowsData.map((d, index) => ({
            org_id: orgId,
            document_id: doc.id,
            row_number: index + 1,
            account_name: d.description || d.account_description || 'Unknown',
            value:
              d.value_year_n || d.value || d.total || d.current_balance || d.previous_balance || 0,
            period: d.year_n?.toString() || d.period || null,
          })),
        )
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
        .from('financial_documents' as any)
        .update({ status: 'Error', updated_at: new Date().toISOString() })
        .eq('id', doc.id)

      return { data: null, error: new Error(error.message || 'Erro durante a extração local.') }
    }
  },

  async deleteDocument(id: string, filePath: string | null) {
    if (filePath) {
      await supabase.storage.from('documents').remove([filePath])
    }
    const { error } = await supabase
      .from('financial_documents' as any)
      .delete()
      .eq('id', id)
    return { error }
  },

  async getDownloadUrl(filePath: string) {
    if (!filePath)
      return { data: null, error: new Error('Documento efêmero. Arquivo não armazenado.') }
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
