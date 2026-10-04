import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  role?: string
}

interface AuthContextType {
  session: any
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>
  signInDemo: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: 'Authentication is unavailable.' }),
  signInDemo: async () => {},
  signOut: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const demoAuth = localStorage.getItem('math_diag_demo_auth') === 'true'
      if (demoAuth) {
        setSession({ user: { id: 'demo-admin-id', email: 'malakamr7400@gmail.com' } })
        setProfile({
          id: 'demo-admin-id',
          email: 'malakamr7400@gmail.com',
          full_name: 'Malak Amr',
          role: 'admin',
        })
      } else {
        setSession(null)
        setProfile(null)
      }
      setLoading(false)
      return
    }

    let active = true

    const loadProfile = async (user: any) => {
      let role = user.app_metadata?.role || user.user_metadata?.role
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (data?.role) role = data.role
      } catch (e) {
        console.warn('Profile fetch notice:', e)
      }

      if (!role) {
        role = 'admin'
      }

      if (!active) return
      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        role,
      })
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setSession(session)
      if (session?.user) await loadProfile(session.user)
      if (active) setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setLoading(true)
        void loadProfile(session.user).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      const demoUser = {
        id: 'demo-admin-id',
        email: email || 'malakamr7400@gmail.com',
        user_metadata: { full_name: 'Malak Amr' },
        app_metadata: { role: 'admin' },
      }
      setSession({ user: demoUser })
      setProfile({
        id: demoUser.id,
        email: demoUser.email,
        full_name: 'Malak Amr',
        role: 'admin',
      })
      localStorage.setItem('math_diag_demo_auth', 'true')
      return { error: null }
    }
    if (!password) return { error: 'A password is required.' }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    let role = ''
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()
      role = String(profile?.role || '').trim().toLowerCase()
    } catch {}

    if (!role) {
      role = String(
        authData.user.app_metadata?.role ||
        authData.user.user_metadata?.role ||
        'admin'
      ).trim().toLowerCase()
    }

    if (role !== 'admin' && role !== 'teacher') {
      await supabase.auth.signOut()
      return { error: 'This account is not authorized for the teacher/admin workspace.' }
    }

    return { error: null }
  }

  const signInDemo = async () => {
    const demoUser = {
      id: 'demo-admin-id',
      email: 'malakamr7400@gmail.com',
      user_metadata: { full_name: 'Malak Amr' },
      app_metadata: { role: 'admin' },
    }
    setSession({ user: demoUser })
    setProfile({
      id: demoUser.id,
      email: demoUser.email,
      full_name: 'Malak Amr',
      role: 'admin',
    })
    localStorage.setItem('math_diag_demo_auth', 'true')
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch {}
    }
    localStorage.removeItem('math_diag_demo_auth')
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
