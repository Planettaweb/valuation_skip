/**
 * Parser para extratos bancários: OFX (SGML/XML) e CSV (com detecção de colunas brasileiras e Sispag)
 */

export interface LancamentoExtraido {
  data: string // YYYY-MM-DD
  descricao_original: string
  valor: number // Negativo = débito/saída, Positivo = crédito/entrada
  tipo_movimento: 'debito' | 'credito'
  documento_ref?: string
  fitid?: string
  banco?: string
  conta_bancaria?: string
}

/**
 * Remove tags XML/SGML e extrai valores de tags OFX como <TRNAMT>-150.00
 */
export function parseOFX(content: string): LancamentoExtraido[] {
  const lancamentos: LancamentoExtraido[] = []

  // Extrair banco e conta se houver
  const bankMatch = content.match(/<BANKID>([^<\r\n]+)/i)
  const acctMatch = content.match(/<ACCTID>([^<\r\n]+)/i)
  const banco = bankMatch ? bankMatch[1].trim() : undefined
  const conta_bancaria = acctMatch ? acctMatch[1].trim() : undefined

  // Capturar blocos <STMTTRN>...</STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi
  let match: RegExpExecArray | null

  while ((match = trnRegex.exec(content)) !== null) {
    const trnBlock = match[1]
    if (!trnBlock.trim()) continue

    const getTag = (tag: string) => {
      const reg = new RegExp(`<${tag}>([^<\r\n]+)`, 'i')
      const m = trnBlock.match(reg)
      return m ? m[1].trim() : ''
    }

    const trntype = getTag('TRNTYPE') // DEBIT / CREDIT / CHECK / etc.
    const dtpostedRaw = getTag('DTPOSTED') // Ex: 20260315120000[-03:EST]
    const trnamtRaw = getTag('TRNAMT')
    const fitid = getTag('FITID') || undefined
    const checknum = getTag('CHECKNUM') || undefined
    const refnum = getTag('REFNUM') || undefined
    const memo = getTag('MEMO')
    const name = getTag('NAME')

    if (!dtpostedRaw && !trnamtRaw) continue

    // Formatar data YYYY-MM-DD
    let dataFormatada = new Date().toISOString().split('T')[0]
    if (dtpostedRaw && dtpostedRaw.length >= 8) {
      const y = dtpostedRaw.slice(0, 4)
      const m = dtpostedRaw.slice(4, 6)
      const d = dtpostedRaw.slice(6, 8)
      dataFormatada = `${y}-${m}-${d}`
    }

    // Formatar valor numérico
    const valorNum = parseFloat(trnamtRaw.replace(/,/g, '.'))
    if (isNaN(valorNum)) continue

    const descricao =
      [name, memo].filter(Boolean).join(' - ') || 'Lançamento bancário sem descrição'
    const tipo_movimento = valorNum < 0 || trntype.toUpperCase() === 'DEBIT' ? 'debito' : 'credito'

    lancamentos.push({
      data: dataFormatada,
      descricao_original: descricao,
      valor: valorNum,
      tipo_movimento,
      documento_ref: checknum || refnum || fitid,
      fitid,
      banco,
      conta_bancaria,
    })
  }

  return lancamentos
}

/**
 * Parser para CSVs bancários tradicionais e extratos Sispag
 * Suporta separadores vírgula, ponto-e-vírgula e tabulação
 */
