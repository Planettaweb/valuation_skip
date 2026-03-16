import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        let msg = error.message
        if (msg.toLowerCase().includes('user not found')) {
          msg = 'Não encontramos nenhuma conta vinculada a este e-mail.'
        }
        toast({ title: 'Erro ao enviar link', description: msg, variant: 'destructive' })
      } else {
        toast({
          title: 'Email enviado',
          description:
            'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.',
        })
        setEmail('')
      }
    } catch (err) {
      toast({
        title: 'Erro de Conexão',
        description: 'Ocorreu um erro ao conectar ao sistema. Tente novamente mais tarde.',
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
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Insira seu e-mail para receber um link de redefinição
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-6">
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

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>

            <div className="text-center pt-4">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
