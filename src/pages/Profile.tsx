import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { userSettingsService } from '@/services/user-settings'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Building2, Shield } from 'lucide-react'

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '')
    }
  }, [userProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setLoading(true)
    const { error } = await userSettingsService.updateProfile(userProfile.id, {
      full_name: fullName,
    })

    if (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      })
      await refreshProfile()
    }
    setLoading(false)
  }

  if (!userProfile) return null

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie suas informações pessoais e detalhes da conta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl">Informações Pessoais</CardTitle>
              <CardDescription>Atualize seu nome e confira seu e-mail de acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O e-mail não pode ser alterado por aqui.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !fullName.trim()}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Organização e Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Organização</p>
                  <p className="text-sm text-muted-foreground">{userProfile.org_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Perfil de Acesso</p>
                  <p className="text-sm text-muted-foreground">{userProfile.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
