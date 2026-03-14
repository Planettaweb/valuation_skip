import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'

export default function Register() {
  const [orgName, setOrgName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock successful registration and login
    login({
      id: `user-${Date.now()}`,
      name: adminName,
      email: email,
      role: 'Administrador',
      orgId: `org-${Date.now()}`,
      orgName: orgName,
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden px-4">
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <Card className="w-full max-w-md z-10 glass-panel border-white/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Criar Organização
          </CardTitle>
          <CardDescription>Registre sua empresa no Nearbound 2.0</CardDescription>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Nome do Administrador</Label>
              <Input
                id="adminName"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="bg-background/50 border-white/10 text-white"
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
              />
            </div>
            <div className="space-y-2 pb-2">
              <Label htmlFor="password">Senha Segura</Label>
              <Input
                id="password"
                type="password"
                required
                className="bg-background/50 border-white/10 text-white"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
              Registrar Organização
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
