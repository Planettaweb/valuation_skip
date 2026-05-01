import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { contabilidadeService, Taxonomia } from '@/services/contabilidade'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  taxonomias: Taxonomia[]
  onUpdate: () => void
}

export function TaxonomiaManager({ taxonomias, onUpdate }: Props) {
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('TIPO')
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newValue.trim() || !userProfile?.org_id) return

    try {
      setLoading(true)
      await contabilidadeService.createTaxonomia(userProfile.org_id, activeTab, newValue.trim())
      toast({ title: 'Categoria adicionada com sucesso' })
      setNewValue('')
      onUpdate()
    } catch (err: any) {
      toast({ title: 'Erro ao adicionar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return
    try {
      await contabilidadeService.deleteTaxonomia(id)
      toast({ title: 'Categoria excluída' })
      onUpdate()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const renderList = (categoria: string) => {
    const list = taxonomias.filter((t) => t.categoria === categoria)

    return (
      <div className="space-y-4 h-full flex flex-col mt-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={!newValue.trim() || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </form>

        <ScrollArea className="flex-1 border rounded-md p-4">
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada</p>
          ) : (
            <ul className="space-y-2">
              {list.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border"
                >
                  <span>{item.descricao}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => {
        setActiveTab(val)
        setNewValue('')
      }}
      className="flex flex-col h-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="TIPO">Tipos</TabsTrigger>
        <TabsTrigger value="GRUPO">Grupos</TabsTrigger>
        <TabsTrigger value="NATUREZA">Naturezas</TabsTrigger>
      </TabsList>
      <TabsContent value="TIPO" className="flex-1 mt-0">
        {renderList('TIPO')}
      </TabsContent>
      <TabsContent value="GRUPO" className="flex-1 mt-0">
        {renderList('GRUPO')}
      </TabsContent>
      <TabsContent value="NATUREZA" className="flex-1 mt-0">
        {renderList('NATUREZA')}
      </TabsContent>
    </Tabs>
  )
}
