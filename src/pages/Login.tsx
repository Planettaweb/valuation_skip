import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock successful login
    login({
      id: 'user-1',
      name: 'Admin Demo',
      email: email || 'admin@demo.com',
      role: 'Administrador',
      orgId: 'org-1',
      orgName: 'EcoFin Corp',
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden px-4">
      {/* Ambient background glows */}
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
                <Link
                  to="#"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-11"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
            >
              Entrar no Sistema
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4">
              Não possui uma organização?{' '}
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
