import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ShieldAlert } from 'lucide-react'

export const AdminRoute = () => {
  const { userProfile, loading } = useAuth()

  if (loading) return null

  if (userProfile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores do sistema podem acessar esta área.
        </p>
      </div>
    )
  }

  return <Outlet />
}
