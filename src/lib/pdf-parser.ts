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
  if (valStr === null) return { value: null, nature: nature || null }
  if (valStr === '-') return { value: 0, nature: nature || null }

  let rawNum = valStr.replace(/[()]/g, '')
  let isNegative = valStr.includes('(') || valStr.startsWith('-')

  if (rawNum.includes(',') && rawNum.includes('.') && rawNum.indexOf(',') < rawNum.indexOf('.')) {
    rawNum = rawNum.replace(/,/g, '')
  } else {
    rawNum = rawNum.replace(/\./g, '').replace(',', '.')
  }

  let value = parseFloat(rawNum) || 0
  if (isNegative && value > 0) value = -Math.abs(value)

  return { value, nature: nature ? nature.toUpperCase() : null }
}

export function parseFinancialText(text: string, docType: string) {
  const yearMatches = [...text.matchAll(/\b(201\d|202\d)\b/g)].map((m) => parseIntSafe(m[1]))
  const uniqueYears = [...new Set(yearMatches)].sort((a, b) => b - a)
  const year_n = uniqueYears[0] || new Date().getFullYear()

  const contas: any[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const cleanLine = line.trim()
    if (!cleanLine || /^(?:pág|folha|data|hora|impresso|sistema|relatório)/i.test(cleanLine))
      continue

    const tokens = cleanLine.split(/\s+/)
    const parsedValues = []
    let i = tokens.length - 1

    const isVal = (t: string) =>
      /^[-]?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(t) || t === '-' || /^\([\d.,]+\)$/.test(t)
    const isValWithNat = (t: string) =>
      /^[-]?\d[\d.,]*[DCdc]$/i.test(t) || /^\([\d.,]+\)[DCdc]$/i.test(t)

    while (i >= 0 && parsedValues.length < 2) {
      let token = tokens[i]
      let nature: string | null = null
      let valueStr: string | null = null

      if (/^[DCdc]$/i.test(token) && i > 0) {
        nature = token.toUpperCase()
        i--
        token = tokens[i]
      }

      if (isValWithNat(token)) {
        nature = token.slice(-1).toUpperCase()
        valueStr = token.slice(0, -1)
      } else if (isVal(token)) {
        valueStr = token
      } else {
        break
      }

      if (valueStr) {
        parsedValues.unshift({ valueStr, nature })
      }
      i--
    }

    const descTokens = tokens.slice(0, i + 1)
    let descricao = descTokens.join(' ').trim()

    if (parsedValues.length > 0 || descricao.length > 2) {
      let codigo = 0
      let classificacao = ''

      const prefixMatch = descricao.match(/^(\d{1,6})?\s*([\d]+(?:\.\d+)*)\s+(.*)$/)
      const clsMatch = descricao.match(/^([\d]+(?:\.\d+)*)\s+(.*)$/)

      if (prefixMatch && prefixMatch[3]) {
        codigo = parseIntSafe(prefixMatch[1] || '0')
        classificacao = prefixMatch[2]
        descricao = prefixMatch[3]
      } else if (clsMatch && clsMatch[2]) {
        classificacao = clsMatch[1]
        descricao = clsMatch[2]
      }

      if (!descricao) descricao = 'Sem Descrição'

      const vnStr = parsedValues.length >= 1 ? parsedValues[0].valueStr : null
      const vnNat = parsedValues.length >= 1 ? parsedValues[0].nature : null
      const vn1Str = parsedValues.length >= 2 ? parsedValues[1].valueStr : null
      const vn1Nat = parsedValues.length >= 2 ? parsedValues[1].nature : null

      const vn = parseValueAndNatureStr(vnStr, vnNat)
      const vn1 = parseValueAndNatureStr(vn1Str, vn1Nat)

      contas.push({
        codigo,
        classificacao,
        descricao,
        valor_exercicio_atual: vn.value,
        natureza_exercicio_atual: vn.nature,
        valor_exercicio_anterior: vn1.value,
        natureza_exercicio_anterior: vn1.nature,
        valor: vn.value,
      })
    }
  }

  return {
    cabecalho: { year_n },
    docType,
    items: contas,
  }
}
