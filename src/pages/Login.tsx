import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      toast({ title: 'Erro de Autenticação', description: error.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md z-10 glass-panel border-white/10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <CardHeader className="space-y-3 text-center pb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center border border-primary/30 mb-2">
            <div className="w-6 h-6 bg-primary rounded-full animate-pulse-glow" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Bem-vindo</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Acesse o ecossistema financeiro Nearbound
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email Profissional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-muted-foreground">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-11"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4">
              Não possui uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Criar conta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
