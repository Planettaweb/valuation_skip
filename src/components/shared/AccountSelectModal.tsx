import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, Check, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function AccountSelectModal({
  orgId,
  value,
  onChange,
  disabled,
  placeholder = 'Selecione uma conta...',
}: {
  orgId: string
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAccountName, setSelectedAccountName] = useState<string>('')

  useEffect(() => {
    if (open && accounts.length === 0) {
      loadAccounts()
    }
  }, [open, orgId])

  useEffect(() => {
    if (value && accounts.length > 0) {
      const acc = accounts.find((a) => a.id === value)
      if (acc) setSelectedAccountName(`${acc.codigo || ''} - ${acc.nome_conta}`)
    } else if (value) {
      supabase
        .from('plano_contas')
        .select('codigo, nome_conta')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) setSelectedAccountName(`${data.codigo || ''} - ${data.nome_conta}`)
        })
    } else {
      setSelectedAccountName('')
    }
  }, [value, accounts])

  const loadAccounts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('plano_contas')
      .select('*')
      .eq('org_id', orgId)
      .eq('ativo', true)
      .order('codigo', { ascending: true })

    if (data) setAccounts(data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search) return accounts
    const s = search.toLowerCase()
    return accounts.filter(
      (a) =>
        (a.nome_conta && a.nome_conta.toLowerCase().includes(s)) ||
        (a.codigo && a.codigo.toLowerCase().includes(s)),
    )
  }, [accounts, search])

  return (
    <>
      <div className="relative w-full group" onClick={() => !disabled && setOpen(true)}>
        <Input
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          value={selectedAccountName}
          className={cn(
            'cursor-pointer pr-10 text-sm truncate',
            !disabled && 'hover:border-primary/50 focus:border-primary',
            value && 'text-emerald-400 font-medium border-emerald-400/30',
          )}
        />
        <ExternalLink className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 glass-panel border-white/10">
          <DialogHeader className="p-6 pb-4 border-b border-white/5">
            <DialogTitle>Selecionar Conta do Cliente</DialogTitle>
            <DialogDescription>
              Pesquise e selecione a conta correspondente no plano de contas.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-4 flex-1 flex flex-col min-h-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por código ou nome..."
                className="pl-9 bg-black/20 border-white/10 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto rounded-md border border-white/5 bg-black/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm">Carregando plano de contas...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
                  Nenhuma conta encontrada.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filtered.map((acc) => (
                    <Button
                      key={acc.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start font-normal h-auto py-3 px-4 hover:bg-primary/20 transition-all',
                        value === acc.id &&
                          'bg-primary/20 text-primary border border-primary/20 shadow-sm',
                      )}
                      onClick={() => {
                        onChange(acc.id)
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0 text-primary transition-opacity',
                            value === acc.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="font-medium truncate w-full text-left">
                            {acc.nome_conta}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {acc.codigo}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
