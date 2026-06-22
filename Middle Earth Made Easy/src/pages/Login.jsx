import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
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
