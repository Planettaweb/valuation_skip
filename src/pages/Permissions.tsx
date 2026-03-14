import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminService } from '@/services/admin'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShieldCheck } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

export default function Permissions() {
  const [searchParams] = useSearchParams()
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission('permissions', 'update')

  const [roles, setRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState(searchParams.get('roleId') || '')
  const [permissions, setPermissions] = useState<any[]>([])
  const [rolePerms, setRolePerms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      const [rRes, pRes] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions(),
      ])
      if (rRes.data) setRoles(rRes.data)
      if (pRes.data) setPermissions(pRes.data)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      adminService.getRolePermissions(selectedRole).then((res) => {
        if (res.data) setRolePerms(res.data)
      })
    } else {
      setRolePerms([])
    }
  }, [selectedRole])

  const groupedPerms = permissions.reduce(
    (acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = []
      acc[p.resource].push(p)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const isAllowed = (permId: string) => {
    const rp = rolePerms.find((r) => r.permission_id === permId)
    return rp ? rp.allowed : false
  }

  const handleToggle = async (permId: string) => {
    if (!selectedRole || !canUpdate) return
    const current = isAllowed(permId)
    const newAllowed = !current

    // Optimistic UI Update
    setRolePerms((prev) => {
      const exists = prev.find((r) => r.permission_id === permId)
      if (exists)
        return prev.map((r) => (r.permission_id === permId ? { ...r, allowed: newAllowed } : r))
      return [...prev, { role_id: selectedRole, permission_id: permId, allowed: newAllowed }]
    })

    const { error } = await adminService.setRolePermission(selectedRole, permId, newAllowed)
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar permissão.', variant: 'destructive' })
      // Revert optimism if failed
      setRolePerms((prev) => {
        const exists = prev.find((r) => r.permission_id === permId)
        if (exists)
          return prev.map((r) => (r.permission_id === permId ? { ...r, allowed: current } : r))
        return prev.filter((r) => r.permission_id !== permId)
      })
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Matriz de Permissões</h2>
          <p className="text-muted-foreground text-sm">
            Associe permissões de acesso aos perfis do sistema.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="bg-card/50 border-white/10 h-11">
              <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Selecione um perfil..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !selectedRole ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-card/10">
          <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-2">Selecione um Perfil</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            Escolha um perfil no menu acima para visualizar e editar suas permissões detalhadas no
            sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedPerms).map(([resource, perms]) => (
            <Card
              key={resource}
              className="glass-panel border-white/5 bg-card/30 hover:bg-card/40 transition-colors"
            >
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg capitalize text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {resource}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <Label
                      className="text-sm font-medium text-muted-foreground hover:text-white transition-colors cursor-pointer"
                      onClick={() => handleToggle(p.id)}
                    >
                      {p.action}
                    </Label>
                    <Switch
                      checked={isAllowed(p.id)}
                      onCheckedChange={() => handleToggle(p.id)}
                      disabled={!canUpdate}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
