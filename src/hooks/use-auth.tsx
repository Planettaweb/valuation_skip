import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  org_id: string
  is_active: boolean
  role: string
  org_name: string
  permissions: string[]
  avatar_url?: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  signUp: (email: string, password: string, meta: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, email, full_name, org_id, is_active, avatar_url,
          organizations (name),
          users_roles ( 
            roles (
              name,
              role_permissions (
                allowed,
                permissions ( action, resource )
              )
            ) 
          )
        `)
        .eq('id', userId)
        .single()

      if (data) {
        const roleName = data.users_roles?.[0]?.roles?.name || 'Viewer'
        const orgName = Array.isArray(data.organizations)
          ? data.organizations[0]?.name
          : data.organizations?.name || 'Unknown'

        const perms = new Set<string>()
        data.users_roles?.forEach((ur: any) => {
          ur.roles?.role_permissions?.forEach((rp: any) => {
            if (rp.allowed && rp.permissions) {
              perms.add(`${rp.permissions.resource}:${rp.permissions.action}`)
            }
          })
        })

        setUserProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name || '',
          org_id: data.org_id,
          is_active: data.is_active || false,
          role: roleName,
          org_name: orgName,
          permissions: Array.from(perms),
          avatar_url: data.avatar_url,
        })
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
  }

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      if (session) {
        setSession(session)
        setUser(session.user)
        // Prevent clearing existing profile or causing refetch loops on token refresh
        setUserProfile((prev) => {
          if (!prev || prev.id !== session.user.id) {
            fetchProfile(session.user.id)
          }
          return prev
        })
      } else if (event === 'INITIAL_SESSION') {
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      if (error || !session) {
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session.user)
      fetchProfile(session.user.id)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, meta: any) => {
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
      })
    } catch (error: any) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      return await supabase.auth.signInWithPassword({ email, password })
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = async () => {
    setUserProfile(null)
    try {
      return await supabase.auth.signOut()
    } catch (error: any) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    } catch (error: any) {
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      return await supabase.auth.updateUser({ password })
    } catch (error: any) {
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
