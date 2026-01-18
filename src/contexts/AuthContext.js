import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

// Custom hook to access auth state anywhere
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Email + Password signup
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  // Email + Password login
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    return { data, error }
  }

  // Google OAuth
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    return { data, error }
  }

  // Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Delete account
  const deleteAccount = async () => {
    // Call backend or Supabase admin API
    // Standard users can't delete themselves via client
    const { error } = await supabase.rpc('delete_user')
    return { error }
  }

  const value = {
    user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}