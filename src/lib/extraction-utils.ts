import { supabase } from '@/lib/supabase/client'
import { parseFinancialText } from '@/lib/pdf-parser'

export function extractTableOnly(fullText: string): string {
  const lines = fullText.split('\n')

  const tableStartPatterns = [
    /^\s*(ATIVO|PASSIVO|RECEITA|DESPESA|SALDO|Conta|Código|Descricao|Description|Account|CONTAS)/i,
    /^\s*[A-Z\s]{10,}[\s]{5,}[\d.,\-()]+/,
  ]

  const tableEndPatterns = [
    /^\s*(TOTAL GERAL|TOTAL|Assinado|Responsável|Data:|Carimbo|Assinatura|Preparado|Revisado)/i,
    /^\s*_{5,}/,
  ]

  let tableStart = 0
  let tableEnd = lines.length

  for (let i = 0; i < lines.length; i++) {
    if (tableStartPatterns.some((p) => p.test(lines[i]))) {
      tableStart = i
      break
    }
  }

  for (let i = lines.length - 1; i > tableStart; i--) {
    if (tableEndPatterns.some((p) => p.test(lines[i]))) {
      tableEnd = i
      break
    }
  }

  return lines.slice(tableStart, tableEnd).join('\n')
}

export function extractArrayFromMetadata(metadata: any): any[] {
  if (!metadata) return []
  if (Array.isArray(metadata)) return metadata

  const possibleKeys = ['contas', 'dados', 'items', 'rows', 'balanco_patrimonial']
  const queue = [metadata]

  while (queue.length > 0) {
    const curr = queue.shift()
    if (Array.isArray(curr)) return curr

    if (curr && typeof curr === 'object') {
      for (const key of possibleKeys) {
        if (Array.isArray(curr[key])) return curr[key]
      }
      for (const key of Object.keys(curr)) {
        if (curr[key] && typeof curr[key] === 'object' && !Array.isArray(curr[key])) {
          queue.push(curr[key])
        }
      }
    }
  }

  return []
}

export function isValidRow(c: any): boolean {
  if (!c || typeof c !== 'object') return false

  const hasDesc = !!(
    c.descricao?.toString().trim() ||
    c.description?.toString().trim() ||
    c.account_description?.toString().trim() ||
    c.classificacao?.toString().trim() ||
    c.classification_code?.toString().trim() ||
    c.nome_conta?.toString().trim()
  )

  const hasValue =
    c.valor != null ||
    c.value != null ||
    c.total != null ||
    c.valor_exercicio_atual != null ||
    c.current_balance != null ||
    c.balance != null ||
    c.debit != null ||
    c.credit != null

  return hasDesc || hasValue
}

export function processExtractedData(extractedText: string, documentType: string) {
  const metadataObj = parseFinancialText(extractedText, documentType)
  const rawArray = extractArrayFromMetadata(metadataObj)

  if (rawArray.length === 0) {
    throw new Error(
      'Falha na extração: Nenhum dado contábil encontrado usando os padrões avançados. Verifique a legibilidade do arquivo.',
    )
  }

  const rowsData = rawArray.filter(isValidRow).map((c: any) => ({
    classification_code: c.classificacao || c.classification_code || null,
    description: (
      c.descricao ||
      c.description ||
      c.account_description ||
      c.nome_conta ||
      'Sem Descrição'
    )
      .toString()
      .trim(),
    value:
      c.valor_exercicio_atual ??
      c.valor ??
      c.value ??
      c.current_balance ??
      c.balance ??
      c.total ??
      null,
    period: metadataObj.cabecalho?.year_n || metadataObj.periodo || c.period || null,
    nature: c.natureza_exercicio_atual || c.natureza || c.nature || null,
    document_type: documentType,
    raw: c,
  }))

  if (rowsData.length === 0) {
    throw new Error(
      'Falha na extração: Nenhum dado contábil encontrado. Verifique a legibilidade do arquivo.',
    )
  }

  return { metadataObj, rowsData }
}

export async function persistStructuredData(
  orgId: string,
  docId: string,
  documentType: string,
  rowsData: any[],
) {
  if (rowsData.length === 0) return

  const toNum = (v: any) => {
    if (typeof v === 'number') return v
    if (!v) return null
    const parsed = parseFloat(v.toString().replace(/[^\d.-]/g, ''))
    return isNaN(parsed) ? null : parsed
  }

  const { error: dataError } = await supabase.from('financial_data' as any).insert(
    rowsData.map((d, index) => ({
      org_id: orgId,
      document_id: docId,
      row_number: index + 1,
      account_name: d.description,
      value: toNum(d.value),
      period: d.period?.toString() || null,
    })),
  )
  if (dataError) console.error('Error inserting into financial_data:', dataError)

  try {
    if (documentType === 'Balanço' || documentType === 'Balanço Patrimonial') {
      const { error } = await supabase.from('financial_balanco_patrimonial' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          classification_code: d.classification_code,
          description: d.description,
          value_year_n: toNum(d.value),
          value_year_n_minus_1: toNum(d.raw.valor_exercicio_anterior),
          nature_year_n: d.nature,
          nature_year_n_minus_1: d.raw.natureza_exercicio_anterior || null,
          year_n: d.period ? parseInt(d.period) : null,
        })),
      )
      if (error) throw error
    } else if (documentType === 'Balancete') {
      const { error } = await supabase.from('financial_balancete' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          classification_code: d.classification_code,
          account_description: d.description,
          previous_balance: toNum(d.raw.saldo_anterior || d.raw.previous_balance),
          debit: toNum(d.raw.debito || d.raw.debit),
          credit: toNum(d.raw.credito || d.raw.credit),
          current_balance: toNum(d.value),
        })),
      )
      if (error) throw error
    } else if (documentType === 'DRE') {
      const { error } = await supabase.from('financial_dre' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          description: d.description,
          balance: toNum(d.value),
          sum: toNum(d.raw.soma || d.raw.sum),
          total: toNum(d.raw.total || d.value),
        })),
      )
      if (error) throw error
    } else if (documentType === 'Fluxo de Caixa') {
      const { error } = await supabase.from('financial_fluxo_caixa' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          description: d.description,
          value: toNum(d.value),
          period: d.period?.toString() || null,
        })),
      )
      if (error) throw error
    }
  } catch (err: any) {
    console.error('Error inserting into specific analytical tables:', err)
    throw new Error('Falha ao persistir dados estruturados nas tabelas analíticas: ' + err.message)
  }
}
