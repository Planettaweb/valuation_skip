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

  // Prevent account codes like 1.1.01.02 or 1-1 from being parsed as values
  if (/^\d+\.[\d.]+$/.test(cleanStr) && cleanStr.split('.').length > 2) return null
  if (/^\d+-\d+/.test(cleanStr)) return null
  if (/^[\d.-]+[a-zA-Z]+/.test(cleanStr) && !/[dDcC]$/i.test(cleanStr)) return null

  let isNegative = cleanStr.includes('(') || cleanStr.startsWith('-') || /[dD]\s*$/.test(cleanStr)
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

  let hMap = {
    code: -1,
    class: -1,
    desc: -1,
    prev: -1,
    deb: -1,
    cred: -1,
    curr: -1,
    val_curr: -1,
    val_prev: -1,
    sum: -1,
    total: -1,
    period: -1,
    plan: -1,
    real: -1,
  }

  for (const cols of rows) {
    if (!cols || !Array.isArray(cols) || cols.length === 0 || cols.every((c) => !c)) continue

    const strCols = cols.map((c) => String(c || '').trim())

    if (isHeader) {
      const lowerCols = strCols.map((c) => c.toLowerCase())
      if (
        lowerCols.some(
          (c) =>
            c.includes('descri') ||
            c.includes('conta') ||
            c.includes('valor') ||
            c.includes('saldo') ||
            c.includes('débito'),
        )
      ) {
        isHeader = false
        lowerCols.forEach((c, i) => {
          if (c.includes('código') || c === 'cod' || c.includes('codigo')) hMap.code = i
          else if (c.includes('classifica')) hMap.class = i
          else if (c.includes('descri') || c.includes('conta')) hMap.desc = i
          else if (c.includes('anterior')) {
            hMap.prev = i
            hMap.val_prev = i
          } else if (c.includes('débito') || c.includes('debito')) hMap.deb = i
          else if (c.includes('crédito') || c.includes('credito')) hMap.cred = i
          else if (c.includes('atual') && !c.includes('anterior')) {
            hMap.curr = i
            hMap.val_curr = i
          } else if (c.includes('saldo') && hMap.curr === -1) {
            hMap.curr = i
            hMap.val_curr = i
          } else if (c.includes('soma')) hMap.sum = i
          else if (c.includes('total')) hMap.total = i
          else if (c.includes('planejado')) hMap.plan = i
          else if (c.includes('realizado')) hMap.real = i
          else if (c.includes('mês') || c.includes('mes') || c.includes('período')) hMap.period = i
          else if (c.includes('valor') && hMap.val_curr === -1) hMap.val_curr = i
        })
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

    const useMap =
      hMap.desc !== -1 &&
      (hMap.val_curr !== -1 ||
        hMap.curr !== -1 ||
        hMap.total !== -1 ||
        hMap.real !== -1 ||
        hMap.sum !== -1)

    if (useMap) {
      account_code = hMap.code !== -1 ? strCols[hMap.code] : null
      classification_code = hMap.class !== -1 ? strCols[hMap.class] : null
      description = hMap.desc !== -1 ? strCols[hMap.desc] : ''

      if (documentType === 'Balancete') {
        raw.previous_balance = hMap.prev !== -1 ? parseValueStr(strCols[hMap.prev]) : null
        raw.debit = hMap.deb !== -1 ? parseValueStr(strCols[hMap.deb]) : null
        raw.credit = hMap.cred !== -1 ? parseValueStr(strCols[hMap.cred]) : null
        value = hMap.curr !== -1 ? parseValueStr(strCols[hMap.curr]) : null
      } else if (documentType === 'DRE') {
        value = hMap.val_curr !== -1 ? parseValueStr(strCols[hMap.val_curr]) : null
        if (value === null && hMap.curr !== -1) value = parseValueStr(strCols[hMap.curr])
        raw.sum = hMap.sum !== -1 ? parseValueStr(strCols[hMap.sum]) : null
        raw.total = hMap.total !== -1 ? parseValueStr(strCols[hMap.total]) : null
        if (value === null) value = raw.total || raw.sum
      } else if (documentType === 'Fluxo de Caixa') {
        raw.planned_value = hMap.plan !== -1 ? parseValueStr(strCols[hMap.plan]) : null
        value = hMap.real !== -1 ? parseValueStr(strCols[hMap.real]) : null
        if (value === null && hMap.val_curr !== -1) value = parseValueStr(strCols[hMap.val_curr])
        period = hMap.period !== -1 ? strCols[hMap.period] : null
      } else {
        value = hMap.val_curr !== -1 ? parseValueStr(strCols[hMap.val_curr]) : null
        raw.valor_exercicio_anterior =
          hMap.val_prev !== -1 ? parseValueStr(strCols[hMap.val_prev]) : null
      }

      if (description || value !== null) {
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
      continue
    }

    // Heuristic Fallback (Right-to-Left secure parsing)
    const numCols = []
    for (let i = strCols.length - 1; i >= 0; i--) {
      const val = parseValueStr(strCols[i])
      if (val !== null) {
        numCols.unshift({ val, idx: i })
      }
    }

    if (numCols.length > 0) {
      let actualNumCols = numCols
      if (documentType === 'Balancete' && numCols.length > 4) {
        actualNumCols = numCols.slice(-4)
      } else if (
        (documentType === 'Balanço' || documentType === 'Balanço Patrimonial') &&
        numCols.length > 2
      ) {
        actualNumCols = numCols.slice(-2)
      } else if (documentType === 'DRE' && numCols.length > 3) {
        actualNumCols = numCols.slice(-3)
      } else if (documentType === 'Fluxo de Caixa' && numCols.length > 2) {
        actualNumCols = numCols.slice(-2)
      }

      const firstNumIdx = actualNumCols.length > 0 ? actualNumCols[0].idx : strCols.length
      const textCols = strCols.slice(0, firstNumIdx).filter((c) => c.trim().length > 0)

      if (textCols.length === 1) {
        description = textCols[0]
      } else if (textCols.length === 2) {
        classification_code = textCols[0]
        description = textCols[1]
      } else if (textCols.length >= 3) {
        account_code = textCols[0]
        classification_code = textCols[1]
        description = textCols.slice(2).join(' ')
      }

      if (documentType === 'Balancete') {
        if (actualNumCols.length >= 4) {
          raw.previous_balance = actualNumCols[0].val
          raw.debit = actualNumCols[1].val
          raw.credit = actualNumCols[2].val
          value = actualNumCols[3].val
        } else {
          value = actualNumCols[actualNumCols.length - 1]?.val || null
          if (actualNumCols.length > 1) raw.credit = actualNumCols[actualNumCols.length - 2].val
          if (actualNumCols.length > 2) raw.debit = actualNumCols[actualNumCols.length - 3].val
        }
      } else if (documentType === 'DRE') {
        value = actualNumCols[0]?.val || null
        if (actualNumCols.length > 1) raw.sum = actualNumCols[1].val
        if (actualNumCols.length > 2) raw.total = actualNumCols[2].val
      } else if (documentType === 'Fluxo de Caixa') {
        if (actualNumCols.length >= 2) {
          raw.planned_value = actualNumCols[0].val
          value = actualNumCols[1].val
        } else {
          value = actualNumCols[0]?.val || null
        }
        period =
          strCols.find((c) => /^[A-Za-z]{3}\/?\d{2,4}$/.test(c) || /^\d{2}\/\d{4}$/.test(c)) || null
      } else {
        value = actualNumCols[0]?.val || null
        if (actualNumCols.length > 1) raw.valor_exercicio_anterior = actualNumCols[1].val
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

  const rowsData = rawArray.filter(isValidRow).map((c: any) => {
    let description = (
      c.descricao ||
      c.description ||
      c.account_description ||
      c.nome_conta ||
      'Sem Descrição'
    )
      .toString()
      .trim()

    let val =
      c.valor_exercicio_atual ??
      c.valor ??
      c.value ??
      c.current_balance ??
      c.balance ??
      c.realized_value ??
      c.total ??
      null

    let raw: any = {
      valor_exercicio_anterior: c.valor_exercicio_anterior,
      previous_balance: c.saldo_anterior || c.previous_balance,
      debit: c.debito || c.debit,
      credit: c.credito || c.credit,
      sum: c.soma || c.sum,
      total: c.total,
      planned_value: c.valor_planejado || c.planned_value,
      ...c,
    }

    return {
      account_code: c.account_code || c.codigo || null,
      classification_code: c.classificacao || c.classification_code || null,
      description,
      value: val,
      period: metadataObj.cabecalho?.year_n || metadataObj.periodo || c.period || c.mes || null,
      nature: c.natureza_exercicio_atual || c.natureza || c.nature || null,
      document_type: documentType,
      raw,
    }
  })

  return { metadataObj, rowsData, rawText: extractedText, noise: metadataObj.noise || [] }
}

export async function persistStructuredData(
  orgId: string,
  docId: string,
  documentType: string,
  rowsData: any[],
  onProgress?: (processed: number, total: number) => void,
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

  const BATCH_SIZE = 250
  let processed = 0
  const total = rowsData.length

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rowsData.slice(i, i + BATCH_SIZE)

    const { error: dataError } = await supabase.from('financial_data' as any).insert(
      batch.map((d, index) => ({
        org_id: orgId,
        document_id: docId,
        row_number: i + index + 1,
        account_name: d.description,
        value: toNum(d.value),
        period: d.period?.toString() || null,
      })),
    )
    if (dataError) console.error('Error inserting into financial_data:', dataError)

    const { error: rowsError } = await supabase.from('document_rows').insert(
      batch.map((d, index) => ({
        org_id: orgId,
        document_id: docId,
        row_index: i + index + 1,
        data: d,
      })),
    )
    if (rowsError) console.error('Error inserting into document_rows:', rowsError)

    try {
      if (documentType === 'Balanço' || documentType === 'Balanço Patrimonial') {
        const { error } = await supabase.from('financial_balanco_patrimonial' as any).insert(
          batch.map((d) => ({
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
          batch.map((d) => ({
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
          batch.map((d) => ({
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
          batch.map((d) => ({
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
      throw new Error(
        'Falha ao persistir dados estruturados nas tabelas analíticas: ' + err.message,
      )
    }

    processed += batch.length
    if (onProgress) onProgress(processed, total)
  }
}
