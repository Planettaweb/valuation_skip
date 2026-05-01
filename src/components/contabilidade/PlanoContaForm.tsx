import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PlanoConta, Taxonomia } from '@/services/contabilidade'

const schema = z.object({
  codigo: z
    .string()
    .min(1, 'Código é obrigatório')
    .regex(/^[a-zA-Z0-9.]+$/, 'Formato inválido (ex: 1.1.1)'),
  nome_conta: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  grupo: z.string().min(1, 'Grupo é obrigatório'),
  natureza: z.string().min(1, 'Natureza é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface Props {
  initialData?: PlanoConta
  onSubmit: (data: FormData) => void
  isLoading?: boolean
  taxonomias?: Taxonomia[]
}

export function PlanoContaForm({ initialData, onSubmit, isLoading, taxonomias = [] }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: initialData?.codigo || '',
      nome_conta: initialData?.nome_conta || '',
      tipo: initialData?.tipo || '',
      grupo: initialData?.grupo || '',
      natureza: initialData?.natureza || '',
    },
  })

  const tipos = taxonomias.filter((t) => t.categoria === 'TIPO').map((t) => t.descricao)
  const grupos = taxonomias.filter((t) => t.categoria === 'GRUPO').map((t) => t.descricao)
  const naturezas = taxonomias.filter((t) => t.categoria === 'NATUREZA').map((t) => t.descricao)

  // Ensure initial data values exist in options to avoid select being blank
  if (initialData?.tipo && !tipos.includes(initialData.tipo)) tipos.push(initialData.tipo)
  if (initialData?.grupo && !grupos.includes(initialData.grupo)) grupos.push(initialData.grupo)
  if (initialData?.natureza && !naturezas.includes(initialData.natureza))
    naturezas.push(initialData.natureza)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 1.1.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nome_conta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caixa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grupo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="natureza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Natureza</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {naturezas.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Form>
  )
}
