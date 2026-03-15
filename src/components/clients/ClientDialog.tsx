import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => Promise<void>
  initialData?: any
}

export function ClientDialog({ open, onOpenChange, onSave, initialData }: Props) {
  const [name, setName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialData?.client_name || '')
      setCnpj(initialData?.cnpj || '')
      setIndustry(initialData?.industry || '')
    }
  }, [open, initialData])

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({ client_name: name, cnpj, industry })
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card/50"
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="bg-card/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Setor / Indústria</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-card/50"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
