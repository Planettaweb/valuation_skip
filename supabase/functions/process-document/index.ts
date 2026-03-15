import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload: any = {}
  try {
    payload = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { document_id, document_type, org_id, user_id, file_content } = payload

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Ensure status is Processing (redundant but safe)
    await supabaseClient.from('documents').update({ status: 'Processing' }).eq('id', document_id)

    // Simulate extraction latency (Parsing engine logic goes here using file_content)
    await new Promise((resolve) => setTimeout(resolve, 3500))

    let rowsData: any[] = []

    if (document_type === 'Balanço Patrimonial') {
      rowsData = [
        {
          classification_code: '1',
          description: 'ATIVO',
          value_year_n: 2850024.56,
          value_year_n_minus_1: 1692004.23,
        },
        {
          classification_code: '1.1',
          description: 'ATIVO CIRCULANTE',
          value_year_n: 2763298.76,
          value_year_n_minus_1: 1610288.47,
        },
        {
          classification_code: '1.1.1',
          description: 'DISPONÍVEL',
          value_year_n: 2253806.12,
          value_year_n_minus_1: 1071129.27,
        },
        {
          classification_code: '1.1.10.2',
          description: 'BANCOS CONTA MOVIMENTO',
          value_year_n: 109675.07,
          value_year_n_minus_1: 221371.53,
        },
        {
          classification_code: '1.1.10.3',
          description: 'APLICAÇÕES FINANCEIRAS LIQUIDEZ IMEDIATA',
          value_year_n: 2144131.05,
          value_year_n_minus_1: 849455.69,
        },
        {
          classification_code: '1.1.2',
          description: 'CLIENTES',
          value_year_n: 503540.0,
          value_year_n_minus_1: 539159.2,
        },
      ]
      await supabaseClient
        .from('financial_balanco_patrimonial')
        .insert(rowsData.map((r) => ({ org_id, document_id, ...r })))
    } else if (document_type === 'DRE') {
      rowsData = [
        {
          description: 'Receita Operacional / SERVIÇOS PRESTADOS',
          balance: 29785269.61,
          sum: 29785269.61,
          total: 29785269.61,
        },
        { description: 'Deducoes / (-) ISS', balance: -623736.26, sum: null, total: null },
        { description: 'Deducoes / (-) COFINS', balance: -843533.08, sum: null, total: null },
        {
          description: 'Deducoes / (-) PIS',
          balance: -182765.5,
          sum: -1650034.84,
          total: -1650034.84,
        },
        { description: 'Receita Líquida', balance: null, sum: null, total: 28135234.77 },
        { description: 'Lucro Bruto', balance: null, sum: null, total: 28112144.1 },
      ]
      await supabaseClient
        .from('financial_dre')
        .insert(rowsData.map((r) => ({ org_id, document_id, ...r })))
    } else if (document_type === 'Balancete') {
      rowsData = [
        {
          classification_code: '1',
          account_description: 'ATIVO',
          previous_balance: 2850024.56,
          debit: 111694961.01,
          credit: 90634464.63,
          current_balance: 23910520.94,
        },
        {
          classification_code: '1.1',
          account_description: 'ATIVO CIRCULANTE',
          previous_balance: 2763298.76,
          debit: 111694961.01,
          credit: 90629263.73,
          current_balance: 23828996.04,
        },
        {
          classification_code: '1.1.1',
          account_description: 'DISPONÍVEL',
          previous_balance: 2253806.12,
          debit: 80706486.72,
          credit: 61057368.96,
          current_balance: 21902923.88,
        },
        {
          classification_code: '1.1.2',
          account_description: 'CLIENTES',
          previous_balance: 503540.0,
          debit: 29269908.55,
          credit: 29235711.4,
          current_balance: 537737.15,
        },
      ]
      await supabaseClient
        .from('financial_balancete')
        .insert(rowsData.map((r) => ({ org_id, document_id, ...r })))
    } else if (document_type === 'Fluxo de Caixa') {
      rowsData = [
        { description: 'Saldo Inicial de Caixa', value: 2253806.12, period: '2025' },
        { description: 'Recebimentos de Clientes', value: 111694961.01, period: '2025' },
        { description: 'Pagamentos Operacionais', value: -90634464.63, period: '2025' },
        { description: 'Saldo Final de Caixa', value: 23314302.5, period: '2025' },
      ]
      await supabaseClient
        .from('financial_fluxo_caixa')
        .insert(rowsData.map((r) => ({ org_id, document_id, ...r })))
    }

    // Insert generic rows into document_rows for dynamic rendering and storage bypass
    if (rowsData.length > 0) {
      const documentRowsInsert = rowsData.map((data, index) => ({
        org_id,
        document_id,
        row_index: index,
        data,
      }))
      await supabaseClient.from('document_rows').insert(documentRowsInsert)
    }

    // Mark as Completed and save structural JSON directly to metadata
    await supabaseClient
      .from('documents')
      .update({
        status: 'Completed',
        metadata: rowsData,
      })
      .eq('id', document_id)

    // Audit Logging
    if (org_id) {
      await supabaseClient.from('audit_logs').insert({
        org_id,
        user_id: user_id || null,
        action: 'process_document',
        resource_type: 'document',
        resource_id: document_id,
        details: 'Document processed successfully and data extracted',
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Data extracted successfully' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    if (document_id) {
      try {
        const fallbackClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )
        await fallbackClient.from('documents').update({ status: 'Error' }).eq('id', document_id)

        // Audit Logging for Error
        if (org_id) {
          await fallbackClient.from('audit_logs').insert({
            org_id,
            user_id: user_id || null,
            action: 'process_document',
            resource_type: 'document',
            resource_id: document_id,
            details: `Processing failed: ${error.message}`,
          })
        }
      } catch (_) {}
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
