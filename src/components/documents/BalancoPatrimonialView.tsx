import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { AccountSelectModal } from '@/components/shared/AccountSelectModal'
import { cn } from '@/lib/utils'

export function BalancoPatrimonialView({ bp, data }: { bp: any; data: any[] }) {
  const { userProfile } = useAuth()
  const [mappings, setMappings] = useState<Record<string, string>>({})

  const formatCurrency = (val: any) => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }
    return val
  }

  const handleMapAccount = (rowId: string, accountId: string) => {
    setMappings((prev) => ({ ...prev, [rowId]: accountId }))
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-card/20 animate-fade-in flex-1">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent bg-black/40">
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Ano atual</TableHead>
            <TableHead className="text-right">Ano anterior</TableHead>
            <TableHead className="w-[300px]">Mapear com Conta do Cliente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r, idx) => {
            const rowId = r.id || String(idx)
            return (
              <TableRow key={rowId} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {r.account_code || '-'}
                </TableCell>
                <TableCell className="font-medium">{r.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn((r.value_year_n || 0) < 0 && 'text-red-400')}>
                      {formatCurrency(r.value_year_n)}
                    </span>
                    {r.nature_year_n && (
                      <Badge
                        variant="outline"
                        className="px-1.5 min-w-[24px] justify-center text-muted-foreground border-white/20 text-[10px]"
                      >
                        {r.nature_year_n}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn((r.value_year_n_minus_1 || 0) < 0 && 'text-red-400')}>
                      {formatCurrency(r.value_year_n_minus_1)}
                    </span>
                    {r.nature_year_n_minus_1 && (
                      <Badge
                        variant="outline"
                        className="px-1.5 min-w-[24px] justify-center text-muted-foreground border-white/20 text-[10px]"
                      >
                        {r.nature_year_n_minus_1}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  {userProfile?.org_id ? (
                    <AccountSelectModal
                      orgId={userProfile.org_id}
                      value={mappings[rowId] || null}
                      onChange={(val) => handleMapAccount(rowId, val)}
                      placeholder="Mapear com Conta..."
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">Indisponível</div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
