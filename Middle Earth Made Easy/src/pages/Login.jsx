// Login page — email/password sign-in form.
// On success, Supabase issues a JWT and the AuthContext listener in AuthContext.jsx
// fires onAuthStateChange, which updates the global user state and triggers the
// ProtectedRoute in App.jsx to allow navigation to the map.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()

  // Controlled inputs for the login form
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // UI state: error message shown below the form, loading flag disables the button
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()     // Prevent the default browser form submission (page reload)
    setError(null)
    setLoading(true)

    // Attempt sign-in with Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      // Surface the error message to the user (e.g. "Invalid login credentials")
      setError(error.message)
    } else {
      // Redirect to the map; AuthContext will already have the new session
      navigate('/')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Middle Earth Made Easy</h1>
        <h2>Enter the Realm</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {/* Show server-side error inline below the inputs */}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Entering...' : 'Login'}
          </button>
        </form>

        <p>New to Middle Earth? <Link to="/register">Register</Link></p>
      </div>
    </div>
  )
}
