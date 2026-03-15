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

  const numStr = match[1].replace(/\./g, '').replace(',', '.')
  const value = parseFloat(numStr) || 0
  const nature = match[2] ? match[2].toUpperCase() : null

  return { value, nature }
}

const parseIntSafe = (val: string) => parseInt(val, 10) || 0

export function parseBalancoPatrimonialText(text: string) {
  // Extract years from the document text
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

  // Look for lines that resemble account entries and ignore generic headers
  // E.g. "1  1.1  ATIVO  1.000,00 D  2.000,00 C"
  const contasRegex =
    /(?:^|\n|\s)(\d{1,5})\s+([\d.]+)\s+([A-ZÀ-Úa-zà-ú\s\-/()]+?)\s+([\d.,-]+\s*[DCdc]?)\s+([\d.,-]+\s*[DCdc]?)(?=\n|$)/g

  let match
  let sanityLimit = 2000
  while ((match = contasRegex.exec(text)) !== null && sanityLimit-- > 0) {
    const desc = match[3].trim()
    if (desc.length > 2 && !/^(?:ano|exercício)$/i.test(desc)) {
      const vn = parseValueAndNature(match[4])
      const vn1 = parseValueAndNature(match[5])

      contas.push({
        codigo: parseIntSafe(match[1]),
        classificacao: match[2],
        descricao: desc,
        valor_exercicio_atual: vn.value,
        natureza_exercicio_atual: vn.nature,
        valor_exercicio_anterior: vn1.value,
        natureza_exercicio_anterior: vn1.nature,
      })
    }
  }

  if (contas.length === 0) {
    const lines = text.split('\n')
    for (const line of lines) {
      const parts = line.trim().split(/\s{2,}|\t/)
      if (parts.length >= 5) {
        const cod = parts[0]
        const cls = parts[1]
        const desc = parts.slice(2, parts.length - 2).join(' ')
        const valN = parts[parts.length - 2]
        const valN1 = parts[parts.length - 1]

        if (/^\d+$/.test(cod) && /^[\d.]+$/.test(cls) && !/ano|exercício/i.test(desc)) {
          const vn = parseValueAndNature(valN)
          const vn1 = parseValueAndNature(valN1)

          contas.push({
            codigo: parseIntSafe(cod),
            classificacao: cls,
            descricao: desc,
            valor_exercicio_atual: vn.value,
            natureza_exercicio_atual: vn.nature,
            valor_exercicio_anterior: vn1.value,
            natureza_exercicio_anterior: vn1.nature,
          })
        }
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
