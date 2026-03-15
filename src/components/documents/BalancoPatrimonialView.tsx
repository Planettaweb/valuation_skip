import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useState, useMemo } from 'react'

const PAGE_SIZE = 10

export function BalancoPatrimonialView({ bp, data }: { bp: any; data: any[] }) {
  const [page, setPage] = useState(1)

  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }
    return val
  }

  const totalPages = Math.ceil((data?.length || 0) / PAGE_SIZE)
  const currentData = useMemo(() => {
    if (!data) return []
    return data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [data, page])

  const yearN = currentData[0]?.year_n || bp?.cabecalho?.year_n || 'Exercício Atual'
  const yearN1 =
    currentData[0]?.year_n_minus_1 || bp?.cabecalho?.year_n_minus_1 || 'Exercício Anterior'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-white/10 rounded-lg bg-card/30">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            Informações da Empresa
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Empresa:</span> {bp.cabecalho.empresa}
            </p>
            <p>
              <span className="text-muted-foreground">CNPJ:</span> {bp.cabecalho.cnpj}
            </p>
            <p>
              <span className="text-muted-foreground">Insc. Junta Comercial:</span>{' '}
              {bp.cabecalho.inscricao_junta_comercial}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            Detalhes do Documento
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Período:</span> {bp.cabecalho.data_abertura} a{' '}
              {bp.cabecalho.data_encerramento_balanco}
            </p>
            <p>
              <span className="text-muted-foreground">Emissão:</span> {bp.cabecalho.data_emissao} às{' '}
              {bp.cabecalho.hora_emissao}
            </p>
            <p>
              <span className="text-muted-foreground">Livro / Folha:</span>{' '}
              {bp.cabecalho.numero_livro} / {bp.cabecalho.folha}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-white/5">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Código</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">{yearN}</TableHead>
              <TableHead className="text-center w-[50px]">Nat.</TableHead>
              <TableHead className="text-right">{yearN1}</TableHead>
              <TableHead className="text-center w-[50px]">Nat.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r: any, idx: number) => (
              <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-muted-foreground">
                  {r.codigo || r.classification_code}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.classificacao || r.classification_code}
                </TableCell>
                <TableCell className="font-medium">{r.descricao || r.description}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.valor_exercicio_atual ?? r.value_year_n)}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {r.natureza_exercicio_atual ?? r.nature_year_n ?? '-'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.valor_exercicio_anterior ?? r.value_year_n_minus_1)}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {r.natureza_exercicio_anterior ?? r.nature_year_n_minus_1 ?? '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground px-4">
                Página {page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {bp.declaracao_final && (
        <div className="p-4 border border-white/10 rounded-lg bg-card/30 space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Declaração Final</h4>
          <p className="text-sm italic text-muted-foreground">
            "{bp.declaracao_final.texto_reconhecimento}"
          </p>
          <div className="flex justify-between items-center text-sm">
            <p>
              <span className="text-muted-foreground">Total Ativo/Passivo:</span>{' '}
              <span className="font-semibold text-emerald-400">
                {formatCurrency(bp.declaracao_final.valor_total_ativo_passivo)}
              </span>
            </p>
            <p className="text-muted-foreground">{bp.declaracao_final.local_data}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
            {bp.declaracao_final.assinaturas?.map((ass: any, i: number) => (
              <div key={i} className="text-sm">
                <p className="font-medium">{ass.nome}</p>
                <p className="text-muted-foreground">{ass.cargo}</p>
                <p className="text-xs text-muted-foreground">
                  CPF: {ass.cpf} {ass.registro_conselho ? `| Reg: ${ass.registro_conselho}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
