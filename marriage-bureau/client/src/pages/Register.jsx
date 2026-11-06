import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      await register(form.name.trim(), form.email.trim(), form.password)
      // send them to login to confirm their credentials
      navigate('/login', { state: { registered: true, email: form.email.trim() } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create account</h1>
        <p className="auth-subtitle">Join the Padmashali Samaj Matrimony community</p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <label className="form-label" htmlFor="reg-name">
          Full name
        </label>
        <input
          id="reg-name"
          type="text"
          className="form-input"
          placeholder="e.g. Ravi Kumar"
          value={form.name}
          onChange={update('name')}
          autoComplete="name"
          required
        />

        <label className="form-label" htmlFor="reg-email">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          className="form-input"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <label className="form-label" htmlFor="reg-password">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          className="form-input"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label className="form-label" htmlFor="reg-confirm">
          Confirm password
        </label>
        <input
          id="reg-confirm"
          type="password"
          className="form-input"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          autoComplete="new-password"
          required
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  )
}
