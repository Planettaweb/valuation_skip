import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, KeyRound } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Handle error from URL hash (e.g., token expired or invalid)
    const hash = location.hash || window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const errorDesc = params.get('error_description')
      if (errorDesc) {
        toast({
          title: 'Link Inválido',
          description:
            'O link de recuperação de senha é inválido ou expirou. Por favor, solicite um novo.',
          variant: 'destructive',
        })
        navigate('/forgot-password')
      }
    }
  }, [location, navigate, toast])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'Por favor, verifique se as duas senhas são idênticas.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        let msg = error.message
        if (msg.includes('New password should be different')) {
          msg = 'A nova senha deve ser diferente da atual.'
        }
        toast({ title: 'Erro ao redefinir', description: msg, variant: 'destructive' })
      } else {
        toast({
          title: 'Senha atualizada',
          description: 'Senha alterada com sucesso! Você já pode realizar o login.',
        })
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um problema ao conectar com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md z-10 glass-panel border-white/10 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <CardHeader className="space-y-3 text-center pb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center border border-primary/30 mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Nova Senha</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Crie uma nova senha segura para sua conta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  Nova Senha
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-11"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
