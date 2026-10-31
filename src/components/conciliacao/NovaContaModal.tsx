import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Loader2 } from 'lucide-react'
import { conciliacaoService } from '@/services/conciliacao'
import { toast } from '@/hooks/use-toast'
import { PlanoContaOption } from '@/lib/conciliacao-engine'

interface NovaContaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  clientId: string
  initialNome?: string
  onContaCriada: (conta: PlanoContaOption) => void
}

export function NovaContaModal({
  open,
  onOpenChange,
  orgId,
  clientId,
  initialNome = '',
  onContaCriada,
}: NovaContaModalProps) {
  const [nomeConta, setNomeConta] = useState(initialNome)
  const [codigo, setCodigo] = useState('')
  const [tipo, setTipo] = useState('Despesa')
  const [natureza, setNatureza] = useState('Devedora')
  const [salvando, setSalvando] = useState(false)

  // Atualiza nome inicial caso abra com sugestão
  React.useEffect(() => {
    if (open && initialNome) {
      setNomeConta(initialNome)
    }
  }, [open, initialNome])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeConta.trim()) return

    setSalvando(true)
    try {
      const res = await conciliacaoService.criarContaProvisoria({
        orgId,
        clientId,
        codigo: codigo.trim() || undefined,
        nomeConta: nomeConta.trim(),
        tipo,
        natureza,
      })

      if (res.error || !res.data) {
        throw new Error(res.error || 'Falha ao cadastrar conta')
      }

      toast({
        title: 'Conta Criada no Plano de Contas',
        description: `A conta "${res.data.nome_conta}" agora faz parte do plano e está pronta para conciliação.`,
      })

      onContaCriada(res.data)
      onOpenChange(false)
      setNomeConta('')
      setCodigo('')
    } catch (err: any) {
      toast({
        title: 'Erro ao criar conta',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Nova Conta no Plano de Contas
          </DialogTitle>
          <DialogDescription>
            Crie uma conta específica para atender o lançamento. O plano de contas do cliente nasce
            das confirmações da conciliação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Conta / Descrição</Label>
            <Input
              id="nome"
              placeholder="Ex: SERVIÇOS DE HOSPEDAGEM AWS"
              value={nomeConta}
              onChange={(e) => setNomeConta(e.target.value)}
              className="bg-background/50 uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código (Opcional)</Label>
              <Input
                id="codigo"
                placeholder="Ex: 4.5.12"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Passivo">Passivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Natureza Contábil</Label>
            <Select value={natureza} onValueChange={setNatureza}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Devedora">Devedora (Despesas / Saídas)</SelectItem>
                <SelectItem value="Credora">Credora (Receitas / Entradas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando || !nomeConta.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Salvar Conta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
