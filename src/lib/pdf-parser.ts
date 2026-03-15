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

const parseValueAndNatureStr = (valStr: string, nature: string | null) => {
  if (!valStr || valStr === '-') return { value: 0, nature: nature || null }
  let rawNum = valStr
  // Fallback for US format vs PT-BR format
  if (rawNum.includes(',') && rawNum.includes('.') && rawNum.indexOf(',') < rawNum.indexOf('.')) {
    rawNum = rawNum.replace(/,/g, '')
  } else {
    rawNum = rawNum.replace(/\./g, '').replace(',', '.')
  }

  const value = parseFloat(rawNum) || 0
  return { value, nature: nature ? nature.toUpperCase() : null }
}

export function parseBalancoPatrimonialText(text: string) {
  // Extract specific years dynamically from headers or text
  const yearMatches = [...text.matchAll(/\b(201\d|202\d)\b/g)].map((m) => parseIntSafe(m[1]))
  const uniqueYears = [...new Set(yearMatches)].sort((a, b) => b - a)
  const year_n = uniqueYears[0] || new Date().getFullYear()
  const year_n_minus_1 = uniqueYears[1] || year_n - 1

  const cabecalho = {
    empresa:
      text.match(/(?:Empresa|Razão Social)[:\s]*([A-Z0-9\s.\-&]+)(?:\n|$)/i)?.[1]?.trim() || '',
    cnpj: text.match(/(?:CNPJ)[:\s]*([\d.\-/]+)/i)?.[1] || '',
    inscricao_junta_comercial: text.match(/(?:NIRE|Inscrição|Junta)[:\s]*(\d+)/i)?.[1] || '',
    data_abertura: text.match(/(?:Abertura|Início)[:\s]*([\d]{2}\/[\d]{2}\/[\d]{4})/i)?.[1] || '',
    data_encerramento_balanco:
      text.match(/(?:Encerramento|Fim)[:\s]*([\d]{2}\/[\d]{2}\/[\d]{4})/i)?.[1] || '',
    folha: parseIntSafe(text.match(/(?:Folha|Pág)[\w]*[:\s]*(\d+)/i)?.[1] || '0'),
    numero_livro: parseIntSafe(text.match(/(?:Livro)[:\s]*(\d+)/i)?.[1] || '0'),
    data_emissao: text.match(/(?:Emissão)[:\s]*([\d]{2}\/[\d]{2}\/[\d]{4})/i)?.[1] || '',
    hora_emissao: text.match(/(?:Hora)[:\s]*([\d]{2}:[\d]{2})/i)?.[1] || '',
    year_n,
    year_n_minus_1,
  }

  const contas: any[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const cleanLine = line.trim()
    if (!cleanLine) continue

    const tokens = cleanLine.split(/\s+/)
    if (tokens.length < 3) continue

    const isVal = (t: string) => /^[-]?\d[\d.,]*$/.test(t) || t === '-'
    const isValWithNat = (t: string) => /^[-]?\d[\d.,]*[DCdc]$/i.test(t)

    const parsedValues = []
    let i = tokens.length - 1

    // Backwards Line Processing (Right-to-Left)
    while (i >= 0 && parsedValues.length < 2) {
      let token = tokens[i]
      let nature: string | null = null
      let valueStr: string | null = null

      // Check if detached nature indicator (e.g. "D" or "C")
      if (/^[DCdc]$/i.test(token) && i > 0) {
        nature = token.toUpperCase()
        i--
        token = tokens[i]
      }

      // Check if attached nature indicator (e.g. "1.000,00D")
      if (isValWithNat(token)) {
        nature = token.slice(-1).toUpperCase()
        valueStr = token.slice(0, -1)
      } else if (isVal(token)) {
        valueStr = token
      } else {
        break // Stop at the first non-value token from the end
      }

      if (valueStr) {
        parsedValues.unshift({ valueStr, nature })
      }
      i--
    }

    if (parsedValues.length > 0) {
      const descTokens = tokens.slice(0, i + 1)
      if (descTokens.length === 0) continue

      const descString = descTokens.join(' ')

      // Adaptive pattern for classification and complex descriptions (e.g. "(-) AMORTIZAÇÃO ACUMULADA")
      const prefixMatch = descString.match(/^(\d{1,6})?\s*([\d]+(?:\.\d+)*)\s+(.*)$/)
      const clsMatch = descString.match(/^([\d]+(?:\.\d+)*)\s+(.*)$/)

      let codigo = 0
      let classificacao = ''
      let descricao = descString

      if (prefixMatch && prefixMatch[3]) {
        codigo = parseIntSafe(prefixMatch[1] || '0')
        classificacao = prefixMatch[2]
        descricao = prefixMatch[3]
      } else if (clsMatch && clsMatch[2]) {
        classificacao = clsMatch[1]
        descricao = clsMatch[2]
      } else {
        // No clear classification found. Be strict to avoid false positives.
        if (parsedValues.length < 2) continue
      }

      descricao = descricao.trim()

      if (
        descricao.length > 2 &&
        !/^(?:ano|exercício|saldo|valor|histórico|demonstrações)/i.test(descricao)
      ) {
        const vnStr =
          parsedValues.length === 2
            ? parsedValues[0].valueStr
            : parsedValues.length === 1
              ? parsedValues[0].valueStr
              : '0'
        const vnNat =
          parsedValues.length === 2
            ? parsedValues[0].nature
            : parsedValues.length === 1
              ? parsedValues[0].nature
              : null

        const vn1Str = parsedValues.length === 2 ? parsedValues[1].valueStr : '0'
        const vn1Nat = parsedValues.length === 2 ? parsedValues[1].nature : null

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
        })
      }
    }
  }

  const declaracao_final = {
    texto_reconhecimento: text.match(/(Reconhecemos a exatidão.*?)(?:\n|$)/i)?.[1] || '',
    valor_total_ativo_passivo: parseValueAndNatureStr(
      text.match(/Total Ativo e Passivo.*?([\d.,]+)/i)?.[1] || '0',
      null,
    ).value,
    local_data: text.match(/(?:São Paulo|Rio de Janeiro|Local).*?(\d{2}.*?\d{4})/i)?.[0] || '',
    assinaturas: [] as any[],
  }

  const sigRegex =
    /(?:Nome|Assinatura)[:\s]*([A-Za-zÀ-Úà-ú\s]+)(?:Cargo)[:\s]*([A-Za-z\s]+)(?:CPF)[:\s]*([\d.-]+)/gi
  let sigMatch
  while ((sigMatch = sigRegex.exec(text)) !== null) {
    declaracao_final.assinaturas.push({
      nome: sigMatch[1].trim(),
      cargo: sigMatch[2].trim(),
      cpf: sigMatch[3].trim(),
      registro_conselho: '',
    })
  }

  return {
    balanco_patrimonial: {
      cabecalho,
      contas,
      declaracao_final,
    },
  }
}
