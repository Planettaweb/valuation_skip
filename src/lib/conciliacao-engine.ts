/**
 * Motor de Normalização e Sugestão em 3 Camadas para Conciliação Financeira
 *
 * Regras acordadas:
 * 1. Normalização de texto: maiúsculas, sem acento, expansão de abreviações bancárias usuais, limpeza de pontuações.
 * 2. Camada 1: Dicionário de Mapeamento (plano_contas_mapping) - match exato normalizado -> 100% confiança, conciliação direta.
 * 3. Camada 2: Similaridade léxica + semântica de palavras-chave do setor financeiro/bancário -> 3 melhores opções com % de score.
 * 4. Camada 3: Triagem humana / Inbox de classificação.
 * 5. Regra de ouro: Nada bloqueia -> conta sem encaixe pode ficar como 'fora do padrão' com flag, permitindo auditoria e DFC sem travar.
 * 6. "O plano do cliente nasce das confirmações" -> ao confirmar, cria mapeamento no dicionário e assegura vínculo na conta do plano de contas.
 */

export interface PlanoContaOption {
  id: string
  codigo?: string | null
  nome_conta: string
  descricao?: string | null
  tipo?: string | null
  grupo?: string | null
  natureza?: string | null
}

export interface DicionarioMapping {
  id?: string
  org_id: string
  client_id?: string | null
  texto_original: string
  texto_normalizado: string
  id_conta: string
  origem: 'manual' | 'automatico'
  confianca: number
  contador_uso?: number
}

export interface SugestaoConta {
  conta_id: string
  codigo?: string | null
  nome_conta: string
  score: number // 0 a 100
  camada: 1 | 2 | 3
  motivo: string
}

// Tabela de expansão de abreviações comuns de extratos bancários e Sispag no Brasil
const ABREVIACOES_MAP: Record<string, string> = {
  PGTO: 'PAGAMENTO',
  PAGTO: 'PAGAMENTO',
  PG: 'PAGAMENTO',
  PAG: 'PAGAMENTO',
  FORN: 'FORNECEDOR',
  FORNEC: 'FORNECEDOR',
  FORNECEDORES: 'FORNECEDORES',
  SAL: 'SALARIO',
  SALAR: 'SALARIOS',
  TRANSF: 'TRANSFERENCIA',
  TRF: 'TRANSFERENCIA',
  TED: 'TRANSFERENCIA TED',
  DOC: 'TRANSFERENCIA DOC',
  PIX: 'PIX',
  TAR: 'TARIFA',
  TARIF: 'TARIFA',
  TARIFA: 'TARIFA',
  DEB: 'DEBITO',
  AUT: 'AUTOMATICO',
  AUTO: 'AUTOMATICO',
  AUTOM: 'AUTOMATICO',
  REC: 'RECEBIMENTO',
  RECEB: 'RECEBIMENTO',
  APLIC: 'APLICACAO',
  APLICACAO: 'APLICACAO',
  RESG: 'RESGATE',
  RESGATE: 'RESGATE',
  REND: 'RENDIMENTO',
  RENDIM: 'RENDIMENTO',
  SISPAG: 'SISPAG PAGAMENTOS FORNECEDORES',
  IMPOST: 'IMPOSTO',
  DARF: 'IMPOSTO TRIBUTO DARF',
  GPS: 'IMPOSTO INSS GPS',
  FGTS: 'ENCARGOS FGTS',
  DAS: 'IMPOSTO SIMPLES NACIONAL DAS',
  CONV: 'CONVENIO',
  CONTR: 'CONTRATO',
  PREST: 'PRESTACAO',
  SERV: 'SERVICOS',
  LOC: 'LOCACAO',
  ALUG: 'ALUGUEL',
  MANUT: 'MANUTENCAO',
  COMB: 'COMBUSTIVEL',
  SEG: 'SEGURO',
}

