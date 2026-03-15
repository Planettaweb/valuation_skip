import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Completed':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
          Concluído
        </Badge>
      )
    case 'Processing':
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 transition-colors">
          Processando
        </Badge>
      )
    case 'Error':
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 transition-colors">
          Erro
        </Badge>
      )
    case 'Uploaded':
      return (
        <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20 transition-colors">
          Na Fila
        </Badge>
      )
    default:
      return (
        <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20 transition-colors">
          {status}
        </Badge>
      )
  }
}
