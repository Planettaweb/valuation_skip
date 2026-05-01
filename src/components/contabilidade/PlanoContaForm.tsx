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
import { PlanoConta } from '@/services/contabilidade'

const schema = z.object({
  codigo: z
    .string()
    .min(1, 'Código é obrigatório')
    .regex(/^[a-zA-Z0-9.]+$/, 'Formato inválido (ex: 1.1.1)'),
  nome_conta: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  tipo: z.enum(['Ativo', 'Passivo', 'Patrimônio Líquido', 'Receita', 'Despesa']),
  grupo: z.enum(['Circulante', 'Não Circulante', 'Operacional', 'Não Operacional']),
  natureza: z.enum(['Devedora', 'Credora']),
})

type FormData = z.infer<typeof schema>

interface Props {
  initialData?: PlanoConta
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

export function PlanoContaForm({ initialData, onSubmit, isLoading }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: initialData?.codigo || '',
      nome_conta: initialData?.nome_conta || '',
      tipo: (initialData?.tipo as any) || 'Ativo',
      grupo: (initialData?.grupo as any) || 'Circulante',
      natureza: (initialData?.natureza as any) || 'Devedora',
    },
  })

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
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Passivo">Passivo</SelectItem>
                  <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
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
                  <SelectItem value="Circulante">Circulante</SelectItem>
                  <SelectItem value="Não Circulante">Não Circulante</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Não Operacional">Não Operacional</SelectItem>
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
                  <SelectItem value="Devedora">Devedora</SelectItem>
                  <SelectItem value="Credora">Credora</SelectItem>
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