// Sinônimos semânticos e termos do setor para cálculo da Camada 2
const PALAVRAS_CHAVE_CATEGORIAS: Record<string, string[]> = {
  TARIFA: ['TARIFAS', 'DESPESAS BANCARIAS', 'TAXA', 'MANUTENCAO DE CONTA', 'PACOTE SERVICOS'],
  SISPAG: ['DESPESAS C/ FORNECEDORES', 'PAGAMENTO FORNECEDORES', 'OUTROS FORNECEDORES'],
  FOLHA: ['SALARIOS', '13º SALARIO', 'FERIAS', 'FOLHA DE PAGAMENTO', 'PESSOAL'],
  SALARIO: ['SALARIOS', 'ADIANTAMENTO SALARIAL', 'PRO-LABORE', 'RESCISAO'],
  FORNECEDOR: ['DESPESAS C/ FORNECEDORES', 'FORNECEDORES', 'OUTROS FORNECEDORES'],
  ENERGIA: ['ENERGIA ELETRICA', 'LUZ', 'DESPESAS ADMINISTRATIVAS'],
  AGUA: ['AGUA E ESGOTO', 'DESPESAS ADMINISTRATIVAS'],
  INTERNET: ['TELEFONIA', 'COMUNICACAO', 'INTERNET E TELEFONIA'],
  ALUGUEL: ['ALUGUEL E CONDOMINIO', 'LOCACAO DE IMOVEIS', 'CONDOMINIO'],
  IMPOSTO: ['IMPOSTOS E CONTRIBUICOES', 'TRIBUTOS', 'SIMPLES NACIONAL', 'PIS', 'COFINS', 'ISS'],
  FGTS: ['ENCARGOS SOCIAIS', 'FGTS', 'INSS'],
  INSS: ['ENCARGOS SOCIAIS', 'INSS PREVIDENCIA'],
  HONORARIOS: ['HONORARIOS CONTABEIS', 'HONORARIOS ADVOCATICIOS', 'SERVICOS DE TERCEIROS'],
  COMBUSTIVEL: ['COMBUSTIVEIS E LUBRIFICANTES', 'TRANSPORTE'],
  'PIX RECEBIDO': ['RECEITA OPERACIONAL', 'PLANOS / MENSALIDADES', 'RECEITAS'],
  APLICACAO: ['APLICACAO FINANCEIRA', 'INVESTIMENTOS'],
  RESGATE: [
    'RESGATE APLICACAO',
    'RESGATE AUT CONTAMAX EMPRESARIAL',
    'RESGATE APLICACAO AUTOMATICA',
  ],
  JUROS: ['JUROS RECEBIDOS', 'JUROS PAGOS', 'DESPESAS FINANCEIRAS', 'RECEITAS FINANCEIRAS'],
}

/**
 * Normaliza o texto de um extrato ou de uma conta
 * Ex: "PGTO FORNEC NUVEM LTDA" -> "PAGAMENTO FORNECEDOR NUVEM LTDA"
 */
export function normalizarDescricao(texto: string): string {
  if (!texto) return ''

  // 1. Remover acentos e converter para maiúsculo
  let limpo = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()

  // 2. Substituir caracteres não alfanuméricos por espaço, exceto / e -
  limpo = limpo.replace(/[^A-Z0-9\s]/g, ' ')

  // 3. Expandir abreviações conhecidas token a token
  const tokens = limpo.split(/\s+/).filter(Boolean)
  const expandidos = tokens.map((token) => ABREVIACOES_MAP[token] || token)

  return expandidos.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Coeficiente de Dice-Sørensen para similaridade de bigramas (0.0 a 1.0)
 */
export function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = normalizarDescricao(str1).replace(/\s+/g, '')
  const s2 = normalizarDescricao(str2).replace(/\s+/g, '')

  if (!s1 || !s2) return 0
  if (s1 === s2) return 1

  if (s1.length === 1 || s2.length === 1) {
    return s1 === s2 ? 1 : 0
  }

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>()
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2)
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1)
    }
    return bigrams
  }

  const bg1 = getBigrams(s1)
  const bg2 = getBigrams(s2)

  let intersection = 0
  for (const [bg, count1] of bg1.entries()) {
    const count2 = bg2.get(bg) || 0
    intersection += Math.min(count1, count2)
  }

  const total = s1.length - 1 + (s2.length - 1)
  return total > 0 ? (2 * intersection) / total : 0
}

/**
 * Motor de sugestão em 3 camadas:
 * - Camada 1: Dicionário exato ou normalizado (plano_contas_mapping) -> score 100
 * - Camada 2: Similaridade fonética/léxica + palavras-chave com as contas existentes -> sugere as 3 melhores (30% a 95%)
 * - Camada 3: Triagem humana (quando não há sugestão com confiança razoável)
 */