export function parseExtratoCSV(content: string): LancamentoExtraido[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  // Detectar delimitador: ponto-e-vírgula, vírgula ou tab
  const sample = lines.slice(0, 5).join('\n')
  const countSemi = (sample.match(/;/g) || []).length
  const countComma = (sample.match(/,/g) || []).length
  const countTab = (sample.match(/\t/g) || []).length

  let delimiter = ';'
  if (countComma > countSemi && countComma > countTab) delimiter = ','
  if (countTab > countSemi && countTab > countComma) delimiter = '\t'

  const parseLine = (line: string): string[] => {
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if (c === delimiter && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += c
      }
    }
    parts.push(current.trim())
    return parts.map((p) => p.replace(/^"|"$/g, '').trim())
  }

  const header = parseLine(lines[0]).map((h) =>
    h
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase(),
  )

  // Identificar índices de colunas
  const idxData = header.findIndex(
    (h) => h.includes('DATA') || h.includes('DT') || h.includes('DATE') || h.includes('LANCAMENTO'),
  )
  const idxDesc = header.findIndex(
    (h) =>
      h.includes('HISTORICO') ||
      h.includes('DESCRICAO') ||
      h.includes('MEMO') ||
      h.includes('NOME') ||
      h.includes('FAVORECIDO') ||
      h.includes('FORNECEDOR'),
  )
  const idxValor = header.findIndex(
    (h) => h.includes('VALOR') || h.includes('VAL') || h.includes('AMOUNT'),
  )
  const idxDebito = header.findIndex((h) => h.includes('DEBITO') || h.includes('SAIDA'))
  const idxCredito = header.findIndex((h) => h.includes('CREDITO') || h.includes('ENTRADA'))
  const idxDoc = header.findIndex(
    (h) => h.includes('DOC') || h.includes('DOCUMENTO') || h.includes('NUMERO'),
  )

  const parseValor = (valStr: string): number | null => {
    if (!valStr) return null
    let str = valStr.replace(/[R$\s]/g, '')
    const isNeg = str.includes('-') || str.includes('(')
    str = str.replace(/[()]/g, '')

    // Se tiver vírgula como separador decimal (formato brasileiro 1.234,56)
    if (str.includes(',') && str.includes('.')) {
      if (str.indexOf('.') < str.indexOf(',')) {
        str = str.replace(/\./g, '').replace(',', '.')
      } else {
        str = str.replace(/,/g, '')
      }
    } else if (str.includes(',')) {
      str = str.replace(',', '.')
    }

    const n = parseFloat(str)
    if (isNaN(n)) return null
    return isNeg && n > 0 ? -n : n
  }

  const parseDataBR = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0]
    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const brMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
    if (brMatch) {
      const day = brMatch[1].padStart(2, '0')
      const month = brMatch[2].padStart(2, '0')
      let year = brMatch[3]
      if (year.length === 2) year = `20${year}`
      return `${year}-${month}-${day}`
    }
    // Formato YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
    }
    return new Date().toISOString().split('T')[0]
  }

  const lancamentos: LancamentoExtraido[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length < 2) continue

    const rawData = idxData !== -1 ? cols[idxData] : cols[0]
    const rawDesc = idxDesc !== -1 ? cols[idxDesc] : cols[1]

    let valorFinal: number | null = null
    let tipo: 'debito' | 'credito' = 'debito'

    if (idxDebito !== -1 && cols[idxDebito] && parseValor(cols[idxDebito])) {
      const v = Math.abs(parseValor(cols[idxDebito]) || 0)
      valorFinal = -v
      tipo = 'debito'
    } else if (idxCredito !== -1 && cols[idxCredito] && parseValor(cols[idxCredito])) {
      const v = Math.abs(parseValor(cols[idxCredito]) || 0)
      valorFinal = v
      tipo = 'credito'
    } else if (idxValor !== -1) {
      valorFinal = parseValor(cols[idxValor])
      if (valorFinal !== null) {
        tipo = valorFinal < 0 ? 'debito' : 'credito'
      }
    } else {
      // Tentar encontrar qualquer coluna com valor
      for (const col of cols) {
        const val = parseValor(col)
        if (val !== null && val !== 0) {
          valorFinal = val
          tipo = val < 0 ? 'debito' : 'credito'
          break
        }
      }
    }

    if (!rawDesc || valorFinal === null) continue

    lancamentos.push({
      data: parseDataBR(rawData),
      descricao_original: rawDesc,
      valor: valorFinal,
      tipo_movimento: tipo,
      documento_ref: idxDoc !== -1 ? cols[idxDoc] : undefined,
    })
  }

  return lancamentos
}
