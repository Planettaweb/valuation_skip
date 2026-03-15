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

const PAGE_SIZE = 10

export function ExtractedDataView({
  data,
  type,
  isDynamic,
}: {
  data: any[]
  type: string
  isDynamic?: boolean
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

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum dado extraído.</p>
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

    if (type === 'Balanço Patrimonial') {
      return (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ano N</TableHead>
              <TableHead className="text-right">Ano N-1</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.classification_code}
                className="border-white/5 hover:bg-white/5"
              >
                <TableCell className="text-muted-foreground">{r.classification_code}</TableCell>
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.value_year_n)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.value_year_n_minus_1)}
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
              <TableRow key={r.id || r.description} className="border-white/5 hover:bg-white/5">
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
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Saldo Anterior</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow
                key={r.id || r.classification_code}
                className="border-white/5 hover:bg-white/5"
              >
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
              <TableHead>Período</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((r) => (
              <TableRow key={r.id || r.description} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-muted-foreground">{r.period}</TableCell>
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell
                  className={cn('text-right', r.value < 0 ? 'text-red-400' : 'text-emerald-400')}
                >
                  {formatCurrency(r.value)}
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
