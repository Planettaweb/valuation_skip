import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Activity } from 'lucide-react'
import { OrbitalEcosystem } from '@/components/OrbitalEcosystem'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [docCount, setDocCount] = useState(0)
  const [userCount, setUserCount] = useState(0)

  const fetchData = async () => {
    if (!userProfile) return
    const { count: docs } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userProfile.org_id)
    const { count: users } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userProfile.org_id)
    setDocCount(docs || 0)
    setUserCount(users || 0)
  }

  useEffect(() => {
    fetchData()
  }, [userProfile])

  useEffect(() => {
    if (!userProfile) return
    const channel = supabase
      .channel('realtime_documents')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'documents',
          filter: `org_id=eq.${userProfile.org_id}`,
        },
        (payload) => {
          toast({
            title: 'Novo Documento',
            description: `Um novo documento "${payload.new.filename}" foi adicionado na sua organização.`,
          })
          fetchData()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile, toast])

  return (
    <div className="flex flex-col gap-12 max-w-6xl mx-auto w-full animate-fade-in">
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

      <div className="w-full relative">
        <OrbitalEcosystem />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Documentos
            </CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{docCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Armazenamento seguro</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membros da Organização
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Nível de engajamento ativo</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status do Sistema
            </CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mt-1 text-emerald-400">Operacional</div>
            <p className="text-xs text-muted-foreground mt-2 truncate">
              Monitoramento em tempo real ativo
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
