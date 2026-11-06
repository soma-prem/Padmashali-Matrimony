import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered || false
  const presetEmail = location.state?.email || ''

  const [form, setForm] = useState({ email: presetEmail, password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      setError('')
      setSubmitting(true)
      const user = await login(form.email.trim(), form.password)
      // Admins land on the admin dashboard; members land on their profile.
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {justRegistered && (
          <p className="form-success" role="status">
            Registration successful! Please log in.
          </p>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <label className="form-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          className="form-input"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          className="form-input"
          placeholder="Your password"
          value={form.password}
          onChange={update('password')}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}
