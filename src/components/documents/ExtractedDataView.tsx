import { useState, useMemo } from 'react'
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
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BalancoPatrimonialView } from './BalancoPatrimonialView'

const PAGE_SIZE = 10

export function ExtractedDataView({
  data,
  type,
  isDynamic,
  rawMetadata,
}: {
  data: any[]
  type: string
  isDynamic?: boolean
  rawMetadata?: any
}) {
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

  if (rawMetadata?.balanco_patrimonial && (type === 'Balanço' || type === 'Balanço Patrimonial')) {
    return <BalancoPatrimonialView bp={rawMetadata.balanco_patrimonial} data={data} />
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum dado encontrado para este documento.
      </p>
    )
  }

  const renderTable = () => {
    if (isDynamic) {
      const allKeys = Array.from(new Set(data.flatMap((row) => Object.keys(row))))
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              {allKeys.map((key) => (
                <TableHead
                  key={key}
                  className="capitalize font-medium text-muted-foreground whitespace-nowrap"
                >
                  {key.replace(/_/g, ' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((row, idx) => (
              <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                {allKeys.map((key) => {
                  const val = row[key]
                  const isNum = typeof val === 'number'
                  return (
                    <TableCell key={key} className={isNum ? 'text-right font-mono' : ''}>
                      {isNum ? formatCurrency(val) : String(val ?? '-')}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (type === 'Balanço' || type === 'Balanço Patrimonial') {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Código</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ano atual</TableHead>
              <TableHead className="text-right">Ano anterior</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.classification_code || Math.random()}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell className="text-muted-foreground">{r.account_code}</TableCell>
                <TableCell className="text-muted-foreground">{r.classification_code}</TableCell>
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{formatCurrency(r.value_year_n)}</span>
                    {r.nature_year_n && (
                      <Badge
                        variant="outline"
                        className="px-1.5 min-w-6 justify-center text-muted-foreground border-white/20"
                      >
                        {r.nature_year_n}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{formatCurrency(r.value_year_n_minus_1)}</span>
                    {r.nature_year_n_minus_1 && (
                      <Badge
                        variant="outline"
                        className="px-1.5 min-w-6 justify-center text-muted-foreground border-white/20"
                      >
                        {r.nature_year_n_minus_1}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (type === 'DRE') {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Soma</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.description || Math.random()}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.balance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.sum)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (type === 'Balancete') {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Código</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Descrição da conta</TableHead>
              <TableHead className="text-right">Saldo Anterior</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.classification_code || Math.random()}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell className="text-muted-foreground">{r.account_code}</TableCell>
                <TableCell className="text-muted-foreground">{r.classification_code}</TableCell>
                <TableCell className="font-medium">{r.account_description}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.previous_balance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.debit)}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.credit)}</TableCell>
                <TableCell className="text-right font-medium text-emerald-400">
                  {formatCurrency(r.current_balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (type === 'Fluxo de Caixa') {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Descrição</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Valor planejado</TableHead>
              <TableHead className="text-right">Valor realizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.description || Math.random()}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell className="text-muted-foreground">{r.period}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(r.planned_value)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium',
                    (r.realized_value || r.value) < 0 ? 'text-red-400' : 'text-emerald-400',
                  )}
                >
                  {formatCurrency(r.realized_value || r.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    return (
      <p className="text-center text-muted-foreground py-8">Modelo de dados não reconhecido.</p>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="overflow-x-auto rounded-md border border-white/5">{renderTable()}</div>

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
    </div>
  )
}
