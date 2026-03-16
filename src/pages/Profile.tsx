import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { userSettingsService } from '@/services/user-settings'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Building2, Shield, Upload, Trash2 } from 'lucide-react'

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth()
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    setUploadingAvatar(true)
    const { error, url } = await userSettingsService.uploadAvatar(userProfile.id, file)

    if (error || !url) {
      toast({
        title: 'Erro ao fazer upload',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    } else {
      const { error: updateError } = await userSettingsService.updateProfile(userProfile.id, {
        avatar_url: url,
      })
      if (updateError) {
        toast({ title: 'Erro ao salvar avatar', variant: 'destructive' })
      } else {
        toast({ title: 'Foto atualizada' })
        await refreshProfile()
      }
    }
    setUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    if (!userProfile) return
    setUploadingAvatar(true)
    const { error } = await userSettingsService.updateProfile(userProfile.id, { avatar_url: null })
    if (error) {
      toast({ title: 'Erro ao remover foto', variant: 'destructive' })
    } else {
      toast({ title: 'Foto removida com sucesso' })
      await refreshProfile()
    }
    setUploadingAvatar(false)
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="bg-muted/50 text-muted-foreground"
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
              <CardTitle className="text-lg">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24 border-2 border-border">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Alterar Foto
                </Button>
                {userProfile?.avatar_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remover
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </CardContent>
          </Card>

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
