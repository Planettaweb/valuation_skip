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
      tableEnd = i + 1
      break
    }
  }

  if (tableStart >= tableEnd - 2) {
    return fullText
  }

  return lines.slice(tableStart, tableEnd).join('\n')
}

export function parseValueStr(str: string) {
  if (!str || typeof str !== 'string') return null
  let cleanStr = str.replace(/(R\$|\$)/gi, '').trim()
  let isNegative = cleanStr.includes('(') || cleanStr.startsWith('-')
  let rawNum = cleanStr.replace(/[DcC()]/gi, '').trim()
  if (!rawNum.match(/\d/)) return null

  if (rawNum.includes(',') && rawNum.includes('.') && rawNum.indexOf(',') < rawNum.indexOf('.')) {
    rawNum = rawNum.replace(/,/g, '')
  } else {
    rawNum = rawNum.replace(/\./g, '').replace(',', '.')
  }
  let value = parseFloat(rawNum)
  if (isNaN(value)) return null
  if (isNegative && value > 0) value = -Math.abs(value)
  return value
}

export function parseStructuredData(rows: any[][], documentType: string) {
  const rowsData: any[] = []
  const noise: any[] = []
  let isHeader = true

  for (const cols of rows) {
    if (!cols || !Array.isArray(cols) || cols.length === 0 || cols.every((c) => !c)) continue

    const strCols = cols.map((c) => String(c || '').trim())

    if (isHeader) {
      if (
        strCols.some((c) =>
          /valor|value|saldo|descrição|description|conta|code|código|débito|crédito|mes|planejado|realizado/i.test(
            c,
          ),
        )
      ) {
        isHeader = false
        noise.push({ linha_original: strCols.join(' | ') })
        continue
      }
      if (strCols.some((c) => /^[\d.,-]+$/.test(c))) {
        isHeader = false
      } else {
        noise.push({ linha_original: strCols.join(' | ') })
        continue
      }
    }

    let account_code = null
    let classification_code = null
    let description = ''
    let value = null
    let period = null
    let raw: any = {}

    const numCols = strCols
      .map((c, i) => ({ val: parseValueStr(c), idx: i }))
      .filter((c) => c.val !== null)

    if (numCols.length > 0) {
      const firstNumIdx = numCols[0].idx

      if (firstNumIdx > 0) {
        description = strCols[firstNumIdx - 1]
      }
      if (firstNumIdx > 1) {
        classification_code = strCols[firstNumIdx - 2]
      }
      if (firstNumIdx > 2) {
        account_code = strCols[firstNumIdx - 3]
      } else if (firstNumIdx === 0 && strCols.length > 1 && !numCols.find((n) => n.idx === 1)) {
        description = strCols[1]
      }

      if (documentType === 'Balancete') {
        raw.previous_balance = numCols[0]?.val || null
        raw.debit = numCols[1]?.val || null
        raw.credit = numCols[2]?.val || null
        value = numCols[3]?.val || numCols[0]?.val
      } else if (documentType === 'DRE') {
        value = numCols[0]?.val || null
        raw.sum = numCols[1]?.val || null
        raw.total = numCols[2]?.val || null
      } else if (documentType === 'Fluxo de Caixa') {
        raw.planned_value = numCols[0]?.val || null
        value = numCols[1]?.val || numCols[0]?.val
        period =
          strCols.find((c) => /^[A-Za-z]{3}\/?\d{2,4}$/.test(c) || /^\d{2}\/\d{4}$/.test(c)) || null
      } else {
        value = numCols[0]?.val || null
        if (numCols.length > 1) {
          raw.valor_exercicio_anterior = numCols[1].val
        }
      }

      rowsData.push({
        account_code,
        classification_code,
        description: description || 'Sem Descrição',
        value,
        period,
        document_type: documentType,
        raw,
      })
    } else {
      noise.push({ linha_original: strCols.join(' | ') })
    }
  }

  return { rowsData, noise }
}

export function parseCSV(text: string, documentType: string) {
  const lines = text.split('\n')
  const data = lines.map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
  return parseStructuredData(data, documentType)
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
    c.credit != null ||
    c.realized_value != null

  return hasDesc || hasValue
}

export function processExtractedData(extractedText: string, documentType: string) {
  const metadataObj = parseFinancialText(extractedText, documentType)
  const rawArray = extractArrayFromMetadata(metadataObj)

  const rowsData = rawArray.filter(isValidRow).map((c: any) => ({
    account_code: c.account_code || c.codigo || null,
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
      c.realized_value ??
      c.total ??
      null,
    period: metadataObj.cabecalho?.year_n || metadataObj.periodo || c.period || c.mes || null,
    nature: c.natureza_exercicio_atual || c.natureza || c.nature || null,
    document_type: documentType,
    raw: {
      valor_exercicio_anterior: c.valor_exercicio_anterior,
      previous_balance: c.saldo_anterior || c.previous_balance,
      debit: c.debito || c.debit,
      credit: c.credito || c.credit,
      sum: c.soma || c.sum,
      total: c.total,
      planned_value: c.valor_planejado || c.planned_value,
      ...c,
    },
  }))

  return { metadataObj, rowsData, rawText: extractedText, noise: metadataObj.noise || [] }
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
    const str = v.toString()
    let isNeg = str.includes('-') || str.includes('(')
    let parsed = parseFloat(str.replace(/[^\d.-]/g, ''))
    if (isNaN(parsed)) return null
    return isNeg && parsed > 0 ? -parsed : Math.abs(parsed) * (isNeg ? -1 : 1)
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

  const { error: rowsError } = await supabase.from('document_rows').insert(
    rowsData.map((d, index) => ({
      org_id: orgId,
      document_id: docId,
      row_index: index + 1,
      data: d,
    })),
  )
  if (rowsError) console.error('Error inserting into document_rows:', rowsError)

  try {
    if (documentType === 'Balanço' || documentType === 'Balanço Patrimonial') {
      const { error } = await supabase.from('financial_balanco_patrimonial' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          account_code: d.account_code,
          classification_code: d.classification_code,
          description: d.description,
          value_year_n: toNum(d.value),
          value_year_n_minus_1: toNum(d.raw?.valor_exercicio_anterior),
          nature_year_n: d.nature,
          nature_year_n_minus_1: d.raw?.natureza_exercicio_anterior || null,
          year_n: d.period ? parseInt(d.period) : null,
        })),
      )
      if (error) throw error
    } else if (documentType === 'Balancete') {
      const { error } = await supabase.from('financial_balancete' as any).insert(
        rowsData.map((d) => ({
          org_id: orgId,
          document_id: docId,
          account_code: d.account_code,
          classification_code: d.classification_code,
          account_description: d.description,
          previous_balance: toNum(d.raw?.previous_balance),
          debit: toNum(d.raw?.debit),
          credit: toNum(d.raw?.credit),
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
          sum: toNum(d.raw?.sum),
          total: toNum(d.raw?.total || d.value),
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
          planned_value: toNum(d.raw?.planned_value),
          realized_value: toNum(d.value),
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
