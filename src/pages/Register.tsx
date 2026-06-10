import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function Register() {
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            org_name: orgName,
          },
        },
      })

      if (signUpError) {
        toast({
          title: 'Erro ao Registrar',
          description:
            signUpError.message === 'User already registered'
              ? 'Este e-mail já está em uso.'
              : 'Não foi possível criar sua conta no momento. Verifique os dados.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const origin = window.location.origin.includes('preview.goskip.app')
        ? 'https://valuation.planettaweb.com.br'
        : window.location.origin
      const redirectUrl = `${origin}/app`
      const { error, data } = await supabase.functions.invoke('send-reset-password-email', {
        body: {
          email,
          resetLink: redirectUrl,
        },
      })

      if (error || data?.error) {
        toast({
          title: 'Aviso',
          description:
            'Sua conta foi criada, mas houve um erro ao enviar o e-mail de confirmação. Contate o suporte.',
          variant: 'destructive',
        })
        navigate('/login')
      } else {
        // Trigger Edge Function to notify admin
        supabase.functions
          .invoke('notify-admin', { body: { email, orgName, fullName } })
          .catch(console.error)

        toast({
          title: 'Conta Criada',
          description:
            'E-mail de validação enviado. Por favor, verifique sua caixa de entrada para ativar sua conta.',
        })
        navigate('/login')
      }
    } catch (err: any) {
      toast({
        title: 'Erro de Conexão',
        description: 'Ocorreu um erro inesperado ou falha de rede. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden px-4 py-8">
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <Card className="w-full max-w-md z-10 glass-panel border-white/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Criar Conta
          </CardTitle>
          <CardDescription>Registre-se e junte-se ao ecossistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nome da Organização</Label>
              <Input
                id="orgName"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-background/50 border-white/10 text-white"
                placeholder="Ex: Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background/50 border-white/10 text-white"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Profissional</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10 text-white"
                placeholder="nome@empresa.com"
              />
            </div>
            <div className="space-y-2 pb-2">
              <Label htmlFor="password">Senha Segura</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...
                </>
              ) : (
                'Registrar Conta'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
