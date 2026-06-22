import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Middle Earth Made Easy</h1>
          <h2>Check Your Email</h2>
          <p className="auth-confirm-msg">
            A confirmation link was sent to <strong>{email}</strong>.
            Click it to activate your account, then{' '}
            <Link to="/login">login here</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Middle Earth Made Easy</h1>
        <h2>Join the Fellowship</h2>
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <p>Already a member? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}
