import { supabase } from '@/lib/supabase/client'
import { parseBalancoPatrimonialText } from '@/lib/pdf-parser'

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

  const possibleKeys = ['contas', 'dados', 'items', 'rows']

  for (const key of possibleKeys) {
    if (Array.isArray(metadata[key])) return metadata[key]
  }

  for (const outerKey of Object.keys(metadata)) {
    if (
      metadata[outerKey] &&
      typeof metadata[outerKey] === 'object' &&
      !Array.isArray(metadata[outerKey])
    ) {
      for (const key of possibleKeys) {
        if (Array.isArray(metadata[outerKey][key])) return metadata[outerKey][key]
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
    typeof c.valor === 'number' ||
    typeof c.value === 'number' ||
    typeof c.total === 'number' ||
    typeof c.valor_exercicio_atual === 'number' ||
    typeof c.current_balance === 'number' ||
    typeof c.balance === 'number' ||
    typeof c.debit === 'number' ||
    typeof c.credit === 'number'

  return hasDesc || hasValue
}

export function processExtractedData(extractedText: string, documentType: string) {
  const parserMap: Record<string, (text: string) => any> = {
    Balanço: parseBalancoPatrimonialText,
    Balancete: parseBalancoPatrimonialText,
    DRE: parseBalancoPatrimonialText,
    'Fluxo de Caixa': parseBalancoPatrimonialText,
  }

  const parser = parserMap[documentType] || parseBalancoPatrimonialText
  const metadataObj = parser(extractedText)
  const rawArray = extractArrayFromMetadata(metadataObj)

  if (rawArray.length === 0) {
    throw new Error(
      `Falha na extração: Nenhum dado contábil encontrado em ${documentType}. Verifique se o PDF está legível.`,
    )
  }

  const rowsData = rawArray.filter(isValidRow).map((c: any) => ({
    classification_code: c.classificacao || c.classification_code || null,
    description: (
      c.descricao ||
      c.description ||
      c.account_description ||
      c.nome_conta ||
      'Unknown'
    )
      .toString()
      .trim(),
    value:
      typeof c.valor_exercicio_atual === 'number'
        ? c.valor_exercicio_atual
        : typeof c.valor === 'number'
          ? c.valor
          : typeof c.value === 'number'
            ? c.value
            : typeof c.current_balance === 'number'
              ? c.current_balance
              : typeof c.balance === 'number'
                ? c.balance
                : typeof c.total === 'number'
                  ? c.total
                  : null,
    period: metadataObj.cabecalho?.year_n || metadataObj.periodo || c.period || null,
    nature: c.natureza || c.nature || null,
    document_type: documentType,
    raw: c,
  }))

  if (rowsData.length === 0) {
    throw new Error('Falha na extração: As linhas de dados extraídas são inválidas ou vazias.')
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

  await supabase.from('financial_data' as any).insert(
    rowsData.map((d, index) => ({
      org_id: orgId,
      document_id: docId,
      row_number: index + 1,
      account_name: d.description || 'Unknown',
      value: d.value || 0,
      period: d.period?.toString() || null,
      document_type: documentType,
    })),
  )

  try {
    if (documentType === 'Balanço') {
      await supabase.from('financial_balanco_patrimonial' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          classification_code: d.classification_code,
          description: d.description,
          value_year_n: d.value,
          value_year_n_minus_1: d.raw.valor_exercicio_anterior || null,
          nature_year_n: d.nature,
          nature_year_n_minus_1: d.raw.natureza_exercicio_anterior || null,
          year_n: d.period ? parseInt(d.period) : null,
        })),
      )
    } else if (documentType === 'Balancete') {
      await supabase.from('financial_balancete' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          classification_code: d.classification_code,
          account_description: d.description,
          previous_balance: d.raw.saldo_anterior || d.raw.previous_balance || null,
          debit: d.raw.debito || d.raw.debit || null,
          credit: d.raw.credito || d.raw.credit || null,
          current_balance: d.value,
        })),
      )
    } else if (documentType === 'DRE') {
      await supabase.from('financial_dre' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          description: d.description,
          balance: d.value,
          sum: d.raw.soma || d.raw.sum || null,
          total: d.raw.total || d.value || null,
        })),
      )
    } else if (documentType === 'Fluxo de Caixa') {
      await supabase.from('financial_fluxo_caixa' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          description: d.description,
          value: d.value,
          period: d.period?.toString() || null,
        })),
      )
    }
  } catch (err) {
    console.error('Non-critical error inserting into specific analytical tables:', err)
  }
}
