let pdfjsLoadPromise: Promise<any> | null = null

async function getPdfJs() {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib

  if (!pdfjsLoadPromise) {
    pdfjsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        const lib = (window as any).pdfjsLib
        if (lib) {
          if (!lib.GlobalWorkerOptions) {
            lib.GlobalWorkerOptions = {}
          }
          lib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          resolve(lib)
        } else {
          reject(new Error('Ocorreu um erro interno ao carregar o motor de PDF.'))
        }
      }
      script.onerror = () =>
        reject(
          new Error(
            'Falha ao carregar as dependências de PDF. Verifique sua conexão com a internet.',
          ),
        )
      document.head.appendChild(script)
    })
  }

  return pdfjsLoadPromise
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await getPdfJs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  } catch (e: any) {
    console.error('PDF Extraction Error:', e)
    throw new Error(
      e.message || 'Falha ao extrair texto do PDF. O arquivo pode estar corrompido ou protegido.',
    )
  }
}

const parseIntSafe = (val: string) => parseInt(val, 10) || 0

const parseValueAndNatureStr = (valStr: string | null, nature: string | null) => {
  if (!valStr) return { value: null, nature: nature || null }
  if (valStr === '-') return { value: 0, nature: nature || null }

  let cleanStr = valStr.replace(/(R\$|\$)/gi, '').trim()
  let isNegative = cleanStr.includes('(') || cleanStr.startsWith('-')
  let extractedNature = nature

  const natMatch = cleanStr.match(/[DcC]$/i)
  if (natMatch && !extractedNature) {
    extractedNature = natMatch[0].toUpperCase()
  }

  let rawNum = cleanStr.replace(/[DcC()]/gi, '').trim()

  if (rawNum.includes(',') && rawNum.includes('.') && rawNum.indexOf(',') < rawNum.indexOf('.')) {
    rawNum = rawNum.replace(/,/g, '')
  } else {
    rawNum = rawNum.replace(/\./g, '').replace(',', '.')
  }

  let value = parseFloat(rawNum)
  if (isNaN(value)) return { value: null, nature: extractedNature || null }
  if (isNegative && value > 0) value = -Math.abs(value)

  return { value, nature: extractedNature || null }
}

export function parseFinancialText(text: string, docType: string) {
  const yearMatches = [...text.matchAll(/\b(201\d|202\d)\b/g)].map((m) => parseIntSafe(m[1]))
  const uniqueYears = [...new Set(yearMatches)].sort((a, b) => b - a)
  const year_n = uniqueYears[0] || new Date().getFullYear()

  const contas: any[] = []
  let extractedTotal = 0

  const lines = text.split('\n')

  const primaryRegex = /^(\d+)\s+([\d.]+)\s+(.+?)\s+([-\d.,()]+[DCdc]?)\s+([-\d.,()]+[DCdc]?)$/
  const secondaryRegex = /^([\d.]*)\s*(.+?)\s+([-\d.,()]+[DCdc]?)\s*([-\d.,()]+[DCdc]?)?$/
  const basicFallback = /^(.*?)\s+([-\d.,()]+[DCdc]?)$/

  for (const line of lines) {
    const cleanLine = line.trim()
    if (!cleanLine) continue

    if (/^(?:pág|folha|data|hora|impresso|sistema|relatório|cnpj|insc|empresa)/i.test(cleanLine))
      continue

    const totalMatch =
      cleanLine.match(/TOTALIZANDO.*?VALOR DE R\$?\s*([-\d.,]+)/i) ||
      cleanLine.match(
        /^(?:TOTAL GERAL|TOTAL|PASSIVO E PATRIMÔNIO LÍQUIDO).*?([-\d.,]+[DCdc]?)$/i,
      ) ||
      cleanLine.match(/TOTAL.*?([-\d.,]+[DCdc]?)$/i)

    if (totalMatch) {
      const matchVal = totalMatch[1] || totalMatch[2] || totalMatch[0]
      const p = parseValueAndNatureStr(matchVal, null)
      if (p.value) extractedTotal = p.value
    }

    let match = cleanLine.match(primaryRegex)
    if (match) {
      const v1 = parseValueAndNatureStr(match[4], null)
      const v2 = parseValueAndNatureStr(match[5], null)
      contas.push({
        codigo: parseIntSafe(match[1]),
        classificacao: match[2],
        descricao: match[3].trim(),
        valor_exercicio_atual: v1.value,
        natureza_exercicio_atual: v1.nature,
        valor_exercicio_anterior: v2.value,
        natureza_exercicio_anterior: v2.nature,
        valor: v1.value,
        linha_original: cleanLine,
      })
      continue
    }

    match = cleanLine.match(secondaryRegex)
    if (match && match[2].length > 3 && !match[2].match(/^[\d.\s]+$/)) {
      const v1 = parseValueAndNatureStr(match[3], null)
      const v2 = parseValueAndNatureStr(match[4] || '', null)
      if (v1.value !== null) {
        contas.push({
          codigo: null,
          classificacao: match[1] || null,
          descricao: match[2].trim(),
          valor_exercicio_atual: v1.value,
          natureza_exercicio_atual: v1.nature,
          valor_exercicio_anterior: v2.value,
          natureza_exercicio_anterior: v2.nature,
          valor: v1.value,
          linha_original: cleanLine,
        })
        continue
      }
    }

    const basicMatch = cleanLine.match(basicFallback)
    if (basicMatch && basicMatch[1].length > 3 && !basicMatch[1].match(/^[\d.\s]+$/)) {
      const v1 = parseValueAndNatureStr(basicMatch[2], null)
      if (v1.value !== null) {
        contas.push({
          codigo: null,
          classificacao: null,
          descricao: basicMatch[1].trim(),
          valor_exercicio_atual: v1.value,
          natureza_exercicio_atual: v1.nature,
          valor_exercicio_anterior: null,
          natureza_exercicio_anterior: null,
          valor: v1.value,
          linha_original: cleanLine,
        })
      }
    }
  }

  const calculatedSum = contas.reduce((acc, c) => acc + (c.valor_exercicio_atual || 0), 0)

  return {
    cabecalho: { year_n },
    docType,
    items: contas,
    extractedTotal,
    calculatedSum,
  }
}
