import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Activity } from 'lucide-react'
import { OrbitalEcosystem } from '@/components/OrbitalEcosystem'
import useDataStore from '@/stores/useDataStore'
import useAuthStore from '@/stores/useAuthStore'

export default function Index() {
  const { documents, users } = useDataStore()
  const { user } = useAuthStore()

  const orgDocs = documents.filter((d) => d.orgId === user?.orgId)
  const orgUsers = users.filter((u) => u.orgId === user?.orgId)

  return (
    <div className="flex flex-col gap-12 max-w-6xl mx-auto w-full animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-8">
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1"
        >
          <RocketIcon className="w-3 h-3 mr-2 inline" /> Sell to a global ecosystem
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Introducing <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-300 ml-2">
            Nearbound 2.0
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Welcome to Nearbound 2.0, where businesses can connect, and sell to a global ecosystem. We
          bring together the efficiency of digital automation with the impact of face-to-face
          interactions.
        </p>
      </div>

      {/* Orbital Visualization */}
      <div className="w-full relative">
        <OrbitalEcosystem />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Documentos
            </CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orgDocs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">+2 nesta semana</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membros Ativos
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orgUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Nível de engajamento alto</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Atividade
            </CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-1 text-white/90">Há 2 horas</div>
            <p className="text-xs text-muted-foreground mt-2 truncate">
              Upload de: Relatorio_Financeiro...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}
