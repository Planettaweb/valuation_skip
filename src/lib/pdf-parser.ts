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

const parseValueAndNature = (val: string) => {
  if (!val) return { value: 0, nature: null }
  const str = val.trim()
  const match = str.match(/([\d.,-]+)\s*([DCdc])?/)
  if (!match) return { value: 0, nature: null }

  let rawNum = match[1]
  // Fallback for US format vs PT-BR format
  if (rawNum.includes(',') && rawNum.includes('.') && rawNum.indexOf(',') < rawNum.indexOf('.')) {
    rawNum = rawNum.replace(/,/g, '')
  } else {
    rawNum = rawNum.replace(/\./g, '').replace(',', '.')
  }

  const value = parseFloat(rawNum) || 0
  const nature = match[2] ? match[2].toUpperCase() : null

  return { value, nature }
}

const parseIntSafe = (val: string) => parseInt(val, 10) || 0

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

    // Attempt 1: Standard match (Code Classification Description Value_N Nature Value_N-1 Nature)
    const standardMatch = cleanLine.match(
      /^(\d{1,6})\s+([\d.]+)\s+(.*?)\s+([\d.,-]+\s*[DCdc]?)\s+([\d.,-]+\s*[DCdc]?)$/,
    )

    if (standardMatch) {
      const desc = standardMatch[3].trim()
      if (desc.length > 2 && !/^(?:ano|exercício|saldo|valor|histórico)/i.test(desc)) {
        const vn = parseValueAndNature(standardMatch[4])
        const vn1 = parseValueAndNature(standardMatch[5])

        contas.push({
          codigo: parseIntSafe(standardMatch[1]),
          classificacao: standardMatch[2],
          descricao: desc,
          valor_exercicio_atual: vn.value,
          natureza_exercicio_atual: vn.nature,
          valor_exercicio_anterior: vn1.value,
          natureza_exercicio_anterior: vn1.nature,
        })
        continue
      }
    }

    // Attempt 2: Flexible fallback for weird spacing and missing codes
    const fallbackMatch = cleanLine.match(
      /^(\d{1,6})?\s*([\d.]+)\s+(.*?)((?:[\d.,-]+\s*[DCdc]?\s*){2})$/,
    )
    if (fallbackMatch && !standardMatch) {
      const codStr = fallbackMatch[1] || '0'
      const clsStr = fallbackMatch[2]
      const desc = fallbackMatch[3].trim()

      if (desc.length > 2 && !/^(?:ano|exercício|saldo|valor|histórico)/i.test(desc)) {
        const valueChunk = fallbackMatch[4]
        const valMatches = [...valueChunk.matchAll(/([\d.,-]+)\s*([DCdc]?)/g)]

        const validMatches = valMatches.filter(
          (m) =>
            /[1-9]/.test(m[1]) ||
            m[1] === '0' ||
            m[1] === '0,00' ||
            m[1] === '0.00' ||
            /^[\d.,-]+$/.test(m[1]),
        )

        if (validMatches.length >= 2) {
          const mN = validMatches[validMatches.length - 2]
          const mN1 = validMatches[validMatches.length - 1]

          const vn = parseValueAndNature(mN[0])
          const vn1 = parseValueAndNature(mN1[0])

          contas.push({
            codigo: parseIntSafe(codStr),
            classificacao: clsStr,
            descricao: desc,
            valor_exercicio_atual: vn.value,
            natureza_exercicio_atual: vn.nature,
            valor_exercicio_anterior: vn1.value,
            natureza_exercicio_anterior: vn1.nature,
          })
          continue
        }
      }
    }

    // Attempt 3: No code, only classification and special characters in description
    const noCodeMatch = cleanLine.match(
      /^([\d.]+)\s+([A-Za-zÀ-Úà-ú\s\-/()&]+?)\s+([\d.,-]+\s*[DCdc]?)\s+([\d.,-]+\s*[DCdc]?)$/,
    )
    if (noCodeMatch && !standardMatch && !fallbackMatch) {
      const clsStr = noCodeMatch[1]
      const desc = noCodeMatch[2].trim()
      if (desc.length > 2 && !/^(?:ano|exercício|saldo|valor|histórico)/i.test(desc)) {
        const vn = parseValueAndNature(noCodeMatch[3])
        const vn1 = parseValueAndNature(noCodeMatch[4])

        contas.push({
          codigo: 0,
          classificacao: clsStr,
          descricao: desc,
          valor_exercicio_atual: vn.value,
          natureza_exercicio_atual: vn.nature,
          valor_exercicio_anterior: vn1.value,
          natureza_exercicio_anterior: vn1.nature,
        })
        continue
      }
    }
  }

  const declaracao_final = {
    texto_reconhecimento: text.match(/(Reconhecemos a exatidão.*?)(?:\n|$)/i)?.[1] || '',
    valor_total_ativo_passivo: parseValueAndNature(
      text.match(/Total Ativo e Passivo.*?([\d.,]+)/i)?.[1] || '0',
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
