// AuthContext — provides the logged-in user and a loading flag to any component in the tree.
// Components call useAuth() to read { user, loading } without prop-drilling.
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // user: the Supabase User object when logged in, or null when logged out
  const [user, setUser] = useState(null)
  // loading: true until the initial session check completes; prevents a flash of the login page
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // getSession() reads the stored JWT from localStorage — no network call needed.
    // This resolves immediately on page load so components never wait for a server round-trip.
    supabase.auth.getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    // onAuthStateChange fires whenever the session changes: login, logout, token refresh.
    // This keeps user state in sync across tabs and after password changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Clean up the listener when the provider unmounts (e.g. during hot-reload in dev)
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook — import useAuth() in any component to access the auth state
export function useAuth() {
  return useContext(AuthContext)
}
