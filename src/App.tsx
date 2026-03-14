import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { Loader2 } from 'lucide-react'

import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Documents from './pages/Documents'
import Users from './pages/Users'
import NotFound from './pages/NotFound'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />
  }

  if (!userProfile.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background bg-grid-pattern relative p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="glass-panel p-8 max-w-md w-full text-center border-white/10 z-10">
          <h1 className="text-2xl font-bold text-white mb-2">Aprovação Pendente</h1>
          <p className="text-muted-foreground mb-6">
            Sua conta está aguardando aprovação do administrador.
          </p>
          <button
            onClick={async () => {
              await signOut()
            }}
            className="text-primary hover:underline text-sm font-medium"
          >
            Sair e Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Public Route Wrapper
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  if (userProfile) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />

    <Route path="/reset-password" element={<ResetPassword />} />

    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/users" element={<Users />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
