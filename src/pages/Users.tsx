import { useState } from 'react'
import { ShieldAlert, UserPlus, Mail } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useDataStore from '@/stores/useDataStore'
import useAuthStore from '@/stores/useAuthStore'

export default function Users() {
  const { user } = useAuthStore()
  const { users, addUser } = useDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('Visualizador')

  if (user?.role !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores da organização podem visualizar e gerenciar usuários.
        </p>
      </div>
    )
  }

  const orgUsers = users.filter((u) => u.orgId === user?.orgId)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    addUser({
      id: `usr-${Date.now()}`,
      name: newEmail.split('@')[0], // mock name
      email: newEmail,
      role: newRole,
      orgId: user.orgId,
    })
    setIsOpen(false)
    setNewEmail('')
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrador':
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none">
            Admin
          </Badge>
        )
      case 'Analista':
        return (
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
            Analista
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-white/10 text-white/70 hover:bg-white/20 border-none"
          >
            Visualizador
          </Badge>
        )
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground text-sm">Controle de acesso da sua organização.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" /> Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Convite</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email do Usuário</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="email@exemplo.com"
                    className="pl-9 bg-card/50"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nível de Acesso</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-card/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="Administrador">Administrador (Acesso Total)</SelectItem>
                    <SelectItem value="Analista">Analista (Edição de Docs)</SelectItem>
                    <SelectItem value="Visualizador">Visualizador (Apenas Leitura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-4">
                Enviar Convite
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgUsers.map((u) => (
              <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="font-medium flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {u.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {u.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Ativo
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
