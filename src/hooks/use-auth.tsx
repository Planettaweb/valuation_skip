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
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  signUp: (email: string, password: string, meta: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
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
          id, email, full_name, org_id, is_active,
          organizations (name),
          users_roles ( roles (name) )
        `)
        .eq('id', userId)
        .single()

      if (data) {
        const roleName = data.users_roles?.[0]?.roles?.name || 'Viewer'
        const orgName = Array.isArray(data.organizations)
          ? data.organizations[0]?.name
          : data.organizations?.name || 'Unknown'
        setUserProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name || '',
          org_id: data.org_id,
          is_active: data.is_active || false,
          role: roleName,
          org_name: orgName,
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, meta: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    })
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    setUserProfile(null)
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, userProfile, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
