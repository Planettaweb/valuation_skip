import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'
import { userSettingsService } from '@/services/user-settings'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Moon, Sun, Monitor, ShieldAlert, KeyRound, Activity } from 'lucide-react'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { userProfile, updatePassword } = useAuth()
  const { toast } = useToast()

  const [loading2FA, setLoading2FA] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  const [lastLogin, setLastLogin] = useState<string | null>(null)

  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' })
  const [loadingPass, setLoadingPass] = useState(false)

  useEffect(() => {
    if (userProfile) {
      loadSecurityData()
    }
  }, [userProfile])

  const loadSecurityData = async () => {
    if (!userProfile) return
    const [tfaRes, sessionRes] = await Promise.all([
      userSettingsService.get2FAStatus(userProfile.id),
      userSettingsService.getSessionOverview(userProfile.id),
    ])
    if (tfaRes.data) {
      setIs2FAEnabled(tfaRes.data.is_enabled || false)
    }
    if (sessionRes.data) {
      setLastLogin(sessionRes.data.last_login)
    }
  }

  const handleToggle2FA = async (checked: boolean) => {
    if (!userProfile) return
    setLoading2FA(true)
    if (checked) {
      const { error } = await userSettingsService.enable2FA(userProfile.id, userProfile.org_id)
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      } else {
        toast({
          title: '2FA Ativado',
          description: 'Autenticação de dois fatores ativada com sucesso.',
        })
        setIs2FAEnabled(true)
      }
    } else {
      const { error } = await userSettingsService.disable2FA(userProfile.id)
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      } else {
        toast({
          title: '2FA Desativado',
          description: 'Autenticação de dois fatores foi desativada.',
        })
        setIs2FAEnabled(false)
      }
    }
    setLoading2FA(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPass.length < 6) {
      return toast({
        title: 'Senha muito curta',
        description: 'Mínimo de 6 caracteres.',
        variant: 'destructive',
      })
    }
    if (passForm.newPass !== passForm.confirmPass) {
      return toast({
        title: 'Senhas incompatíveis',
        description: 'A confirmação deve ser igual à nova senha.',
        variant: 'destructive',
      })
    }

    setLoadingPass(true)
    const { error } = await updatePassword(passForm.newPass)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Senha atualizada', description: 'Sua senha foi alterada com sucesso.' })
      setPassForm({ newPass: '', confirmPass: '' })
    }
    setLoadingPass(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground text-sm">
          Gerencie preferências de interface e segurança da sua conta.
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl">Tema da Interface</CardTitle>
              <CardDescription>Escolha como o sistema será exibido para você.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  <Sun className="w-8 h-8 mb-2" />
                  <span className="font-medium">Claro</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  <Moon className="w-8 h-8 mb-2" />
                  <span className="font-medium">Escuro</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    theme === 'system'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  <Monitor className="w-8 h-8 mb-2" />
                  <span className="font-medium">Sistema</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    Autenticação de Dois Fatores (2FA)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Adicione uma camada extra de segurança à sua conta.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {loading2FA && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Switch
                    checked={is2FAEnabled}
                    onCheckedChange={handleToggle2FA}
                    disabled={loading2FA}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha de acesso periodicamente para manter sua conta segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="newPass">Nova Senha</Label>
                  <Input
                    id="newPass"
                    type="password"
                    placeholder="••••••••"
                    value={passForm.newPass}
                    onChange={(e) => setPassForm((p) => ({ ...p, newPass: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    placeholder="••••••••"
                    value={passForm.confirmPass}
                    onChange={(e) => setPassForm((p) => ({ ...p, confirmPass: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={loadingPass || !passForm.newPass}>
                  {loadingPass ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando...
                    </>
                  ) : (
                    'Atualizar Senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Atividade da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">Último Login</span>
                <span className="text-sm text-muted-foreground">
                  {lastLogin
                    ? new Date(lastLogin).toLocaleString()
                    : 'Nenhuma atividade recente registrada.'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