export function sugerirConta(
  descricaoOriginal: string,
  dicionario: DicionarioMapping[],
  planoContas: PlanoContaOption[],
): SugestaoConta[] {
  const descNorm = normalizarDescricao(descricaoOriginal)
  if (!descNorm) return []

  // CAMADA 1: Match exato no dicionário (por texto normalizado ou original)
  const matchDicionario = dicionario.find(
    (d) =>
      d.texto_normalizado === descNorm ||
      normalizarDescricao(d.texto_original) === descNorm ||
      d.texto_original.toUpperCase().trim() === descricaoOriginal.toUpperCase().trim(),
  )

  if (matchDicionario) {
    const conta = planoContas.find((c) => c.id === matchDicionario.id_conta)
    if (conta) {
      return [
        {
          conta_id: conta.id,
          codigo: conta.codigo,
          nome_conta: conta.nome_conta || conta.descricao || 'Conta Sem Nome',
          score: Math.min(100, Math.max(90, Number(matchDicionario.confianca) || 100)),
          camada: 1,
          motivo: 'Regra aprendida do Dicionário (Match Exato)',
        },
      ]
    }
  }

  // CAMADA 2: Similaridade léxica e palavras-chave setoriais
  const pontuacoes: Array<{
    conta: PlanoContaOption
    score: number
    motivo: string
  }> = []

  const tokensDescricao = descNorm.split(/\s+/)

  for (const conta of planoContas) {
    const nomeConta = conta.nome_conta || conta.descricao || ''
    const nomeContaNorm = normalizarDescricao(nomeConta)
    if (!nomeContaNorm) continue

    // 2.1 Similaridade direta de bigramas
    let scoreBase = calcularSimilaridade(descNorm, nomeContaNorm) * 80

    // 2.2 Se o nome da conta estiver contido na descrição ou vice-versa
    if (descNorm.includes(nomeContaNorm) || nomeContaNorm.includes(descNorm)) {
      scoreBase = Math.max(scoreBase, 85)
    }

    // 2.3 Correspondência por palavras-chave do setor
    let bonusPalavraChave = 0
    let matchMotivo = 'Similaridade léxica de termos'

    for (const [termoExtrato, termosContaAlvo] of Object.entries(PALAVRAS_CHAVE_CATEGORIAS)) {
      const temTermoNoExtrato = tokensDescricao.some(
        (t) => t.includes(termoExtrato) || termoExtrato.includes(t),
      )
      if (temTermoNoExtrato) {
        for (const target of termosContaAlvo) {
          const targetNorm = normalizarDescricao(target)
          if (nomeContaNorm.includes(targetNorm) || targetNorm.includes(nomeContaNorm)) {
            bonusPalavraChave = Math.max(bonusPalavraChave, 88)
            matchMotivo = `Regra do setor: ${termoExtrato} → ${target}`
          }
        }
      }
    }

    // 2.4 Token overlap (quantas palavras coincidem)
    const tokensConta = nomeContaNorm.split(/\s+/)
    const commonTokens = tokensDescricao.filter((t) => t.length > 2 && tokensConta.includes(t))
    if (commonTokens.length > 0) {
      const overlapScore = Math.min(80, 50 + commonTokens.length * 15)
      scoreBase = Math.max(scoreBase, overlapScore)
    }

    const finalScore = Math.min(95, Math.round(Math.max(scoreBase, bonusPalavraChave)))

    if (finalScore >= 35) {
      pontuacoes.push({
        conta,
        score: finalScore,
        motivo: bonusPalavraChave > 0 ? matchMotivo : 'Semelhança na descrição com o plano padrão',
      })
    }
  }

  // Ordenar decrescente pelo score
  pontuacoes.sort((a, b) => b.score - a.score)

  const top3 = pontuacoes.slice(0, 3).map((item) => ({
    conta_id: item.conta.id,
    codigo: item.conta.codigo,
    nome_conta: item.conta.nome_conta || item.conta.descricao || 'Conta',
    score: item.score,
    camada: (item.score >= 50 ? 2 : 3) as 2 | 3,
    motivo: item.motivo,
  }))

  return top3
}

/**
 * Gera hash idempotente para deduplicação de lançamentos
 */
export function gerarHashLancamento(
  data: string,
  valor: number,
  descricao: string,
  documentoRef?: string,
): string {
  const norm = `${data}_${Number(valor).toFixed(2)}_${normalizarDescricao(descricao)}_${(documentoRef || '').trim()}`
  let hash = 0
  for (let i = 0; i < norm.length; i++) {
    const char = norm.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Converte para inteiro de 32 bits
  }
  return `dedup_${Math.abs(hash).toString(16)}_${norm.length}`
}
