import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => Promise<void>
  initialData?: any
}

export function ValuationDialog({ open, onOpenChange, onSave, initialData }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState('Valuation')
  const [sharepoint, setSharepoint] = useState('')
  const [status, setStatus] = useState('Em Andamento')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialData?.valuation_name || '')
      setType(initialData?.valuation_type || 'Valuation')
      setSharepoint(initialData?.sharepoint_folder_path || '')
      setStatus(initialData?.status || 'Em Andamento')
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      valuation_name: name,
      valuation_type: type,
      sharepoint_folder_path: sharepoint,
      status,
    })
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nome do Projeto</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Projeto</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-card/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Valuation">Valuation</SelectItem>
                <SelectItem value="M&A">M&A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-card/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Caminho da Pasta no SharePoint</Label>
            <Input
              value={sharepoint}
              onChange={(e) => setSharepoint(e.target.value)}
              placeholder="https://sharepoint.com/.../Pasta"
              className="bg-card/50"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? 'Salvando...' : 'Salvar Projeto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
