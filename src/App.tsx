import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { AdminRoute } from './components/admin/AdminRoute'
import { ThemeProvider } from './components/theme-provider'

import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Documents from './pages/Documents'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import Users from './pages/Users'
import Organizations from './pages/Organizations'
import Roles from './pages/Roles'
import Permissions from './pages/Permissions'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import PlanoContas from './pages/PlanoContas'
import TiposDocumentos from './pages/TiposDocumentos'
import MatrizRelacionamento from './pages/MatrizRelacionamento'
import NotFound from './pages/NotFound'
import LandingPage from './pages/LandingPage'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
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
        <div className="glass-panel p-8 max-w-md w-full text-center border-border z-10">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aprovação Pendente</h1>
          <p className="text-muted-foreground mb-6">
            Seu perfil está sendo avaliado pelo administrador. Você será notificado quando seu
            acesso for liberado.
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  if (userProfile) return <Navigate to="/app" replace />
  return <>{children}</>
}

const LegacyRedirect = () => {
  const location = useLocation()
  return <Navigate to={`/app${location.pathname}${location.search}${location.hash}`} replace />
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

    <Route path="/" element={<LandingPage />} />

    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Index />} />
      <Route path="clients" element={<Clients />} />
      <Route path="clients/:clientId" element={<ClientDetails />} />
      <Route path="documents" element={<Documents />} />
      <Route path="plano-contas" element={<PlanoContas />} />
      <Route path="tipos-documentos" element={<TiposDocumentos />} />
      <Route path="matriz-relacionamento" element={<MatrizRelacionamento />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />

      {/* Admin Module Routes */}
      <Route element={<AdminRoute />}>
        <Route path="users" element={<Users />} />
        <Route path="organizations" element={<Organizations />} />
        <Route path="roles" element={<Roles />} />
        <Route path="permissions" element={<Permissions />} />
      </Route>
    </Route>

    {/* Legacy Route Redirects */}
    <Route path="/clients/*" element={<LegacyRedirect />} />
    <Route path="/documents/*" element={<LegacyRedirect />} />
    <Route path="/plano-contas/*" element={<LegacyRedirect />} />
    <Route path="/tipos-documentos/*" element={<LegacyRedirect />} />
    <Route path="/matriz-relacionamento/*" element={<LegacyRedirect />} />
    <Route path="/profile/*" element={<LegacyRedirect />} />
    <Route path="/settings/*" element={<LegacyRedirect />} />
    <Route path="/users/*" element={<LegacyRedirect />} />
    <Route path="/organizations/*" element={<LegacyRedirect />} />
    <Route path="/roles/*" element={<LegacyRedirect />} />
    <Route path="/permissions/*" element={<LegacyRedirect />} />
    <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
)

export default App
